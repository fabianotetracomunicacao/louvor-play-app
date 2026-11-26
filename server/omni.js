import { createClient } from '@supabase/supabase-js';

export const scaleIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createServerSupabase() {
    const { VITE_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    let national = /^55\d{10,11}$/.test(digits) ? digits.slice(2) : digits;
    if (!/^\d{10,11}$/.test(national)) return '';
    if (/^\d{2}[6-9]\d{7}$/.test(national)) {
        national = national.slice(0, 2) + '9' + national.slice(2);
    }
    return '55' + national;
}

export async function sendOmniMessage(phone, content, { timeout = 8000 } = {}) {
    const target = normalizePhone(phone);
    const { OMNI_CHANNEL_ID: channel, OMNI_SECRET_KEY: key } = process.env;
    if (!target || !channel || !key) return { error: 'omni_not_configured', retryable: true };

    try {
        const response = await fetch('https://api.omni.z-api.io/v1/channels/' + encodeURIComponent(channel) + '/messages', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: { identifier: target }, content }),
            signal: AbortSignal.timeout(timeout),
        });
        const result = await response.json().catch(() => null);
        if (response.ok && typeof result?.messageId === 'string' && result.messageId) {
            return { messageId: result.messageId };
        }
        const code = result?.subCode || result?.code;
        return {
            error: typeof code === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(code) ? code : 'omni_send_failed',
            retryable: response.status >= 400 && response.status < 500 && response.status !== 408,
        };
    } catch {
        return { error: 'omni_send_unknown', retryable: false };
    }
}

export function sendOmniText(phone, message, options) {
    if (!phone || !message) return null;
    return sendOmniMessage(phone, { type: 'TEXT', body: { message } }, options);
}
