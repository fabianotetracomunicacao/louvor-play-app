import React, { useState, useEffect } from 'react';
import { X, Save, Shuffle, List, Music, Plus, Trash2, ArrowRight, RotateCcw, Check, GripVertical, CheckCircle2, XCircle, Clock, Send, MessageSquare } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import { getSongFunctions, searchProfiles, getSetlistScale, addUserToSetlistScale, removeUserFromSetlistScale, getPlaylistMembers, getInstruments, mapSongFromDb } from '../utils/storage';
import { WhatsAppService } from '../services/WhatsAppService';
import { supabase } from '../supabaseClient';
import { Portal } from './Portal';
import { User, Calendar, Shield, Search, UserPlus, Users } from 'lucide-react';

// Helper types for usage - INITIAL DEFAULT (will be updated from DB)
const DEFAULT_USAGE_TYPES = ['Abertura', 'Louvor', 'Adoração', 'Oferta', 'Ceia', 'Palavra', 'Apelo', 'Encerramento'];

const getDateInputValue = (value) => {
    if (!value) return '';
    const raw = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTimeInputValue = (value) => {
    if (!value) return '';
    const raw = String(value);
    const match = raw.match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : '';
};

export function SetlistManager({ playlistId, songs = [], availableSongs = [], onClose, onSave, initialData }) {

    const [currentStep, setCurrentStep] = useState(1); // 1: Dados & Escala, 2: Selecionar Músicas, 3: Organizar Culto
    const [mode, setMode] = useState('manual'); // 'manual' or 'auto'
    const [setlistName, setSetlistName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');

    // Scheduling & Permissions
    const [scheduledDate, setScheduledDate] = useState(getDateInputValue(initialData?.date));
    const [scheduledTime, setScheduledTime] = useState(getTimeInputValue(initialData?.service_time || initialData?.serviceTime));
    const [isCollaborative, setIsCollaborative] = useState(initialData?.is_collaborative || false);

    // Scale (People)
    const [scaleMembers, setScaleMembers] = useState([]);
    const [sendWhatsApp, setSendWhatsApp] = useState(true);
    const [initialScaleUserIds, setInitialScaleUserIds] = useState(new Set());
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [userQuery, setUserQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [playlistMembers, setPlaylistMembers] = useState([]); // Members of the parent playlist
    const [instrumentsMetadata, setInstrumentsMetadata] = useState([]);
    const [loadingScale, setLoadingScale] = useState(false);

    // Role Selection Modal State
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [userToScale, setUserToScale] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [editingMemberId, setEditingMemberId] = useState(null);

    // Initial Data Loading
    useEffect(() => {
        if (initialData?.id) {
            setLoadingScale(true);
            getSetlistScale(initialData.id)
                .then(setScaleMembers)
                .catch(console.error)
                .finally(() => setLoadingScale(false));
        }

        // Load Playlist Members for suggestions (AND Owner)
        if (playlistId) {
            Promise.all([
                getPlaylistMembers(playlistId),
                supabase.from('playlists').select('owner_id').eq('id', playlistId).single(),
                getInstruments()
            ]).then(async ([members, { data: playlistData }, instruments]) => {
                setInstrumentsMetadata(instruments);

                let rawMembers = members.map(m => ({
                    id: m.user_id,
                    name: m.profile?.name || m.profile?.email,
                    email: m.profile?.email,
                    avatar_url: m.profile?.avatar_url,
                    instrument: m.profile?.instrument || '',
                    available_instruments: m.profile?.available_instruments || []
                }));

                // Fetch Owner Profile if exists and not already in list
                if (playlistData?.owner_id) {
                    const isOwnerAlreadyAdded = rawMembers.some(m => m.id === playlistData.owner_id);
                    if (!isOwnerAlreadyAdded) {
                        const { data: ownerProfile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', playlistData.owner_id)
                            .single();

                        if (ownerProfile) {
                            rawMembers.push({
                                id: ownerProfile.id,
                                name: ownerProfile.name || ownerProfile.email,
                                email: ownerProfile.email,
                                avatar_url: ownerProfile.avatar_url,
                                instrument: ownerProfile.instrument || '',
                                available_instruments: ownerProfile.available_instruments || []
                            });
                        }
                    }
                }

                const uniqueMembers = Array.from(new Map(rawMembers.map(item => [item.id, item])).values());
                const userIds = uniqueMembers.map(m => m.id);

                // Fetch past scale roles for all playlist members to populate skills automatically
                let userPastRolesMap = {};
                if (userIds.length > 0) {
                    try {
                        const { data: pastScales } = await supabase
                            .from('setlist_scales')
                            .select('user_id, role')
                            .in('user_id', userIds);

                        if (pastScales) {
                            pastScales.forEach(sc => {
                                if (!sc.user_id || !sc.role) return;
                                if (!userPastRolesMap[sc.user_id]) userPastRolesMap[sc.user_id] = new Set();
                                sc.role.split(' + ').forEach(r => {
                                    const trimmed = r.trim();
                                    if (trimmed) userPastRolesMap[sc.user_id].add(trimmed);
                                });
                            });
                        }
                    } catch (e) {
                        console.warn('Error fetching past scale roles for skills:', e);
                    }
                }

                // Merge profile skills + past scale roles
                const enrichedMembers = uniqueMembers.map(m => {
                    const pastRoles = userPastRolesMap[m.id] ? Array.from(userPastRolesMap[m.id]) : [];
                    const combinedSkills = Array.from(new Set([
                        ...(m.available_instruments || []),
                        ...(m.instrument ? [m.instrument] : []),
                        ...pastRoles
                    ])).filter(Boolean);

                    return {
                        ...m,
                        instrument: m.instrument || combinedSkills[0] || '',
                        available_instruments: combinedSkills
                    };
                });

                setPlaylistMembers(enrichedMembers);
            });
        }
    }, [initialData?.id, playlistId]);

    // Search Users Effect (Local Filter now)
    useEffect(() => {
        const query = userQuery.toLowerCase().trim();
        const existingIds = new Set(scaleMembers.map(m => m.user.id));

        if (query.length === 0) {
            // Show all valid members
            setUserResults(playlistMembers.filter(u => !existingIds.has(u.id)));
        } else {
            // Local Filter
            const results = playlistMembers.filter(u =>
                !existingIds.has(u.id) &&
                ((u.name && u.name.toLowerCase().includes(query)) || (u.email && u.email.toLowerCase().includes(query)))
            );
            setUserResults(results);
        }
    }, [userQuery, playlistMembers, scaleMembers]);

    const addToScale = async (user) => {
        // Instead of adding immediately, open the role selection modal
        setUserToScale(user);
        setEditingMemberId(null);
        // Default to their main instrument
        const main = user.instrument || (user.available_instruments && user.available_instruments[0]) || 'Vocal';
        setSelectedRoles([main]);
        setShowRoleModal(true);
        setShowUserSearch(false);
    };

    const editMemberRole = (member) => {
        setUserToScale(member.user);
        setEditingMemberId(member.id);
        // Split existing roles "Violão + Vocal" -> ["Violão", "Vocal"]
        const existingRoles = member.role.split(' + ').map(r => r.trim());
        setSelectedRoles(existingRoles);
        setShowRoleModal(true);
    };

    const confirmAddToScale = async () => {
        if (!userToScale) return;
        
        const user = userToScale;
        const role = selectedRoles.join(' + ') || 'Vocal';
        
        if (editingMemberId) {
            // Updating existing member role — no WhatsApp notification for role changes
            const memberId = editingMemberId;
            setScaleMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
            
            if (!String(memberId).startsWith('temp_') && initialData?.id) {
                try {
                    await addUserToSetlistScale(initialData.id, user.id, role);
                } catch (e) {
                    console.error("Error updating role:", e);
                }
            }
        } else {
            // Adding new member — optimistic UI first
            const tempId = 'temp_' + Date.now();
            const newMember = { id: tempId, role, user: { ...user } };
            setScaleMembers(prev => [...prev, newMember]);

            if (initialData?.id) {
                try {
                    const result = await addUserToSetlistScale(initialData.id, user.id, role);
                    if (result) {
                        setScaleMembers(prev => prev.map(m => m.id === tempId ? { ...m, id: result.id } : m));

                        // ✅ Send WhatsApp notification to the musician if they have a phone
                        const musicianPhone = user.whatsapp || user.phone;
                        if (musicianPhone && result.id) {
                            WhatsAppService.sendScaleConfirmation({
                                scaleId: result.id,
                                musicianPhone,
                                musicianName: user.name || user.full_name || user.email || 'Músico',
                                roleName: role,
                                setlistTitle: initialData?.name || initialData?.title || 'Culto',
                                setlistDate: initialData?.date || scheduledDate,
                                setlistTime: initialData?.service_time || initialData?.serviceTime || scheduledTime
                            }).catch(err =>
                                console.warn('[SetlistManager] WhatsApp notification failed (non-critical):', err)
                            );
                        } else if (!musicianPhone) {
                            console.info(`[SetlistManager] Músico ${user.name} sem WhatsApp cadastrado — notificação ignorada.`);
                        }
                    }
                } catch (error) {
                    console.error("Error adding to scale:", error);
                    alert("Erro ao adicionar membro.");
                    getSetlistScale(initialData.id).then(setScaleMembers);
                }
            }
        }
        
        setShowRoleModal(false);
        setUserToScale(null);
        setEditingMemberId(null);
        setUserQuery('');
    };

    const removeFromScale = async (scaleId) => {
        // Optimistic
        setScaleMembers(prev => prev.filter(m => m.id !== scaleId));

        if (initialData?.id) {
            try {
                await removeUserFromSetlistScale(scaleId);
            } catch (error) {
                console.error("Error removing from scale:", error);
                alert("Erro ao remover membro.");
                // Revert
                getSetlistScale(initialData.id).then(setScaleMembers);
            }
        }
    };

    // Dynamic Categories from DB
    const [usageTypes, setUsageTypes] = useState(DEFAULT_USAGE_TYPES);
    const [isGlobalConfig, setIsGlobalConfig] = useState(true); // Track if we are using global or custom config

    useEffect(() => {
        async function loadFunctions() {
            try {
                const functions = await getSongFunctions();
                // If DB has functions, use them. Otherwise fallback to default.
                if (functions && functions.length > 0) {
                    setUsageTypes(functions.map(f => f.name));
                    // If we are mounting fresh (not editing), reset autoConfig to match new types
                    if (!initialData) {
                        setAutoConfig(functions.map(f => ({ type: f.name, count: 0 })));
                    }
                }
            } catch (err) {
                console.warn("Could not load dynamic functions, using defaults:", err);
            }
        }
        loadFunctions();
    }, []);

    // If editing, map initial items to matched songs from 'songs' prop, preserving usage
    const [selectedSongs, setSelectedSongs] = useState(() => {
        if (!initialData) return [];
        return initialData.items.map(item => {
            const songData = item.song || {};
            // Make sure we carry forward any media block specifics
            return {
                id: songData.id,
                title: songData.title,
                artist: songData.artist,
                usage: item.usage_type,
                media_content: item.media_content || songData.media_content || null,
                isMediaBlock: songData.isMediaBlock || item.usage_type === 'media_block',
                uniqueId: Math.random().toString(36) // New unique ID for Drag list
            };
        });
    });

    // Ensure state updates if initialData changes after mount
    useEffect(() => {
        if (initialData) {
            setMode('manual');
            setCurrentStep(1);
            setSetlistName(initialData.name || '');
            setDescription(initialData.description || ''); // Load description
            setScheduledDate(getDateInputValue(initialData.date));
            setScheduledTime(getTimeInputValue(initialData.service_time || initialData.serviceTime));
            setSelectedSongs(initialData.items.map(item => ({
                id: item.song?.id,
                title: item.song?.title,
                artist: item.song?.artist,
                usage: item.usage_type,
                media_content: item.media_content || item.song?.media_content || null,
                isMediaBlock: item.song?.isMediaBlock || item.usage_type === 'media_block',
                uniqueId: Math.random().toString(36)
            })));
        } else {
            // If switching to Create mode without unmounting
            setMode('selection');
            setSetlistName('');
            setDescription('');
            setScheduledDate('');
            setScheduledTime('');
            setSelectedSongs([]);
            // Reset config to currently loaded usageTypes
            setAutoConfig(usageTypes.map(type => ({ type, count: 0 })));
        }
    }, [initialData, usageTypes]); // Add usageTypes dependency to reset if they load late

    // Auto Mode Config
    const [autoConfig, setAutoConfig] = useState(DEFAULT_USAGE_TYPES.map(type => ({ type, count: 0 })));
    const [randomStrategy, setRandomStrategy] = useState('random'); // 'random', 'least_played'

    // Manual Mode Search
    const [searchQuery, setSearchQuery] = useState('');

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(selectedSongs);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setSelectedSongs(items);
    };

    const addSongManual = (song) => {
        // Use first function as default usage if available
        const defaultUsage = (Array.isArray(song.functions) && song.functions.length > 0) ? song.functions[0] : '';
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setSelectedSongs([...selectedSongs, { ...song, uniqueId, usage: defaultUsage }]);
    };

    const removeSong = (index) => {
        const newSongs = [...selectedSongs];
        newSongs.splice(index, 1);
        setSelectedSongs(newSongs);
    };

    const generateRandomSetlist = () => {
        // Logic to pick songs based on autoConfig + randomStrategy
        // This is a simplified client-side implementation
        let pool = [...songs];
        let newSelection = [];

        // Simple Random Picker Helper
        // Helper to normalize strings (remove accents, lowercase)
        const normalize = (str) => {
            return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
        };

        const pick = (type, count) => {
            for (let i = 0; i < count; i++) {
                if (pool.length === 0) break;

                // 1. Try to find candidates matching the requested 'type' (Style)
                const typeNorm = normalize(type);

                const candidates = pool.map((s, idx) => ({ s, idx })).filter(({ s }) => {
                    // Check Style
                    const styleMatch = normalize(s.style) === typeNorm;
                    // Check Tags (if array)
                    const tagMatch = Array.isArray(s.tags) && s.tags.some(t => normalize(t) === typeNorm);
                    // Check Functions (if array)
                    const funcMatch = Array.isArray(s.functions) && s.functions.some(f => normalize(f) === typeNorm);

                    return styleMatch || tagMatch || funcMatch;
                });



                let chosenIndexInPool = -1;

                if (candidates.length > 0) {
                    // Pick random from MATCHING candidates
                    const randCandIdx = Math.floor(Math.random() * candidates.length);
                    chosenIndexInPool = candidates[randCandIdx].idx;
                } else {
                    // Fallback: Pick random from REMAINING pool
                    // Optimization: We could try to avoid picking songs that explicitly belong to OTHER categories, 
                    // but for now, random fallback is safer than nothing.
                    chosenIndexInPool = Math.floor(Math.random() * pool.length);
                }

                const picked = pool[chosenIndexInPool];

                // Add to selection
                newSelection.push({ ...picked, uniqueId: Math.random().toString(36), usage: type });

                // Remove from pool to avoid duplicates
                pool.splice(chosenIndexInPool, 1);
            }
        };

        autoConfig.forEach(cfg => {
            if (cfg.count > 0) pick(cfg.type, cfg.count);
        });

        setSelectedSongs(newSelection);
        setMode('manual');
        setCurrentStep(3);
    };

    const handleFinalSave = () => {
        if (!setlistName.trim()) return alert('Digite um nome para a escala.');
        if (selectedSongs.length === 0) return alert('Adicione músicas à escala.');

        onSave({
            name: setlistName,
            description: description,
            scheduledDate: scheduledDate || null,
            scheduledTime: scheduledTime || null,
            isCollaborative: isCollaborative,
            sendWhatsApp: sendWhatsApp,
            scaleMembers: scaleMembers.map(m => ({ userId: m.user.id, role: m.role })), // Pass simple array of IDs/Roles
            items: selectedSongs.map((s, i) => {
                const isMedia = s.isMediaBlock || (s.id && String(s.id).startsWith('media_block_'));
                return {
                    songId: isMedia ? null : s.id, // Only send UUID for actual songs
                    position: i,
                    usage: isMedia ? 'media_block' : s.usage,
                    media_content: isMedia ? (s.media_content || []) : null
                };
            })
        });
    };

    const swapSong = (index) => {
        const currentItem = selectedSongs[index];
        const targetUsage = currentItem.usage || ''; // Target specific usage if defined

        // Normalize helper
        const normalize = (str) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
        const typeNorm = normalize(targetUsage);

        // Filter candidates from ALL songs that are NOT currently selected
        const currentIds = new Set(selectedSongs.map(s => s.id));

        let pool = songs.filter(s => !currentIds.has(s.id));

        // If we have a target usage, try to filter by it
        let candidates = pool;
        if (targetUsage) {
            candidates = pool.filter(s => {
                const styleMatch = normalize(s.style) === typeNorm;
                const tagMatch = Array.isArray(s.tags) && s.tags.some(t => normalize(t) === typeNorm);
                const funcMatch = Array.isArray(s.functions) && s.functions.some(f => normalize(f) === typeNorm);
                return styleMatch || tagMatch || funcMatch;
            });
        }

        // If no candidates found for that usage (or empty pool), fallback to random from available pool
        if (candidates.length === 0 && pool.length > 0) {
            candidates = pool;
        }

        if (candidates.length > 0) {
            const randomIdx = Math.floor(Math.random() * candidates.length);
            const newSongData = candidates[randomIdx];

            // Replace item at index
            const newItems = [...selectedSongs];
            newItems[index] = {
                ...newItems[index], // Keep uniqueId and usage
                id: newSongData.id,
                title: newSongData.title,
                artist: newSongData.artist
            };
            setSelectedSongs(newItems);
        } else {
            // No songs available to swap
            alert("Não há outras músicas disponíveis para troca.");
        }
    };

    // Lock Body Scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] md:p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 w-full h-full md:w-[95vw] md:max-w-6xl md:h-[92vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-slate-200 dark:border-slate-800">

                    {/* Header */}
                    <div className="p-4 md:px-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-20">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <List className="text-purple-600" /> {initialData ? 'Editar Setlist' : 'Novo Setlist'}
                        </h2>
                        <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X /></button>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/60 px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 w-full max-w-2xl justify-between">
                            {/* Step 1 */}
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className={`flex items-center gap-2 text-xs md:text-sm font-bold transition cursor-pointer ${currentStep === 1 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${currentStep === 1 ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>1</span>
                                <span className="truncate">1. Dados & Escala</span>
                            </button>

                            <div className={`flex-1 h-0.5 transition-colors ${currentStep > 1 ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'}`} />

                            {/* Step 2 */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!setlistName.trim()) return alert('Digite um nome para o setlist antes de avançar.');
                                    setCurrentStep(2);
                                }}
                                className={`flex items-center gap-2 text-xs md:text-sm font-bold transition cursor-pointer ${currentStep === 2 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${currentStep === 2 ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>2</span>
                                <span className="truncate">2. Selecionar Músicas</span>
                            </button>

                            <div className={`flex-1 h-0.5 transition-colors ${currentStep > 2 ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'}`} />

                            {/* Step 3 */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!setlistName.trim()) return alert('Digite um nome para o setlist antes de avançar.');
                                    if (selectedSongs.length === 0) return alert('Selecione pelo menos uma música antes de avançar.');
                                    setCurrentStep(3);
                                }}
                                className={`flex items-center gap-2 text-xs md:text-sm font-bold transition cursor-pointer ${currentStep === 3 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${currentStep === 3 ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>3</span>
                                <span className="truncate">3. Organizar Culto</span>
                            </button>
                        </div>
                    </div>

                    {/* Content Section - Scrollable Wrapper */}
                    <div className="flex-1 overflow-y-auto overscroll-contain p-5 md:p-6 bg-white dark:bg-slate-900">
                        
                        {/* ================= STEP 1: DADOS GERAIS & ESCALA ================= */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                {/* Top 2 Columns Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    {/* Left Column: Nome & Descrição */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nome do Setlist *</label>
                                            <input
                                                type="text"
                                                className="w-full text-base font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400"
                                                placeholder="Ex: Culto Domingo - 27/12"
                                                value={setlistName}
                                                onChange={e => setSetlistName(e.target.value)}
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Descrição (Opcional)</label>
                                            <textarea
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none placeholder:text-slate-400"
                                                placeholder="Adicione detalhes, observações ou avisos sobre o culto..."
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column: Data, Horário, WhatsApp, Permissões */}
                                    <div className="space-y-4">
                                        {/* Date & Time Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                                                    <Calendar size={13} /> Data Prevista
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                                                    value={scheduledDate}
                                                    onChange={e => setScheduledDate(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                                                    <Clock size={13} /> Horário
                                                </label>
                                                <input
                                                    type="time"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                                                    value={scheduledTime}
                                                    onChange={e => setScheduledTime(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Toggles Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                            {/* WhatsApp Toggle */}
                                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 shrink-0">
                                                    <Send size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Notificação WhatsApp</div>
                                                    <div className="text-[10px] text-slate-500 truncate">Enviar ao escalar</div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setSendWhatsApp(!sendWhatsApp)}
                                                    className={`w-11 h-6 rounded-full transition relative shrink-0 ${sendWhatsApp ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${sendWhatsApp ? 'left-6' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            {/* Edição Colaborativa Toggle */}
                                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs">
                                                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 shrink-0">
                                                    <Shield size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Edição Colaborativa</div>
                                                    <div className="text-[10px] text-slate-500 truncate">Membros podem editar</div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setIsCollaborative(!isCollaborative)}
                                                    className={`w-11 h-6 rounded-full transition relative shrink-0 ${isCollaborative ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isCollaborative ? 'left-6' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scale (Escala) Section - Grid of Member Photo Cards */}
                                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-base">
                                            <User size={20} className="text-purple-600" /> Escala de Músicos & Cantores
                                            {scaleMembers.length > 0 && (
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-extrabold">
                                                    {scaleMembers.length} escalado(s)
                                                </span>
                                            )}
                                        </h3>

                                        {/* Quick Filter */}
                                        <div className="relative w-full sm:w-64">
                                            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400"
                                                placeholder="Filtrar por nome..."
                                                value={userQuery}
                                                onChange={e => setUserQuery(e.target.value)}
                                            />
                                            {userQuery && (
                                                <button onClick={() => setUserQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Escalados Badges */}
                                    {scaleMembers.length > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Escalados neste culto</div>
                                            <div className="flex flex-wrap gap-2">
                                                {scaleMembers.map(member => {
                                                    const status = member.status || 'PENDING';
                                                    const isConfirmed = status === 'CONFIRMED';
                                                    const isDeclined = status === 'DECLINED';
                                                    
                                                    let badgeStyle = 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200';
                                                    if (isConfirmed) {
                                                        badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200';
                                                    } else if (isDeclined) {
                                                        badgeStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 text-rose-800 dark:text-rose-200';
                                                    }

                                                    return (
                                                        <div key={member.id} className={`flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full border shadow-xs transition ${badgeStyle}`}>
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                                                {member.user?.avatar_url ? (
                                                                    <img src={member.user.avatar_url} alt={member.user.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                        {(member.user?.name || '?').charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-bold truncate max-w-[90px]">
                                                                {member.user?.name?.split(' ')[0] || member.user?.email}
                                                            </span>
                                                            
                                                            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 shadow-xs" title={`Status: ${status}`}>
                                                                {isConfirmed && <CheckCircle2 size={11} className="text-emerald-500" />}
                                                                {isDeclined && <XCircle size={11} className="text-rose-500" />}
                                                                {!isConfirmed && !isDeclined && <Clock size={11} className="text-amber-500" />}
                                                                <span>{isConfirmed ? 'OK' : isDeclined ? 'Recusou' : 'Pendente'}</span>
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() => editMemberRole(member)}
                                                                className="bg-purple-100 dark:bg-purple-900/40 text-[10px] font-extrabold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 hover:bg-purple-200 dark:hover:bg-purple-900/60 rounded-md truncate max-w-[100px]"
                                                                title="Alterar Função"
                                                            >
                                                                {member.role}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeFromScale(member.id)}
                                                                className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition"
                                                                title="Remover da escala"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Team Member Photo & Name Card Grid */}
                                    <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                            <span>Clique na pessoa para escalar:</span>
                                            <span className="text-[10px] text-slate-400 font-normal">{playlistMembers.length} membro(s) no time</span>
                                        </div>

                                        {playlistMembers.length === 0 ? (
                                            <div className="text-center py-6 text-xs text-slate-400">Nenhum membro cadastrado nesta igreja/playlist.</div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                {(() => {
                                                    const existingIds = new Set(scaleMembers.map(m => m.user.id));
                                                    const q = userQuery.trim().toLowerCase();

                                                    const filtered = playlistMembers.filter(u => {
                                                        if (!q) return true;
                                                        return (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
                                                    });

                                                    if (filtered.length === 0) {
                                                        return <div className="col-span-full py-4 text-center text-xs text-slate-400">Nenhum membro encontrado.</div>;
                                                    }

                                                    return filtered.map(user => {
                                                        const isAlreadyScaled = existingIds.has(user.id);
                                                        const mainRole = user.instrument || (user.available_instruments && user.available_instruments[0]) || 'Vocal';

                                                        return (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                disabled={isAlreadyScaled}
                                                                onClick={() => addToScale(user)}
                                                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center group relative overflow-hidden ${
                                                                    isAlreadyScaled
                                                                        ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 hover:shadow-md cursor-pointer'
                                                                }`}
                                                            >
                                                                {/* Photo / Avatar */}
                                                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-2 relative flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-600 group-hover:scale-105 transition-transform">
                                                                    {user.avatar_url ? (
                                                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="font-extrabold text-sm text-purple-600 dark:text-purple-300">
                                                                            {(user.name || '?').charAt(0).toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                    {isAlreadyScaled && (
                                                                        <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center text-white">
                                                                            <Check size={18} />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Name */}
                                                                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate w-full px-1">
                                                                    {user.name || 'Sem nome'}
                                                                </div>

                                                                {/* Main Skill / Instrument */}
                                                                <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 truncate w-full mt-0.5">
                                                                    {isAlreadyScaled ? 'Escalado' : mainRole}
                                                                </div>

                                                                {!isAlreadyScaled && (
                                                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Plus size={12} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= STEP 2: SELECIONAR MÚSICAS (AMPLA VISUALIZAÇÃO) ================= */}
                        {currentStep === 2 && (
                            <div className="space-y-5 animate-in fade-in duration-200">
                                {/* Mode Selector Header & Selected Counter */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMode('manual')}
                                            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                                                mode === 'manual'
                                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                            }`}
                                        >
                                            <List size={16} /> Seleção Manual da Playlist
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setMode('auto')}
                                            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                                                mode === 'auto'
                                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                            }`}
                                        >
                                            <Shuffle size={16} /> Gerar Aleatoriamente
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Músicas Selecionadas:</span>
                                        <span className="text-sm font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                                            {selectedSongs.length} música(s)
                                        </span>
                                    </div>
                                </div>

                                {/* Manual Selection Mode */}
                                {mode === 'manual' && (
                                    <div className="space-y-4">
                                        {/* Prominent Search Bar */}
                                        <div className="relative">
                                            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Buscar música nesta playlist por título, artista, tom ou versão..."
                                                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-600 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none shadow-xs placeholder:text-slate-400"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                            />
                                            {searchQuery && (
                                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Large Grid of Available Songs in Playlist */}
                                        {(() => {
                                            const candidateMap = new Map();
                                            availableSongs.forEach(s => { if (s && s.id && !candidateMap.has(s.id)) candidateMap.set(s.id, s); });
                                            songs.forEach(s => { if (s && s.id && !candidateMap.has(s.id)) candidateMap.set(s.id, s); });

                                            const candidatePool = Array.from(candidateMap.values());
                                            const q = searchQuery.trim().toLowerCase();

                                            const filteredCandidates = q
                                                ? candidatePool.filter(s =>
                                                    (s.title && s.title.toLowerCase().includes(q)) ||
                                                    (s.artist && s.artist.toLowerCase().includes(q)) ||
                                                    (s.version_label && s.version_label.toLowerCase().includes(q)) ||
                                                    (s.creatorName && s.creatorName.toLowerCase().includes(q)) ||
                                                    (s.creator?.name && s.creator.name.toLowerCase().includes(q)) ||
                                                    (s.creator?.email && s.creator.email.toLowerCase().includes(q))
                                                )
                                                : candidatePool;

                                            if (filteredCandidates.length === 0) {
                                                return (
                                                    <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                                                        <Music className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                                                        <div className="font-bold text-sm">
                                                            {searchQuery ? 'Nenhuma música encontrada com este termo.' : 'Nenhuma música cadastrada nesta playlist.'}
                                                        </div>
                                                        <div className="text-xs mt-1 text-slate-400">
                                                            Adicione músicas à playlist primeiro para poder escalá-las no culto.
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1 overscroll-contain">
                                                    {filteredCandidates.map(song => {
                                                        const selectionCount = selectedSongs.filter(s => s.id === song.id).length;
                                                        const isSelected = selectionCount > 0;
                                                        const versionLabel = song.version_label || '';
                                                        const versionTone = song.version_tone || song.originalKey || '';

                                                        return (
                                                            <div
                                                                key={song.id}
                                                                onClick={() => addSongManual(song)}
                                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                                                                    isSelected
                                                                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-700 shadow-xs'
                                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-md'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-purple-600 dark:text-purple-300'}`}>
                                                                            {song.type === 'lyrics' ? <FileText size={16} /> : <Music size={16} />}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-800 dark:text-slate-100'}`}>
                                                                                {song.title}
                                                                            </h4>
                                                                            <p className="text-xs text-slate-500 truncate">{song.artist}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                                                                        isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                                                    }`}>
                                                                        {isSelected ? <Check size={14} /> : <Plus size={14} />}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-700/60 text-slate-500">
                                                                    <div className="flex items-center gap-1.5 truncate">
                                                                        {versionTone && (
                                                                            <span className="font-extrabold text-purple-600 dark:text-purple-400 bg-purple-100/70 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                                                                                Tom: {versionTone}
                                                                            </span>
                                                                        )}
                                                                        {versionLabel && (
                                                                            <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded truncate">
                                                                                {versionLabel}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {isSelected && (
                                                                        <span className="font-extrabold bg-purple-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                                                                            {selectionCount}x
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}

                                        {/* Selected Songs Summary Strip */}
                                        {selectedSongs.length > 0 && (
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex justify-between items-center">
                                                    <span>Músicas escolhidas para este culto:</span>
                                                    <button onClick={() => setSelectedSongs([])} className="text-rose-500 hover:underline">Limpar todas</button>
                                                </div>

                                                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                                                    {selectedSongs.map((song, idx) => (
                                                        <div key={song.uniqueId || idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 pl-3 pr-2 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                                                            <span className="text-purple-600 font-extrabold">{idx + 1}.</span>
                                                            <span className="text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{song.title}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSong(idx)}
                                                                className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Auto Generator Mode */}
                                {mode === 'auto' && (
                                    <div className="space-y-4 max-w-xl mx-auto">
                                        <div className="flex gap-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setRandomStrategy('random')}
                                                className={`flex-1 p-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${randomStrategy === 'random' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <Shuffle size={14} /> Sortear Totalmente Aleatório
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRandomStrategy('least_played')}
                                                className={`flex-1 p-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${randomStrategy === 'least_played' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <RotateCcw size={14} /> Priorizar Menos Tocadas
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {autoConfig.map((cfg, idx) => (
                                                <div key={cfg.type} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{cfg.type}</span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newCfg = [...autoConfig];
                                                                if (newCfg[idx].count > 0) newCfg[idx].count--;
                                                                setAutoConfig(newCfg);
                                                            }}
                                                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold"
                                                        >-</button>
                                                        <span className="w-6 text-center font-bold text-sm">{cfg.count}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newCfg = [...autoConfig];
                                                                newCfg[idx].count++;
                                                                setAutoConfig(newCfg);
                                                            }}
                                                            className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 font-bold"
                                                        >+</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={generateRandomSetlist}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer"
                                        >
                                            <Shuffle size={18} /> Sortear Setlist Agora
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ================= STEP 3: ORGANIZAR CULTO ================= */}
                        {currentStep === 3 && (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                                    <GripVertical size={16} className="text-purple-600 shrink-0" />
                                    <span>Arraste os itens para definir a ordem sequencial das músicas durante o culto.</span>
                                </div>

                                {selectedSongs.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">
                                        Nenhuma música foi selecionada. Volte para a etapa 2 para escolher as músicas.
                                    </div>
                                ) : (
                                    <DragDropContext onDragEnd={handleDragEnd}>
                                        <Droppable droppableId="setlist-preview">
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2.5 pb-4 max-h-[58vh] overflow-y-auto pr-1">
                                                    {selectedSongs.map((item, index) => (
                                                        <Draggable key={item.uniqueId || index} draggableId={item.uniqueId || String(index)} index={index}>
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className="flex flex-col md:flex-row md:items-center gap-3 p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl group shadow-xs hover:border-purple-300"
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        <div {...provided.dragHandleProps} className="text-slate-300 hover:text-purple-600 cursor-grab active:cursor-grabbing p-1">
                                                                            <GripVertical size={20} />
                                                                        </div>
                                                                        <div className="text-purple-600 font-extrabold w-6 text-center text-sm">{index + 1}</div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                {item.type === 'lyrics' ? (
                                                                                    <FileText size={14} className="text-amber-500 flex-shrink-0" />
                                                                                ) : (
                                                                                    <Music size={14} className="text-purple-500 flex-shrink-0" />
                                                                                )}
                                                                                <div className="font-bold text-slate-900 dark:text-white truncate text-sm">{item.title}</div>
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-500 truncate uppercase tracking-wider mt-0.5">{item.artist}</div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 pl-10 md:pl-0">
                                                                        <select
                                                                            disabled={item.isMediaBlock || (item.id && String(item.id).startsWith('media_block_'))}
                                                                            className="flex-1 md:w-36 text-xs font-bold bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                                                                            value={item.usage || ''}
                                                                            onChange={(e) => {
                                                                                const newItems = [...selectedSongs];
                                                                                newItems[index].usage = e.target.value;
                                                                                setSelectedSongs(newItems);
                                                                            }}
                                                                        >
                                                                            <option value="">Selecione a Função...</option>
                                                                            {usageTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                                            {(item.isMediaBlock || (item.id && String(item.id).startsWith('media_block_'))) && <option value="media_block">Projeção</option>}
                                                                        </select>

                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => swapSong(index)}
                                                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"
                                                                                title="Sortear Outra"
                                                                            >
                                                                                <RotateCcw size={16} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeSong(index)}
                                                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition"
                                                                                title="Remover"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer - Fixed at bottom */}
                    <div className="p-4 md:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Step 1 Footer */}
                        {currentStep === 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition text-sm cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!setlistName.trim()) return alert('Digite um nome para o setlist antes de avançar.');
                                        setCurrentStep(2);
                                    }}
                                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Próximo: Selecionar Músicas <ArrowRight size={16} />
                                </button>
                            </>
                        )}

                        {/* Step 2 Footer */}
                        {currentStep === 2 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="w-full sm:w-auto px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition text-sm cursor-pointer"
                                >
                                    ← Voltar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedSongs.length === 0) return alert('Selecione pelo menos uma música para continuar.');
                                        setCurrentStep(3);
                                    }}
                                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Próximo: Organizar Culto <ArrowRight size={16} />
                                </button>
                            </>
                        )}

                        {/* Step 3 Footer */}
                        {currentStep === 3 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="w-full sm:w-auto px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition text-sm cursor-pointer"
                                >
                                    ← Voltar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleFinalSave}
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Save size={18} /> Salvar Setlist
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Role Selection Modal */}
            {showRoleModal && userToScale && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Users size={20} className="text-purple-600" />
                                Definir Função
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Escolha o instrumento para <strong>{userToScale.name}</strong></p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">Habilidades do Usuário</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(userToScale.available_instruments || []).length > 0 ? (
                                        userToScale.available_instruments.map(inst => (
                                            <button
                                                key={inst}
                                                onClick={() => {
                                                    if (selectedRoles.includes(inst)) {
                                                        setSelectedRoles(selectedRoles.filter(r => r !== inst));
                                                    } else {
                                                        setSelectedRoles([...selectedRoles, inst]);
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all ${
                                                    selectedRoles.includes(inst) 
                                                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20' 
                                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                                }`}
                                            >
                                                {inst}
                                                {selectedRoles.includes(inst) && <Check size={14} />}
                                                {inst === userToScale.instrument && !selectedRoles.includes(inst) && <span className="text-[8px] bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-500 font-normal">Principal</span>}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="col-span-2 py-2 text-xs text-slate-400 italic text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                            Nenhuma habilidade cadastrada.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">Outras Funções</label>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val && !selectedRoles.includes(val)) {
                                            setSelectedRoles([...selectedRoles, val]);
                                        }
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Adicionar outra função...</option>
                                    {instrumentsMetadata
                                        .filter(i => !(userToScale.available_instruments || []).includes(i.name))
                                        .map(inst => (
                                            <option key={inst.id} value={inst.name}>{inst.name}</option>
                                        ))
                                    }
                                    <option value="Vocal">Vocal</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>

                            {selectedRoles.length > 0 && (
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                                    <label className="block text-[9px] uppercase font-extrabold text-purple-400 mb-2">Funções Selecionadas (Toque para remover)</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedRoles.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setSelectedRoles(selectedRoles.filter(r => r !== role))}
                                                className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 transition-colors group"
                                                title="Remover"
                                            >
                                                {role}
                                                <X size={10} className="text-purple-400 group-hover:text-red-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowRoleModal(false); setUserToScale(null); }}
                                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAddToScale}
                                    className="flex-[2] py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 transition text-sm flex items-center justify-center gap-2"
                                >
                                    Confirmar Escala
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Portal>
    );
}


