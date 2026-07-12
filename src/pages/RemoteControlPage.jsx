import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Play, Pause, FastForward, Rewind, MonitorUp, ListMusic, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Clock, X, Settings2, BookOpen, Music, Megaphone, AlertTriangle, Search, Plus, FileText, Wifi, WifiOff } from 'lucide-react';

import bibleData from '../assets/bible-nvi.json';

const BOOK_NAME_MAP = {
    'gn': 'Gênesis', 'ex': 'Êxodo', 'lv': 'Levítico', 'nm': 'Números', 'dt': 'Deuteronômio',
    'js': 'Josué', 'jz': 'Juízes', 'rt': 'Rute', '1sm': '1 Samuel', '2sm': '2 Samuel',
    '1rs': '1 Reis', '2rs': '2 Reis', '1cr': '1 Crônicas', '2cr': '2 Crônicas', 'ed': 'Esdras',
    'ne': 'Neemias', 'et': 'Ester', 'jó': 'Jó', 'sl': 'Salmos', 'pv': 'Provérbios',
    'ec': 'Eclesiastes', 'ct': 'Cantares', 'is': 'Isaías', 'jr': 'Jeremias', 'lm': 'Lamentações',
    'ez': 'Ezequiel', 'dn': 'Daniel', 'os': 'Oséias', 'jl': 'Joel', 'am': 'Amós',
    'ob': 'Obadias', 'jn': 'Jonas', 'mq': 'Miquéias', 'na': 'Naum', 'hc': 'Habacuque',
    'zf': 'Sofonias', 'ag': 'Ageu', 'zc': 'Zacarias', 'ml': 'Malaquias',
    'mt': 'Mateus', 'mc': 'Marcos', 'lc': 'Lucas', 'jo': 'João', 'at': 'Atos',
    'rm': 'Romanos', '1co': '1 Coríntios', '2co': '2 Coríntios', 'gl': 'Gálatas', 'ef': 'Efésios',
    'fp': 'Filipenses', 'cl': 'Colossenses', '1ts': '1 Tessalonicenses', '2ts': '2 Tessalonicenses',
    '1tm': '1 Timóteo', '2tm': '2 Timóteo', 'tt': 'Tito', 'fl': 'Filemom', 'hb': 'Hebreus',
    'tg': 'Tiago', '1pe': '1 Pedro', '2pe': '2 Pedro', '1jo': '1 João', '2jo': '2 João',
    '3jo': '3 João', 'jd': 'Judas', 'ap': 'Apocalipse'
};

