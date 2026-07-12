import React, { useEffect, useState } from 'react';
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export const Toast = ({ id, type = 'info', message, duration = 3000, link, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    const styles = {
        success: { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', text: 'text-green-800 dark:text-green-200', icon: <Check size={20} className="text-green-600 dark:text-green-400" /> },
        error: { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500', text: 'text-red-800 dark:text-red-200', icon: <AlertCircle size={20} className="text-red-600 dark:text-red-400" /> },
        warning: { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-500', text: 'text-orange-800 dark:text-orange-200', icon: <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" /> },
        info: { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-800 dark:text-blue-200', icon: <Info size={20} className="text-blue-600 dark:text-blue-400" /> },
    };

    const style = styles[type] || styles.info;

    const handleClick = () => {
        if (link) {
            navigate(link);
            setIsVisible(false);
            setTimeout(() => onClose(id), 300);
        }
    };

    return (
        <div
            className={`
                flex items-center gap-3 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform 
                ${style.bg} ${style.border} ${style.text}
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                ${link ? 'cursor-pointer hover:shadow-xl active:scale-95' : ''}
            `}
            role="alert"
            onClick={handleClick}
        >
            <div className="shrink-0">{style.icon}</div>
            <p className="font-medium text-sm flex-1">{message}</p>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(false);
                    setTimeout(() => onClose(id), 300);
                }}
                className="ml-auto p-1 opacity-60 hover:opacity-100 transition"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
            <div className="flex flex-col gap-2 pointer-events-auto px-4 sm:px-0">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </div>
        </div>
    );
};

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden scale-100 animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{message}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`
                            px-4 py-2 font-bold text-white rounded-lg transition shadow-md
                            ${type === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'}
                        `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
