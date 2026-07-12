import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';


/**
 * VisualSegment: Representa um par { acorde, texto } editável.
 */
export function VisualSegment({ 
    chord, text, onUpdate, onSplit, onMerge, onShift, onAdd, 
    isLast, fontSize, onCursorClick, isActive,
    hasCursor, localCursorIndex, onExitChord
}) {
    const [isEditingChord, setIsEditingChord] = useState(false);
    const textInputRef = useRef(null);
    const chordInputRef = useRef(null);
    const mirrorRef = useRef(null);
    const chordMirrorRef = useRef(null);
    const charMeasureRef = useRef(null);

    const [pixelWidth, setPixelWidth] = useState(0);
    const [chordPixelWidth, setChordPixelWidth] = useState(0);
    const [cursorPixelX, setCursorPixelX] = useState(0);

    // Calculate local pixel position for the cursor
    useLayoutEffect(() => {
        if (hasCursor && charMeasureRef.current) {
            charMeasureRef.current.textContent = (text || '').slice(0, localCursorIndex);
            const textWidthAtCursor = charMeasureRef.current.offsetWidth;
            
            let x = textWidthAtCursor;
            
            // O cursor SEMPRE deve ficar à frente da cifra se ela estiver presente, 
            // respeitando o espaço visual que ela ocupa.
            if (chordPixelWidth > 0 && x < chordPixelWidth) {
                x = chordPixelWidth;
            }
            
            setCursorPixelX(x);
        }
    }, [hasCursor, localCursorIndex, text, fontSize, chordPixelWidth]);

    // Focar o input quando entrar em modo de edição
    useEffect(() => {
        if (isEditingChord && chordInputRef.current) {
            chordInputRef.current.focus();
            chordInputRef.current.select(); // Seleciona o texto para facilitar a troca
        }
    }, [isEditingChord]);

    // Resposta ao foco programático do VisualLine
    useEffect(() => {
        if (isActive) {
            setIsEditingChord(true);
        }
    }, [isActive]);

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
        if (e.key === 'Backspace' && e.target.selectionStart === 0) {
            e.preventDefault();
            onMerge();
        }
        // Atalho para adicionar cifra no meio do texto
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            setIsEditingChord(true);
        } else if (e.key === 'Enter') {
            // Quebra de linha (Modo Word)
            e.preventDefault();
            if (onSplit) onSplit(e.target.selectionStart);
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
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
            e.stopPropagation(); // Evita que o evento suba (bubble) para a VisualLine
            setIsEditingChord(false);
            if (e.key === ' ') {
                e.preventDefault();
                if (onExitChord) onExitChord(true);
            }
        }
    };

    const handleSegmentClick = (e) => {
        if (!onCursorClick) return;
        
        // Se clicar no input de edição de cifra, não mexe no cursor
        if (e.target === chordInputRef.current) return;
        
        // Calcular em qual caractere clicou com base no offsetX do segmento inteiro
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        // Medição iterativa para precisão de pixel
        let charIndex = 0;
        if (charMeasureRef.current) {
            let bestDist = Infinity;
            let bestIndex = 0;
            
            for (let i = 0; i <= text.length; i++) {
                charMeasureRef.current.textContent = text.slice(0, i);
                const width = charMeasureRef.current.offsetWidth;
                const dist = Math.abs(width - clickX);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIndex = i;
                }
            }
            charIndex = bestIndex;
        }
        
        onCursorClick(charIndex);
    };

    // Determina se é um trecho instrumental (sem letras significativas)
    const isInstrumental = !text || text.trim() === '';
    // Segmento espaçador: sem acorde e sem texto (criado pelo Space no modo Word)
    const isSpacer = chord === null && (!text || text === '');
    // minWidth: acorde > espaçador > fallback mínimo
    const computedMinWidth = chordPixelWidth > 0 ? `${chordPixelWidth}px` : (isSpacer ? '12px' : undefined);

    return (
        <div 
            className={`inline-flex flex-col items-start min-w-[4px] relative ${isInstrumental ? 'pr-1' : 'pr-0'}`}
            onClick={handleSegmentClick}
            style={{ minWidth: computedMinWidth }}
        >
            {/* Cursor "Ghost" Local - Elevado e acompanhando a largura maior */}
            {hasCursor && (
                <div 
                    className="absolute bg-indigo-600 w-[2.5px] z-50 pointer-events-none animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.4)] rounded-full"
                    style={{ 
                        left: `${cursorPixelX}px`, 
                        top: '12px',
                        height: '32px'
                    }}
                ></div>
            )}






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


            {/* Mirror para cálculo de precisão do clique */}
            <span 
                ref={charMeasureRef}
                className="absolute invisible whitespace-pre font-sans pointer-events-none"
                style={{ fontSize: `${fontSize}pt` }}
            ></span>

            {/* Espaço da Cifra (Acima) */}
            <div className="h-6 flex items-end w-full relative">
                {(chord !== null || isEditingChord) && (
                    <input
                        ref={chordInputRef}
                        type="text"
                        value={chord || ''}
                        onChange={handleChordChange}
                        onFocus={() => {
                            setIsEditingChord(true);
                            if (onCursorClick) onCursorClick(0);
                        }}
                        onBlur={handleChordBlur}
                        onKeyDown={handleChordKeyDown}
                        autoFocus={isEditingChord}
                        className={`bg-transparent text-indigo-700 dark:text-indigo-400 font-bold px-0 py-0.5 outline-none transition-all focus:text-indigo-900 dark:focus:text-indigo-200 text-center placeholder:opacity-20 ${isEditingChord ? 'border-b border-dashed border-indigo-300 dark:border-indigo-700' : ''}`}
                        style={{ 
                            width: `${Math.max(chordPixelWidth, 12)}px`,
                            fontSize: `${fontSize * 0.95}pt` 
                        }}
                        placeholder="?"
                    />
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
                className={`lyric-input bg-transparent border-none outline-none p-0 m-0 leading-none h-6 whitespace-pre font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 placeholder:opacity-20 focus:placeholder:opacity-0 cursor-text`}
                style={{ 
                    width: `${text ? pixelWidth : (chord ? Math.max(pixelWidth, 10) : 60)}px`,
                    fontSize: `${fontSize}pt`
                }}
            />

        </div>
    );
}
