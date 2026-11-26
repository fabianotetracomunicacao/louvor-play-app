import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabaseClient';

export const normalizePhone = (phone) => {
    if (!phone) return '';
    let digits = String(phone).replace(/\D/g, '');
    if (!digits) return '';
    if (!digits.startsWith('55')) digits = '55' + digits;
    if (digits.length === 12) digits = digits.slice(0, 4) + '9' + digits.slice(4);
    return digits;
};

async function requestScaleWhatsApp(scaleId, action) {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) throw new Error('Sessão indisponível');

    const endpoint = Capacitor.isNativePlatform()
        ? 'https://www.louvorplay.com.br/api/scale-whatsapp'
        : '/api/scale-whatsapp';
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + data.session.access_token,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scaleId, action }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || 'Falha ao solicitar envio');
    return result;
}

export const WhatsAppService = {
    sendScaleConfirmation({ scaleId }) {
        return requestScaleWhatsApp(scaleId, 'invite');
    },

    async updateScaleStatus(scaleId, status, declineReason = '') {
        const updatePayload = { status, whatsapp_status: status };
        if (status === 'CONFIRMED') updatePayload.confirmed_at = new Date().toISOString();
        if (status === 'DECLINED') {
            updatePayload.declined_at = new Date().toISOString();
            if (declineReason) updatePayload.decline_reason = declineReason;
        }

        const { data, error } = await supabase.from('setlist_scales')
            .update(updatePayload)
            .eq('id', scaleId)
            .select('id, setlist_id, user_id, role, status, confirmed_at, declined_at, decline_reason')
            .maybeSingle();
        if (error) throw error;

        if (status === 'DECLINED' && data?.setlist_id) {
            const [setlist, musician] = await Promise.all([
                supabase.from('setlists').select('name,title,created_by').eq('id', data.setlist_id).maybeSingle(),
                supabase.from('profiles').select('name,full_name').eq('id', data.user_id).maybeSingle(),
            ]);
            if (setlist.data?.created_by) {
                const name = musician.data?.name || musician.data?.full_name || 'Músico';
                const title = setlist.data.title || setlist.data.name || 'Culto';
                const { error: notificationError } = await supabase.from('notifications').insert({
                    user_id: setlist.data.created_by,
                    title: '⚠️ Músico recusou a escala',
                    message: name + ' (' + (data.role || 'Escala') + ') informou que não poderá participar de "' + title + '".',
                    type: 'WARNING',
                    read: false,
                });
                if (notificationError) console.warn('[WhatsApp] Falha ao criar a notificação', notificationError.code);
            }
            requestScaleWhatsApp(scaleId, 'decline')
                .catch(err => console.warn('[WhatsApp] Falha ao solicitar aviso:', err.message));
        }

        return data || { id: scaleId, ...updatePayload };
    },
};
