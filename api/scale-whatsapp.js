import {
    createServerSupabase, normalizePhone, scaleIdPattern, sendOmniMessage, sendOmniText,
} from '../server/omni.js';

const nativeOrigins = new Set(['https://localhost', 'http://localhost', 'capacitor://localhost']);

async function findRow(supabase, table, fields, id) {
    const { data, error } = await supabase.from(table).select(fields).eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
}

async function canSendInvite(supabase, setlist, userId) {
    if (setlist.created_by === userId) return true;
    if (!setlist.playlist_id) return false;

    const playlist = await findRow(supabase, 'playlists', 'owner_id', setlist.playlist_id);
    if (playlist?.owner_id === userId) return true;
    if (!setlist.is_collaborative) return false;

    const { data, error } = await supabase.from('playlist_members').select('status')
        .eq('playlist_id', setlist.playlist_id).eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return ['active', 'accepted'].includes(data?.status);
}

function formatDate(setlist) {
    if (!setlist.date) return 'data a definir';
    const date = new Date(String(setlist.date).slice(0, 10) + 'T12:00:00Z');
    if (Number.isNaN(date.getTime())) return 'data a definir';
    const day = date.toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo',
    });
    return setlist.service_time ? day + ' às ' + setlist.service_time.slice(0, 5) : day;
}

function inviteContent(scale, musician, setlist, songs) {
    const values = [
        musician.name || musician.full_name || 'Músico(a)',
        setlist.title || setlist.name || 'Culto',
        formatDate(setlist),
        scale.role || 'Músico(a)',
    ].map(value => value.replace(/\s+/g, ' ').trim().slice(0, 120));
    const buttons = [
        { id: 'scale_confirm:' + scale.id, title: 'Confirmar presença' },
        { id: 'scale_decline:' + scale.id, title: 'Não poderei tocar' },
    ];

    if (process.env.OMNI_SCALE_TEMPLATE) {
        return {
            type: 'TEMPLATE',
            attachments: [{
                template: {
                    name: process.env.OMNI_SCALE_TEMPLATE,
                    language: { policy: 'deterministic', code: process.env.OMNI_SCALE_TEMPLATE_LANGUAGE || 'pt_BR' },
                    components: [
                        { type: 'body', parameters: values.map(text => ({ type: 'text', text })) },
                        ...buttons.map((button, index) => ({
                            type: 'button', sub_type: 'quick_reply', index: String(index),
                            parameters: [{ type: 'payload', payload: button.id }],
                        })),
                    ],
                },
            }],
        };
    }

    const [name, title, date, role] = values;
    const intro = '🎵 *LouvorPlay - Confirmação de escala*\n\nOlá, *' + name + '*! Você foi escalado para:\n' +
        '📌 ' + title + '\n📅 ' + date + '\n🎸 ' + role;
    const instructions = '\n\nToque em uma opção abaixo ou cite esta mensagem e responda 1 para confirmar ou 2 para recusar.';
    const repertoire = songs.length ? '\n\n🎶 *Repertório:*\n' + songs.join('\n') : '';
    const maxRepertoire = 1024 - intro.length - instructions.length;
    return {
        type: 'INTERACTIVE_BUTTON',
        body: { message: intro + repertoire.slice(0, maxRepertoire) + instructions },
        attachments: buttons,
    };
}

async function claimSend(supabase, id, status, column) {
    const claimedAt = new Date().toISOString();
    const { data, error } = await supabase.from('setlist_scales').update({ [column]: claimedAt })
        .eq('id', id).eq('status', status).is(column, null).select('id').maybeSingle();
    if (error) throw error;
    return data ? claimedAt : null;
}

async function releaseClaim(supabase, id, column, claimedAt) {
    const { error } = await supabase.from('setlist_scales').update({ [column]: null })
        .eq('id', id).eq(column, claimedAt);
    if (error) throw error;
}

