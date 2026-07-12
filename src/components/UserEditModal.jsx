import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Lock, Trash2, Save, Music, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getInstruments } from '../utils/storage';

export function UserEditModal({ user, onClose, onUserUpdated }) {
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'musician',
        instrument: user.instrument || '',
        active_church_id: user.active_church_id || ''
    });
    const [selectedInstruments, setSelectedInstruments] = useState(user.available_instruments || []);
    const [instrumentsMetadata, setInstrumentsMetadata] = useState([]);
    const [churches, setChurches] = useState([]);
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadMetadata();
        loadChurches();
    }, []);

    const loadChurches = async () => {
        const { data } = await supabase.from('churches').select('id, name').eq('status', 'active');
        if (data) setChurches(data);
    };

    const loadMetadata = async () => {
        const metadata = await getInstruments();
        setInstrumentsMetadata(metadata);
    };

    const toggleInstrument = (name) => {
        if (selectedInstruments.includes(name)) {
            setSelectedInstruments(selectedInstruments.filter(i => i !== name));
        } else {
            setSelectedInstruments([...selectedInstruments, name]);
        }
    };

    const handleUpdateUser = async () => {
        setLoading(true);
        try {
            // 1. Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    role: formData.role,
                    instrument: formData.instrument,
                    available_instruments: selectedInstruments,
                    active_church_id: formData.active_church_id || null
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Update Church Membership (SaaS)
            if (formData.active_church_id && formData.role !== 'super_admin') {
                // Determine church role
                let churchRole = 'WORSHIPPER';
                if (formData.role === 'CHURCH_ADMIN') churchRole = 'CHURCH_ADMIN';
                if (formData.role === 'WORSHIP_LEADER') churchRole = 'WORSHIP_LEADER';

                // Upsert membership (using UNIQUE constraint on church_id, user_id is tricky if we want to CHANGE the church)
                // Better approach: If they already had a church, update it. If not, insert it.
                // But for simplicity, we'll try to find any membership and update it, or insert.
                
                const { data: existing } = await supabase
                    .from('church_user_memberships')
                    .select('id, church_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (existing) {
                    // Update existing membership
                    const { error: memError } = await supabase
                        .from('church_user_memberships')
                        .update({ 
                            church_id: formData.active_church_id, 
                            role: churchRole 
                        })
                        .eq('id', existing.id);
                    if (memError) console.error('Error updating membership:', memError);
                } else {
                    // Create new membership
                    const { error: memError } = await supabase
                        .from('church_user_memberships')
                        .insert({
                            user_id: user.id,
                            church_id: formData.active_church_id,
                            role: churchRole,
                            status: 'active'
                        });
                    if (memError) console.error('Error creating membership:', memError);
                }
            }

            // Update password if provided
            if (newPassword.trim()) {
                const { error: passwordError } = await supabase.rpc('update_user_password_by_admin', {
                    target_user_id: user.id,
                    new_password: newPassword
                });
                if (passwordError) throw passwordError;
            }

            alert('Usuário atualizado com sucesso!');
            onUserUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Erro ao atualizar usuário: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        setLoading(true);
        try {
            // Use the existing RPC function for deletion
            const { error } = await supabase.rpc('delete_user_with_transfer', {
                target_user_id: user.id,
                successor_id: null // null means no songs to transfer
            });

            if (error) throw error;

            alert('Usuário excluído com sucesso!');
            onUserUpdated();
            onClose();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erro ao excluir usuário: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User size={20} className="text-purple-400" />
                        Editar Usuário
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nome
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Nome do usuário"
                            />
                        </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email (somente leitura)
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Church Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Igreja Vinculada (Opcional)
                        </label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                disabled={formData.role === 'super_admin'}
                                value={formData.active_church_id}
                                onChange={(e) => setFormData({ ...formData, active_church_id: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            >
                                <option value="">Nenhuma / Usuário Individual</option>
                                {churches.map(church => (
                                    <option key={church.id} value={church.id}>{church.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tipo de Usuário (Cargo Global)
                        </label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={formData.role}
                                onChange={(e) => {
                                    const role = e.target.value;
                                    setFormData({ ...formData, role: role });
                                    if (role === 'super_admin') setFormData(prev => ({ ...prev, role: role, active_church_id: '' }));
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="super_admin">Super Admin (Plataforma)</option>
                                <option value="CHURCH_ADMIN">Responsável da Igreja</option>
                                <option value="WORSHIP_LEADER">Líder de Adoração</option>
                                <option value="WORSHIPPER">Adorador</option>
                            </select>
                        </div>
                    </div>

                    {/* Instrument */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Instrumento Principal
                        </label>
                        <div className="relative">
                            <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={formData.instrument}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, instrument: val });
                                    if (val && !selectedInstruments.includes(val)) {
                                        setSelectedInstruments([...selectedInstruments, val]);
                                    }
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                            >
                                <option value="">Selecione o instrumento principal...</option>
                                {instrumentsMetadata.map(inst => (
                                    <option key={inst.id} value={inst.name}>{inst.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Available Instruments (Multi-Select Tags) */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                            Habilidades / Instrumentos Disponíveis
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 border border-slate-700 rounded-lg min-h-[60px]">
                            {instrumentsMetadata.length === 0 && (
                                <span className="text-slate-500 text-xs italic">Nenhum instrumento cadastrado no sistema.</span>
                            )}
                            {instrumentsMetadata.map(inst => {
                                const isMain = inst.name === formData.instrument;
                                const isSelected = selectedInstruments.includes(inst.name) || isMain;
                                return (
                                    <button
                                        key={inst.id}
                                        onClick={() => !isMain && toggleInstrument(inst.name)}
                                        disabled={isMain}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                            isSelected
                                                ? 'bg-purple-600 text-white border-purple-500'
                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                        } border ${isMain ? 'ring-2 ring-purple-400/50 border-purple-400 cursor-default font-black' : ''}`}
                                    >
                                        {isSelected && <Check size={12} />}
                                        {inst.name}
                                        {isMain && <span className="ml-1 text-[8px] uppercase opacity-70">(Principal)</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                            Selecione todos os instrumentos que este usuário pode tocar ou funções que pode realizar.
                        </p>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nova Senha (deixe em branco para não alterar)
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-slate-700 bg-slate-800 sticky bottom-0 flex flex-col gap-3">
                    <button
                        onClick={handleUpdateUser}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                    >
                        <Save size={18} />
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>

                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full bg-transparent hover:bg-red-600/10 text-red-400 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 border border-red-600/20"
                        >
                            <Trash2 size={16} />
                            Excluir Usuário
                        </button>
                    ) : (
                        <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/20 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <p className="text-xs text-red-300 text-center font-bold uppercase tracking-tight">
                                Confirmar exclusão permanente?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold text-sm transition"
                                >
                                    Não
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={loading}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold text-sm transition shadow-lg shadow-red-600/20"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
