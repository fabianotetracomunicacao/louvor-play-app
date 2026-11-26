// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const scaleId = '0dd92999-fb26-4a25-b053-cb9281fe0608';
const ownerId = 'leader';
const request = (token = 'leader-token') => new Request('https://test.invalid/api/scale-whatsapp', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ scaleId, action: 'invite', phone: '5511555555555' }),
});

async function runSend(options = {}) {
    const { default: endpoint } = await import('../../../api/scale-whatsapp.js');
    const sends = [];
    const updates = [];
    vi.stubGlobal('fetch', async (url, req = {}) => {
        const { hostname, pathname } = new URL(url);
        if (hostname === 'api.omni.z-api.io') {
            sends.push({ url, authorization: new Headers(req.headers).get('authorization'), body: JSON.parse(req.body) });
            return Response.json({ messageId: 'invitation-message' });
        }
        if (pathname === '/auth/v1/user') return Response.json({ id: options.actor || ownerId });
        if (pathname === '/rest/v1/setlist_scales' && req.method === 'PATCH') {
            updates.push(JSON.parse(req.body));
            return Response.json(options.alreadyClaimed ? null : { id: scaleId });
        }
        if (pathname === '/rest/v1/setlist_scales') {
            return Response.json({ id: scaleId, user_id: 'musician', status: 'PENDING', setlist_id: 'setlist', role: 'Vocal' });
        }
        if (pathname === '/rest/v1/setlists') {
            return Response.json({ id: 'setlist', created_by: ownerId, title: 'Culto', date: '2026-11-26', service_time: '19:00:00' });
        }
        if (pathname === '/rest/v1/profiles') {
            return Response.json({ name: 'Músico Teste', whatsapp: options.phone || '(49) 99999-0000' });
        }
        if (pathname === '/rest/v1/setlist_items') return Response.json([]);
        throw new Error('Unexpected request: ' + pathname);
    });
    return { response: await endpoint.fetch(request()), sends, updates };
}

describe('envio de escala pelo Omni', () => {
    beforeEach(() => {
        vi.stubEnv('OMNI_CHANNEL_ID', 'test-channel');
        vi.stubEnv('OMNI_SECRET_KEY', 'fake-omni-key');
        vi.stubEnv('OMNI_SCALE_TEMPLATE', '');
        vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test');
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake-server-key');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it('usa o telefone do cadastro e inclui botões vinculados à escala', async () => {
        const { response, sends, updates } = await runSend();
        expect(response.status).toBe(200);
        expect(sends).toHaveLength(1);
        expect(sends[0]).toMatchObject({
            url: 'https://api.omni.z-api.io/v1/channels/test-channel/messages',
            authorization: 'Bearer fake-omni-key',
            body: {
                recipient: { identifier: '5549999990000' },
                content: {
                    type: 'INTERACTIVE_BUTTON',
                    attachments: [
                        { id: 'scale_confirm:' + scaleId, title: 'Confirmar presença' },
                        { id: 'scale_decline:' + scaleId, title: 'Não poderei tocar' },
                    ],
                },
            },
        });
        expect(updates).toContainEqual(expect.objectContaining({ whatsapp_omni_message_id: 'invitation-message' }));
    });

    it('bloqueia o envio por um usuário sem permissão na escala', async () => {
        const { response, sends } = await runSend({ actor: 'stranger' });
        expect(response.status).toBe(403);
        expect(sends).toHaveLength(0);
    });

    it('não reenvia um convite que já está sendo processado', async () => {
        const { response, sends } = await runSend({ alreadyClaimed: true });
        expect(response.status).toBe(200);
        expect(sends).toHaveLength(0);
    });

    it('acrescenta o nono dígito para um celular cadastrado no formato antigo', async () => {
        const { response, sends } = await runSend({ phone: '554499990000' });
        expect(response.status).toBe(200);
        expect(sends[0].body.recipient.identifier).toBe('5544999990000');
    });

    it('envia um template aprovado quando configurado', async () => {
        vi.stubEnv('OMNI_SCALE_TEMPLATE', 'louvorplay_confirmacao_escala');
        const { response, sends } = await runSend();
        expect(response.status).toBe(200);
        expect(sends[0].body.content).toMatchObject({
            type: 'TEMPLATE',
            attachments: [{
                template: {
                    name: 'louvorplay_confirmacao_escala',
                    language: { code: 'pt_BR', policy: 'deterministic' },
                    components: [
                        { type: 'body', parameters: [{ type: 'text', text: 'Músico Teste' }, { type: 'text', text: 'Culto' }, { type: 'text', text: 'quinta-feira, 26/11 às 19:00' }, { type: 'text', text: 'Vocal' }] },
                        { type: 'button', sub_type: 'quick_reply', index: '0', parameters: [{ type: 'payload', payload: 'scale_confirm:' + scaleId }] },
                        { type: 'button', sub_type: 'quick_reply', index: '1', parameters: [{ type: 'payload', payload: 'scale_decline:' + scaleId }] },
                    ],
                },
            }],
        });
    });
});
