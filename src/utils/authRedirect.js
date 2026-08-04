export const getSiteOrigin = () => {
    const configured = import.meta.env.VITE_SITE_URL;
    if (configured) return configured.replace(/\/$/, '');
    if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
    return 'https://www.louvorplay.com.br';
};

export const getAuthRedirectUrl = (path = '') => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${getSiteOrigin()}${cleanPath}`;
};

export const isRecoveryFlowUrl = () => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    return search.includes('type=recovery') || hash.includes('type=recovery');
};

export const exchangeAuthRedirectFromUrl = async (supabaseClient) => {
    if (typeof window === 'undefined') {
        return { data: null, error: null, handled: false };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hashStr = window.location.hash ? window.location.hash.substring(1) : '';
    const hashParams = new URLSearchParams(hashStr);

    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
    const type = searchParams.get('type') || hashParams.get('type');

    if (code) {
        const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
        return { data, error, handled: true };
    }

    if (tokenHash && type) {
        const { data, error } = await supabaseClient.auth.verifyOtp({
            token_hash: tokenHash,
            type
        });
        return { data, error, handled: true };
    }

    return { data: null, error: null, handled: false };
};
