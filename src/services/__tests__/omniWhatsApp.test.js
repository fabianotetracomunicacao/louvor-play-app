// @vitest-environment node
import { createHmac } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import webhook from '../../../api/zapi-webhook.js';

const secret = 'a-fake-webhook-signing-secret';
const channel = 'test-channel';
const scaleId = '0dd92999-fb26-4a25-b053-cb9281fe0608';
const sender = '5544999990000';
const context = {
    message: {
        _id: 'incoming-message',
        channel_id: channel,
        metadata: { from_me: false, middleware: 'META_WHATSAPP' },
        sender: { identifier: sender },
    },
    messageEventType: 'NEW_MESSAGE',
};

function signedRequest(contents, options = {}) {
    const { messageOverrides, eventOverrides, tamper, compress, age = 0 } = options;
    const body = Buffer.from(JSON.stringify({
        ...context,
        ...eventOverrides,
        message: { ...context.message, contents, ...messageOverrides },
    }));
    const time = Math.floor(Date.now() / 1000) - age;
    const mac = createHmac('sha256', secret).update(`${time}\nwebhook.delivery.event\n0\n42\n`).update(body).digest('hex');
    const requestBody = tamper ? Buffer.concat([body, Buffer.from(' ')]) : body;
    return new Request('https://test.invalid/api/zapi-webhook', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-webhook-signature': `t=${time},v1=${mac}`,
            'x-idempotency-key': 'webhook.delivery.event:0:42',
            ...(compress && { 'content-encoding': 'gzip' }),
        },
        body: compress ? gzipSync(requestBody) : requestBody,
    });
}

describe('webhook do Omni', () => {
    beforeEach(() => {
        vi.stubEnv('OMNI_CHANNEL_ID', channel);
        vi.stubEnv('OMNI_WEBHOOK_SECRET', secret);
        vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake-server-key');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it('rejeita um corpo alterado antes de consultar o banco', async () => {
        const database = vi.fn();
        vi.stubGlobal('fetch', database);
        const response = await webhook.fetch(signedRequest([{ type: 'TEXT', message: '1' }], { tamper: true }));
        expect(response.status).toBe(401);
        expect(database).not.toHaveBeenCalled();
    });

    it('rejeita assinaturas antigas mesmo se o corpo for autêntico', async () => {
        const response = await webhook.fetch(signedRequest([{ type: 'TEXT', message: '1' }], { age: 360 }));
        expect(response.status).toBe(401);
    });

    it('envia a resposta citada e o telefone ao RPC ao receber gzip válido', async () => {
        let rpcArguments;
        vi.stubGlobal('fetch', async (url, options) => {
            expect(String(url)).toBe('https://supabase.test/rest/v1/rpc/process_omni_scale_response');
            rpcArguments = JSON.parse(options.body);
            return Response.json({ ignored: true });
        });
        const response = await webhook.fetch(signedRequest([
            { type: 'TEXT', message: '2', message_id_reply: 'outgoing-message' },
        ], { compress: true }));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ignored: true, reason: 'pending_scale_not_found' });
        expect(rpcArguments).toMatchObject({
            p_phone: sender,
            p_status: 'DECLINED',
            p_reply_to: 'outgoing-message',
        });
    });

    it('envia o identificador da escala da resposta rápida ao RPC', async () => {
        let reply;
        vi.stubGlobal('fetch', async (url, options) => {
            reply = JSON.parse(options.body);
            return Response.json({ ignored: true });
        });
        const response = await webhook.fetch(signedRequest([
            { type: 'TEXT', message: 'Confirmar presença', internal_information: { payload: `scale_confirm:${scaleId}` } },
        ]));
        expect(response.status).toBe(200);
        expect(reply).toMatchObject({ p_phone: sender, p_status: 'CONFIRMED', p_scale_id: scaleId });
    });

    it.each([
        ['scale_confirm', 'CONFIRMED', 'Confirmar presença'],
        ['scale_decline', 'DECLINED', 'Não poderei tocar'],
    ])('registra o botão real do Omni e envia os avisos após %s', async (action, status, title) => {
        vi.stubEnv('OMNI_SECRET_KEY', 'fake-api-key');
        const outbound = [];
        vi.stubGlobal('fetch', async (url, options) => {
            const body = JSON.parse(options.body);
            if (String(url).includes('/rest/v1/rpc/')) {
                expect(body).toEqual({ p_phone: sender, p_status: status, p_scale_id: scaleId });
                return Response.json({
                    success: true,
                    musician_phone: sender,
                    musician_message: 'Sua resposta foi registrada.',
                    leader_phone: '5544999991111',
                    leader_message: 'Lista atualizada da escala.',
                });
            }
            expect(String(url)).toBe('https://api.omni.z-api.io/v1/channels/test-channel/messages');
            outbound.push(body);
            return Response.json({ messageId: 'message-accepted' });
        });
        const response = await webhook.fetch(signedRequest([
            {
                '@class': '.ButtonContent',
                type: 'BUTTON',
                title,
                external_information: { button_reply_id: action + ':' + scaleId },
            },
        ], { eventOverrides: { messageEventType: undefined }, compress: true }));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            success: true,
            notifications: { musician: 'accepted', leader: 'accepted' },
        });
        expect(outbound).toEqual(expect.arrayContaining([
            { recipient: { identifier: sender }, content: { type: 'TEXT', body: { message: 'Sua resposta foi registrada.' } } },
            { recipient: { identifier: '5544999991111' }, content: { type: 'TEXT', body: { message: 'Lista atualizada da escala.' } } },
        ]));
        expect(outbound).toHaveLength(2);
    });

    it('usa a referência do envelope quando o Omni envia uma resposta citada', async () => {
        let reply;
        vi.stubGlobal('fetch', async (url, options) => {
            reply = JSON.parse(options.body);
            return Response.json({ ignored: true });
        });
        const response = await webhook.fetch(signedRequest(
            [{ type: 'TEXT', message: '1' }],
            { eventOverrides: { messageEventType: undefined }, messageOverrides: { reference_id: 'outgoing-message' } },
        ));
        expect(response.status).toBe(200);
        expect(reply).toEqual({ p_phone: sender, p_status: 'CONFIRMED', p_reply_to: 'outgoing-message' });
    });

    it.each([
        ['outro canal', { channel_id: 'other-channel' }],
        ['mensagem do próprio canal', { metadata: { from_me: true } }],
    ])('ignora %s antes de consultar o banco', async (_name, messageOverrides) => {
        const database = vi.fn();
        vi.stubGlobal('fetch', database);
        const response = await webhook.fetch(signedRequest([
            { type: 'TEXT', message: '1', message_id_reply: 'outgoing-message' },
        ], { messageOverrides }));
        expect(response.status).toBe(200);
        expect(database).not.toHaveBeenCalled();
    });

    it('ignora um número solto para preservar as outras escalas do contato', async () => {
        const database = vi.fn();
        vi.stubGlobal('fetch', database);
        const response = await webhook.fetch(signedRequest([{ type: 'TEXT', message: '1' }]));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ignored: true, reason: 'not_a_scale_response' });
        expect(database).not.toHaveBeenCalled();
    });
});
