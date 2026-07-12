import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import { useNotification } from '../contexts/NotificationContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../supabaseClient';
import { getMusicalStyles, getInstruments } from '../utils/storage';
import packageJson from '../../package.json';
import {
    User, Mail, Phone, MapPin, Music, Settings,
    Bell, Check, Camera, LogOut, Save, Shield, ArrowLeft, Palette, RefreshCw, Clock, Sparkles, CheckCircle, MonitorPlay, Image as ImageIcon, Video as VideoIcon, Type, BookOpen, Upload, Trash2, AlertTriangle
} from 'lucide-react';
import ImageBackgroundModal from '../components/ImageBackgroundModal';
import VideoBackgroundModal from '../components/VideoBackgroundModal';

export function ProfileSettingsPage() {
    const { user, logout, isAdmin, isSuperAdmin, isChurchAdmin, isWorshipLeader } = useAuth();
    const navigate = useNavigate();
    const { confirmAction } = useNotification();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);
    const logoFileInputRef = useRef(null);
    const [musicalStyles, setMusicalStyles] = useState([]);
    const [instrumentsMetadata, setInstrumentsMetadata] = useState([]);

    // Import player preferences from DataContext
    const {
        isMobile,
        isTablet,
        mobilePreferences,
        desktopPreferences,
        tabletPreferences,
        refreshData,
        // updateMobilePreferences, // Not strictly needed anymore but harmless
        // updateDesktopPreferences
    } = useData();

    // Local state for player settings
    const [playerTab, setPlayerTab] = useState('mobile');
    const [tempMobilePrefs, setTempMobilePrefs] = useState({ fontSize: 12, lineSpacing: 1.0, letterSpacing: 1.0, scrollSpeed: 5 });
    const [tempDesktopPrefs, setTempDesktopPrefs] = useState({ fontSize: 22, lineSpacing: 0.8, letterSpacing: 1.0, scrollSpeed: 5 });
    const [tempTabletPrefs, setTempTabletPrefs] = useState({ fontSize: 20, lineSpacing: 0.8, letterSpacing: 1.0, scrollSpeed: 5 });
    const [playerMessage, setPlayerMessage] = useState({ type: '', text: '' });

    // Projection Defaults State
    const [projDefaults, setProjDefaults] = useState({
        bgColor: '#000000',
        bgType: 'color',
        bgUrl: '',
        textColor: '#FFFFFF',
        textShadow: true,
        fontSize: 100,
        alertBgColor: '#000000',
        alertTextColor: '#FFFFFF',
        alertFontSize: 100
    });
    const [isProjImageModalOpen, setIsProjImageModalOpen] = useState(false);
    const [isProjVideoModalOpen, setIsProjVideoModalOpen] = useState(false);
    const [bibleBGDefaults, setBibleBGDefaults] = useState({
        bgColor: '#000000',
        bgType: 'color',
        bgUrl: ''
    });
    const [bibleModalTarget, setBibleModalTarget] = useState(null); // 'image', 'video' or 'timer_image', 'timer_video'
    const [timerDefaults, setTimerDefaults] = useState({
        bgColor: '#000000',
        bgType: 'color',
        bgUrl: ''
    });
    const [churchLogoUrl, setChurchLogoUrl] = useState('');

    // Form State
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        phone: '',
        church: '',
        favorite_style: '',
        city: '',
        birth_date: '',
        avatar_url: '',
        role: '',
        instrument: '',
        available_instruments: []
    });

    const [preferences, setPreferences] = useState({
        default_tone_mode: 'original',
        default_display_mode: 'full',
        default_instrument: 'guitar',
        default_font_size: 12,
        default_line_spacing: 0.8,
        default_scroll_speed: 5,
        default_magic_speed_enabled: false, // New Global Toggle
        allow_collab_invites: true,
        newsletter_opt_in: true,
        theme: 'dark', // Handled globally but good to show
        chord_color_light: '#d97706', // Default amber-600
        chord_color_dark: '#d97706'   // Default amber-600
    });

    useEffect(() => {
        if (user) {
            loadUserProfile();
        }
    }, [user]);

    const loadUserProfile = async () => {
        setIsLoading(true);
        try {
            // Fetch Profile and Styles in parallel
            const [profileResult, stylesResult, instrumentsResult, prefResult] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                getMusicalStyles(),
                getInstruments(),
                supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()
            ]);

            const { data: profileData, error: profileError } = profileResult;
            const { data: prefData } = prefResult;

            if (stylesResult) {
                setMusicalStyles(stylesResult.sort((a, b) => a.name.localeCompare(b.name)));
            }

            if (profileError) throw profileError;

            setProfile({
                full_name: profileData.full_name || profileData.name || '', // Fallback to 'name' if full_name empty
                email: user.email, // Auth email is source of truth
                phone: profileData.phone || '',
                church: profileData.church || profileData.church_name || '', // Fallback
                instrument: profileData.instrument || '',
                favorite_style: profileData.favorite_style || '',
                city: profileData.city || '',
                birth_date: profileData.birth_date || '',
                avatar_url: profileData.avatar_url || '',
                role: profileData.role || 'musician',
                available_instruments: profileData.available_instruments || []
            });

            if (instrumentsResult) {
                setInstrumentsMetadata(instrumentsResult);
            }

            if (prefData) {
                setPreferences({
                    default_tone_mode: prefData.default_tone_mode || 'original',
                    default_display_mode: prefData.default_display_mode || 'full',
                    default_instrument: prefData.default_instrument || 'guitar',
                    default_font_size: prefData.default_font_size || 12,
                    default_line_spacing: prefData.default_line_spacing || 0.8,
                    default_scroll_speed: prefData.default_scroll_speed || 5,
                    default_magic_speed_enabled: prefData.default_magic_speed_enabled || false,
                    allow_collab_invites: prefData.allow_collab_invites !== false,
                    newsletter_opt_in: prefData.newsletter_opt_in !== false,
                    theme: prefData.theme || 'dark',
                    chord_color_light: prefData.chord_color_light || '#d97706',
                    chord_color_dark: prefData.chord_color_dark || '#d97706'
                });
                setProjDefaults({
                    bgColor: prefData.proj_default_bg_color || '#000000',
                    bgType: prefData.proj_default_bg_type || 'color',
                    bgUrl: prefData.proj_default_bg_url || '',
                    textColor: prefData.proj_default_text_color || '#FFFFFF',
                    textShadow: prefData.proj_default_text_shadow !== false,
                    fontSize: prefData.proj_default_font_size || 100,
                    alertBgColor: prefData.alert_default_bg_color || '#000000',
                    alertTextColor: prefData.alert_default_text_color || '#FFFFFF',
                    alertFontSize: prefData.alert_default_font_size || 100
                });
                setBibleBGDefaults({
                    bgColor: prefData.bible_default_bg_color || '#000000',
                    bgType: prefData.bible_default_bg_type || 'color',
                    bgUrl: prefData.bible_default_bg_url || ''
                });
                setTimerDefaults({
                    bgColor: prefData.timer_default_bg_color || '#000000',
                    bgType: prefData.timer_default_bg_type || 'color',
                    bgUrl: prefData.timer_default_bg_url || ''
                });
                setChurchLogoUrl(prefData.church_logo_url || '');
            } else {
                // Initialize defaults locally if no row exists yet
            }

        } catch (error) {
            console.error("Error loading profile:", error);
            setMessage({ type: 'error', text: 'Erro ao carregar perfil.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Load player preferences when they change
    useEffect(() => {
        if (mobilePreferences) {
            setTempMobilePrefs(mobilePreferences);
        }
        if (desktopPreferences) {
            setTempDesktopPrefs(desktopPreferences);
        }
        if (tabletPreferences) {
            setTempTabletPrefs(tabletPreferences);
        }
    }, [mobilePreferences, desktopPreferences, tabletPreferences]);

    const handleAvatarUpload = async (event) => {
        try {
            setIsUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
            setMessage({ type: 'success', text: 'Foto enviada! Clique em Salvar para confirmar.' });

        } catch (error) {
            console.error("Error uploading avatar:", error);
            setMessage({ type: 'error', text: 'Erro ao enviar foto.' });
        } finally {
            setIsUploading(false);
        }
    };


    const handleChurchLogoUpload = async (event) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return;
            setIsUploadingLogo(true);

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `church-logo-${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Delete old logo if exists and is a storage URL
            if (churchLogoUrl && churchLogoUrl.includes('supabase.co/storage/v1/object/public/avatars/')) {
                try {
                    const oldPath = churchLogoUrl.split('/').pop();
                    if (oldPath) {
                        await supabase.storage.from('avatars').remove([oldPath]);
                    }
                } catch (err) {
                    console.warn("Could not delete old logo:", err);
                }
            }

            // 2. Upload new logo
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setChurchLogoUrl(publicUrl);
            setMessage({ type: 'success', text: 'Logo da igreja enviada! Clique em Salvar para concluir.' });

        } catch (error) {
            console.error("Error uploading church logo:", error);
            setMessage({ type: 'error', text: 'Erro ao enviar logo da igreja.' });
        } finally {
            setIsUploadingLogo(false);
            if (logoFileInputRef.current) logoFileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ type: '', text: '' });
        try {
            // Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    phone: profile.phone,
                    church: profile.church,
                    favorite_style: profile.favorite_style,
                    city: profile.city,
                    birth_date: profile.birth_date || null,
                    avatar_url: profile.avatar_url,
                    instrument: profile.instrument,
                    available_instruments: profile.available_instruments
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Update Preferences (Upsert)
            const { error: prefError } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    default_tone_mode: preferences.default_tone_mode,
                    default_display_mode: preferences.default_display_mode,
                    default_instrument: preferences.default_instrument,
                    default_font_size: preferences.default_font_size,
                    default_line_spacing: preferences.default_line_spacing,
                    default_scroll_speed: preferences.default_scroll_speed,
                    default_magic_speed_enabled: preferences.default_magic_speed_enabled,
                    allow_collab_invites: preferences.allow_collab_invites,
                    newsletter_opt_in: preferences.newsletter_opt_in,
                    chord_color_light: preferences.chord_color_light,
                    chord_color_dark: preferences.chord_color_dark,
                    // Mobile player preferences
                    mobile_font_size: tempMobilePrefs.fontSize,
                    mobile_line_spacing: tempMobilePrefs.lineSpacing,
                    mobile_letter_spacing: tempMobilePrefs.letterSpacing,
                    mobile_scroll_speed: tempMobilePrefs.scrollSpeed,
                    // Desktop player preferences
                    desktop_font_size: tempDesktopPrefs.fontSize,
                    desktop_line_spacing: tempDesktopPrefs.lineSpacing,
                    desktop_letter_spacing: tempDesktopPrefs.letterSpacing,
                    desktop_scroll_speed: tempDesktopPrefs.scrollSpeed,
                    // Tablet player preferences
                    tablet_font_size: tempTabletPrefs.fontSize,
                    tablet_line_spacing: tempTabletPrefs.lineSpacing,
                    tablet_letter_spacing: tempTabletPrefs.letterSpacing,
                    tablet_scroll_speed: tempTabletPrefs.scrollSpeed,
                    // Projection defaults
                    proj_default_bg_color: projDefaults.bgColor,
                    proj_default_bg_type: projDefaults.bgType,
                    proj_default_bg_url: projDefaults.bgUrl,
                    proj_default_text_color: projDefaults.textColor,
                    proj_default_text_shadow: projDefaults.textShadow,
                    proj_default_font_size: projDefaults.fontSize,
                    alert_default_bg_color: projDefaults.alertBgColor,
                    alert_default_text_color: projDefaults.alertTextColor,
                    alert_default_font_size: projDefaults.alertFontSize,
                    bible_default_bg_color: bibleBGDefaults.bgColor,
                    bible_default_bg_type: bibleBGDefaults.bgType,
                    bible_default_bg_url: bibleBGDefaults.bgUrl,
                    timer_default_bg_color: timerDefaults.bgColor,
                    timer_default_bg_type: timerDefaults.bgType,
                    timer_default_bg_url: timerDefaults.bgUrl,
                    church_logo_url: churchLogoUrl,
                    updated_at: new Date()
                });

            if (prefError) throw prefError;

            // Refresh data from server to ensure consistency
            await refreshData();

            setMessage({ type: 'success', text: 'Perfil e configurações atualizados com sucesso!' });

            // Show toast for 2 seconds then navigate back
            setTimeout(() => {
                setMessage({ type: '', text: '' });
                navigate(-1);
            }, 2000);

        } catch (error) {
            console.error("Error saving profile:", error);
            setMessage({ type: 'error', text: 'Erro ao salvar alterações.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        const confirmed = await confirmAction({
            title: 'Sair',
            message: 'Tem certeza que deseja sair?',
            confirmText: 'Sair',
            type: 'danger'
        });

        if (confirmed) {
            await logout();
            navigate('/login');
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = await confirmAction({
            title: 'Excluir Minha Conta',
            message: 'Atenção: Esta ação é IRREVERSÍVEL. Seu acesso será removido permanentemente e suas cifras serão transferidas para a revisão da plataforma. Deseja realmente excluir sua conta?',
            confirmText: 'Sim, Excluir Minha Conta',
            type: 'danger'
        });

        if (confirmed) {
            try {
                const { error } = await supabase.rpc('delete_user_and_transfer_to_review', {
                    target_user_id: user.id
                });
                
                if (error) throw error;
                
                // If successful, log out
                await logout();
                navigate('/login');
            } catch (err) {
                console.error("Erro ao excluir conta:", err);
                setMessage({ type: 'error', text: 'Não foi possível excluir a conta. ' + err.message });
            }
        }
    };

    const [isUpdating, setIsUpdating] = useState(false);
    const [updateResult, setUpdateResult] = useState(null); // null | 'updated' | 'latest'
    const handleCheckUpdates = async () => {
        setIsUpdating(true);
        setUpdateResult(null);
        try {
            // 1. Clear app-specific data caches
            const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('lp_cache_'));
            keysToRemove.forEach(k => localStorage.removeItem(k));

            let hasNewVersion = false;

            // 2. Proactive check: Fetch version.json from server with cache-buster
            try {
                const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
                if (response.ok) {
                    const serverData = await response.json();
                    const localVersion = localStorage.getItem('lp_app_version');
                    if (localVersion && serverData.hash && localVersion !== serverData.hash) {
                        hasNewVersion = true;
                        localStorage.setItem('lp_app_version', serverData.hash);
                    } else if (!localVersion) {
                        localStorage.setItem('lp_app_version', serverData.hash || 'v1');
                    }
                }
            } catch (fetchErr) {
                console.warn('Metadata version check skipped:', fetchErr);
            }

            // 3. Service Worker check (The main PWA mechanism)
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    // Trigger a check for new worker
                    await registration.update();
                    
                    if (registration.waiting) {
                        hasNewVersion = true;
                    } else if (registration.installing) {
                        // Wait for it to finish installing
                        const worker = registration.installing;
                        await new Promise((resolve) => {
                            worker.addEventListener('statechange', (e) => {
                                if (e.target.state === 'installed') resolve();
                            });
                            // Safety timeout
                            setTimeout(resolve, 5000);
                        });
                        if (registration.waiting) hasNewVersion = true;
                    }
                }
            }

            if (hasNewVersion) {
                // Clear all browser caches for this origin
                if ('caches' in window) {
                    try {
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map(name => caches.delete(name)));
                    } catch (cErr) { console.error('Cache clear error:', cErr); }
                }

                // Force SW skip waiting if possible
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration?.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                }

                setUpdateResult('updated');
                // Hard reload ignoring cache
                setTimeout(() => {
                    window.location.reload(true);
                }, 2000);
            } else {
                setUpdateResult('latest');
            }
        } catch (e) {
            console.error('Error checking for updates:', e);
            setUpdateResult('latest');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;
    }

    return (
        <div className="max-w-2xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Meu Perfil</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie suas informações e preferências</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 py-2 rounded-xl transition"
                >
                    <LogOut size={20} />
                    Sair
                </button>
            </div>

            {/* Message Toast */}
            {message.text && (
                <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[150] p-4 rounded-xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top-5 fade-in duration-300 ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {message.type === 'error' ? <Shield size={20} /> : <Check size={20} />}
                    <span className="font-semibold">{message.text}</span>
                </div>
            )}

            {/* Update Result Modal */}
            {updateResult && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center animate-in zoom-in-90 duration-300 border border-slate-100 dark:border-slate-800">
                        {updateResult === 'updated' ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                                    <Sparkles size={32} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                    Atualização encontrada! 🎉
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                                    Uma nova versão está sendo aplicada.
                                </p>
                                <p className="text-xs text-purple-500 font-semibold animate-pulse">
                                    Recarregando o app em instantes...
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                                    <CheckCircle size={32} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                    Tudo atualizado ✨
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                                    Você já está usando a versão mais recente do app. Nenhuma atualização disponível no momento.
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 font-mono">
                                    v{packageJson.version}
                                </p>
                                <button
                                    onClick={() => setUpdateResult(null)}
                                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-semibold text-sm transition"
                                >
                                    Fechar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}


            {/* Main Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">

                {/* Avatar Section */}
                <div className="flex flex-col items-center justify-center -mt-12 mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-xl">
                            <div className={`w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden relative ${isUploading ? 'opacity-50' : ''}`}>
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    </div>
                                )}
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-white">{(profile.full_name || 'U').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-purple-600 group-hover:scale-110 transition">
                            <Camera size={16} />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    <div className="text-center mt-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{profile.full_name || 'Usuário'}</h2>
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider">
                            {isSuperAdmin ? 'Super Admin' : 
                             isChurchAdmin ? 'Responsável da Igreja' : 
                             isWorshipLeader ? 'Líder de Adoração' : 
                             'Adorador'}
                        </span>
                    </div>
                </div>

                {/* Personal Info Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-purple-500 transition">
                            <User size={18} className="text-slate-400" />
                            <input
                                type="text"
                                value={profile.full_name}
                                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                className="bg-transparent outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                                placeholder="Seu nome"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email (Fixo)</label>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 opacity-70 cursor-not-allowed">
                            <Mail size={18} className="text-slate-400" />
                            <input
                                type="text"
                                value={profile.email}
                                disabled
                                className="bg-transparent outline-none w-full text-slate-700 dark:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-purple-500 transition">
                            <Phone size={18} className="text-slate-400" />
                            <input
                                type="text"
                                value={profile.phone}
                                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                className="bg-transparent outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Nascimento</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-purple-500 transition">
                            <input
                                type="date"
                                value={profile.birth_date}
                                onChange={e => setProfile({ ...profile, birth_date: e.target.value })}
                                className="bg-transparent outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cidade</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-purple-500 transition">
                            <MapPin size={18} className="text-slate-400" />
                            <input
                                type="text"
                                value={profile.city}
                                onChange={e => setProfile({ ...profile, city: e.target.value })}
                                className="bg-transparent outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                                placeholder="Sua cidade"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Igreja / Comunidade</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-purple-500 transition">
                            <MapPin size={18} className="text-slate-400" />
                            <input
                                type="text"
                                value={profile.church}
                                onChange={e => setProfile({ ...profile, church: e.target.value })}
                                className="bg-transparent outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                                placeholder="Qual sua igreja?"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estilo Musical Favorito</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-purple-500 transition relative">
                            <Music size={18} className="text-slate-400 absolute left-3 pointer-events-none" />
                            <select
                                value={profile.favorite_style}
                                onChange={e => setProfile({ ...profile, favorite_style: e.target.value })}
                                className="bg-transparent outline-none w-full text-slate-900 dark:text-slate-100 appearance-none cursor-pointer pl-8"
                            >
                                <option value="" className="bg-white dark:bg-slate-900 text-slate-500">Selecione um estilo...</option>
                                {musicalStyles.map(style => (
                                    <option key={style.id} value={style.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                        {style.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instrumento Principal</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-purple-500 transition relative">
                            <Music size={18} className="text-slate-400" />
                            <select
                                value={profile.instrument}
                                onChange={e => {
                                    const val = e.target.value;
                                    const newAvail = [...profile.available_instruments];
                                    if (val && !newAvail.includes(val)) {
                                        newAvail.push(val);
                                    }
                                    setProfile({ ...profile, instrument: val, available_instruments: newAvail });
                                }}
                                className="bg-transparent outline-none w-full text-slate-900 dark:text-slate-100 appearance-none cursor-pointer"
                            >
                                <option value="">Selecione seu instrumento principal...</option>
                                {instrumentsMetadata.map(inst => (
                                    <option key={inst.id} value={inst.name}>{inst.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Habilidades / Instrumentos que Domina</label>
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                            {instrumentsMetadata.map(inst => {
                                const isMain = inst.name === profile.instrument;
                                const isSelected = (profile.available_instruments || []).includes(inst.name) || isMain;
                                return (
                                    <button
                                        key={inst.id}
                                        type="button"
                                        onClick={() => {
                                            if (isMain) return;
                                            let newAvail = [...profile.available_instruments];
                                            if (newAvail.includes(inst.name)) {
                                                newAvail = newAvail.filter(i => i !== inst.name);
                                            } else {
                                                newAvail.push(inst.name);
                                            }
                                            setProfile({ ...profile, available_instruments: newAvail });
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            isSelected
                                                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                                                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                        } ${isMain ? 'ring-2 ring-purple-400 dark:ring-purple-900 border-purple-400 cursor-default opacity-80' : ''}`}
                                    >
                                        {isSelected && <Check size={14} />}
                                        {inst.name}
                                        {isMain && <span className="text-[8px] bg-white/20 px-1 rounded ml-1">PRINCIPAL</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance Settings */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 ml-1">
                    <Palette className="text-purple-500" size={24} />
                    Aparência
                </h3>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Cor da Cifra (Modo Claro)</h4>
                            <p className="text-sm text-slate-500">Cor dos acordes quando o tema claro estiver ativo.</p>
                        </div>
                        <input
                            type="color"
                            value={preferences.chord_color_light}
                            onChange={(e) => setPreferences({ ...preferences, chord_color_light: e.target.value })}
                            className="bg-transparent w-10 h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                    <hr className="border-slate-100 dark:border-slate-800" />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Cor da Cifra (Modo Escuro)</h4>
                            <p className="text-sm text-slate-500">Cor dos acordes quando o tema escuro estiver ativo.</p>
                        </div>
                        <input
                            type="color"
                            value={preferences.chord_color_dark}
                            onChange={(e) => setPreferences({ ...preferences, chord_color_dark: e.target.value })}
                            className="bg-transparent w-10 h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Player Settings (Mobile/Desktop) */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 ml-1">
                    <Music className="text-purple-500" size={24} />
                    Configurações do Player
                </h3>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">

                    {/* Default Display Mode */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Visualização Padrão</h4>
                            <p className="text-sm text-slate-500">Como as músicas devem abrir (com ou sem tabs).</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                            <button
                                onClick={() => setPreferences({ ...preferences, default_display_mode: 'full' })}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition ${!preferences.default_display_mode || preferences.default_display_mode === 'full' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                            >
                                Completo
                            </button>
                            <button
                                onClick={() => setPreferences({ ...preferences, default_display_mode: 'no_tabs' })}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition ${preferences.default_display_mode === 'no_tabs' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                            >
                                S/ Tabs
                            </button>
                            <button
                                onClick={() => setPreferences({ ...preferences, default_display_mode: 'only_tabs' })}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition ${preferences.default_display_mode === 'only_tabs' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                            >
                                Só Tabs
                            </button>
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Default Tone Mode */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Tom Padrão</h4>
                            <p className="text-sm text-slate-500">Qual tom carregar ao abrir a música.</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                            <button
                                onClick={() => setPreferences({ ...preferences, default_tone_mode: 'original' })}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${preferences.default_tone_mode === 'original' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                            >
                                Original
                            </button>
                            <button
                                onClick={() => setPreferences({ ...preferences, default_tone_mode: 'church' })}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${preferences.default_tone_mode === 'church' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                            >
                                Igreja
                            </button>
                            <button
                                onClick={() => setPreferences({ ...preferences, default_tone_mode: 'personal' })}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${preferences.default_tone_mode === 'personal' || preferences.default_tone_mode === 'my_key' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                            >
                                Meu Tom
                            </button>
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Default Instrument */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Instrumento Padrão</h4>
                            <p className="text-sm text-slate-500">Desenhos de acordes ao clicar nas cifras.</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                            <button
                                onClick={() => setPreferences({ ...preferences, default_instrument: 'guitar' })}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${!preferences.default_instrument || preferences.default_instrument === 'guitar' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                            >
                                Violão
                            </button>
                            <button
                                onClick={() => setPreferences({ ...preferences, default_instrument: 'keyboard' })}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${preferences.default_instrument === 'keyboard' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                            >
                                Teclado
                            </button>
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Default Magic Speed */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Velocidade Mágica Automática</h4>
                            <p className="text-sm text-slate-500">Ativar a rolagem mágica automaticamente ao abrir músicas.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.default_magic_speed_enabled}
                                onChange={e => setPreferences({ ...preferences, default_magic_speed_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-full">
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Velocidade de Rolagem Padrão</label>
                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{preferences.default_scroll_speed}</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">Usada quando a música não tem uma velocidade específica salva.</p>
                            <input
                                type="range" min="1" max="100" step="1"
                                value={preferences.default_scroll_speed}
                                onChange={e => setPreferences({ ...preferences, default_scroll_speed: parseInt(e.target.value) })}
                                className="w-full accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Device Indicator */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Dispositivo atual:</span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {isMobile ? '📱 Mobile' : (isTablet ? '📲 Tablet' : '💻 Desktop')}
                        </span>
                    </div>

                    {/* Tabs */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                        <button
                            onClick={() => setPlayerTab('mobile')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition ${playerTab === 'mobile' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                        >
                            📱 Mobile
                        </button>
                        <button
                            onClick={() => setPlayerTab('tablet')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition ${playerTab === 'tablet' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                        >
                            📲 Tablet
                        </button>
                        <button
                            onClick={() => setPlayerTab('desktop')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition ${playerTab === 'desktop' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                        >
                            💻 Desktop
                        </button>
                    </div>

                    {/* Mobile Settings */}
                    {playerTab === 'mobile' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200">
                            {/* Font Size */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Tamanho Fonte</label>
                                <input
                                    type="range" min="10" max="30" step="1"
                                    value={tempMobilePrefs.fontSize}
                                    onChange={e => setTempMobilePrefs({ ...tempMobilePrefs, fontSize: parseInt(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempMobilePrefs.fontSize}pt</span>
                            </div>

                            {/* Line Spacing */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Espaçamento</label>
                                <input
                                    type="range" min="0.5" max="3.0" step="0.1"
                                    value={tempMobilePrefs.lineSpacing}
                                    onChange={e => setTempMobilePrefs({ ...tempMobilePrefs, lineSpacing: parseFloat(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempMobilePrefs.lineSpacing.toFixed(1)}</span>
                            </div>

                            {/* Letter Spacing */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Espaç. Letras</label>
                                <input
                                    type="range" min="0.5" max="2.0" step="0.1"
                                    value={tempMobilePrefs.letterSpacing}
                                    onChange={e => setTempMobilePrefs({ ...tempMobilePrefs, letterSpacing: parseFloat(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempMobilePrefs.letterSpacing.toFixed(1)}</span>
                            </div>

                            {/* Scroll Speed */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Velocidade</label>
                                <input
                                    type="range" min="1" max="100" step="1"
                                    value={tempMobilePrefs.scrollSpeed}
                                    onChange={e => setTempMobilePrefs({ ...tempMobilePrefs, scrollSpeed: parseInt(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempMobilePrefs.scrollSpeed}</span>
                            </div>
                        </div>
                    )}

                    {/* Desktop Settings */}
                    {playerTab === 'desktop' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                            {/* Font Size */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Tamanho Fonte</label>
                                <input
                                    type="range" min="10" max="40" step="1"
                                    value={tempDesktopPrefs.fontSize}
                                    onChange={e => setTempDesktopPrefs({ ...tempDesktopPrefs, fontSize: parseInt(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempDesktopPrefs.fontSize}pt</span>
                            </div>

                            {/* Line Spacing */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Espaçamento</label>
                                <input
                                    type="range" min="0.5" max="3.0" step="0.1"
                                    value={tempDesktopPrefs.lineSpacing}
                                    onChange={e => setTempDesktopPrefs({ ...tempDesktopPrefs, lineSpacing: parseFloat(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempDesktopPrefs.lineSpacing.toFixed(1)}</span>
                            </div>

                            {/* Letter Spacing */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Espaç. Letras</label>
                                <input
                                    type="range" min="0.5" max="2.0" step="0.1"
                                    value={tempDesktopPrefs.letterSpacing}
                                    onChange={e => setTempDesktopPrefs({ ...tempDesktopPrefs, letterSpacing: parseFloat(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempDesktopPrefs.letterSpacing.toFixed(1)}</span>
                            </div>

                            {/* Scroll Speed */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Velocidade</label>
                                <input
                                    type="range" min="1" max="100" step="1"
                                    value={tempDesktopPrefs.scrollSpeed}
                                    onChange={e => setTempDesktopPrefs({ ...tempDesktopPrefs, scrollSpeed: parseInt(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempDesktopPrefs.scrollSpeed}</span>
                            </div>
                        </div>
                    )}
                    {/* Tablet Settings */}
                    {playerTab === 'tablet' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                            {/* Font Size */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Tamanho Fonte</label>
                                <input
                                    type="range" min="10" max="35" step="1"
                                    value={tempTabletPrefs.fontSize}
                                    onChange={e => setTempTabletPrefs({ ...tempTabletPrefs, fontSize: parseInt(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempTabletPrefs.fontSize}pt</span>
                            </div>

                            {/* Line Spacing */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Espaçamento</label>
                                <input
                                    type="range" min="0.5" max="3.0" step="0.1"
                                    value={tempTabletPrefs.lineSpacing}
                                    onChange={e => setTempTabletPrefs({ ...tempTabletPrefs, lineSpacing: parseFloat(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempTabletPrefs.lineSpacing.toFixed(1)}</span>
                            </div>

                            {/* Letter Spacing */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Espaç. Letras</label>
                                <input
                                    type="range" min="0.5" max="2.0" step="0.1"
                                    value={tempTabletPrefs.letterSpacing}
                                    onChange={e => setTempTabletPrefs({ ...tempTabletPrefs, letterSpacing: parseFloat(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempTabletPrefs.letterSpacing.toFixed(1)}</span>
                            </div>

                            {/* Scroll Speed */}
                            <div className="flex items-center gap-4">
                                <label className="w-32 text-sm text-slate-500">Velocidade</label>
                                <input
                                    type="range" min="1" max="20" step="1"
                                    value={tempTabletPrefs.scrollSpeed}
                                    onChange={e => setTempTabletPrefs({ ...tempTabletPrefs, scrollSpeed: parseInt(e.target.value) })}
                                    className="flex-1 accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-12 text-right font-mono text-sm">{tempTabletPrefs.scrollSpeed}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Platform Preferences */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 ml-1">
                    <Settings className="text-purple-500" size={24} />
                    Preferências da Plataforma
                </h3>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">

                    {/* Allow Collab Invites */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Convites de Colaboração</h4>
                                <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full">BETA</span>
                            </div>
                            <p className="text-sm text-slate-500">Permitir que outros editores te adicionem em playlists.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.allow_collab_invites}
                                onChange={e => setPreferences({ ...preferences, allow_collab_invites: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Newsletter */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Novidades e Dicas</h4>
                                <Bell size={14} className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">Receber atualizações sobre novas funcionalidades por email.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.newsletter_opt_in}
                                onChange={e => setPreferences({ ...preferences, newsletter_opt_in: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                </div>
            </div>

            {/* Projection Defaults Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 ml-1">
                    <MonitorPlay className="text-indigo-500" size={24} />
                    Padrão da Projeção
                </h3>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
                    <p className="text-sm text-slate-500 -mt-1">
                        Configurações visuais padrão para a tela de projeção. Aplicadas quando nenhum fundo específico está definido para a playlist ou música.
                    </p>

                    {/* Cor de Fundo */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Cor de Fundo Padrão</h4>
                            <p className="text-sm text-slate-500">Usada quando não há imagem ou vídeo de fundo.</p>
                        </div>
                        <input
                            type="color"
                            value={projDefaults.bgColor}
                            onChange={e => setProjDefaults({ ...projDefaults, bgColor: e.target.value, bgType: 'color' })}
                            className="bg-transparent w-10 h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                        />
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Cor do Texto */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Cor do Texto</h4>
                            <p className="text-sm text-slate-500">Cor principal das letras projetadas.</p>
                        </div>
                        <input
                            type="color"
                            value={projDefaults.textColor}
                            onChange={e => setProjDefaults({ ...projDefaults, textColor: e.target.value })}
                            className="bg-transparent w-10 h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                        />
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Sombra no Texto */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Sombra no Texto</h4>
                            <p className="text-sm text-slate-500">Adiciona sombra para melhorar legibilidade sobre imagens/vídeos.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={projDefaults.textShadow}
                                onChange={e => setProjDefaults({ ...projDefaults, textShadow: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Tamanho do Texto */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Tamanho do Texto</h4>
                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{projDefaults.fontSize}%</span>
                        </div>
                        <p className="text-sm text-slate-500">Escala base do tamanho da fonte de projeção.</p>
                        <input
                            type="range" min="50" max="200" step="5"
                            value={projDefaults.fontSize}
                            onChange={e => setProjDefaults({ ...projDefaults, fontSize: parseInt(e.target.value) })}
                            className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>50%</span><span>100% (padrão)</span><span>200%</span>
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Imagem de Fundo */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Imagem de Fundo Global</h4>
                            <p className="text-sm text-slate-500">
                                {projDefaults.bgType === 'image' && projDefaults.bgUrl
                                    ? <span className="text-indigo-500 font-medium">✓ Imagem definida</span>
                                    : 'Nenhuma imagem global definida.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {projDefaults.bgType === 'image' && projDefaults.bgUrl && (
                                <button
                                    onClick={() => setProjDefaults({ ...projDefaults, bgType: 'color', bgUrl: '' })}
                                    className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                                >Remover</button>
                            )}
                            <button
                                onClick={() => setIsProjImageModalOpen(true)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${projDefaults.bgType === 'image' && projDefaults.bgUrl ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                            >
                                <ImageIcon size={16} /> Escolher
                            </button>
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Vídeo de Fundo */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Vídeo de Fundo Global</h4>
                            <p className="text-sm text-slate-500">
                                {projDefaults.bgType === 'video' && projDefaults.bgUrl
                                    ? <span className="text-indigo-500 font-medium">✓ Vídeo definido</span>
                                    : 'Nenhum vídeo global definido.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {projDefaults.bgType === 'video' && projDefaults.bgUrl && (
                                <button
                                    onClick={() => setProjDefaults({ ...projDefaults, bgType: 'color', bgUrl: '' })}
                                    className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                                >Remover</button>
                            )}
                            <button
                                onClick={() => setIsProjVideoModalOpen(true)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${projDefaults.bgType === 'video' && projDefaults.bgUrl ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                            >
                                <VideoIcon size={16} /> Escolher
                            </button>
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Logo da Igreja */}
                    <div className="flex flex-col gap-4">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Logo da Igreja / Ministério</h4>
                                <ImageIcon size={14} className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">Exibida no Timer e na Tela Limpa quando não há músicas projetando.</p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div 
                                className={`w-40 h-28 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition relative ${isUploadingLogo ? 'opacity-50' : ''}`}
                                onClick={() => logoFileInputRef.current?.click()}
                            >
                                {isUploadingLogo && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                    </div>
                                )}
                                {churchLogoUrl ? (
                                    <img src={churchLogoUrl} alt="Logo Igreja" className="max-w-full max-h-full object-contain p-3" />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <ImageIcon size={32} />
                                        <span className="text-xs mt-2 font-bold">Enviar Logo</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => logoFileInputRef.current?.click()}
                                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2"
                                >
                                    <Upload size={16} />
                                    Trocar Logo
                                </button>
                                {churchLogoUrl && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("Deseja remover a logo?")) {
                                                if (churchLogoUrl.includes('supabase.co/storage/v1/object/public/avatars/')) {
                                                    const oldPath = churchLogoUrl.split('/').pop();
                                                    if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
                                                }
                                                setChurchLogoUrl('');
                                            }
                                        }}
                                        className="text-rose-500 hover:text-rose-600 text-xs font-bold text-left px-2 flex items-center gap-1"
                                    >
                                        <Trash2 size={12} />
                                        Remover Logo
                                    </button>
                                )}
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={logoFileInputRef}
                            onChange={handleChurchLogoUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Alert Style Defaults */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider opacity-60">Estilo Padrão do Alerta</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cor de Fundo</span>
                                </div>
                                <input
                                    type="color"
                                    value={projDefaults.alertBgColor}
                                    onChange={e => setProjDefaults({ ...projDefaults, alertBgColor: e.target.value })}
                                    className="bg-transparent w-8 h-8 cursor-pointer rounded-lg overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm"
                                />
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cor do Texto</span>
                                </div>
                                <input
                                    type="color"
                                    value={projDefaults.alertTextColor}
                                    onChange={e => setProjDefaults({ ...projDefaults, alertTextColor: e.target.value })}
                                    className="bg-transparent w-8 h-8 cursor-pointer rounded-lg overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tamanho da Fonte (Base)</span>
                                <span className="text-xs font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded shadow-sm">{projDefaults.alertFontSize}%</span>
                            </div>
                            <input
                                type="range" min="50" max="250" step="5"
                                value={projDefaults.alertFontSize}
                                onChange={e => setProjDefaults({ ...projDefaults, alertFontSize: parseInt(e.target.value) })}
                                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase">
                                <span>Pequeno</span><span>Padrão (100%)</span><span>Muito Grande</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bible Background Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 ml-1">
                    <BookOpen className="text-purple-500" size={24} />
                    Fundo Padrão da Bíblia
                </h3>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
                    <p className="text-sm text-slate-500 -mt-1">
                        Configure um fundo exclusivo para quando projetar versículos bíblicos.
                    </p>

                    {/* Cor de Fundo Bíblia */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Cor de Fundo da Bíblia</h4>
                            <p className="text-sm text-slate-500">Usada se não houver imagem ou vídeo configurado.</p>
                        </div>
                        <input
                            type="color"
                            value={bibleBGDefaults.bgColor}
                            onChange={e => setBibleBGDefaults({ ...bibleBGDefaults, bgColor: e.target.value, bgType: 'color' })}
                            className="bg-transparent w-10 h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                        />
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Imagem de Fundo Bíblia */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Imagem de Fundo Bíblia</h4>
                            <p className="text-sm text-slate-500">
                                {bibleBGDefaults.bgType === 'image' && bibleBGDefaults.bgUrl
                                    ? <span className="text-purple-500 font-medium">✓ Imagem definida</span>
                                    : 'Nenhuma imagem definida para Bíblia.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {bibleBGDefaults.bgType === 'image' && bibleBGDefaults.bgUrl && (
                                <button
                                    onClick={() => setBibleBGDefaults({ ...bibleBGDefaults, bgType: 'color', bgUrl: '' })}
                                    className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                                >Remover</button>
                            )}
                            <button
                                onClick={() => { setBibleModalTarget('image'); setIsProjImageModalOpen(true); }}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${bibleBGDefaults.bgType === 'image' && bibleBGDefaults.bgUrl ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                            >
                                <ImageIcon size={16} /> Escolher
                            </button>
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Vídeo de Fundo Bíblia */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Vídeo de Fundo Bíblia</h4>
                            <p className="text-sm text-slate-500">
                                {bibleBGDefaults.bgType === 'video' && bibleBGDefaults.bgUrl
                                    ? <span className="text-purple-500 font-medium">✓ Vídeo definido</span>
                                    : 'Nenhum vídeo definido para Bíblia.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {bibleBGDefaults.bgType === 'video' && bibleBGDefaults.bgUrl && (
                                <button
                                    onClick={() => setBibleBGDefaults({ ...bibleBGDefaults, bgType: 'color', bgUrl: '' })}
                                    className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                                >Remover</button>
                            )}
                            <button
                                onClick={() => { setBibleModalTarget('video'); setIsProjVideoModalOpen(true); }}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${bibleBGDefaults.bgType === 'video' && bibleBGDefaults.bgUrl ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                            >
                                <VideoIcon size={16} /> Escolher
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timer Default Background */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 ml-1">
                    <Clock className="text-purple-500" size={24} />
                    Fundo Padrão do Timer
                </h3>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
                    <p className="text-sm text-slate-500 -mt-1">
                        Configure um fundo exclusivo para a tela do timer.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setTimerDefaults({ ...timerDefaults, bgType: 'color' })}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${timerDefaults.bgType === 'color' ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-slate-50 text-slate-500 border border-transparent'}`}
                        >COR</button>
                        <button
                            onClick={() => { setBibleModalTarget('timer_image'); setIsProjImageModalOpen(true); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${timerDefaults.bgType === 'image' ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-slate-50 text-slate-500 border border-transparent'}`}
                        >IMAGEM</button>
                        <button
                            onClick={() => { setBibleModalTarget('timer_video'); setIsProjVideoModalOpen(true); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${timerDefaults.bgType === 'video' ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-slate-50 text-slate-500 border border-transparent'}`}
                        >VÍDEO</button>
                    </div>

                    {timerDefaults.bgType === 'color' && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500">Cor de fundo:</span>
                            <input
                                type="color"
                                value={timerDefaults.bgColor}
                                onChange={(e) => setTimerDefaults({ ...timerDefaults, bgColor: e.target.value })}
                                className="w-8 h-8 rounded shrink-0"
                            />
                        </div>
                    )}

                    {timerDefaults.bgUrl && (
                        <div className="relative w-full aspect-video rounded-xl bg-black overflow-hidden border border-slate-200 dark:border-slate-700">
                            {timerDefaults.bgType === 'image' ? (
                                <img src={timerDefaults.bgUrl} className="w-full h-full object-cover" alt="Timer BG" />
                            ) : (
                                <video src={timerDefaults.bgUrl} className="w-full h-full object-cover" muted loop autoPlay />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Image/Video Background Modals for Projection Defaults */}
            <ImageBackgroundModal
                isOpen={isProjImageModalOpen}
                onClose={() => { setIsProjImageModalOpen(false); setBibleModalTarget(null); }}
                currentUrl={
                    bibleModalTarget === 'image' ? bibleBGDefaults.bgUrl :
                    bibleModalTarget === 'timer_image' ? timerDefaults.bgUrl :
                    (projDefaults.bgType === 'image' ? projDefaults.bgUrl : '')
                }
                onSelect={(url) => {
                    if (bibleModalTarget === 'image') {
                        setBibleBGDefaults({ ...bibleBGDefaults, bgType: 'image', bgUrl: url });
                    } else if (bibleModalTarget === 'timer_image') {
                        setTimerDefaults({ ...timerDefaults, bgType: 'image', bgUrl: url });
                    } else {
                        setProjDefaults({ ...projDefaults, bgType: 'image', bgUrl: url });
                    }
                    setIsProjImageModalOpen(false);
                    setBibleModalTarget(null);
                }}
            />
            <VideoBackgroundModal
                isOpen={isProjVideoModalOpen}
                onClose={() => { setIsProjVideoModalOpen(false); setBibleModalTarget(null); }}
                currentUrl={
                    bibleModalTarget === 'video' ? bibleBGDefaults.bgUrl :
                    bibleModalTarget === 'timer_video' ? timerDefaults.bgUrl :
                    (projDefaults.bgType === 'video' ? projDefaults.bgUrl : '')
                }
                onSelect={(url) => {
                    if (bibleModalTarget === 'video') {
                        setBibleBGDefaults({ ...bibleBGDefaults, bgType: 'video', bgUrl: url });
                    } else if (bibleModalTarget === 'timer_video') {
                        setTimerDefaults({ ...timerDefaults, bgType: 'video', bgUrl: url });
                    } else {
                        setProjDefaults({ ...projDefaults, bgType: 'video', bgUrl: url });
                    }
                    setBibleModalTarget(null);
                    setIsProjVideoModalOpen(false);
                }}
            />

            {/* App / Updates Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 ml-1">
                    <RefreshCw className="text-purple-500" size={24} />
                    Aplicativo
                </h3>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Verificar Atualizações</h4>
                            <p className="text-sm text-slate-500">Limpa o cache e recarrega o app para buscar a versão mais recente.</p>
                        </div>
                        <button
                            onClick={handleCheckUpdates}
                            disabled={isUpdating}
                            className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-60"
                        >
                            <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} />
                            {isUpdating ? 'Atualizando...' : 'Verificar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold flex items-center gap-2 text-rose-600 dark:text-rose-500 ml-1">
                    <AlertTriangle size={24} />
                    Zona de Perigo
                </h3>
                <div className="bg-rose-50 dark:bg-rose-900/10 rounded-3xl p-6 shadow-sm border border-rose-200 dark:border-rose-900/30">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-rose-800 dark:text-rose-400">Excluir Minha Conta</h4>
                            <p className="text-sm text-rose-600 dark:text-rose-500/80 max-w-lg">
                                Atenção: a exclusão da conta é um processo irreversível. Você perderá o acesso imediato e todas as suas músicas serão enviadas para a moderação da plataforma.
                            </p>
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition shrink-0"
                        >
                            <Trash2 size={18} />
                            Quero Excluir
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                    <ArrowLeft size={24} />
                    Voltar
                </button>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition shadow-lg shadow-purple-600/20 transform hover:-translate-y-1"
                >
                    {isSaving ? (
                        <>Salvando...</>
                    ) : (
                        <>
                            <Save size={24} />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>
        </div >
    );
}