async function sendInvite(supabase, scale, musician, setlist, respond) {
    const phone = normalizePhone(musician?.whatsapp) || normalizePhone(musician?.phone);
    if (!phone) return respond({ skipped: true, reason: 'missing_phone' });
    if (scale.status !== 'PENDING') return respond({ skipped: true, reason: 'already_answered' });

    const { data: items, error: itemsError } = await supabase.from('setlist_items')
        .select('song:songs(title,artist)').eq('setlist_id', scale.setlist_id)
        .order('position').limit(30);
    if (itemsError) console.warn('[omni send] Repertoire unavailable', itemsError.code);
    const songs = (items || []).filter(item => item.song?.title)
        .map(({ song }, index) => (index + 1) + '. ' + song.title + (song.artist ? ' (' + song.artist + ')' : ''));

    const claimColumn = 'whatsapp_omni_invite_claimed_at';
    const claim = await claimSend(supabase, scale.id, 'PENDING', claimColumn);
    if (!claim) return respond({ skipped: true, reason: 'already_requested' });

    const result = await sendOmniMessage(phone, inviteContent(scale, musician, setlist, songs));
    if (!result.messageId) {
        if (result.retryable) await releaseClaim(supabase, scale.id, claimColumn, claim);
        console.warn('[omni send] Invitation not accepted', result.error);
        return respond({ error: result.error }, 502);
    }

    const { error } = await supabase.from('setlist_scales').update({
        whatsapp_omni_message_id: result.messageId,
        whatsapp_sent_at: new Date().toISOString(),
    }).eq('id', scale.id).eq(claimColumn, claim);
    if (error) throw error;
    const { error: statusError } = await supabase.from('setlist_scales')
        .update({ whatsapp_status: 'SENT' }).eq('id', scale.id).eq('status', 'PENDING');
    if (statusError) throw statusError;
    return respond({ success: true });
}

async function sendDeclineAlert(supabase, scale, musician, setlist, respond) {
    if (scale.status !== 'DECLINED' || !setlist.created_by) return respond({ skipped: true });
    const leader = await findRow(supabase, 'profiles', 'phone,whatsapp', setlist.created_by);
    const phone = normalizePhone(leader?.whatsapp) || normalizePhone(leader?.phone);
    if (!phone) return respond({ skipped: true, reason: 'missing_phone' });

    const claimColumn = 'whatsapp_omni_decline_claimed_at';
    const claim = await claimSend(supabase, scale.id, 'DECLINED', claimColumn);
    if (!claim) return respond({ skipped: true, reason: 'already_requested' });

    const message = '⚠️ *LouvorPlay - Alerta de escala*\n\n' +
        (musician?.name || musician?.full_name || 'Um músico') + ' informou que não poderá participar de ' +
        (setlist.title || setlist.name || 'Culto') + ' (' + formatDate(setlist) + ').\n\n' +
        'Acesse o LouvorPlay para atualizar a escala.';
    const result = await sendOmniText(phone, message);
    if (!result.messageId) {
        if (result.retryable) await releaseClaim(supabase, scale.id, claimColumn, claim);
        console.warn('[omni send] Leader alert not accepted', result.error);
        return respond({ error: result.error }, 502);
    }
    return respond({ success: true });
}

export default {
    async fetch(request) {
        const origin = request.headers.get('origin');
        const headers = { 'Cache-Control': 'no-store' };
        if (nativeOrigins.has(origin)) {
            headers['Access-Control-Allow-Origin'] = origin;
            headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
            headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
            headers.Vary = 'Origin';
        }
        const respond = (data, status = 200) => Response.json(data, { status, headers });
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
        if (request.method !== 'POST') return respond({ error: 'method_not_allowed' }, 405);

        const token = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') || '')?.[1];
        if (!token) return respond({ error: 'authentication_required' }, 401);
        const supabase = createServerSupabase();
        if (!supabase) return respond({ error: 'database_not_configured' }, 503);

        const { data: auth, error: authError } = await supabase.auth.getUser(token);
        if (authError || !auth.user) return respond({ error: 'authentication_required' }, 401);
        const body = await request.json().catch(() => null);
        if (!scaleIdPattern.test(body?.scaleId || '') || !['invite', 'decline'].includes(body?.action)) {
            return respond({ error: 'invalid_scale_request' }, 400);
        }

        try {
            const scale = await findRow(supabase, 'setlist_scales', 'id,setlist_id,user_id,role,status', body.scaleId);
            if (!scale) return respond({ error: 'scale_not_found' }, 404);
            const setlist = await findRow(supabase, 'setlists', 'id,created_by,playlist_id,is_collaborative,title,name,date,service_time', scale.setlist_id);
            if (!setlist) return respond({ error: 'scale_not_found' }, 404);
            const canSend = body.action === 'invite'
                ? await canSendInvite(supabase, setlist, auth.user.id)
                : auth.user.id === scale.user_id;
            if (!canSend) return respond({ error: 'forbidden' }, 403);
            const musician = await findRow(supabase, 'profiles', 'name,full_name,phone,whatsapp', scale.user_id);
            return body.action === 'invite'
                ? await sendInvite(supabase, scale, musician, setlist, respond)
                : await sendDeclineAlert(supabase, scale, musician, setlist, respond);
        } catch (error) {
            console.error('[omni send] Scale operation failed', error.code);
            return respond({ error: 'scale_send_failed' }, 500);
        }
    },
};
