import React, { useState, useEffect, useRef } from 'react';
import { useVideoPlayer } from '../contexts/VideoPlayerContext';
import { X, Minus, Maximize2, Move } from 'lucide-react';

export function FloatingVideoPlayer() {
    const { isOpen, currentVideoId, currentTitle, closePlayer, isMinimized, toggleMinimize } = useVideoPlayer();

    const isMobile = window.innerWidth < 768;
    const initialWidth = isMobile ? 320 : 480;

    const [position, setPosition] = useState({
        x: Math.max(20, window.innerWidth - initialWidth - 20),
        y: 100
    });
    const [minimizedPosition, setMinimizedPosition] = useState({
        x: isMobile ? window.innerWidth - 200 : 190,
        y: isMobile ? 60 : 16
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingMinimized, setIsDraggingMinimized] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (isMinimized) return;
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMinimizedMouseDown = (e) => {
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;

        setIsDraggingMinimized(true);
        dragOffset.current = {
            x: e.clientX - minimizedPosition.x,
            y: e.clientY - minimizedPosition.y,
            startX,
            startY
        };
    };

    const handleMinimizedClick = (e) => {
        // Only toggle if we didn't drag (mouse didn't move much)
        const dragDistance = Math.sqrt(
            Math.pow(e.clientX - dragOffset.current.startX, 2) +
            Math.pow(e.clientY - dragOffset.current.startY, 2)
        );

        if (dragDistance < 5) { // Less than 5px movement = click
            toggleMinimize();
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
            if (isDraggingMinimized) {
                setMinimizedPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsDraggingMinimized(false);
        };

        if (isDragging || isDraggingMinimized) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isDraggingMinimized]);

    if (!isOpen || !currentVideoId) return null;

    return (
        <>
            {/* Minimized indicator */}
            {isMinimized && (
                <div
                    className="fixed z-[100] bg-slate-900 text-white rounded-l-xl shadow-2xl flex items-center gap-2 p-2 px-3 border border-slate-700 cursor-move hover:bg-slate-800 transition select-none"
                    style={{
                        left: minimizedPosition.x,
                        top: minimizedPosition.y,
                        userSelect: 'none',
                        touchAction: 'none'
                    }}
                    onMouseDown={handleMinimizedMouseDown}
                    onClick={handleMinimizedClick}
                    onTouchStart={(e) => {
                        const touch = e.touches[0];
                        const startX = touch.clientX;
                        const startY = touch.clientY;

                        setIsDraggingMinimized(true);
                        dragOffset.current = {
                            x: touch.clientX - minimizedPosition.x,
                            y: touch.clientY - minimizedPosition.y,
                            startX,
                            startY
                        };
                    }}
                    onTouchMove={(e) => {
                        if (isDraggingMinimized) {
                            const touch = e.touches[0];
                            setMinimizedPosition({
                                x: touch.clientX - dragOffset.current.x,
                                y: touch.clientY - dragOffset.current.y
                            });
                        }
                    }}
                    onTouchEnd={(e) => {
                        if (isDraggingMinimized) {
                            const touch = e.changedTouches[0];
                            const dragDistance = Math.sqrt(
                                Math.pow(touch.clientX - dragOffset.current.startX, 2) +
                                Math.pow(touch.clientY - dragOffset.current.startY, 2)
                            );

                            if (dragDistance < 5) {
                                toggleMinimize();
                            }

                            setIsDraggingMinimized(false);
                        }
                    }}
                >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold max-w-[150px] truncate">{currentTitle}</span>
                    <Maximize2 size={14} className="ml-2 opacity-50" />
                </div>
            )}

            {/* Player container - always rendered but repositioned when minimized */}
            <div
                className="fixed z-[100] bg-black rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-700"
                style={{
                    left: isMinimized ? -10000 : position.x,
                    top: isMinimized ? -10000 : position.y,
                    width: isMobile ? '320px' : '480px'
                }}
            >
                {/* Header / Drag Handle - only show when not minimized */}
                {!isMinimized && (
                    <div
                        className="bg-slate-900 p-2 flex items-center justify-between cursor-move select-none"
                        style={{ touchAction: 'none' }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={(e) => {
                            const touch = e.touches[0];
                            setIsDragging(true);
                            dragOffset.current = {
                                x: touch.clientX - position.x,
                                y: touch.clientY - position.y
                            };
                        }}
                        onTouchMove={(e) => {
                            if (isDragging) {
                                const touch = e.touches[0];
                                setPosition({
                                    x: touch.clientX - dragOffset.current.x,
                                    y: touch.clientY - dragOffset.current.y
                                });
                            }
                        }}
                        onTouchEnd={() => setIsDragging(false)}
                    >
                        <div className="flex items-center gap-2 text-white truncate pr-2">
                            <Move size={14} className="opacity-50" />
                            <span className="text-xs font-bold truncate">{currentTitle}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                            >
                                <Minus size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); closePlayer(); }}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Video Container - always rendered */}
                <div
                    className="relative bg-black"
                    style={{
                        paddingTop: '56.25%',
                        width: '100%'
                    }}
                >
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </>
    );
}
