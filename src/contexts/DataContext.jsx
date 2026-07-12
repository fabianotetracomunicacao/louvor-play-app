import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMostViewedSongs, getUserHistory, getLikedSongs, getUserEdits, getMyPlaylists, toggleLike as storageToggleLike, addToHistory as storageAddToHistory, getUserPreferences } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useDeviceType } from '../hooks/useDeviceType';
import { supabase } from '../supabaseClient';

const DataContext = createContext();

export function useData() {
    return useContext(DataContext);
}

export function DataProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const { isMobile, isTablet, isDesktop } = useDeviceType();
    const [topSongs, setTopSongs] = useState([]);
    const [recentHistory, setRecentHistory] = useState([]);
    const [likedSongIds, setLikedSongIds] = useState(new Set());
    const [likedSongs, setLikedSongs] = useState([]); // Cache full objects
    const [myPlaylists, setMyPlaylists] = useState([]); // Cache playlists
    const [userEdits, setUserEdits] = useState([]);   // Cache user edits
    const [titleMap, setTitleMap] = useState({}); // Cache for titles needed by Player
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

    // Player Preferences (Mobile/Desktop)
    const [mobilePreferences, setMobilePreferences] = useState({
        fontSize: 12,
        lineSpacing: 1.0,
        letterSpacing: 1.0,
        scrollSpeed: 5
    });
    const [desktopPreferences, setDesktopPreferences] = useState({
        fontSize: 22,
        lineSpacing: 0.8,
        letterSpacing: 1.0,
        scrollSpeed: 5
    });
    const [tabletPreferences, setTabletPreferences] = useState({
        fontSize: 20,
        lineSpacing: 0.8,
        letterSpacing: 1.0,
        scrollSpeed: 5
    });

    // Chord Colors
    const [chordColors, setChordColors] = useState({
        light: '#d97706',
        dark: '#d97706'
    });

    // Default Instrument
    const [defaultInstrument, setDefaultInstrument] = useState('guitar');

    const loadData = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [viewed, history, liked, edits, preferences] = await Promise.all([
                getMostViewedSongs(10),
                getUserHistory(10),
                getLikedSongs(),
                getUserEdits(),
                getUserPreferences()
            ]);

            setTopSongs(viewed);
            setRecentHistory(history);
            setLikedSongs(liked);
            setLikedSongIds(new Set(liked.map(s => s.id)));
            setUserEdits(edits);

            if (preferences) {
                setMobilePreferences({
                    fontSize: preferences.mobile_font_size || 12,
                    lineSpacing: preferences.mobile_line_spacing || 1.0,
                    letterSpacing: preferences.mobile_letter_spacing || 1.0,
                    scrollSpeed: preferences.mobile_scroll_speed || 5
                });
                setDesktopPreferences({
                    fontSize: preferences.desktop_font_size || 22,
                    lineSpacing: preferences.desktop_line_spacing || 0.8,
                    letterSpacing: preferences.desktop_letter_spacing || 1.0,
                    scrollSpeed: preferences.desktop_scroll_speed || 5
                });
                setTabletPreferences({
                    fontSize: preferences.tablet_font_size || 18,
                    lineSpacing: preferences.tablet_line_spacing || 0.9,
                    letterSpacing: preferences.tablet_letter_spacing || 1.0,
                    scrollSpeed: preferences.tablet_scroll_speed || 5
                });
                setChordColors({
                    light: preferences.chord_color_light || '#d97706',
                    dark: preferences.chord_color_dark || '#d97706'
                });
                setDefaultInstrument(preferences.default_instrument || 'guitar');
            }

            const map = {};
            [...viewed, ...history, ...liked, ...edits].forEach(s => {
                if (s.id) map[s.id] = s.title;
            });
            setTitleMap(prev => ({ ...prev, ...map }));

        } catch (error) {
            if (error.name === 'AbortError' || error.message?.includes('Fetch is aborted')) {
                return;
            }
            console.error("Error loading global data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) loadData();
    }, [user, authLoading]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.style.setProperty('--chord-color-light', chordColors.light);
            document.documentElement.style.setProperty('--chord-color-dark', chordColors.dark);
        }
    }, [chordColors]);

    const toggleLike = async (songId) => {
        setLikedSongIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(songId)) {
                newSet.delete(songId);
                setLikedSongs(current => current.filter(s => s.id !== songId));
            } else {
                newSet.add(songId);
            }
            return newSet;
        });

        try {
            await storageToggleLike(songId);
            const liked = await getLikedSongs();
            setLikedSongs(liked);
            setLikedSongIds(new Set(liked.map(s => s.id)));
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const addToHistory = async (song) => {
        setRecentHistory(prev => {
            const filtered = prev.filter(s => s.id !== song.id);
            return [song, ...filtered].slice(0, 10);
        });

        try {
            await storageAddToHistory(song.id);
        } catch (error) {
            console.error("Error adding to history:", error);
        }
    };

    const refreshEdits = async () => {
        const edits = await getUserEdits();
        setUserEdits(edits);
    };

    const refreshPlaylists = async (force = true) => {
        setIsLoadingPlaylists(true);
        try {
            const playlists = await getMyPlaylists(force);
            setMyPlaylists(playlists);
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error("Error loading playlists:", error);
        } finally {
            setIsLoadingPlaylists(false);
        }
    };

    const updateMobilePreferences = async (fontSize, lineSpacing, letterSpacing, scrollSpeed) => {
        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    mobile_font_size: fontSize,
                    mobile_line_spacing: lineSpacing,
                    mobile_letter_spacing: letterSpacing,
                    mobile_scroll_speed: scrollSpeed,
                    updated_at: new Date()
                });

            if (error) throw error;
            setMobilePreferences({ fontSize, lineSpacing, letterSpacing, scrollSpeed });
        } catch (error) {
            console.error('Error updating mobile preferences:', error);
            throw error;
        }
    };

    const updateDesktopPreferences = async (fontSize, lineSpacing, letterSpacing, scrollSpeed) => {
        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    desktop_font_size: fontSize,
                    desktop_line_spacing: lineSpacing,
                    desktop_letter_spacing: letterSpacing,
                    desktop_scroll_speed: scrollSpeed,
                    updated_at: new Date()
                });

            if (error) throw error;
            setDesktopPreferences({ fontSize, lineSpacing, letterSpacing, scrollSpeed });
        } catch (error) {
            console.error('Error updating desktop preferences:', error);
            throw error;
        }
    };

    const updateTabletPreferences = async (fontSize, lineSpacing, letterSpacing, scrollSpeed) => {
        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    tablet_font_size: fontSize,
                    tablet_line_spacing: lineSpacing,
                    tablet_letter_spacing: letterSpacing,
                    tablet_scroll_speed: scrollSpeed,
                    updated_at: new Date()
                });

            if (error) throw error;
            setTabletPreferences({ fontSize, lineSpacing, letterSpacing, scrollSpeed });
        } catch (error) {
            console.error('Error updating tablet preferences:', error);
            throw error;
        }
    };

    const updateDefaultInstrument = async (instrument) => {
        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    default_instrument: instrument,
                    updated_at: new Date()
                });

            if (error) throw error;
            setDefaultInstrument(instrument);
        } catch (error) {
            console.error('Error updating default instrument:', error);
            throw error;
        }
    };

    const currentPlayerPreferences = isMobile ? mobilePreferences : (isTablet ? tabletPreferences : desktopPreferences);

    const value = React.useMemo(() => ({
        topSongs,
        recentHistory,
        likedSongIds,
        likedSongs,
        userEdits,
        myPlaylists,
        toggleLike,
        addToHistory,
        refreshEdits,
        refreshPlaylists,
        isLoading,
        isLoadingPlaylists,
        refreshData: loadData,
        isMobile,
        isTablet,
        isDesktop,
        mobilePreferences,
        desktopPreferences,
        tabletPreferences,
        chordColors,
        defaultInstrument,
        currentPlayerPreferences,
        updateMobilePreferences,
        updateDesktopPreferences,
        updateTabletPreferences,
        updateDefaultInstrument
    }), [
        topSongs, recentHistory, likedSongIds, likedSongs, userEdits, myPlaylists,
        isLoading, isLoadingPlaylists, isMobile, isTablet, isDesktop,
        mobilePreferences, desktopPreferences, tabletPreferences,
        chordColors, defaultInstrument, currentPlayerPreferences
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
