import React, { useState } from 'react';
import { CreditCard, QrCode, X, Copy, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { AsaasService } from '../services/AsaasService';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

export function CheckoutModal({ isOpen, onClose, plan, onSuccess }) {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [paymentMethod, setPaymentMethod] = useState('PIX'); // PIX | CREDIT_CARD
    const [loading, setLoading] = useState(false);
    const [pixData, setPixData] = useState(null);
    const [copied, setCopied] = useState(false);

    // Credit Card Form State
    const [ccForm, setCcForm] = useState({
        holderName: '',
        number: '',
        expiryMonth: '',
        expiryYear: '',
        ccv: '',
        cpfCnpj: '',
        email: user?.email || '',
        phone: '',
        postalCode: '',
        addressNumber: ''
    });

    if (!isOpen || !plan) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCcForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCopyPix = () => {
        navigator.clipboard.writeText(pixData.payload);
        setCopied(true);
        showToast('Código PIX copiado mecânico!', 'success');
        setTimeout(() => setCopied(false), 3000);
    };

    const handleCheckout = async (e) => {
        e?.preventDefault();
        setLoading(true);
        
        try {
            // Validate CC Form
            let ccData = null;
            let ccHolderInfo = null;
            let customerData = {
                name: user?.user_metadata?.full_name || 'Usuário ' + user?.id?.substring(0, 5),
                email: ccForm.email
            };

            if (paymentMethod === 'CREDIT_CARD') {
                if (!ccForm.holderName || !ccForm.number || !ccForm.expiryMonth || !ccForm.expiryYear || !ccForm.ccv || !ccForm.cpfCnpj || !ccForm.postalCode || !ccForm.addressNumber) {
                    showToast('Preencha os campos obrigatórios do cartão.', 'error');
                    setLoading(false);
                    return;
                }

                ccData = {
                    holderName: ccForm.holderName,
                    number: ccForm.number.replace(/\D/g, ''),
                    expiryMonth: ccForm.expiryMonth,
                    expiryYear: ccForm.expiryYear.length === 2 ? `20${ccForm.expiryYear}` : ccForm.expiryYear,
                    ccv: ccForm.ccv
                };

                ccHolderInfo = {
                    name: ccForm.holderName,
                    email: ccForm.email,
                    cpfCnpj: ccForm.cpfCnpj.replace(/\D/g, ''),
                    postalCode: ccForm.postalCode.replace(/\D/g, ''),
                    addressNumber: ccForm.addressNumber,
                    phone: ccForm.phone.replace(/\D/g, '') || ''
                };

                // Add missing customer data needed for creation
                customerData.cpfCnpj = ccHolderInfo.cpfCnpj;
                customerData.postalCode = ccHolderInfo.postalCode;
                customerData.addressNumber = ccHolderInfo.addressNumber;
                customerData.phone = ccHolderInfo.phone;
            }

            const response = await AsaasService.createSubscription(
                plan.id,
                'individual',
                null,
                customerData,
                paymentMethod,
                ccData,
                ccHolderInfo
            );

            if (paymentMethod === 'PIX') {
                if (response.pixQrCode) {
                    setPixData(response.pixQrCode);
                    showToast('PIX gerado! Realize o pagamento.', 'success');
                } else if (response.invoiceUrl) {
                    // Fallback to Asaas Invoice Window
                    window.open(response.invoiceUrl, '_blank');
                    onSuccess && onSuccess(response);
                }
            } else {
                // If Credit Card, might be ACTIVE instantly or fail
                if (response.status === 'ACTIVE') {
                    showToast('Pagamento confirmado com sucesso!', 'success');
                    onSuccess && onSuccess(response);
                    onClose();
                } else {
                    showToast('Assinatura criada. O cartão será processado.', 'info');
                    onSuccess && onSuccess(response);
                    onClose();
                }
            }

        } catch (error) {
            console.error('Checkout error:', error);
            showToast(error.message || 'Falha ao processar assinatura', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Assinar {plan.name}</h2>
                        <p className="text-sm text-slate-500 font-medium">R$ {plan.price.toFixed(2)} / {plan.billing_cycle === 'YEARLY' ? 'Ano' : 'Mês'}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* PIX Flow Active */}
                    {pixData ? (
                        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 shrink-0" />
                                <div className="text-left">
                                    <p className="font-bold">Código PIX gerado!</p>
                                    <p className="text-sm">Escaneie o QR Code abaixo ou utilize o código Copia e Cola no app do seu banco.</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-center p-4 bg-white rounded-2xl border-4 border-slate-100">
                                <img 
                                    src={`data:image/png;base64,${pixData.encodedImage}`} 
                                    alt="QR Code PIX" 
                                    className="w-48 h-48"
                                />
                            </div>

                            <button 
                                onClick={handleCopyPix}
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                            >
                                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                {copied ? 'Copiado!' : 'Copiar Código PIX'}
                            </button>

                            <button 
                                onClick={() => { onSuccess && onSuccess(); onClose(); }}
                                className="w-full text-slate-500 font-bold hover:text-slate-900 dark:hover:text-white transition"
                            >
                                Já realizei o pagamento
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Payment Tabs */}
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                                <button
                                    onClick={() => setPaymentMethod('PIX')}
                                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${paymentMethod === 'PIX' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <QrCode className="w-4 h-4" />
                                    PIX 
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${paymentMethod === 'CREDIT_CARD' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Cartão
                                </button>
                            </div>

                            {paymentMethod === 'CREDIT_CARD' ? (
                                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 animate-in fade-in">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex gap-3 text-blue-700 dark:text-blue-400">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p className="text-sm font-medium">Os dados do cartão são criptografados e não são salvos nos nossos servidores.</p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">E-mail para Recibo</label>
                                            <input type="email" name="email" value={ccForm.email} onChange={handleInputChange} required className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition" placeholder="seu@email.com" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">CPF/CNPJ</label>
                                                <input type="text" name="cpfCnpj" value={ccForm.cpfCnpj} onChange={handleInputChange} required className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white" placeholder="000.000.000-00" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Telefone</label>
                                                <input type="text" name="phone" value={ccForm.phone} onChange={handleInputChange} required className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white" placeholder="(00) 00000-0000" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">CEP</label>
                                                <input type="text" name="postalCode" value={ccForm.postalCode} onChange={handleInputChange} required className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white" placeholder="00000-000" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Número (Residência)</label>
                                                <input type="text" name="addressNumber" value={ccForm.addressNumber} onChange={handleInputChange} required className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white" placeholder="Ex: 123" />
                                            </div>
                                        </div>
                                        <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-4"></div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome no Cartão</label>
                                            <input type="text" name="holderName" value={ccForm.holderName} onChange={handleInputChange} required className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white" placeholder="Como escrito no cartão" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Número do Cartão</label>
                                            <input type="text" name="number" value={ccForm.number} onChange={handleInputChange} required className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white" placeholder="0000 0000 0000 0000" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Mês (MM)</label>
                                                <input type="text" name="expiryMonth" value={ccForm.expiryMonth} onChange={handleInputChange} required maxLength="2" className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-center" placeholder="12" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Ano (AA)</label>
                                                <input type="text" name="expiryYear" value={ccForm.expiryYear} onChange={handleInputChange} required maxLength="4" className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-center" placeholder="28" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">CVV</label>
                                                <input type="text" name="ccv" value={ccForm.ccv} onChange={handleInputChange} required maxLength="4" className="w-full bg-slate-50 dark:bg-slate-900/50 outline-none p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-center" placeholder="123" />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center space-y-2">
                                        <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
                                        <p className="font-bold text-slate-900 dark:text-white">Pagamento Instantâneo via PIX</p>
                                        <p className="text-sm text-slate-500">Ao prosseguir, geraremos um código QR e o Copia e Cola para você concluir a assinatura no seu banco.</p>
                                        <p className="text-sm font-bold text-emerald-500 pt-2">Acesso liberado na hora!</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Action */}
                {!pixData && (
                    <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800">
                        <button 
                            type={paymentMethod === 'CREDIT_CARD' ? 'submit' : 'button'}
                            form={paymentMethod === 'CREDIT_CARD' ? 'checkout-form' : undefined}
                            onClick={paymentMethod === 'PIX' ? handleCheckout : undefined}
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white py-4 rounded-xl font-black transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                        >
                            {loading ? <Loader className="animate-spin w-5 h-5" /> : (paymentMethod === 'PIX' ? <QrCode className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />)}
                            {loading ? 'Processando...' : (paymentMethod === 'PIX' ? 'Gerar PIX' : 'Assinar com Cartão')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
