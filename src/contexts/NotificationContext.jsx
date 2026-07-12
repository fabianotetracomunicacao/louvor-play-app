import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { ToastContainer, ConfirmModal } from '../components/NotificationUI';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();

    // Toast State
    const [toasts, setToasts] = useState([]);

    // User Notifications (DB)
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Confirm Modal State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        onCancel: () => { },
        type: 'danger', // 'danger' | 'info'
        confirmText: 'Confirmar',
        cancelText: 'Cancelar'
    });

    // --- TOASTS ---

    const showToast = useCallback((message, type = 'info', duration = 3000, link = null) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type, duration, link }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // --- DB NOTIFICATIONS ---

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                // Silently handle AbortError if it's broad cancellation
                if (error.name === 'AbortError' || error.message?.includes('Fetch is aborted') || error.message?.includes('AbortError')) {
                    return;
                }
                console.error("Error fetching notifications:", error);
            } else {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error("fetchNotifications Exception:", err);
        }
    }, [user]);

    // Realtime Subscription
    useEffect(() => {
        let mounted = true;
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications();

        const subscription = supabase
            .channel(`public:notifications:${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    if (!mounted) return;
                    fetchNotifications();
                    if (payload.eventType === 'INSERT') {
                        showToast(payload.new.message, payload.new.type || 'info', 5000, payload.new.link);
                    }
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [user, fetchNotifications, showToast]);

    const markAsRead = async (notificationId) => {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
    };

    const markAllAsRead = async () => {
        if (!user) return;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);
    };

    const sendNotification = async (toUserId, type, title, message, data = {}, link = null) => {
        const { error } = await supabase
            .from('notifications')
            .insert([{
                user_id: toUserId,
                type,
                title,
                message,
                data,
                link,
                read: false
            }]);
        if (error) console.error("Error sending notification:", error);
    };

    // --- CONFIRM MODAL ---

    const confirmAction = useCallback(({
        title,
        message,
        onConfirm,
        onCancel,
        type = 'danger',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar'
    }) => {
        return new Promise((resolve) => {
            setConfirmDialog({
                isOpen: true,
                title,
                message,
                type,
                confirmText,
                cancelText,
                onConfirm: async () => {
                    if (onConfirm) await onConfirm();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: async () => {
                    if (onCancel) await onCancel();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                }
            });
        });
    }, []);

    const value = React.useMemo(() => ({
        showToast,
        removeToast,
        confirmAction,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        sendNotification,
        fetchNotifications
    }), [showToast, removeToast, confirmAction, notifications, unreadCount, fetchNotifications]);

    return (
        <NotificationContext.Provider value={value}>
            {children}

            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <ConfirmModal
                {...confirmDialog}
                onCancel={() => {
                    confirmDialog.onCancel();
                }}
            />
        </NotificationContext.Provider>
    );
};
