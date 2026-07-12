import React, { useEffect, useState } from 'react';
import { Music, Calendar, Clock, Play, ArrowRight, Search, PlusCircle, Layout, TrendingUp, Filter, Heart, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchSongs, getSongsByStyle, getSongsByFunction } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { ApplicationCarousel } from '../components/ApplicationCarousel';

export function HomePage() {
    const { user, userProfile, isEditor, activeChurch, isChurchAdmin, isSuperAdmin, subscriptionStatus } = useAuth();
    const navigate = useNavigate();

    // Global Data from Context
    const { topSongs, recentHistory, likedSongIds, toggleLike, isLoading } = useData();

    // Search State
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchSongs(query);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleApplicationSelect = async (funcName) => {
        setIsSearching(true);
        setQuery(`Aplicação: ${funcName}`); // Visual feedback in search bar
        try {
            const results = await getSongsByFunction(funcName);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    }

    const handleToggleLike = (e, songId) => {
        e.stopPropagation();
        toggleLike(songId);
    };

    const handleSongClick = (id) => {
        navigate(`/player/${id}`);
    };

    const EmptyState = ({ message, icon: Icon }) => (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Icon size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">{message}</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20 relative min-h-screen">
            {/* Background Image - Full Screen */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                {/* Subtle gradient overlay - stronger in dark mode */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 dark:from-slate-900/85 dark:via-slate-900/80 to-white/50 dark:to-slate-900/85" style={{ zIndex: 2 }}></div>
                {/* Mobile/Tablet - Vertical Image */}
                <img
                    src="/worship-mobile.png"
                    alt="Worship"
                    className="md:hidden w-full h-full object-cover object-center"
                    style={{ zIndex: 1 }}
                />
                {/* Desktop - Horizontal Image */}
                <img
                    src="/worship-desktop.png"
                    alt="Worship"
                    className="hidden md:block w-full h-full object-cover object-center"
                    style={{ zIndex: 1 }}
                />
            </div>

            {/* Content - relative positioning to appear above background */}
            <div className="relative" style={{ zIndex: 10 }}>
                {/* HERO BANNER */}
                <div className="relative py-12 flex flex-col items-center justify-center text-center space-y-4">
                    {/* Official Logo */}
                    <div className="mb-2 transform hover:scale-105 transition duration-500">
                        <img 
                            src="/icon.png" 
                            alt="LouvorPlay Icon" 
                            className="w-16 h-16 object-contain drop-shadow-2xl" 
                        />
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{userProfile?.full_name || userProfile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]}</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">O que vamos tocar hoje?</p>
                    </div>

                    {/* Search Bar - Floating */}
                    <div className="w-full max-w-lg relative group z-10">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition pointer-events-none z-30" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar música, artista ou trecho..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full relative z-20 bg-white dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-full py-4 pl-12 pr-14 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xl shadow-slate-200/50 dark:shadow-black/50 transition"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition shadow-lg flex items-center justify-center group-focus-within:scale-100 scale-90"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    {/* Usage Filters (Carousel) */}
                    <div className="w-full pt-2 animate-fade-in-up px-4">
                        <ApplicationCarousel onSelect={handleApplicationSelect} />
                    </div>
                </div>

                {/* SEARCH RESULTS SECTION */}
                {(searchResults.length > 0 || isSearching || (query && !isSearching && searchResults.length === 0)) && (
                    <section className="animate-in fade-in slide-in-from-bottom-5 duration-500 mb-8 bg-white/5 dark:bg-slate-800/10 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
                        <div className="flex items-center justify-between px-1 mb-4">
                            <div className="flex items-center gap-2">
                                <Search size={20} className="text-blue-500" />
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {isSearching ? 'Buscando...' : `Resultados para "${query}"`}
                                </h2>
                            </div>
                            {(searchResults.length > 0 || !isSearching) && (
                                <button onClick={() => { setQuery(''); setSearchResults([]); }} className="text-xs text-slate-500 hover:text-red-500 font-medium">
                                    Limpar Busca
                                </button>
                            )}
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {searchResults.map((song) => (
                                    <div key={song.id}
                                        className="flex items-center gap-4 p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-100/50 dark:border-slate-700/50 rounded-xl hover:shadow-md cursor-pointer transition group"
                                        onClick={() => handleSongClick(song.id)}
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-slate-100/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition">
                                            {song.title.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{song.title}</h3>
                                                {song.isOfficial && (
                                                    <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10 flex-shrink-0" aria-label="Música Oficial" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{song.artist}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !isSearching && (
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                                <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-full">
                                    <Search size={32} className="text-slate-400 opacity-50" />
                                </div>
                                <div>
                                    <p className="text-slate-900 dark:text-slate-100 font-bold italic">"Não encontramos músicas para sua busca..."</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Tente usar palavras-chave diferentes ou verifique a ortografia.</p>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* SECTION: VISTO POR ÚLTIMO (RECENT HISTORY) */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Clock size={20} className="text-blue-500" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Visto por Último</h2>
                    </div>

                    {recentHistory.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                            {recentHistory.map((song) => (
                                <div
                                    key={song.id}
                                    onClick={() => handleSongClick(song.id)}
                                    className="flex-shrink-0 w-40 snap-start cursor-pointer group relative"
                                >
                                    <div className="aspect-square bg-white dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700 hover:ring-blue-500 transition shadow-sm hover:shadow-md p-4">
                                        <span className="text-4xl mb-3 transition duration-300 transform group-hover:scale-110">🎵</span>
                                        <div className="text-center w-full">
                                            <div className="flex items-center justify-center gap-1">
                                                <p className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-500 transition text-sm">{song.title}</p>
                                                {song.isOfficial && (
                                                    <BadgeCheck size={12} className="text-blue-500 fill-blue-500/10 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{song.artist}</p>
                                        </div>
                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-[2px]">
                                            <Play className="fill-white text-white w-12 h-12" />
                                        </div>
                                        {/* Like Button (Always Visible) */}
                                        <button
                                            onClick={(e) => handleToggleLike(e, song.id)}
                                            className="absolute top-2 right-2 p-2 rounded-full bg-slate-100/50 hover:bg-white text-slate-500 hover:text-red-500 transition shadow-sm backdrop-blur-sm z-10"
                                        >
                                            <Heart size={16} className={likedSongIds.has(song.id) ? "fill-red-500 text-red-500" : ""} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="Você ainda não visualizou nenhuma música." icon={Clock} />
                    )}
                </section>

                {/* SECTION: MAIS ACESSADAS (MOST VIEWED) */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <TrendingUp size={20} className="text-purple-500" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mais Acessadas</h2>
                    </div>

                    {topSongs.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {topSongs.map((song, index) => (
                                <div
                                    key={song.id}
                                    onClick={() => handleSongClick(song.id)}
                                    className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition cursor-pointer group shadow-sm hover:shadow-lg flex items-center gap-3 relative pr-8"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
                                        #{index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">{song.title}</h3>
                                            {song.isOfficial && (
                                                <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{song.artist}</p>
                                    </div>
                                    {/* Like Button */}
                                    <button
                                        onClick={(e) => handleToggleLike(e, song.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition"
                                    >
                                        <Heart size={18} className={likedSongIds.has(song.id) ? "fill-red-500 text-red-500" : ""} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="Nenhuma música acessada recentemente." icon={TrendingUp} />
                    )}
                </section>

                {/* SECTION: GESTÃO FINANCEIRA */}
                {(!activeChurch || isChurchAdmin || isSuperAdmin) && (
                    <section className="mt-8">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-black rounded-[2.5rem] p-8 shadow-2xl border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg> 
                                        {activeChurch ? 'Financeiro da Igreja' : 'Sua Assinatura'}
                                    </h3>
                                    <p className="text-slate-400">
                                        {activeChurch ? 'Gerencie a assinatura e os pagamentos da sua igreja.' : 'Status de sua assinatura musical individual do LouvorPlay.'}
                                    </p>
                                    
                                    <div className="flex items-center gap-3 mt-4">
                                        {(() => {
                                            // Provide active auth context from scope via `AuthContext`
                                            return (
                                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                  subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                                                  subscriptionStatus === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400' :
                                                  'bg-amber-500/20 text-amber-400'
                                              }`}>
                                                  Status: {subscriptionStatus === 'ACTIVE' ? 'Ativo' : subscriptionStatus === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                                              </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                                
                                {activeChurch && (
                                    <button 
                                        onClick={() => window.open('https://sandbox.asaas.com', '_blank')}
                                        className="w-full md:w-auto bg-white text-slate-900 px-8 py-4 rounded-2xl font-black transition hover:bg-purple-100 flex items-center justify-center gap-2 shadow-xl shadow-black/20"
                                    >
                                        Acessar Portal Asaas <ArrowRight size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* ACTIONS GRID (Quick Access) */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    {isEditor && (
                        <button
                            onClick={() => navigate('/editor')}
                            className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 transition text-left group border border-blue-100 dark:border-slate-700"
                        >
                            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition">
                                <span className="text-2xl">+</span>
                            </div>
                            <span className="block font-bold text-lg text-slate-900 dark:text-white mb-1">Nova Música</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Adicionar cifra ao repertório</span>
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/playlists')}
                        className="p-6 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl hover:shadow-lg hover:shadow-purple-500/10 transition text-left group border border-purple-100 dark:border-slate-700"
                    >
                        <div className="bg-purple-600 w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-purple-600/30 group-hover:scale-110 transition">
                            <span className="text-2xl">📚</span>
                        </div>
                        <span className="block font-bold text-lg text-slate-900 dark:text-white mb-1">Criar Playlist</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Organize seu setlist</span>
                    </button>
                </div>
            </div> {/* Close content wrapper */}
        </div>
    );
}
