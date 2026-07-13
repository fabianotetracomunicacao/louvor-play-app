import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { getUserGlobalPrefs, saveUserGlobalPrefs, getSystemMedia, deleteSystemMedia, deleteUserMedia } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

export default function ImageBackgroundModal({ isOpen, onClose, onSelect, currentUrl }) {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('system'); // 'system' or 'my'
    const [systemImages, setSystemImages] = useState([]);
    const [userImages, setUserImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const systemFileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            getSystemMedia('image').then(data => setSystemImages(data || []));
            getUserGlobalPrefs().then(prefs => {
                if (prefs && prefs.uploaded_images) {
                    setUserImages(prefs.uploaded_images);
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
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            setIsUploading(true);
            
            for (const file of files) {
                // Basic check
                if (file.size > 10 * 1024 * 1024) {
                    alert(`Imagem "${file.name}" muito grande. Limite de 10MB.`);
                    continue;
                }

                if (!isSystem && userImages.length >= 10) {
                    alert("Limite de 10 imagens atingido.");
                    break;
                }

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
                            .insert({ type: 'image', name: file.name, url: data.url })
                            .select()
                            .single();
                        if (!error && newMedia) {
                            setSystemImages(prev => [newMedia, ...prev]);
                        }
                    } else {
                        const newImg = { id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, url: data.url, name: file.name };
                        setUserImages(prev => {
                            const newArray = [...prev, newImg];
                            saveUserGlobalPrefs({ uploaded_images: newArray });
                            return newArray;
                        });
                    }
                } else {
                    console.error(`Upload failed for ${file.name}`);
                }
            }
        } catch (error) {
            console.error("Upload process failed", error);
            alert("Erro durante o processo de upload.");
        } finally {
            setIsUploading(true); // Small delay feel
            setTimeout(() => {
                setIsUploading(false);
                if (isSystem) {
                    if (systemFileInputRef.current) systemFileInputRef.current.value = '';
                } else {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            }, 500);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[90vw] max-w-4xl h-[80vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                        <ImageIcon className="text-purple-500" size={20} />
                        Imagens de Fundo
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'system' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        onClick={() => setActiveTab('system')}
                    >
                        Padrões do Sistema
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'my' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        onClick={() => setActiveTab('my')}
                    >
                        Minhas Imagens ({userImages.length}/10)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-900/50">

                    {/* System Images Tab */}
                    {activeTab === 'system' && (
                        <div className="space-y-4">
                            {isAdmin && (
                                <div className="flex justify-end bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                                    <button
                                        onClick={() => systemFileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="bg-purple-600/10 text-purple-600 hover:bg-purple-600 hover:text-white dark:text-purple-400 px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition disabled:opacity-50"
                                    >
                                        {isUploading ? 'Enviando...' : (
                                            <>
                                                <Upload size={16} />
                                                Adicionar Fundo (Admin)
                                            </>
                                        )}
                                    </button>
                                    <input
                                        type="file"
                                        ref={systemFileInputRef}
                                        onChange={(e) => handleFileChange(e, true)}
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {systemImages.map((img) => (
                                    <div
                                        key={img.id}
                                        className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition border-4 ${currentUrl === img.url ? 'border-purple-600' : 'border-transparent'}`}
                                    >
                                        <div className="w-full h-full" onClick={() => handleSelect(img.url)}>
                                            <img 
                                                src={img.url} 
                                                alt={img.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                                                onError={(e) => {
                                                    e.target.onerror = null; 
                                                    e.target.src = 'https://placehold.co/600x400/1e293b/white?text=Erro';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-500" />
                                        </div>

                                        {currentUrl === img.url && (
                                            <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full shadow-lg pointer-events-none">
                                                <CheckCircle size={16} />
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm("Remover esta imagem padrão do sistema? Todos os usuários perderão acesso a ela.")) {
                                                        try {
                                                            await deleteSystemMedia(img.id);
                                                            setSystemImages(systemImages.filter(s => s.id !== img.id));
                                                        } catch (err) {
                                                            alert("Erro ao excluir imagem do sistema.");
                                                        }
                                                    }
                                                }}
                                                className="absolute top-2 left-2 bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg z-10 hover:bg-red-700"
                                                title="Excluir imagem de sistema"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {systemImages.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <ImageIcon size={48} className="mb-2 opacity-50" />
                                    <p>Nenhuma imagem de sistema configurada.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Images Tab */}
                    {activeTab === 'my' && (
                        <div>
                            {/* Upload Area */}
                            <div className="mb-6 bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-center">
                                <Upload size={32} className="text-slate-400 mb-2" />
                                <h4 className="font-bold dark:text-white mb-1">Adicionar Nova Imagem</h4>
                                <p className="text-xs text-slate-500 max-w-sm mb-4">Arquivos JPG, PNG ou WEBP. <br />Tamanho máximo 10MB.</p>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/jpeg, image/png, image/webp"
                                    multiple
                                    onChange={handleFileChange}
                                />

                                <button
                                    onClick={handleUploadClick}
                                    disabled={isUploading || userImages.length >= 10}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
                                </button>

                                {userImages.length >= 10 && (
                                    <p className="text-red-500 text-xs mt-3 font-bold">Límite de 10 imagens atingido.</p>
                                )}
                            </div>

                            {/* Gallery */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {userImages.map((img) => (
                                    <div
                                        key={img.id}
                                        className={`relative aspect-video rounded-xl overflow-hidden group shadow-sm hover:shadow-md transition border-4 ${currentUrl === img.url ? 'border-purple-600' : 'border-transparent'}`}
                                    >
                                        <div className="w-full h-full cursor-pointer" onClick={() => handleSelect(img.url)}>
                                            <img 
                                                src={img.url} 
                                                alt={img.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                                                onError={(e) => {
                                                    e.target.onerror = null; 
                                                    e.target.src = 'https://placehold.co/600x400/1e293b/white?text=Erro';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-500" />
                                        </div>

                                        {currentUrl === img.url && (
                                            <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full shadow-lg z-10">
                                                <CheckCircle size={16} />
                                            </div>
                                        )}

                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (window.confirm("Remover esta imagem? Músicas que a utilizam voltarão para o fundo padrão.")) {
                                                    const success = await deleteUserMedia(img.id, img.url, 'image');
                                                    if (success) {
                                                        setUserImages(prev => prev.filter(u => u.id !== img.id));
                                                    } else {
                                                        alert("Erro ao excluir imagem.");
                                                    }
                                                }
                                            }}
                                            className="absolute top-2 left-2 bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg z-10 hover:bg-red-700"
                                            title="Excluir imagem"
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
