import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Trash2, CheckCircle, Search, Music, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../supabaseClient';
import { permanentlyDeleteSong } from '../utils/storage';

export function AdminContentReviewPage() {
    const navigate = useNavigate();
    const { showToast, confirmAction } = useNotification();
    const [reviewSongs, setReviewSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        fetchReviewSongs();
    }, []);

    const fetchReviewSongs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('songs')
                .select('*')
                .eq('pending_admin_review', true)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviewSongs(data || []);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar lista de revisão.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (song) => {
        const confirmed = await confirmAction({
            title: 'Aprovar Música',
            message: `Deseja integrar "${song.title}" definitivamente ao repertório oficial? Ela passará a fazer parte da plataforma livremente.`,
            confirmText: 'Aprovar',
            type: 'default'
        });

        if (confirmed) {
            try {
                const { error } = await supabase
                    .from('songs')
                    .update({ pending_admin_review: false })
                    .eq('id', song.id);

                if (error) throw error;
                showToast('Música aprovada com sucesso!', 'success');
                fetchReviewSongs();
            } catch (err) {
                console.error(err);
                showToast('Erro ao aprovar música.', 'error');
            }
        }
    };

    const handleReject = async (song) => {
        const confirmed = await confirmAction({
            title: 'Rejeitar Música',
            message: `ATENÇÃO: Deseja REJEITAR e excluir "${song.title}" DEFINITIVAMENTE? Esta ação é irreversível.`,
            confirmText: 'Rejeitar e Excluir',
            type: 'danger'
        });

        if (confirmed) {
            try {
                // Permanently delete directly to avoid polluting trash for rejected user content
                await permanentlyDeleteSong(song.id);
                showToast('Música rejeitada e excluída.', 'success');
                fetchReviewSongs();
            } catch (err) {
                console.error(err);
                showToast('Erro ao rejeitar música.', 'error');
            }
        }
    };

    const filteredSongs = reviewSongs.filter(song =>
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Eye className="text-blue-500" />
                        Painel de Revisão
                    </h1>
                    <p className="text-sm text-slate-500">Músicas transferidas de contas excluídas aguardando moderação.</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar cifras em revisão..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition font-bold"
                />
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Buscando itens...</div>
                ) : filteredSongs.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-slate-500">
                        <CheckCircle size={48} className="mb-4 opacity-20 text-emerald-500" />
                        <p className="font-bold">A fila de revisão está vazia.</p>
                        <p className="text-sm mt-1">Tudo em dia!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSongs.map(song => (
                            <div key={song.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-500">
                                        <Music size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{song.title}</h3>
                                        <p className="text-sm text-slate-500">{song.artist}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => handleApprove(song)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Aprovar
                                    </button>
                                    <button
                                        onClick={() => handleReject(song)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Rejeitar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
