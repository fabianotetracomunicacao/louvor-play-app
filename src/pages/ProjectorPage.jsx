import React, { useEffect, useState, useRef } from 'react';
import { Maximize, Minimize, Megaphone, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

function ProjectorPage() {
    const { user } = useAuth();
    const [currentSlide, setCurrentSlide] = useState(null);
    const [bgStack, setBgStack] = useState([{ id: 'init', type: 'color', url: '', color: '#000000' }]);
    const [projFontSize, setProjFontSize] = useState(100);
    const [textColor, setTextColor] = useState('#ffffff');
    const [textShadow, setTextShadow] = useState(true);
    const [timerState, setTimerState] = useState({ 
        running: false, 
        endDate: null, 
        text: '',
        bgType: 'color',
        bgUrl: '',
        bgColor: '#000000'
    });
    const timerStateRef = useRef(timerState);
    const [churchLogoUrl, setChurchLogoUrl] = useState('');
    const [timeLeft, setTimeLeft] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef(null);
    const videoRef = useRef(null);
    const [alertText, setAlertText] = useState('');
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [displayedAlertText, setDisplayedAlertText] = useState('');
    const [alertBgColor, setAlertBgColor] = useState('#000000');
    const [alertTextColor, setAlertTextColor] = useState('#FFFFFF');
    const [alertFontSize, setAlertFontSize] = useState(100);
    const [isTextTransitioning, setIsTextTransitioning] = useState(false);

    // Fade Transition States
    const [currentSongId, setCurrentSongId] = useState('none');
    const currentSongIdRef = useRef('none');
    const [isFadingOut, setIsFadingOut] = useState(false);
    const broadcastChannelRef = useRef(null);

    useEffect(() => {
        currentSongIdRef.current = currentSongId;
    }, [currentSongId]);

    useEffect(() => {
        timerStateRef.current = timerState;
    }, [timerState]);

    // Alert Text Transition Effect (Cross-fade)
    useEffect(() => {
        if (alertText !== displayedAlertText) {
            setIsTextTransitioning(true);
            const timer = setTimeout(() => {
                setDisplayedAlertText(alertText);
                setIsTextTransitioning(false);
            }, 400); // 400ms to fade out
            return () => clearTimeout(timer);
        }
    }, [alertText, displayedAlertText]);

    function handleStateUpdate(data) {
        if (!data || data.isPreview) return;

        const applyState = () => {
            if (data.type === 'SHOW_SLIDE' || data.type === 'SYNC_STATE') {
                setCurrentSlide(data.slide);
            } else if (data.type === 'CLEAR_SLIDE') {
                setCurrentSlide(null);
            }

            if (data.type === 'SYNC_STATE') {
                if (data.songId !== undefined) setCurrentSongId(data.songId);

                // Track background changes using Stack to allow crossfading
                setBgStack(prev => {
                    const currentBg = prev[prev.length - 1];
                    let newType = currentBg.type;
                    let newUrl = currentBg.url;
                    let newColor = currentBg.color;

                    if (data.bgType !== undefined) newType = data.bgType;
                    if (data.bgUrl !== undefined) newUrl = data.bgUrl;
                    if (data.bgColor !== undefined) newColor = data.bgColor;

                    if (newType !== currentBg.type || newUrl !== currentBg.url || newColor !== currentBg.color) {
                        return [...prev.slice(-1), { id: Date.now().toString(), type: newType, url: newUrl, color: newColor }];
                    }
                    return prev;
                });

                if (data.projFontSize !== undefined) setProjFontSize(data.projFontSize);
                if (data.textColor !== undefined) setTextColor(data.textColor);
                if (data.textShadow !== undefined) setTextShadow(data.textShadow);

                // Timer logic
                if (data.isTimerRunning) {
                    const endDate = data.timerEndDate || (data.action === 'START_TIMER' ? (Date.now() + (data.timerMinutes || 5) * 60 * 1000) : null);
                    
                    if (endDate) {
                        // Set initial time left immediately to avoid blank screen
                        const now = Date.now();
                        const diff = endDate - now;
                        if (diff > 0) {
                            const initialMinutes = Math.floor(diff / 60000);
                            const initialSeconds = Math.floor((diff % 60000) / 1000);
                            setTimeLeft(`${initialMinutes.toString().padStart(2, '0')}:${initialSeconds.toString().padStart(2, '0')}`);
                        } else {
                            setTimeLeft('00:00');
                        }

                        setTimerState({ 
                            running: true, 
                            endDate: endDate,
                            text: data.timerText || 'O Culto Vai Começar em:',
                            bgType: data.timerBgType || 'color',
                            bgUrl: data.timerBgUrl || '',
                            bgColor: data.timerBgColor || '#000000'
                        });
                    }
                } else if (data.action === 'STOP_TIMER' || data.isTimerRunning === false) {
                    setTimerState(prev => ({ ...prev, running: false }));
                    setTimeLeft('');
                }

            }

            // Video Actions (OUTSIDE SYNC_STATE)
            if (data.type === 'VIDEO_ACTION' && videoRef.current) {
                console.log('Video action received:', data.action, data.time);
                const video = videoRef.current;
                switch (data.action) {
                    case 'PLAY':
                        video.play().catch(() => {});
                        break;
                    case 'PAUSE':
                        video.pause();
                        break;
                    case 'SEEK':
                        if (typeof data.time === 'number') {
                            video.currentTime = data.time;
                        }
                        break;
                    case 'RESTART':
                        video.currentTime = 0;
                        video.play().catch(() => {});
                        break;
                    default:
                        break;
                }
            }

            if (data.churchLogoUrl !== undefined) {
                setChurchLogoUrl(data.churchLogoUrl);
            }

            if (data.alertText !== undefined) setAlertText(data.alertText);
            if (data.isAlertActive !== undefined) setIsAlertActive(data.isAlertActive);
            if (data.alertBgColor !== undefined) setAlertBgColor(data.alertBgColor);
            if (data.alertTextColor !== undefined) setAlertTextColor(data.alertTextColor);
            if (data.alertFontSize !== undefined) setAlertFontSize(data.alertFontSize);
        };

        // If it's a SYNC_STATE and the songId changed (and we already had a songId),
        // we trigger a fade out, wait, apply state, then fade in.
        const isSongChanging = data.type === 'SYNC_STATE' && data.songId && currentSongIdRef.current !== 'none' && data.songId !== currentSongIdRef.current;
        
        // Timer change detection
        const willBeRunning = data.isTimerRunning === true || data.action === 'START_TIMER';
        const isTimerChanging = (willBeRunning !== timerStateRef.current.running) && data.isTimerRunning !== undefined;

        if (isSongChanging || isTimerChanging) {
            setIsFadingOut(true);
            setTimeout(() => {
                applyState();
                setIsFadingOut(false);
            }, 500); // 500ms fade to black
        } else {
            applyState();
        }
    }

    const handleStateUpdateRef = useRef(handleStateUpdate);
    useEffect(() => {
        handleStateUpdateRef.current = handleStateUpdate;
    });

    useEffect(() => {
        // Load initial state from localStorage if opened after control panel
        try {
            const savedState = localStorage.getItem('projector_current_state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                handleStateUpdateRef.current(parsed);
            }
        } catch (e) {
            console.error("Error reading initial projector state", e);
        }

        // Listen for real-time updates from the control panel
        broadcastChannelRef.current = new BroadcastChannel('projector_sync');

        broadcastChannelRef.current.onmessage = (event) => {
            if (event.data.type === 'MEDIA_COMMAND') {
                const video = videoRef.current;
                if (video) {
                    if (event.data.action === 'play') video.play().catch(() => {});
                    else if (event.data.action === 'pause') video.pause();
                }
                return;
            }
            handleStateUpdateRef.current(event.data);
        };

        // Listen for real-time updates via Supabase (Multi-device)
        let realtimeChannel = null;
        if (user?.id) {
            realtimeChannel = supabase.channel(`projector_remote_${user.id}`);
            realtimeChannel.on('broadcast', { event: 'state_update' }, ({ payload }) => {
                handleStateUpdateRef.current(payload);
            });
            realtimeChannel.subscribe();
        }

        // Listen for storage events (alternate sync method)
        const handleStorageChange = (e) => {
            if (e.key === 'projector_current_state' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    handleStateUpdateRef.current(parsed);
                } catch (err) {
                    console.error("Error parsing storage update", err);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            if (broadcastChannelRef.current) broadcastChannelRef.current.close();
            window.removeEventListener('storage', handleStorageChange);
            if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        };
    }, [user?.id]);

    // Report Video Status back to control panel
    useEffect(() => {
        let interval;
        if (currentSlide?.type === 'video') {
            interval = setInterval(() => {
                const video = videoRef.current;
                if (video && broadcastChannelRef.current) {
                    broadcastChannelRef.current.postMessage({
                        type: 'VIDEO_STATUS',
                        currentTime: video.currentTime,
                        duration: video.duration || 0,
                        paused: video.paused,
                        url: currentSlide.url
                    });
                }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [currentSlide]);

    // Fullscreen and Controls Logic
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        const handleMouseMove = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        };
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('mousemove', handleMouseMove);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };


    // Timer Countdown Effect
    useEffect(() => {
        if (!timerState.running || !timerState.endDate) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = timerState.endDate - now;

            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft('00:00');
                setTimerState(prev => ({ ...prev, running: false }));
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timerState.running, timerState.endDate]);

    const renderBackground = () => {
        // If timer is running, we might have a specific timer background
        if (timerState.running || timeLeft === '00:00') {
            if (timerState.bgType === 'image' && timerState.bgUrl) {
                return <img 
                    src={timerState.bgUrl} 
                    className="absolute inset-0 w-full h-full object-cover z-0" 
                    alt="Timer BG" 
                    style={{ filter: 'brightness(0.6)' }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/1920x1080/000000/000000?text='; // Black fallback if image fails
                    }}
                />;
            }
            if (timerState.bgType === 'video' && timerState.bgUrl) {
                return (
                    <video
                        src={timerState.bgUrl}
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        muted loop autoPlay playsInline
                        style={{ filter: 'brightness(0.6)' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                );
            }
            return <div className="absolute inset-0 z-0" style={{ backgroundColor: timerState.bgColor || '#000000' }} />;
        }

        if (bgStack.length === 0) return <div className="absolute inset-0 bg-black z-0" />;
        return bgStack.map((bg, index) => {
            const isTop = index === bgStack.length - 1;
            // The new background fades in. The old ones stay visible behind until pushed out of the array
            const fadeClass = isTop && bgStack.length > 1 ? "animate-in fade-in duration-1000 fill-mode-forwards" : "";

            if (bg.type === 'image' && bg.url) {
                return (
                    <img
                        key={bg.id}
                        src={bg.url}
                        alt=""
                        className={`absolute inset-0 w-full h-full object-cover ${index === 0 ? 'z-0' : 'z-10'} ${fadeClass}`}
                        style={{ filter: 'brightness(0.6)' }}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/1920x1080/000000/000000?text='; // Black fallback
                        }}
                    />
                );
            } else if (bg.type === 'video' && bg.url) {
                return (
                    <video
                        key={bg.id}
                        src={bg.url}
                        ref={el => {
                            if (el) {
                                const p = el.play();
                                if (p !== undefined) p.catch(() => {});
                            }
                        }}
                        loop
                        muted
                        playsInline
                        className={`absolute inset-0 w-full h-full object-cover ${index === 0 ? 'z-0' : 'z-10'} ${fadeClass}`}
                        style={{ filter: 'brightness(0.6)' }}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none'; // Fallback to background color below
                        }}
                    />
                );
            }
            return <div key={bg.id} className={`absolute inset-0 ${index === 0 ? 'z-0' : 'z-10'} ${fadeClass}`} style={{ backgroundColor: bg.type === 'color' ? bg.color : '#000000' }} />;
        });
    };

    const renderContent = () => {
        // If timer is running, override normal display
        if (timerState.running || timeLeft === '00:00') {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden font-sans select-none relative">
                    {renderBackground()}

                    <div className="z-10 flex flex-col items-center">
                        {churchLogoUrl && (
                            <img
                                src={churchLogoUrl}
                                alt="Church Logo"
                                className="w-[15vw] h-auto object-contain mb-8 animate-in fade-in zoom-in duration-1000 drop-shadow-xl"
                            />
                        )}
                        <p className="text-white/80 text-[4vw] mb-4 font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-4 duration-1000 text-center px-10">
                            {timerState.text}
                        </p>
                        <p className="text-white font-black text-[18vw] leading-none drop-shadow-2xl tabular-nums animate-in fade-in zoom-in duration-1000">
                            {timeLeft}
                        </p>
                        {timeLeft === '00:00' && (
                            <p className="text-white/70 text-[3vw] mt-6 font-bold uppercase tracking-[0.5em] animate-pulse">
                                INICIANDO AGORA
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        // If no slide is active, show background + logo
        if (!currentSlide) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden font-sans select-none relative">
                    {renderBackground()}
                    <div className="z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 flex flex-col items-center">
                        {churchLogoUrl ? (
                            <img src={churchLogoUrl} className="w-[30vw] h-auto object-contain drop-shadow-2xl" alt="Church Logo" />
                        ) : (
                            <img src="/logo_official.png" className="w-1/3 opacity-30 invert brightness-0 grayscale" alt="LouvorPlay Logo" />
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden font-sans select-none relative transition-colors duration-700">
                {renderBackground()}

            {/* Transition Overlay */}
                <div
                    key={currentSlide.id || JSON.stringify(currentSlide.lines)}
                    className={`relative z-10 w-full mx-auto flex flex-col items-center justify-center animate-fade-in-fast ${(currentSlide.type === 'image' || currentSlide.type === 'video') && currentSlide.url ? 'h-screen max-w-full p-0 m-0' : 'max-w-[90vw] min-h-[80vh]'}`}
                >
                    {currentSlide.type === 'image' && currentSlide.url ? (
                        <img
                            src={currentSlide.url}
                            alt="Media"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/1920x1080/1e293b/ffffff?text=Falha+ao+carregar+imagem';
                            }}
                        />
                    ) : currentSlide.type === 'video' && currentSlide.url ? (
                        <video
                            src={currentSlide.url}
                            ref={videoRef}
                            onLoadedMetadata={(e) => {
                                e.target.play().catch(() => {});
                            }}
                            loop
                            className="w-full h-full object-contain"
                        />
                    ) : currentSlide.type === 'verse' ? (
                        <div className="flex flex-col items-center max-w-[85vw]">
                            {currentSlide.lines?.map((line, idx) => (
                                <div
                                    key={idx}
                                    className="w-full text-center font-bold"
                                    style={{
                                        fontSize: `${7 * (projFontSize / 100)}vh`,
                                        lineHeight: '1.4',
                                        letterSpacing: '0.02em',
                                        color: textColor,
                                        textShadow: textShadow ? '0 4px 16px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)' : 'none'
                                    }}
                                >
                                    {line}
                                </div>
                            ))}
                            {currentSlide.reference && (
                                <div 
                                    className="mt-[5vh] px-6 py-2 bg-black/30 backdrop-blur-md rounded-full border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-1000"
                                    style={{
                                        fontSize: `${3 * (projFontSize / 100)}vh`,
                                        color: textColor,
                                        opacity: 0.8,
                                        fontWeight: '800',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {currentSlide.reference}
                                </div>
                            )}
                        </div>
                    ) : (
                        currentSlide.lines?.map((line, idx) => (
                            <div
                                key={idx}
                                className="w-full text-center font-bold"
                                style={{
                                    fontSize: `${7 * (projFontSize / 100)}vh`,
                                    lineHeight: '1.4',
                                    letterSpacing: '0.02em',
                                    color: textColor,
                                    textShadow: textShadow ? '0 4px 16px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)' : 'none'
                                }}
                            >
                                {line}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Persistent Alert Message Banner - TICKER STYLE WITH FADE IN/OUT */}
            <div 
                className={`fixed top-0 left-0 right-0 z-[100] border-b border-white/20 shadow-2xl flex items-center overflow-hidden transition-all duration-700 ease-in-out ${isAlertActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}
                style={{ 
                    backgroundColor: alertBgColor,
                    height: `${4 * (alertFontSize / 100)}vh`
                }}
            >
                <div 
                    key={`${alertFontSize}-${alertText}`}
                    className={`animate-marquee-slower h-full flex flex-row items-center whitespace-nowrap transition-opacity duration-300 ease-in-out ${isTextTransitioning ? 'opacity-0' : 'opacity-100'}`}
                >
                    {[...Array(4)].map((_, i) => (
                        <div 
                            key={i} 
                            className="flex flex-row items-center gap-[1.5vw] px-[3vw] font-bold uppercase tracking-widest shrink-0"
                            style={{ 
                                color: alertTextColor,
                                fontSize: `${1.8 * (alertFontSize / 100)}vh`
                            }}
                        >
                            <AlertTriangle size={`${2.2 * (alertFontSize / 100)}vh`} className="shrink-0" style={{ color: 'inherit' }} />
                            <span>{displayedAlertText || ''}</span>
                            <AlertTriangle size={`${2.2 * (alertFontSize / 100)}vh`} className="shrink-0" style={{ color: 'inherit' }} />
                            <div className="w-[30vw] shrink-0"></div>
                        </div>
                    ))}
                </div>
            </div>

            {renderContent()}
            {/* Fade Out Black Screen Overlay */}
            <div
                className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Floating Fullscreen Controls */}
            <div className={`fixed top-4 right-4 z-[60] transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={toggleFullscreen}
                    className={`p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white shadow-lg transition transform hover:scale-105 ${isAlertActive ? 'mt-16' : ''}`}
                    title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                >
                    {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>
            </div>
        </>
    );
}

export default ProjectorPage;
