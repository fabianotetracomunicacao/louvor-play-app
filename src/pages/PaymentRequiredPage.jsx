import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CreditCard, ArrowRight, Loader, Star } from 'lucide-react';
import { AsaasService } from '../services/AsaasService';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../supabaseClient';
import { CheckoutModal } from '../components/CheckoutModal';

export function PaymentRequiredPage() {
    const { user, activeChurch, subscriptionStatus, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useNotification();
    
    // Page state
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [subDetails, setSubDetails] = useState(null);
    const [availablePlans, setAvailablePlans] = useState([]);
    
    // Modal state
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedPlanToCheckout, setSelectedPlanToCheckout] = useState(null);

    useEffect(() => {
        if (subscriptionStatus === 'ACTIVE') {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [subscriptionStatus, navigate]);

    const fetchData = async () => {
        setLoadingInfo(true);
        try {
            // First check if they have a subscription
            const profile = await supabase.from('profiles').select('subscription_id').eq('id', user.id).single();
            const church = activeChurch ? await supabase.from('churches').select('subscription_id').eq('id', activeChurch.id).single() : null;
            
            let subId = church?.data?.subscription_id || profile?.data?.subscription_id;
            
            if (subId) {
                const details = await AsaasService.getSubscriptionDetails(subId);
                setSubDetails(details);
            } else {
                // If they don't have a subscription, load available individual plans
                const { data: plans } = await supabase.from('plans').select('*').eq('type', 'individual').order('price', { ascending: true });
                setAvailablePlans(plans || []);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoadingInfo(false);
        }
    };

    const handleOpenCheckout = (plan) => {
        setSelectedPlanToCheckout(plan);
        setIsCheckoutOpen(true);
    };

    const handleCheckoutSuccess = (response) => {
        showToast('Processamento concluído. Verifique seu dashboard.', 'success');
        // A reload or state refresh might be needed here to update subscriptionStatus
        setTimeout(() => window.location.reload(), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 space-y-8 text-center animate-in zoom-in-95 duration-500">
                
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
                    {subDetails ? <AlertCircle className="text-rose-500 w-10 h-10 animate-bounce" /> : <Star className="text-purple-500 w-10 h-10" />}
                </div>
                
                <div className="space-y-3">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-4">
                        {subDetails ? 'Acesso Suspenso' : 'Assine o LouvorPlay'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {subDetails 
                            ? 'Identificamos uma fatura em atraso na sua assinatura. Para continuar usando a plataforma, por favor regularize o pagamento.'
                            : 'Nenhuma assinatura ativa foi encontrada para sua conta. Escolha um plano abaixo para liberar seu acesso.'}
                    </p>
                </div>

                {loadingInfo ? (
                    <div className="flex justify-center p-4">
                        <Loader className="animate-spin text-purple-500" />
                    </div>
                ) : subDetails ? (
                    // HAS AN OVERDUE SUBSCRIPTION
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5 text-left space-y-4">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Plano Atual</p>
                            <p className="font-bold text-slate-900 dark:text-white">{subDetails.plan?.name}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700/50">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">Valor</p>
                                <p className="font-bold text-slate-900 dark:text-white">R$ {subDetails.plan?.price?.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400">Status</p>
                                <p className="font-black text-rose-500">Atrasado / Pendente</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleOpenCheckout(subDetails.plan)}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 mt-4 py-4 rounded-2xl font-black transition hover:bg-purple-600 dark:hover:bg-purple-100 hover:text-white flex items-center justify-center gap-2"
                        >
                            <CreditCard className="w-5 h-5" />
                            Pagar Fatura
                        </button>
                    </div>
                ) : (
                    // DOES NOT HAVE A SUBSCRIPTION
                    <div className="grid gap-4 mt-6">
                        {availablePlans.map(plan => (
                             <div key={plan.id} className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-6 rounded-2xl text-left flex items-center justify-between hover:border-purple-500 dark:hover:border-purple-500 transition cursor-pointer group" onClick={() => handleOpenCheckout(plan)}>
                                 <div>
                                     <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">{plan.name}</h3>
                                     <p className="text-slate-500 text-sm">{plan.billing_cycle === 'YEARLY' ? 'Cobrado anualmente' : 'Cobrado mensalmente'}</p>
                                 </div>
                                 <div className="text-right">
                                     <div className="font-black text-xl text-slate-900 dark:text-white">R$ {plan.price.toFixed(2)}</div>
                                 </div>
                             </div>
                        ))}
                        {availablePlans.length === 0 && (
                            <p className="text-slate-500 text-sm">Nenhum plano disponível no momento.</p>
                        )}
                    </div>
                )}

                <div className="space-y-3 pt-4">
                    <button 
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className="w-full text-slate-400 hover:text-slate-600 dark:hover:text-white py-3 font-bold flex items-center justify-center gap-2 transition"
                    >
                         Sair da conta <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <CheckoutModal 
                isOpen={isCheckoutOpen} 
                onClose={() => setIsCheckoutOpen(false)} 
                plan={selectedPlanToCheckout}
                onSuccess={handleCheckoutSuccess}
            />
        </div>
    );
}
