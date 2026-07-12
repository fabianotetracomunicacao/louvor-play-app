import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
    Package, Plus, Edit3, Trash2, CheckCircle, 
    XCircle, Shield, ArrowLeft, Save, Loader
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export function SuperAdminPlansPage() {
    const { isSuperAdmin } = useAuth();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'church',
        billing_cycle: 'MONTHLY',
        leader_limit: 1,
        worshiper_limit: 5,
        price: 0,
        active: true
    });

    useEffect(() => {
        if (isSuperAdmin) {
            loadPlans();
        }
    }, [isSuperAdmin]);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('price', { ascending: true });

            if (error) throw error;
            setPlans(data);
        } catch (err) {
            console.error(err);
            showToast('Erro ao carregar planos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingPlan(null);
        setFormData({
            name: '',
            description: '',
            type: 'church',
            billing_cycle: 'MONTHLY',
            leader_limit: 1,
            worshiper_limit: 5,
            price: 0,
            active: true
        });
        setIsEditing(true);
    };

    const handleOpenEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description || '',
            type: plan.type || 'church',
            billing_cycle: plan.billing_cycle || 'MONTHLY',
            leader_limit: plan.leader_limit,
            worshiper_limit: plan.worshiper_limit,
            price: plan.price || 0,
            active: plan.active
        });
        setIsEditing(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveLoading(true);
        try {
            if (editingPlan) {
                const { error } = await supabase
                    .from('plans')
                    .update(formData)
                    .eq('id', editingPlan.id);
                if (error) throw error;
                showToast('Plano atualizado com sucesso!', 'success');
            } else {
                const { error } = await supabase
                    .from('plans')
                    .insert(formData);
                if (error) throw error;
                showToast('Plano criado com sucesso!', 'success');
            }
            setIsEditing(false);
            loadPlans();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleToggleActive = async (plan) => {
        try {
            const { error } = await supabase
                .from('plans')
                .update({ active: !plan.active })
                .eq('id', plan.id);
            if (error) throw error;
            setPlans(plans.map(p => p.id === plan.id ? { ...p, active: !p.active } : p));
            showToast(`Plano ${!plan.active ? 'ativado' : 'desativado'} com sucesso.`);
        } catch (err) {
            showToast('Erro ao atualizar status do plano.', 'error');
        }
    };

    if (!isSuperAdmin) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
                <Shield size={48} className="mx-auto text-slate-200" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
                <p className="text-slate-500">Apenas administradores globais podem acessar esta página.</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/churches" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <Package className="text-purple-600" /> Gestão de Planos
                        </h1>
                        <p className="text-slate-500">Gerencie os pacotes e limites do SaaS</p>
                    </div>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-600/20"
                >
                    <Plus size={20} />
                    Novo Plano
                </button>
            </div>

            {/* Plans Tables */}
            {[
                { title: 'Planos de Igreja', data: plans.filter(p => typeof p.type === 'undefined' || p.type === 'church') },
                { title: 'Planos Individuais', data: plans.filter(p => p.type === 'individual') }
            ].map(({ title, data }, idx) => (
                <div key={idx} className="mb-10 last:mb-0">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 pl-2">{title}</h3>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                <tr>
                                    <th className="p-6">Plano</th>
                                    <th className="p-6">Tipo</th>
                                    <th className="p-6">Limites</th>
                                    <th className="p-6">Preço (R$)</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-20 text-center text-slate-500">Carregando planos...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan="6" className="p-20 text-center text-slate-500">Nenhum plano cadastrado nesta categoria.</td></tr>
                                ) : data.map(plan => (
                                    <tr key={plan.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${plan.active ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{plan.name}</p>
                                                    <p className="text-xs text-slate-400 max-w-xs truncate">{plan.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block w-max ${
                                                plan.type === 'individual' 
                                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                                                    : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                            }`}>
                                                {plan.type === 'individual' ? 'Individual' : 'Igreja'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-sm">
                                            {plan.type === 'individual' ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">Acesso Individual</span>
                                                    <span className="text-slate-500">1 Usuário</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{plan.leader_limit} Líderes</span>
                                                    <span className="text-slate-500">{plan.worshiper_limit} Adoradores</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                    {plan.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                    / {plan.billing_cycle === 'YEARLY' ? 'Anual' : 'Mensal'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                plan.active 
                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                    : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                            }`}>
                                                {plan.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                                <button 
                                                    onClick={() => handleToggleActive(plan)}
                                                    className={`p-2 rounded-xl transition ${plan.active ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                                                    title={plan.active ? 'Desativar' : 'Ativar'}
                                                >
                                                    {plan.active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenEdit(plan)}
                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* Edit/Add Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">
                            {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nome do Plano</label>
                                <input 
                                    required
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                                    placeholder="Ex: Plano Intermediário"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Público do Plano</label>
                                    <select 
                                        required
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold appearance-none"
                                    >
                                        <option value="church">Igreja (Multi-usuário)</option>
                                        <option value="individual">Individual (Único)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Ciclo de Cobrança</label>
                                    <select 
                                        required
                                        value={formData.billing_cycle}
                                        onChange={e => setFormData({ ...formData, billing_cycle: e.target.value })}
                                        className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold appearance-none"
                                    >
                                        <option value="MONTHLY">Mensal</option>
                                        <option value="YEARLY">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div className={`grid grid-cols-2 gap-4 transition-all duration-300 ${formData.type === 'individual' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Limite: Líderes</label>
                                    <input 
                                        required
                                        type="number" 
                                        value={formData.leader_limit}
                                        onChange={e => setFormData({ ...formData, leader_limit: parseInt(e.target.value) })}
                                        className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Limite: Adoradores</label>
                                    <input 
                                        required
                                        type="number" 
                                        value={formData.worshiper_limit}
                                        onChange={e => setFormData({ ...formData, worshiper_limit: parseInt(e.target.value) })}
                                        className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                                    Preço {formData.billing_cycle === 'YEARLY' ? 'Anual' : 'Mensal'} (R$)
                                </label>
                                <input 
                                    required
                                    type="number" 
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Descrição</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold min-h-[100px]"
                                    placeholder="O que este plano oferece?"
                                />
                            </div>

                            <div className="flex gap-4 pt-6 sticky bottom-0 bg-white dark:bg-slate-900 py-2">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 text-slate-500 font-bold">Cancelar</button>
                                <button 
                                    type="submit" 
                                    disabled={saveLoading}
                                    className="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2"
                                >
                                    {saveLoading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                    {editingPlan ? 'Salvar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
