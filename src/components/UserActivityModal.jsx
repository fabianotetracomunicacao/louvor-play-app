import React, { useState, useEffect } from 'react';
import { X, Loader, Music, Eye, MonitorUp, ListMusic, PlusCircle, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function UserActivityModal({ isOpen, onClose, targetId, targetName }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (isOpen && targetId) {
            fetchStats();
        }
    }, [isOpen, targetId]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_user_activity_report', { target_user_id: targetId });
            if (error) throw error;
            setStats(data);
        } catch (err) {
            console.error('Error fetching activity report:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden relative">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Relatório de Atividade</h3>
                            <p className="text-sm font-bold text-slate-400">{targetName}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader className="animate-spin text-purple-600" size={32} />
                            <p className="text-slate-400 font-bold animate-pulse">Consolidando dados...</p>
                        </div>
                    ) : stats ? (
                        <div className="space-y-8">
                            
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <StatCard 
                                    icon={<PlusCircle size={18} />} 
                                    label="Músicas Criadas" 
                                    value={stats.songs_created} 
                                    color="text-emerald-500" 
                                    bgColor="bg-emerald-50 dark:bg-emerald-500/10" 
                                />
                                <StatCard 
                                    icon={<Eye size={18} />} 
                                    label="Músicas Abertas" 
                                    value={stats.songs_viewed} 
                                    color="text-blue-500" 
                                    bgColor="bg-blue-50 dark:bg-blue-500/10" 
                                />
                                <StatCard 
                                    icon={<MonitorUp size={18} />} 
                                    label="Projeções" 
                                    value={stats.projections} 
                                    color="text-amber-500" 
                                    bgColor="bg-amber-50 dark:bg-amber-500/10" 
                                />
                                <StatCard 
                                    icon={<TrendingUp size={18} />} 
                                    label="Acessos (Logins)" 
                                    value={stats.logins} 
                                    color="text-purple-500" 
                                    bgColor="bg-purple-50 dark:bg-purple-500/10" 
                                />
                                <StatCard 
                                    icon={<ListMusic size={18} />} 
                                    label="Playlists" 
                                    value={stats.total_playlists} 
                                    color="text-indigo-500" 
                                    bgColor="bg-indigo-50 dark:bg-indigo-500/10" 
                                />
                                <StatCard 
                                    icon={<Calendar size={18} />} 
                                    label="Participações" 
                                    value={stats.playlists_member} 
                                    color="text-pink-500" 
                                    bgColor="bg-pink-50 dark:bg-pink-500/10" 
                                />
                            </div>

                            {/* Engagement Message */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Nível de Engajamento</h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                                            style={{ width: `${Math.min(100, (stats.logins * 5 + stats.projections * 10 + stats.songs_created * 20) / 2)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                                        {stats.logins > 50 ? 'Elite' : stats.logins > 20 ? 'Ativo' : 'Iniciante'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            Não foi possível carregar os dados.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 pt-0 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition-all active:scale-95"
                    >
                        FECHAR
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, bgColor }) {
    return (
        <div className={`${bgColor} p-4 rounded-3xl border border-white/10 dark:border-transparent flex flex-col gap-2 transition-transform hover:scale-[1.02]`}>
            <div className={`${color} opacity-80`}>{icon}</div>
            <div>
                <div className="text-2xl font-black text-slate-800 dark:text-white leading-none">{value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{label}</div>
            </div>
        </div>
    );
}
