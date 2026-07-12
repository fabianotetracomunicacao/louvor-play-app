import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Users, ArrowLeft, Activity, ShieldAlert, CheckCircle, Clock, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

export function AdminFinancialsPage() {
    const { isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useNotification();
    
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        mrr: 0,
        arr: 0,
        statusCounts: {},
        totalActive: 0
    });
    const [recentSubs, setRecentSubs] = useState([]);

    useEffect(() => {
        if (isSuperAdmin) {
            loadFinancialData();
        }
    }, [isSuperAdmin]);

    const loadFinancialData = async () => {
        setLoading(true);
        try {
            // Fetch MRR, ARR, and Statuses in parallel using the new RPCs
            const [
                { data: mrrData },
                { data: arrData },
                { data: statusData },
                { data: recentData }
            ] = await Promise.all([
                supabase.rpc('get_financial_mrr'),
                supabase.rpc('get_financial_arr'),
                supabase.rpc('get_subscriptions_by_status'),
                supabase.from('subscriptions')
                    .select('*, plans(name), profiles(name, email), churches(name)')
                    .order('updated_at', { ascending: false })
                    .limit(10)
            ]);

            let statusCounts = {};
            let totalActive = 0;

            if (statusData) {
                statusData.forEach(s => {
                    statusCounts[s.sub_status] = parseInt(s.count);
                    if (s.sub_status === 'ACTIVE') totalActive += parseInt(s.count);
                });
            }

            setMetrics({
                mrr: mrrData || 0,
                arr: arrData || 0,
                statusCounts,
                totalActive
            });

            setRecentSubs(recentData || []);

        } catch (error) {
            console.error('Error loading financial data:', error);
            showToast('Erro ao carregar os dados financeiros. Verifique se a migração do banco foi aplicada.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <ShieldAlert size={48} className="mx-auto text-rose-500" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
                    <p className="text-slate-500">Apenas administradores globais podem acessar o painel financeiro.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <DollarSign size={32} className="text-emerald-500" />
                        Painel Financeiro
                    </h1>
                    <p className="text-slate-500 mt-1">Gestão de assinaturas, receita e inadimplência</p>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* MRR */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <TrendingUp size={80} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">MRR</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                        {Number(metrics.mrr).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Receita Recorrente Mensal</p>
                </div>

                {/* ARR */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <DollarSign size={80} className="text-blue-500" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs font-black uppercase text-blue-600 tracking-wider">ARR</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                        {Number(metrics.arr).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Receita Recorrente Anual</p>
                </div>

                {/* Active Subscriptions */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Users size={80} className="text-purple-500" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <span className="text-xs font-black uppercase text-purple-600 tracking-wider">Ativos</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                        {metrics.totalActive.toLocaleString()}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Assinaturas Ativas</p>
                </div>

                {/* Overdue Subscriptions */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Activity size={80} className="text-rose-500" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                        <span className="text-xs font-black uppercase text-rose-600 tracking-wider">Atrasados</span>
                    </div>
                    <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mb-1">
                        {(metrics.statusCounts['OVERDUE'] || 0).toLocaleString()}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Clientes Inadimplentes</p>
                </div>
            </div>

            {/* Status Breakdown & Recent Subs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Status List */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm lg:col-span-1">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Activity className="text-purple-500" /> Status Geral
                    </h2>
                    <div className="space-y-4">
                        {[
                            { status: 'ACTIVE', label: 'Ativas', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                            { status: 'PENDING', label: 'Pendentes (Aguardando)', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                            { status: 'OVERDUE', label: 'Atrasadas', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                            { status: 'CANCELED', label: 'Canceladas/Expiradas', icon: X, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg} ${item.color}`}>
                                        <item.icon size={16} />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                                </div>
                                <span className="font-black text-slate-900 dark:text-white text-lg">
                                    {metrics.statusCounts[item.status] || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Subscriptions Table */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Users className="text-blue-500" /> Movimentações Recentes
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs uppercase font-black tracking-widest text-slate-400">
                                    <th className="pb-4">Cliente / Igreja</th>
                                    <th className="pb-4">Plano</th>
                                    <th className="pb-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {recentSubs.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="py-8 text-center text-slate-500">Nenhuma movimentação encontrada.</td>
                                    </tr>
                                ) : recentSubs.map(sub => (
                                    <tr key={sub.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                        <td className="py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {sub.churches?.name || sub.profiles?.name || sub.profiles?.email || 'Desconhecido'}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                Atualizado em {new Date(sub.updated_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="font-bold text-slate-700 dark:text-slate-300">{sub.plans?.name || '--'}</div>
                                            <div className="text-xs text-purple-600 font-medium mt-0.5">
                                                {sub.custom_price !== null 
                                                    ? `R$ ${sub.custom_price} (Custom)` 
                                                    : sub.manual_override ? 'Cortesia Manual' : 'Preço Padrão'}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                                                sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                                                sub.status === 'PENDING' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                                                sub.status === 'OVERDUE' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' :
                                                'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                            }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
