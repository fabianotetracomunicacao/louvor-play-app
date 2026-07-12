import React from 'react';
import { Settings, Wrench, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MaintenancePage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl text-center border border-slate-100 dark:border-slate-700">
                
                {/* Ícone com animação de pulso suave */}
                <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-amber-100 dark:bg-amber-900/30 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Wrench className="w-12 h-12 text-amber-500 dark:text-amber-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
                    Estamos em Manutenção
                </h1>
                
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    O Louvor Play está passando por algumas atualizações e melhorias para tornar sua experiência ainda melhor. Voltaremos em breve!
                </p>

                {/* Botão de login oculto para Admins */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <button 
                        onClick={() => navigate('/login')}
                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Acesso para Administradores</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
