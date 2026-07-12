import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Save, Package, DollarSign, ShieldAlert, CheckCircle, Loader } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { Portal } from './Portal';

export function SubscriptionManagerModal({ isOpen, onClose, targetId, targetName, type }) {
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);

    // Form State
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [isManualOverride, setIsManualOverride] = useState(false);
    const [status, setStatus] = useState('ACTIVE');

    useEffect(() => {
        if (isOpen && targetId) {
            loadData();
        }
    }, [isOpen, targetId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Load active plans for this type
            const { data: plansData, error: plansErr } = await supabase
                .from('plans')
                .select('*')
                .eq('type', type)
                .eq('active', true)
                .order('price', { ascending: true });

            if (plansErr) throw plansErr;
            setPlans(plansData);

            // 2. Load current subscription
            const field = type === 'church' ? 'church_id' : 'user_id';
            const { data: subData, error: subErr } = await supabase
                .from('subscriptions')
                .select('*, plans(*)')
                .eq(field, targetId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (subErr && subErr.code !== 'PGRST116') throw subErr;

            if (subData) {
                setCurrentSubscription(subData);
                setSelectedPlanId(subData.plan_id);
                setCustomPrice(subData.custom_price || '');
                setIsManualOverride(subData.manual_override || false);
                setStatus(subData.status || 'ACTIVE');
            } else if (plansData.length > 0) {
                setCurrentSubscription(null);
                setSelectedPlanId(plansData[0].id);
                setCustomPrice('');
                setIsManualOverride(false);
                setStatus('ACTIVE');
            }
        } catch (err) {
            console.error('Error loading subscription data:', err);
            showToast('Erro ao carregar dados da assinatura.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaveLoading(true);
        try {
            const field = type === 'church' ? 'church_id' : 'user_id';
            const payload = {
                [field]: targetId,
                plan_id: selectedPlanId,
                status: status,
                custom_price: customPrice ? parseFloat(customPrice) : null,
                manual_override: isManualOverride
            };

            if (currentSubscription) {
                // Update existing
                const { error } = await supabase
                    .from('subscriptions')
                    .update(payload)
                    .eq('id', currentSubscription.id);
                if (error) throw error;
            } else {
                // Insert new (Manual Mock over Asaas logic for Super Admins)
                payload.asaas_subscription_id = `manual_${Date.now()}`;
                
                const { error } = await supabase
                    .from('subscriptions')
                    .insert(payload);
                if (error) throw error;
            }

            showToast('Assinatura salva com sucesso!', 'success');
            onClose(true); // pass true to indicate changes were made
        } catch (err) {
            console.error('Save error:', err);
            showToast('Erro ao salvar assinatura.', 'error');
        } finally {
            setSaveLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                    
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <DollarSign className="text-emerald-500" />
                                Gerenciar Assinatura
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Alocar plano ou aplicar descontos para: <strong className="text-purple-600">{targetName}</strong></p>
                        </div>
                        <button onClick={() => onClose()} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader size={32} className="animate-spin text-purple-600" />
                            </div>
                        ) : (
                            <form id="subscription-form" onSubmit={handleSave} className="space-y-6">
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Plano</label>
                                    <select
                                        value={selectedPlanId}
                                        onChange={(e) => setSelectedPlanId(e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                                        required
                                    >
                                        <option value="" disabled>Selecione um plano...</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} - R$ {p.price} ({p.billing_cycle === 'YEARLY' ? 'Anual' : 'Mensal'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Valor Customizado (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Opcional. Ex: 29.90"
                                            value={customPrice}
                                            onChange={(e) => setCustomPrice(e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 outline-none font-medium text-purple-600 dark:text-purple-400 placeholder:text-slate-400"
                                        />
                                        <p className="text-[10px] text-slate-400">Deixe em branco para usar o valor original do plano.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Status do Acesso</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className={`w-full border rounded-xl px-4 py-3 outline-none font-bold ${
                                                status === 'ACTIVE' 
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                                    : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                                            }`}
                                        >
                                            <option value="ACTIVE">Ativo (Permitido)</option>
                                            <option value="PENDING">Pendente (Cobrando)</option>
                                            <option value="OVERDUE">Atrasado (Bloqueado)</option>
                                            <option value="CANCELED">Cancelado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="mt-1">
                                            <input 
                                                type="checkbox" 
                                                checked={isManualOverride}
                                                onChange={(e) => setIsManualOverride(e.target.checked)}
                                                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-amber-800 dark:text-amber-500 select-none flex items-center gap-2">
                                                <ShieldAlert size={16} />
                                                Cortesia / Liberação Manual
                                            </p>
                                            <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1 select-none leading-relaxed">
                                                Ao marcar essa opção, o sistema <strong>NÃO</strong> irá checar pendências no Asaas para este usuário/igreja. O acesso ficará liberado sem validações de pagamento futuras até que o status seja alterado.
                                            </p>
                                        </div>
                                    </label>
                                </div>

                            </form>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="px-6 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="subscription-form"
                            disabled={saveLoading || loading}
                            className="flex items-center gap-2 px-8 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
                        >
                            {saveLoading ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
                            Salvar Assinatura
                        </button>
                    </div>

                </div>
            </div>
        </Portal>
    );
}
