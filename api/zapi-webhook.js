import { createHmac, timingSafeEqual } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { createServerSupabase, sendOmniText, scaleIdPattern } from '../server/omni.js';

const maxBodySize = 1024 * 1024;
const maxSignatureAge = 300;

function validSignature(body, headers, secret) {
    const signature = headers.get('x-webhook-signature') || '';
    const match = /^t=(\d{1,12}),\s*v1=([a-f0-9]{64})$/i.exec(signature);
    const idempotencyKey = /^(.+):(\d+):(\d+)$/.exec(headers.get('x-idempotency-key') || '');
    if (!match || !idempotencyKey) return false;

    const [, time, mac] = match;
    if (Math.abs(Date.now() / 1000 - Number(time)) > maxSignatureAge) return false;

    const [, topic, partition, offset] = idempotencyKey;
    const hmac = createHmac('sha256', secret);
    hmac.update([time, topic, partition, offset, ''].join('\n'));
    hmac.update(body);
    return timingSafeEqual(hmac.digest(), Buffer.from(mac, 'hex'));
}

function getScaleResponse(event, channelId) {
    const incoming = event?.message;
    const phone = incoming?.sender?.identifier;
    if (event?.messageEventType !== 'NEW_MESSAGE' || incoming?.channel_id !== channelId ||
        incoming?.metadata?.from_me !== false || incoming?.metadata?.middleware !== 'META_WHATSAPP' ||
        typeof phone !== 'string' || !/^\+?\d{8,15}$/.test(phone) || !Array.isArray(incoming?.contents)) {
        return null;
    }

    for (const content of incoming.contents) {
        if (!content || content.internal_information?.group_id) continue;
        const details = content.internal_information;
        const candidates = [
            content.payload, content.button_id, content.selected_button_id, content.button_reply?.id,
            details?.payload, details?.button_id, details?.selected_button_id, details?.buttonId,
            details?.button_reply?.id, content.id, content.message,
        ];
        for (const value of candidates) {
            if (typeof value !== 'string') continue;
            const [action, id, extra] = value.split(':');
            if (extra === undefined && scaleIdPattern.test(id || '')) {
                if (action === 'scale_confirm') return { p_phone: phone, p_scale_id: id, p_status: 'CONFIRMED' };
                if (action === 'scale_decline') return { p_phone: phone, p_scale_id: id, p_status: 'DECLINED' };
            }
        }

        const replyTo = content.message_id_reply;
        if (typeof replyTo !== 'string' || !/^[a-z0-9_.=-]{1,200}$/i.test(replyTo)) continue;
        const text = String(content.message || content.title || '').trim().toLowerCase()
            .normalize('NFD').replace(/\p{Diacritic}/gu, '');
        if (/^(1|sim|confirmo|confirmar presenca)$/.test(text)) {
            return { p_phone: phone, p_reply_to: replyTo, p_status: 'CONFIRMED' };
        }
        if (/^(2|nao|recuso|nao poderei tocar)$/.test(text)) {
            return { p_phone: phone, p_reply_to: replyTo, p_status: 'DECLINED' };
        }
    }
    return null;
}

export default {
    async fetch(request) {
        if (request.method !== 'POST') {
            return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: { Allow: 'POST' } });
        }
        const { OMNI_WEBHOOK_SECRET: secret, OMNI_CHANNEL_ID: channelId } = process.env;
        if (!secret || !channelId) {
            return Response.json({ error: 'webhook_not_configured' }, { status: 503 });
        }
        if (!request.headers.has('x-webhook-signature')) {
            return Response.json({ error: 'invalid_signature' }, { status: 401 });
        }

        let body;
        try {
            body = Buffer.from(await request.arrayBuffer());
            if (body.length > maxBodySize) return new Response(null, { status: 413 });
            if (request.headers.get('content-encoding') === 'gzip' && body[0] === 0x1f && body[1] === 0x8b) {
                body = gunzipSync(body, { maxOutputLength: maxBodySize });
            }
        } catch {
            return Response.json({ error: 'invalid_body' }, { status: 400 });
        }
        if (!validSignature(body, request.headers, secret)) {
            return Response.json({ error: 'invalid_signature' }, { status: 401 });
        }

        let event;
        try {
            event = JSON.parse(body.toString('utf8'));
        } catch {
            return Response.json({ error: 'invalid_body' }, { status: 400 });
        }
        const reply = getScaleResponse(event, channelId);
        if (!reply) return Response.json({ ignored: true });

        const supabase = createServerSupabase();
        if (!supabase) return Response.json({ error: 'database_not_configured' }, { status: 503 });

        const { data, error } = await supabase.rpc('process_omni_scale_response', reply);
        if (error) {
            console.error('[omni webhook] Scale response failed', error.code);
            return Response.json({ error: 'processing_failed' }, { status: 500 });
        }
        if (!data?.success) return Response.json({ ignored: true });

        const deliveries = await Promise.allSettled([
            sendOmniText(data.musician_phone, data.musician_message, { timeout: 1700 }),
            sendOmniText(data.leader_phone, data.leader_message, { timeout: 1700 }),
        ]);
        for (const delivery of deliveries) {
            if (delivery.status === 'rejected' || delivery.value?.error) {
                console.warn('[omni webhook] WhatsApp acknowledgment was not accepted', delivery.value?.error);
            }
        }
        return Response.json({ success: true });
    },
};