export default function RemoteControlPage() {
    const { sessionId } = useParams();
    const [status, setStatus] = useState('connecting');
    const [fullState, setFullState] = useState(null);
    const [viewMode, setViewMode] = useState('lyrics');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const channelRef = useRef(null);
    const activeSlideRef = useRef(null); // ref for auto-scroll to active slide
    const scrollContainerRef = useRef(null); // ref for the main scrollable area

    // Bible Search State
    const [bibleSearchQuery, setBibleSearchQuery] = useState('');
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [verses, setVerses] = useState([]);

    useEffect(() => {
        if (!sessionId) return;

        console.log('Connecting to Supabase channel:', `projector_remote_${sessionId}`);
        const channel = supabase.channel(`projector_remote_${sessionId}`, {
            config: {
                broadcast: { ack: true }
            }
        });

        channel.on('broadcast', { event: 'state_update' }, ({ payload }) => {
            console.log('RECEIVED STATE UPDATE:', payload);
            setFullState(payload);
        });

        channel.subscribe((status) => {
            console.log('Supabase Realtime Status:', status);
            setStatus(status === 'SUBSCRIBED' ? 'connected' : 'error');
            if (status === 'SUBSCRIBED') {
                // Request current state immediately on connection
                setTimeout(() => {
                    console.log('SENT: REQUEST_SYNC');
                    channel.send({
                        type: 'broadcast',
                        event: 'remote_command',
                        payload: { action: 'REQUEST_SYNC' }
                    });
                }, 1000);
            }
        });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    // Retry REQUEST_SYNC every 3s until state arrives (handles slow PC load)
    useEffect(() => {
        if (fullState !== null) return; // Already have state, stop retrying
        if (status !== 'connected') return;
        const retry = setInterval(() => {
            console.log('RETRY: REQUEST_SYNC (no state yet)');
            channelRef.current?.send({
                type: 'broadcast',
                event: 'remote_command',
                payload: { action: 'REQUEST_SYNC' }
            });
        }, 3000);
        return () => clearInterval(retry);
    }, [fullState, status]);

    const sendCommand = (action, data = {}) => {
        if (!channelRef.current || status !== 'connected') {
            console.warn('Cannot send command: disconnected');
            return;
        }
        console.log('SENT COMMAND:', action, data);
        channelRef.current.send({
            type: 'broadcast',
            event: 'remote_command',
            payload: { action, ...data }
        });
    };

    const { 
        songTitle = 'LouvorPlay', 
        slideText = '', 
        allSlides = [],
        bgType = 'color',
        bgUrl = '',
        bgColor = '#000000',
        textColor = '#ffffff',
        textShadow = 'none',
        isAlertActive = false,
        alertText = '',
        isTimerRunning = false,
        timerText = '',
        liveSongIndex = -1,
        activeSongIndex = -1,
        liveSlideIndex = -1,
        playlistItems = [],
        slide = null // Add current slide context
    } = fullState || {};

    const [copyToast, setCopyToast] = useState(false);
    const [projectedVerses, setProjectedVerses] = useState([]); // Track current chapter verses for navigation
    const [currentVerseIndex, setCurrentVerseIndex] = useState(-1);

    const currentDisplayIndex = activeSongIndex >= 0 ? activeSongIndex : liveSongIndex;
    const isShowingPreview = activeSongIndex >= 0 && activeSongIndex !== liveSongIndex;

    // Auto-scroll to the active slide when it changes
    useEffect(() => {
        if (activeSlideRef.current) {
            activeSlideRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [liveSlideIndex]);

    // When the song changes, scroll to top — or to the active slide if there is one
    useEffect(() => {
        if (!scrollContainerRef.current) return;
        if (liveSlideIndex >= 0 && activeSlideRef.current) {
            // There is an active slide — scroll to it
            activeSlideRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // No active slide — go to top
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [songTitle]);

    // Dynamic Manifest & Shortcut Customization
    useEffect(() => {
        const originalTitle = document.title;
        const originalManifest = document.querySelector('link[rel="manifest"]')?.href;
        const originalAppleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content;
        const originalAppleIcon = document.querySelector('link[rel="apple-touch-icon"]')?.href;

        // Set New Identity
        document.title = "Controle LouvorPlay";
        
        let manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) manifestLink.href = '/remote-manifest.json';

        let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (!appleTitle) {
            appleTitle = document.createElement('meta');
            appleTitle.name = 'apple-mobile-web-app-title';
            document.head.appendChild(appleTitle);
        }
        appleTitle.content = "Controle LouvorPlay";

        let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (!appleIcon) {
            appleIcon = document.createElement('link');
            appleIcon.rel = 'apple-touch-icon';
            document.head.appendChild(appleIcon);
        }
        appleIcon.href = '/remote-icon.png';

        return () => {
            // Restore original on unmount
            document.title = originalTitle;
            if (manifestLink && originalManifest) manifestLink.href = originalManifest;
            if (appleTitle) appleTitle.content = originalAppleTitle || "LouvorPlay";
            if (appleIcon && originalAppleIcon) appleIcon.href = originalAppleIcon;
        };
    }, []);

    if (status === 'connecting') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Conectando ao terminal de projeção...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
                <X size={48} className="text-red-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">Erro de Conexão</h1>
                <p className="text-slate-400 mb-6">Não foi possível conectar à sessão realtime.</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-purple-600 rounded-lg font-bold"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    const renderPreviewLines = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => (
            <div key={i} className="leading-tight drop-shadow-lg">{line}</div>
        ));
    };

    // Bible Helpers
    const booksList = bibleData.map(book => ({
        abbrev: book.abbrev,
        name: BOOK_NAME_MAP[book.abbrev] || book.abbrev.toUpperCase(),
        chapterCount: book.chapters.length,
        data: book.chapters
    }));

    const filteredBooks = booksList.filter(book => 
        book.name.toLowerCase().includes(bibleSearchQuery.toLowerCase())
    );

    const handleSelectBook = (book) => {
        setSelectedBook(book);
        setSelectedChapter(null);
        setVerses([]);
    };

    const handleSelectChapter = (chapter) => {
        setSelectedChapter(chapter);
        const chapterData = selectedBook.data[chapter - 1];
        if (chapterData) {
            setVerses(chapterData.map((text, index) => ({ number: index + 1, text })));
        }
    };

    const handleProjectVerse = (verse, allVersesInChapter = []) => {
        sendCommand('PROJECT_VERSE', {
            verse: {
                type: 'verse',
                reference: `${selectedBook.name} ${selectedChapter}:${verse.number}`,
                text: verse.text,
                lines: [verse.text]
            }
        });
        
        if (allVersesInChapter.length > 0) {
            setProjectedVerses(allVersesInChapter);
            const idx = allVersesInChapter.findIndex(v => v.number === verse.number);
            setCurrentVerseIndex(idx);
        }
        
        setIsMenuOpen(false);
    };

    const handleNextVerse = () => {
        if (currentVerseIndex >= 0 && currentVerseIndex + 1 < projectedVerses.length) {
            const nextVerse = projectedVerses[currentVerseIndex + 1];
            handleProjectVerse(nextVerse, projectedVerses);
        } else {
            sendCommand('NEXT_SLIDE');
        }
    };

    const handlePrevVerse = () => {
        if (currentVerseIndex > 0) {
            const prevVerse = projectedVerses[currentVerseIndex - 1];
            handleProjectVerse(prevVerse, projectedVerses);
        } else {
            sendCommand('PREV_SLIDE');
        }
    };

    return (
        <div className="h-[100dvh] bg-white text-slate-900 flex flex-col overflow-hidden select-none font-sans relative">
            {/* Navigation Menu / Repertoire Sidebar Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-left duration-300">
                    <div className="px-4 py-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold tracking-tight">Setlist Atual</h2>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
                        {playlistItems.map((item, idx) => (
                            <button 
                                key={item.id}
                                onClick={() => { 
                                    sendCommand('SELECT_PLAYLIST_ITEM', { index: idx }); 
                                    setIsMenuOpen(false); 
                                    setViewMode('lyrics'); 
                                }}
                                className={`w-full group relative flex items-center gap-4 p-3 rounded-xl transition-all ${currentDisplayIndex === idx ? 'bg-purple-50 ring-1 ring-purple-100' : (item.song?.isMediaBlock ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-slate-50 border-b border-slate-50')}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentDisplayIndex === idx ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {idx + 1}
                                </div>
                                <div className={`w-10 h-8 rounded-lg flex items-center justify-center ${currentDisplayIndex === idx ? 'bg-slate-900 text-white' : 'bg-slate-900/10 text-slate-600'}`}>
                                    {item.song?.isMediaBlock ? <ImageIcon size={16} /> : <Video size={16} />}
                                </div>
                                <div className="flex-1 text-left truncate">
                                    <div className="flex items-center gap-2">
                                        <p className={`font-bold text-sm ${currentDisplayIndex === idx ? 'text-purple-900' : 'text-slate-800'}`}>
                                            {item.song?.title}
                                        </p>
                                        {liveSongIndex === idx && (
                                            <span className="px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase tracking-tighter">Live</span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium truncate">
                                        {item.song?.artist || (item.song?.isMediaBlock ? 'Mídia / Avisos' : 'Arranjo')}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 space-y-3 bg-slate-50/50 border-t border-slate-100 pb-10">
                        <button onClick={() => { setViewMode('media'); setIsMenuOpen(false); }} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-500 font-bold text-sm hover:border-purple-300">
                            <Plus size={18} /> Adicionar Mídia / Aviso
                        </button>
                        <button onClick={() => { setViewMode('bible'); setIsMenuOpen(false); }} className="w-full p-4 bg-purple-50 rounded-2xl flex items-center justify-center gap-3 text-purple-600 font-bold text-sm border border-purple-100 shadow-sm">
                            <BookOpen size={18} /> Pesquisar Bíblia / Versículo
                        </button>
                    </div>
                </div>
            )}

            {/* FIXED HEADER AND PREVIEW */}
            <header className="fixed top-0 left-0 right-0 bg-white z-[60] border-b border-slate-100">
                <div className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMenuOpen(true)} className="p-2.5 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-100">
                            <Settings2 size={18} />
                        </button>
                        <div>
                            <h1 className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                {viewMode === 'lyrics' ? 'Slides' : viewMode === 'bible' ? 'Bíblia' : 'Opções'}
                            </h1>
                            <p className="text-xs text-slate-900 font-black truncate max-w-[150px]">{songTitle}</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 ${status === 'connected' ? 'bg-green-50 px-2' : 'bg-red-50 px-2'} py-1 rounded-full border ${status === 'connected' ? 'border-green-100' : 'border-red-100'}`}>
                        {status === 'connected' ? <Wifi size={10} className="text-green-500" /> : <WifiOff size={10} className="text-red-500" />}
                        <span className={`text-[8px] ${status === 'connected' ? 'text-green-700' : 'text-red-700'} font-black uppercase tracking-widest`}>
                            {status === 'connected' ? 'Live' : 'Off'}
                        </span>
                    </div>
                </div>

                <div className="px-5 pb-5 pt-1 bg-slate-50/20">
                    <div 
                        className="aspect-video w-full rounded-2xl shadow-xl overflow-hidden relative border border-white"
                        style={{ backgroundColor: bgType === 'color' ? bgColor : '#000' }}
                    >
                        {bgType === 'image' && bgUrl && (
                            <img src={bgUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
                        )}
                        {/* Play/Pause Overlay only on VIDEO slides */}
                        {(slide?.type === 'video' || slide?.url?.includes('mp4') || slide?.url?.includes('webm')) && (
                            <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center gap-3 z-20">
                                <div className="text-[10px] text-white/50 lowercase font-bold">mídia em exibição</div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); sendCommand('PLAY_MEDIA'); }}
                                        className="w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all transform active:scale-95 shadow-lg border border-white/30"
                                        title="Play"
                                    >
                                        <Play size={24} fill="currentColor" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); sendCommand('PAUSE_MEDIA'); }}
                                        className="w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all transform active:scale-95 shadow-lg border border-white/30"
                                        title="Pause"
                                    >
                                        <Pause size={24} fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div 
                            className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 pointer-events-none"
                            style={{ 
                                color: textColor,
                                textShadow: textShadow !== 'none' ? '0.5px 0.5px 1.5px rgba(0,0,0,0.8)' : 'none',
                                filter: isAlertActive ? 'blur(1.5px) grayscale(0.5)' : 'none'
                            }}
                        >
                            <div className="w-full text-[13px] font-bold leading-tight drop-shadow-md">
                                {renderPreviewLines(slideText) || (
                                    <div className="text-slate-500/20 italic text-[10px]">TELA LIMPA</div>
                                )}
                            </div>
                        </div>

                        {isAlertActive && (
                            <div className="absolute top-0 left-0 right-0 bg-red-600/90 text-white py-1.5 flex items-center justify-center gap-1.5 backdrop-blur-sm z-30">
                                <AlertTriangle size={8} />
                                <span className="text-[8px] font-black uppercase tracking-tight truncate max-w-[80%]">{alertText}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* SCROLLABLE CONTENT AREA */}
            <main ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-white px-5 pt-[300px] pb-32">
                {viewMode === 'lyrics' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Slides</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                {liveSlideIndex + 1} / {allSlides.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {allSlides.length > 0 ? allSlides.map((slide, idx) => {
                                const isTargetLive = !isShowingPreview && liveSlideIndex === idx;
                                return (
                                <button 
                                    key={idx}
                                    ref={isTargetLive ? activeSlideRef : null}
                                    onClick={() => sendCommand('SELECT_SLIDE', { index: idx, songIndex: currentDisplayIndex })}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] flex flex-col gap-2 ${isTargetLive ? 'bg-purple-600 border-purple-300 shadow-lg shadow-purple-100' : 'bg-slate-50/50 border-slate-100'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${isTargetLive ? 'bg-purple-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                            {slide.type}
                                        </span>
                                        {isTargetLive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                    </div>
                                    <p className={`text-sm font-bold leading-relaxed ${isTargetLive ? 'text-white' : 'text-slate-700'}`}>
                                        {slide.text}
                                    </p>
                                </button>
                            )}) : (
                                <button 
                                    onClick={() => sendCommand('REQUEST_SYNC')}
                                    className="w-full py-12 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl"
                                >
                                    <FileText size={40} className="mb-3 opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clique para carregar conteúdo</p>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {viewMode === 'bible' && (
                    <div className="space-y-4">
                        {!selectedBook ? (
                            <>
                                <div className="sticky top-0 bg-white pb-4 pt-1 z-10">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Gênesis, Mateus..."
                                            value={bibleSearchQuery}
                                            onChange={(e) => setBibleSearchQuery(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredBooks.map(book => (
                                        <button key={book.abbrev} onClick={() => handleSelectBook(book)} className="p-4 bg-white border border-slate-100 rounded-xl text-left shadow-sm">
                                            <span className="font-bold text-sm block truncate text-slate-800">{book.name}</span>
                                            <span className="text-[9px] text-slate-400 uppercase font-black">{book.chapterCount} Cap</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : !selectedChapter ? (
                            <div className="space-y-4">
                                <button onClick={() => setSelectedBook(null)} className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase py-2">
                                    <ChevronLeft size={14} /> Voltar
                                </button>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{selectedBook.name}</h3>
                                <div className="grid grid-cols-5 gap-2 pb-10">
                                    {Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1).map(chap => (
                                        <button key={chap} onClick={() => handleSelectChapter(chap)} className="aspect-square bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center font-black text-slate-800 active:bg-purple-600 active:text-white transition">
                                            {chap}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between sticky top-0 bg-white pb-3 pt-1 z-10">
                                    <button onClick={() => setSelectedChapter(null)} className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
                                        <ChevronLeft size={14} /> Cap {selectedChapter}
                                    </button>
                                    <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xs">{selectedBook.name}</h3>
                                </div>
                                <div className="space-y-2 pb-10">
                                    {verses.map(verse => (
                                        <button 
                                            key={verse.number} 
                                            onClick={() => handleProjectVerse(verse, verses)} 
                                            className={`w-full text-left p-4 rounded-2xl transition flex gap-3 shadow-sm border ${currentVerseIndex === (verse.number - 1) ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-50/50 border-slate-100 text-slate-600'}`}
                                        >
                                            <span className={`font-black text-[10px] mt-0.5 ${currentVerseIndex === (verse.number - 1) ? 'text-purple-200' : 'text-purple-600'}`}>{verse.number}</span>
                                            <span className="text-xs leading-normal font-medium">{verse.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'media' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => sendCommand('PLAY_MEDIA')} className="h-28 bg-green-500 text-white rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-green-100">
                                <Play size={28} fill="currentColor" />
                                <span className="text-[10px] font-black uppercase">Play</span>
                            </button>
                            <button onClick={() => sendCommand('PAUSE_MEDIA')} className="h-28 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-slate-100">
                                <Pause size={28} fill="currentColor" />
                                <span className="text-[10px] font-black uppercase">Pause</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => sendCommand('SHOW_LOGO')} className="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                                <ImageIcon size={20} className="text-blue-500" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Logo Igreja</span>
                            </button>
                            <button onClick={() => sendCommand('CLEAR_SLIDE')} className="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                                <X size={20} className="text-red-500" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Limpar Tela</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* FIXED FOOTER */}
            <footer className="fixed bottom-0 left-0 right-0 h-24 px-6 bg-white/95 backdrop-blur-lg border-t border-slate-100 flex items-center justify-between z-[60] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={() => viewMode === 'bible' ? handlePrevVerse() : sendCommand('PREV_SLIDE')} 
                    className="w-16 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 active:bg-purple-100 active:text-purple-600 transition-all"
                >
                    <Rewind size={24} />
                </button>
                <div className="flex-1 flex justify-center gap-8">
                     <button onClick={() => setViewMode('lyrics')} className={`p-2 transition-all ${viewMode === 'lyrics' ? 'text-purple-600 scale-110' : 'text-slate-200'}`}>
                        <Music size={26} />
                    </button>
                    <button onClick={() => setViewMode('media')} className={`p-2 transition-all ${viewMode === 'media' ? 'text-purple-600 scale-110' : 'text-slate-200'}`}>
                        <Settings2 size={26} />
                    </button>
                </div>
                <button 
                    onClick={() => viewMode === 'bible' ? handleNextVerse() : sendCommand('NEXT_SLIDE')} 
                    className="w-16 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white active:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-200"
                >
                    <FastForward size={24} />
                </button>
            </footer>
        </div>
    );
}
