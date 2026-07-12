import React, { createContext, useContext, useState } from 'react';

const VideoPlayerContext = createContext({});

export function VideoPlayerProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState(null);
    const [currentTitle, setCurrentTitle] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);

    const openPlayer = (videoId, title) => {
        // Extract ID if full URL is passed? 
        // Logic: if videoId contains 'youtube.com' or 'youtu.be', extract.
        // But let's assume caller handles extraction or we do it here.
        const id = extractYoutubeId(videoId);
        setCurrentVideoId(id);
        setCurrentTitle(title || '');
        setIsOpen(true);
        setIsMinimized(false);
    };

    const closePlayer = () => {
        setIsOpen(false);
        setCurrentVideoId(null);
        setCurrentTitle('');
    };

    const minimizePlayer = () => setIsMinimized(true);
    const restorePlayer = () => setIsMinimized(false);
    const toggleMinimize = () => setIsMinimized(prev => !prev);

    return (
        <VideoPlayerContext.Provider value={{
            isOpen,
            currentVideoId,
            currentTitle,
            isMinimized,
            openPlayer,
            closePlayer,
            minimizePlayer,
            restorePlayer,
            toggleMinimize
        }}>
            {children}
        </VideoPlayerContext.Provider>
    );
}

function extractYoutubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

export const useVideoPlayer = () => useContext(VideoPlayerContext);
