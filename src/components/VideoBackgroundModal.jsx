import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, Video, CheckCircle } from 'lucide-react';
import { getUserGlobalPrefs, saveUserGlobalPrefs, getSystemMedia, deleteSystemMedia, deleteUserMedia } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

export default function VideoBackgroundModal({ isOpen, onClose, onSelect, currentUrl }) {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('system'); // 'system' or 'my'
    const [systemVideos, setSystemVideos] = useState([]);
    const [userVideos, setUserVideos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const systemFileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            getSystemMedia('video').then(data => setSystemVideos(data || []));
            getUserGlobalPrefs().then(prefs => {
                if (prefs && prefs.uploaded_videos) {
                    setUserVideos(prefs.uploaded_videos);
                }
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelect = (url) => {
        onSelect(url);
        onClose();
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e, isSystem = false) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check Size (70MB max)
        if (file.size > 70 * 1024 * 1024) {
            alert("Vídeo muito grande. Limite de 70MB.");
            return;
        }

        if (!isSystem && userVideos.length >= 2) {
            alert("Limite de 2 vídeos atingido. Exclua um vídeo para enviar outro.");
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `backgrounds/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file, { upsert: false });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            if (publicUrl) {
                const data = { url: publicUrl };
                if (isSystem) {
                    const { data: newMedia, error } = await supabase
                        .from('system_media')
                        .insert({ type: 'video', name: file.name, url: data.url })
                        .select()
                        .single();
                    if (!error && newMedia) {
                        setSystemVideos([newMedia, ...systemVideos]);
                    }
                } else {
                    const newVid = { id: `user_vid_${Date.now()}`, url: data.url, name: file.name };
                    const newArray = [...userVideos, newVid];
                    setUserVideos(newArray);
                    saveUserGlobalPrefs({ uploaded_videos: newArray });
                }
            } else {
                alert("Erro no upload.");
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Erro de comunicação com o servidor de upload.");
        } finally {
            setIsUploading(false);
            if (isSystem && systemFileInputRef.current) systemFileInputRef.current.value = '';
            else if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[90vw] max-w-4xl h-[80vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                        <Video className="text-blue-500" size={20} />
                        Vídeos de Fundo (MP4/WebM)
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'system' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        onClick={() => setActiveTab('system')}
                    >
                        Padrões do Sistema
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'my' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        onClick={() => setActiveTab('my')}
                    >
                        Meus Vídeos ({userVideos.length}/2)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-900/50">

                    {/* System Videos Tab */}
                    {activeTab === 'system' && (
                        <div className="space-y-4">
                            {isAdmin && (
                                <div className="flex justify-end bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                                    <button
                                        onClick={() => systemFileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition disabled:opacity-50"
                                    >
                                        {isUploading ? 'Enviando...' : (
                                            <>
                                                <Upload size={16} />
                                                Adicionar Vídeo (Admin)
                                            </>
                                        )}
                                    </button>
                                    <input
                                        type="file"
                                        ref={systemFileInputRef}
                                        onChange={(e) => handleFileChange(e, true)}
                                        accept="video/mp4, video/webm"
                                        className="hidden"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                                {systemVideos.map((vid) => (
                                    <div
                                        key={vid.id}
                                        className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition border-4 ${currentUrl === vid.url ? 'border-blue-600' : 'border-transparent'}`}
                                    >
                                        <div className="w-full h-full" onClick={() => handleSelect(vid.url)}>
                                            <video
                                                src={vid.url}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500 bg-black"
                                                muted
                                                loop
                                                playsInline
                                                onMouseOver={e => {
                                                    const playPromise = e.target.play();
                                                    if (playPromise !== undefined) {
                                                        playPromise.catch(() => { /* Safe to ignore interruption */ });
                                                    }
                                                }}
                                                onMouseOut={e => {
                                                    try {
                                                        e.target.pause();
                                                    } catch (err) { /* Safe to ignore */ }
                                                }}
                                            />

                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 pointer-events-none">
                                                <p className="text-white text-sm font-bold truncate flex items-center gap-2">
                                                    <Video size={14} /> {vid.name}
                                                </p>
                                            </div>
                                        </div>

                                        {currentUrl === vid.url && (
                                            <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg pointer-events-none">
                                                <CheckCircle size={16} />
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm("Remover este vídeo padrão do sistema? Todos os usuários perderão acesso a ele.")) {
                                                        try {
                                                            await deleteSystemMedia(vid.id);
                                                            setSystemVideos(systemVideos.filter(s => s.id !== vid.id));
                                                        } catch (err) {
                                                            alert("Erro ao excluir vídeo do sistema.");
                                                        }
                                                    }
                                                }}
                                                className="absolute top-2 left-2 bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg z-10 hover:bg-red-700"
                                                title="Excluir vídeo de sistema"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {systemVideos.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <Video size={48} className="mb-2 opacity-50" />
                                    <p>Nenhum vídeo de sistema configurado.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Videos Tab */}
                    {activeTab === 'my' && (
                        <div>
                            {/* Upload Area */}
                            <div className="mb-6 bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-center">
                                <Upload size={32} className="text-slate-400 mb-2" />
                                <h4 className="font-bold dark:text-white mb-1">Adicionar Novo Vídeo</h4>
                                <p className="text-xs text-slate-500 max-w-sm mb-4">Arquivos MP4 ou WebM.<br />Tamanho máximo 70MB. Recomenda-se Loops de 10-15s.</p>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="video/mp4, video/webm"
                                    onChange={handleFileChange}
                                />

                                <button
                                    onClick={handleUploadClick}
                                    disabled={isUploading || userVideos.length >= 2}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
                                </button>

                                {userVideos.length >= 2 && (
                                    <p className="text-red-500 text-xs mt-3 font-bold">Límite de 2 vídeos atingido.</p>
                                )}
                            </div>

                            {/* Gallery */}
                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                                {userVideos.map((vid) => (
                                    <div
                                        key={vid.id}
                                        className={`relative aspect-video rounded-xl overflow-hidden group shadow-sm hover:shadow-md transition border-4 ${currentUrl === vid.url ? 'border-blue-600' : 'border-transparent'}`}
                                    >
                                        <div className="w-full h-full cursor-pointer" onClick={() => handleSelect(vid.url)}>
                                            <video
                                                src={vid.url}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500 bg-black"
                                                muted
                                                loop
                                                playsInline
                                                onMouseOver={e => e.target.play()}
                                                onMouseOut={e => e.target.pause()}
                                            />
                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 pointer-events-none">
                                                <p className="text-white text-xs truncate opacity-70 flex items-center gap-1">
                                                    <Video size={12} /> {vid.name}
                                                </p>
                                            </div>
                                        </div>

                                        {currentUrl === vid.url && (
                                            <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg z-10 pointer-events-none">
                                                <CheckCircle size={16} />
                                            </div>
                                        )}

                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (window.confirm("Remover este vídeo? Músicas que o utilizam voltarão para o fundo padrão.")) {
                                                    const success = await deleteUserMedia(vid.id, vid.url, 'video');
                                                    if (success) {
                                                        setUserVideos(prev => prev.filter(u => u.id !== vid.id));
                                                    } else {
                                                        alert("Erro ao excluir vídeo.");
                                                    }
                                                }
                                            }}
                                            className="absolute top-2 left-2 bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg z-10 hover:bg-red-700"
                                            title="Excluir vídeo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
