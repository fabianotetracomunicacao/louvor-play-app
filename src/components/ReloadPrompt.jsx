import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw, X } from 'lucide-react';

export function ReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            if (r) {
                // Automatically check for updates every hour (optional, but good practice)
                setInterval(() => {
                    r.update();
                }, 60 * 60 * 1000);
            }
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    const close = () => {
        setNeedRefresh(false);
    };

    const handleUpdate = async () => {
        console.log('Limpando caches do aplicativo...');
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                console.log('Todos os caches foram limpos com sucesso.');
            } catch (err) {
                console.error('Erro ao limpar caches:', err);
            }
        }
        
        // Trigger update to the service worker (this will send SKIP_WAITING and then reload)
        updateServiceWorker(true);
        
        // Fallback para forçar recarregamento caso o updateServiceWorker demore ou falhe
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-1/2 md:transform md:-translate-x-1/2 md:w-96 z-[9999] bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border-2 border-purple-500 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <RefreshCcw size={20} className="text-purple-500 animate-spin-slow" />
                        Nova versão disponível!
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Clique em atualizar para carregar as novidades do aplicativo.
                    </p>
                </div>
                <button
                    onClick={close}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="mt-4 flex gap-3">
                <button
                    onClick={handleUpdate}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition transform active:scale-95"
                >
                    Atualizar Agora
                </button>
            </div>
        </div>
    );
}
