import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Trash2, AlertTriangle, Search, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { getDeletedSongs, restoreSong, permanentlyDeleteSong } from '../utils/storage';

export function AdminTrashPage() {
    const navigate = useNavigate();
    const { showToast, confirmAction } = useNotification();
    const [deletedSongs, setDeletedSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        fetchDeletedSongs();
    }, []);

    const fetchDeletedSongs = async () => {
        setLoading(true);
        try {
            const songs = await getDeletedSongs();
            setDeletedSongs(songs);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar lixeira.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (song) => {
        const confirmed = await confirmAction({
            title: 'Restaurar Música',
            message: `Deseja restaurar "${song.title}"? Ela voltará para o repertório visível.`,
            confirmText: 'Restaurar',
            type: 'default' // Blue/Neutral
        });

        if (confirmed) {
            await restoreSong(song.id);
            showToast('Música restaurada com sucesso!', 'success');
            fetchDeletedSongs();
        }
    };

    const handlePermanentDelete = async (song) => {
        const confirmed = await confirmAction({
            title: 'Excluir Permanentemente',
            message: `ATENÇÃO: Deseja excluir "${song.title}" DEFINITIVAMENTE? Esta ação é irreversível.`,
            confirmText: 'Excluir Para Sempre',
            type: 'danger'
        });

        if (confirmed) {
            await permanentlyDeleteSong(song.id);
            showToast('Música excluída permanentemente.', 'success');
            fetchDeletedSongs();
        }
    };

    const filteredSongs = deletedSongs.filter(song =>
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
                        <Trash2 className="text-red-600" />
                        Lixeira
                    </h1>
                    <p className="text-sm text-slate-500">Recupere ou exclua permanentemente itens removidos.</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar na lixeira..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Carregando itens excluídos...</div>
                ) : filteredSongs.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-slate-500">
                        <Trash2 size={48} className="mb-4 opacity-20" />
                        <p>A lixeira está vazia.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSongs.map(song => (
                            <div key={song.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                                        <Music size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{song.title}</h3>
                                        <p className="text-sm text-slate-500">{song.artist} • <span className="text-xs">Excluído em: {new Date(song.deleted_at).toLocaleDateString()}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => handleRestore(song)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={16} /> Restaurar
                                    </button>
                                    <button
                                        onClick={() => handlePermanentDelete(song)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Excluir
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
