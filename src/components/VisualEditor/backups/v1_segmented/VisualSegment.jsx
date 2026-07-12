import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';


/**
 * VisualSegment: Representa um par { acorde, texto } editável.
 */
export function VisualSegment({ chord, text, onUpdate, onSplit, onMerge, onShift, onAdd, isLast, fontSize }) {
    const [isEditingChord, setIsEditingChord] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const textInputRef = useRef(null);
    const chordInputRef = useRef(null);
    const mirrorRef = useRef(null);
    const chordMirrorRef = useRef(null);

    const [pixelWidth, setPixelWidth] = useState(0);
    const [chordPixelWidth, setChordPixelWidth] = useState(0);

    // Focar o input quando entrar em modo de edição
    useEffect(() => {
        if (isEditingChord && chordInputRef.current) {
            chordInputRef.current.focus();
            chordInputRef.current.select(); // Seleciona o texto para facilitar a troca
        }
    }, [isEditingChord]);

    // Medição em tempo real da largura do texto e da cifra para alinhamento perfeito
    useLayoutEffect(() => {
        if (mirrorRef.current) setPixelWidth(mirrorRef.current.offsetWidth);
        if (chordMirrorRef.current) setChordPixelWidth(chordMirrorRef.current.offsetWidth);
    }, [text, chord, fontSize]);






    const handleTextChange = (e) => {
        const newText = e.target.value;
        onUpdate({ chord, text: newText });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace' && text === '' && !isLast) {
            e.preventDefault();
            onMerge();
        }
        // Atalho para adicionar cifra no meio do texto
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            setIsEditingChord(true);
        }
    };

    const handleChordChange = (e) => {
        const newChord = e.target.value.replace(/\s/g, '');
        onUpdate({ chord: newChord, text });
    };


    const handleChordBlur = () => {
        setIsEditingChord(false);
        if (chord === '') onUpdate({ chord: null, text });
    };

    const handleChordKeyDown = (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onShift(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            onShift(1);
        }
    };

    // Determina se o balão deve estar visível
    const isActuallyFocused = isEditingChord;





    // Determina se é um trecho instrumental (sem letras significativas)
    const isInstrumental = !text || text.trim() === '';

    return (
        <div className={`inline-flex flex-col items-start min-w-[4px] relative ${isInstrumental ? 'pr-1' : 'pr-0'}`}>






            {/* Mirror Span (Hidden) para medição de pixels */}
            <span 
                ref={mirrorRef}
                className="absolute invisible whitespace-pre font-sans pointer-events-none"
                style={{ fontSize: `${fontSize}pt` }}
            >
                {text || (chord ? '' : 'Letra...')}
            </span>
            <span 
                ref={chordMirrorRef}
                className="absolute invisible whitespace-pre font-sans font-bold pointer-events-none"
                style={{ fontSize: `${fontSize * 0.95}pt` }}
            >
                {chord || '?'}
            </span>


            {/* Espaço da Cifra (Acima) */}
            <div 
                className="h-6 flex items-end w-full relative group"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                {(chord !== null || isEditingChord) ? (
                    <div className="relative inline-flex flex-col items-center">
                        {/* Nudge Controls & Delete - Prioridade Total para o Foco (isEditingChord) */}
                        {(isEditingChord || showControls) && (
                            <div 
                                className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-full p-1 z-50 animate-in fade-in zoom-in duration-200 whitespace-nowrap"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <button 
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => onShift(-1)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition"
                                    title="Mover para esquerda"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                
                                <button 
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        setIsEditingChord(false); // Garante que saia do modo de edição
                                        if (isInstrumental) {
                                            onMerge(); // Deleta o segmento se não tem letra
                                        } else {
                                            onUpdate({ chord: null, text }); // Apenas remove a cifra se tem letra
                                        }
                                    }}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full text-red-400 hover:text-red-500 transition"
                                    title="Excluir este acorde"
                                >
                                    <Trash2 size={12} />
                                </button>

                                <button 
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => onShift(1)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition"
                                    title="Mover para direita"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}



                        <input
                            ref={chordInputRef}
                            type="text"
                            value={chord || ''}
                            onChange={handleChordChange}
                            onFocus={() => setIsEditingChord(true)}
                            onBlur={handleChordBlur}
                            onKeyDown={handleChordKeyDown}

                            autoFocus={isEditingChord}
                            className={`bg-transparent text-indigo-700 dark:text-indigo-400 font-bold px-0 py-0.5 outline-none transition-all focus:text-indigo-900 dark:focus:text-indigo-200 text-center placeholder:opacity-20 ${isActuallyFocused ? 'border-b border-dashed border-indigo-300 dark:border-indigo-700' : ''}`}
                            style={{ 
                                width: `${Math.max(chordPixelWidth, 12)}px`,
                                fontSize: `${fontSize * 0.95}pt` 
                            }}
                            placeholder="?"
                        />

                        {/* Botões de Inserção Rápida (Hover) */}
                        {showControls && !isEditingChord && (
                            <>
                                <button 
                                    onClick={() => onAdd('before')}
                                    className="absolute -left-4 top-1/2 -translate-y-1/2 p-0.5 bg-indigo-500 text-white rounded-full hover:scale-110 transition-all z-20 shadow-md"
                                    title="Adicionar acorde antes"
                                >
                                    <Plus size={10} />
                                </button>
                                <button 
                                    onClick={() => onAdd('after')}
                                    className="absolute -right-4 top-1/2 -translate-y-1/2 p-0.5 bg-indigo-500 text-white rounded-full hover:scale-110 transition-all z-20 shadow-md"
                                    title="Adicionar acorde depois"
                                >
                                    <Plus size={10} />
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div 
                        className="w-full h-full cursor-text opacity-0 group-hover:opacity-100 flex items-center justify-start transition-all duration-300 text-slate-400 hover:text-indigo-500"
                        onClick={() => setIsEditingChord(true)}
                    >
                        <Plus size={12} className="ml-1" />
                    </div>
                )}
            </div>


            {/* Texto da Letra (Abaixo) */}
            <input
                ref={textInputRef}
                type="text"
                value={text || ''}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={chord ? "" : "Letra..."}
                className="bg-transparent border-none outline-none p-0 m-0 leading-none h-6 whitespace-pre font-sans selection:bg-indigo-200 dark:selection:bg-indigo-800 placeholder:opacity-20 focus:placeholder:opacity-0"
                style={{ 
                    width: `${text ? pixelWidth : (chord ? Math.max(pixelWidth, 10) : 60)}px`,
                    fontSize: `${fontSize}pt`
                }}
            />

        </div>
    );
}
