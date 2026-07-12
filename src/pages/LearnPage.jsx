import React from 'react';
import { GraduationCap } from 'lucide-react';

export function LearnPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in duration-500">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-6 rounded-full mb-6 relative">
                <GraduationCap size={64} className="text-purple-600 dark:text-purple-400" />
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    EM BREVE
                </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Escola de Música
            </h1>

            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
                Estamos preparando um conteúdo incrível para você aprender a tocar, evoluir sua técnica e dominar novos instrumentos.
            </p>

            <div className="mt-8 flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            </div>
        </div>
    );
}
