import React, { useState, useEffect } from 'react';
import { X, Music, Search, Loader2, Check } from 'lucide-react';
import { getMyPlaylists, addSongToPlaylist, getPlaylistWithItems } from '../utils/storage';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../supabaseClient';

export default function AddToPlaylistModal({ songId, onClose }) {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [search, setSearch] = useState('');
    const [addedPlaylistIds, setAddedPlaylistIds] = useState(new Set());
    const { showToast } = useNotification();

    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const data = await getMyPlaylists();
                // Filter only editable playlists
                const editable = data.filter(p => ['owner', 'admin', 'editor'].includes(p.role));
                setPlaylists(editable);

                if (editable.length > 0 && songId) {
                    const { data: items } = await supabase
                        .from('playlist_items')
                        .select('playlist_id')
                        .eq('song_id', songId)
                        .in('playlist_id', editable.map(p => p.id));
                    
                    if (items) {
                        setAddedPlaylistIds(new Set(items.map(i => i.playlist_id)));
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar repertórios:", err);
                showToast("Erro ao carregar repertórios", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchPlaylists();
    }, []);

    const handleAdd = async (playlist) => {
        setSavingId(playlist.id);
        try {
            // First get items to know the next position and avoid duplicates
            const plData = await getPlaylistWithItems(playlist.id);
            if (plData && plData.items) {
                const isAlreadyAdded = plData.items.some(item => item.song_id === songId);
                if (isAlreadyAdded) {
                    showToast("Música já está neste repertório!", "warning");
                    setSavingId(null);
                    return;
                }
                const nextPosition = plData.items.length;
                await addSongToPlaylist(playlist.id, songId, nextPosition);
                showToast("Música adicionada com sucesso!", "success");
                onClose();
            }
        } catch (error) {
            console.error("Erro ao adicionar música:", error);
            showToast("Erro ao adicionar música", "error");
            setSavingId(null);
        }
    };

    const filtered = playlists.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Music className="text-indigo-400" size={24} />
                            Adicionar a Repertório
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Escolha um repertório para adicionar esta música.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar repertório..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 text-white transition-colors"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="animate-spin mb-4 text-indigo-500" size={32} />
                            <p>Carregando repertórios...</p>
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Music size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium text-white mb-1">Nenhum repertório encontrado</p>
                            <p className="text-sm">Você precisa criar um repertório ou ser adicionado como editor em um.</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            Nenhum repertório corresponde à busca.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(playlist => {
                                const isAdded = addedPlaylistIds.has(playlist.id);
                                return (
                                    <button
                                        key={playlist.id}
                                        onClick={() => !isAdded && handleAdd(playlist)}
                                        disabled={savingId === playlist.id || isAdded}
                                        className={`w-full text-left border rounded-xl p-4 flex items-center justify-between transition-all group ${
                                            isAdded 
                                                ? 'bg-indigo-900/20 border-indigo-500/30 cursor-default' 
                                                : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-indigo-500/50'
                                        }`}
                                    >
                                        <div>
                                            <h3 className={`font-bold transition-colors ${isAdded ? 'text-indigo-300' : 'text-white group-hover:text-indigo-300'}`}>
                                                {playlist.name}
                                            </h3>
                                            {playlist.role !== 'owner' && (
                                                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded mt-1 inline-block mr-2">
                                                    Compartilhado (Editor)
                                                </span>
                                            )}
                                            {isAdded && (
                                                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                                                    Já adicionada
                                                </span>
                                            )}
                                        </div>
                                        {savingId === playlist.id ? (
                                            <Loader2 size={20} className="animate-spin text-indigo-400" />
                                        ) : isAdded ? (
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                                <Check size={16} />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <Music size={16} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
