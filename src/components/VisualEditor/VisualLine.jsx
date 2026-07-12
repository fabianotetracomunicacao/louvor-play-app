import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { VisualSegment } from './VisualSegment';

/**
 * VisualLine: Renderiza uma linha da música composta por segmentos.
 */
export function VisualLine({ line, index, onUpdateLine, onSplit, onMergeWithPrevious, onDelete, fontSize, focusHint }) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [cursorIndex, setCursorIndex] = useState(-1); // -1 = sem foco global
    const [isLineFocused, setIsLineFocused] = useState(false);
    const [activeSegIndex, setActiveSegIndex] = useState(-1);
    const containerRef = useRef(null);
    const totalChars = (line.segments || []).reduce((acc, seg) => acc + (seg.text?.length || 0), 0);

    // Reagir a dicas de foco do pai (Split/Merge)
    useEffect(() => {
        if (focusHint && focusHint.lineIndex === index) {
            setCursorIndex(focusHint.charIndex);
            setIsLineFocused(true);
            
            // Focar o input de letra na posição correta
            setTimeout(() => {
                const inputs = containerRef.current?.querySelectorAll('.lyric-input');
                if (inputs && inputs.length > 0) {
                    let currentOffset = 0;
                    for (let i = 0; i < (line.segments?.length || 0); i++) {
                        const segLen = line.segments[i].text?.length || 0;
                        if (focusHint.charIndex >= currentOffset && focusHint.charIndex <= currentOffset + segLen) {
                            const input = inputs[i];
                            if (input) {
                                input.focus();
                                const internalPos = focusHint.charIndex - currentOffset;
                                input.setSelectionRange(internalPos, internalPos);
                            }
                            break;
                        }
                        currentOffset += segLen;
                    }
                } else if (containerRef.current) {
                    containerRef.current.focus();
                }
            }, 0);
        }
    }, [focusHint, index, line.segments]);

    const handleSegmentUpdate = (segIndex, updatedSeg) => {
        const newSegments = [...line.segments];
        newSegments[segIndex] = updatedSeg;
        onUpdateLine({ ...line, segments: newSegments });
    };

    const handleMergeSegments = (segIndex) => {
        if (segIndex === 0) {
            if (onMergeWithPrevious) onMergeWithPrevious(line.segments);
            return;
        }
        const newSegments = [...line.segments];
        const prevSeg = newSegments[segIndex - 1];
        const currSeg = newSegments[segIndex];

        // Mescla texto do atual no anterior
        newSegments[segIndex - 1] = {
            ...prevSeg,
            text: prevSeg.text + currSeg.text
        };
        
        // Remove o atual
        newSegments.splice(segIndex, 1);
        onUpdateLine({ ...line, segments: newSegments });
    };

    const handleShiftCharacter = (segIndex, direction) => {
        const newSegments = [...line.segments];
        
        if (direction > 0) {
            // MOVER PARA DIREITA (Ganha uma letra do anterior ou doa para o anterior?)
            // O usuário quer "movimento o acordo para o lado". 
            // Para mover o ACORDE para a direita, o texto ANTES dele deve aumentar.
            if (segIndex > 0) {
                const prevSeg = { ...newSegments[segIndex - 1] };
                const currSeg = { ...newSegments[segIndex] };
                
                if (currSeg.text.length > 0) {
                    prevSeg.text += currSeg.text[0];
                    currSeg.text = currSeg.text.slice(1);
                    newSegments[segIndex - 1] = prevSeg;
                    newSegments[segIndex] = currSeg;
                } else {
                    // Se não tem mais texto para "roubar", adiciona um espaço no anterior
                    prevSeg.text += ' ';
                    newSegments[segIndex - 1] = prevSeg;
                }
            } else {
                // Primeiro segmento: adiciona espaço no início
                const currSeg = { ...newSegments[segIndex] };
                currSeg.text = ' ' + currSeg.text;
                newSegments[segIndex] = currSeg;
            }
        } else {
            // MOVER PARA ESQUERDA
            if (segIndex > 0) {
                const prevSeg = { ...newSegments[segIndex - 1] };
                const currSeg = { ...newSegments[segIndex] };
                
                if (prevSeg.text.length > 0) {
                    currSeg.text = prevSeg.text.slice(-1) + currSeg.text;
                    prevSeg.text = prevSeg.text.slice(0, -1);
                    newSegments[segIndex - 1] = prevSeg;
                    newSegments[segIndex] = currSeg;
                }
            } else {
                // Primeiro segmento: remove espaço se existir
                const currSeg = { ...newSegments[segIndex] };
                if (currSeg.text.startsWith(' ')) {
                    currSeg.text = currSeg.text.slice(1);
                    newSegments[segIndex] = currSeg;
                }
            }
        }
        
        onUpdateLine({ ...line, segments: newSegments });
    };

    const handleAddSegment = (segIndex, position) => {
        const newSegments = [...line.segments];
        const currentSeg = newSegments[segIndex];
        
        if (position === 'after' && currentSeg.text && currentSeg.text.length > 0) {
            // Mover o texto para o novo segmento mas deixar UM espaço de respiro
            const newSeg = { chord: '?', text: currentSeg.text };
            newSegments[segIndex] = { ...currentSeg, text: ' ' };
            newSegments.splice(segIndex + 1, 0, newSeg);
        } else {
            const insertAt = position === 'before' ? segIndex : segIndex + 1;
            const newSeg = { chord: '?', text: position === 'before' ? ' ' : '' };
            newSegments.splice(insertAt, 0, newSeg);
        }
        onUpdateLine({ ...line, segments: newSegments });
    };

    const [isEditingField, setIsEditingField] = useState(false);

    // --- NOVA LÓGICA MODO WORD ---
    const handleGlobalKeyDown = (e) => {
        // Ignorar se o usuário estiver digitando em um input de cifra ou comentário
        if (e.target.tagName === 'INPUT' && e.target.type === 'text') return;

        const keysToBlock = [' ', 'ArrowLeft', 'ArrowRight', 'Backspace'];
        if (keysToBlock.includes(e.key)) {
            e.preventDefault();
        }

        if (e.key === 'ArrowRight') {
            setCursorIndex(prev => Math.min(prev + 1, totalChars + (line.segments?.length > 1 ? 1 : 0)));
        } else if (e.key === 'ArrowLeft') {
            setCursorIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === ' ') {
            pushBlocksForward();
        } else if (e.key === 'Backspace') {
            pullBlocksBack();
        } else if (/^[a-zA-Z0123456789#]$/.test(e.key)) {
            // Inicia edição de acorde ou cria um novo se a posição estiver vaga
            startChordEditAtCursor(e.key);
        }
    };

    const handleExitChord = (withSpace) => {
        setIsLineFocused(true);
        setIsEditingField(false);
        if (containerRef.current) {
            containerRef.current.focus();
        }
        if (withSpace) {
            setCursorIndex(prev => prev + 1);
        }
    };

    const handleSplitLine = (segIndex, charIndex) => {
        if (!onSplit || !line.segments) return;
        
        const headSegments = line.segments.slice(0, segIndex);
        const tailSegments = line.segments.slice(segIndex + 1);
        
        const segToSplit = line.segments[segIndex];
        const headText = segToSplit.text.slice(0, charIndex);
        const tailText = segToSplit.text.slice(charIndex);
        
        if (charIndex === 0) {
            // Se der enter no início do segmento, o acorde vai junto para a nova linha
            tailSegments.unshift({ ...segToSplit, text: tailText });
        } else {
            // Se der enter no meio/fim, o acorde fica na linha atual e o texto seguinte vai para a nova
            headSegments.push({ ...segToSplit, text: headText });
            tailSegments.unshift({ chord: null, text: tailText });
        }
        
        onSplit(headSegments, tailSegments);
    };



    // Desliza os acordes A PARTIR DO CURSOR uma posição para frente sobre o texto fixo.
    // Apenas acordes cujo índice de início é >= cursorIndex serão movidos.
    const pushBlocksForward = () => {
        if (!line.segments || line.segments.length === 0) return;
        const newSegments = line.segments.map(s => ({ ...s }));
        let count = 0;
        let shifted = false;

        // Precisamos iterar e decidir para cada segmento se ele deve mover
        for (let i = 0; i < newSegments.length; i++) {
            const seg = newSegments[i];
            const segStart = count;
            const segLen = seg.text?.length || 0;

            // Só move se o acorde começar na ou após a posição do cursor
            if (seg.chord !== null && segStart >= cursorIndex) {
                if (seg.text && seg.text.length > 0) {
                    const firstChar = seg.text[0];
                    newSegments[i].text = seg.text.slice(1);

                    if (i > 0) {
                        newSegments[i - 1].text = (newSegments[i - 1].text || '') + firstChar;
                    } else {
                        newSegments.unshift({ chord: null, text: firstChar });
                        i++; // Compensa o unshift
                    }
                    shifted = true;
                }
            }
            count += segLen;
        }

        if (shifted) {
            onUpdateLine({ ...line, segments: newSegments });
            setCursorIndex(prev => prev + 1);
        }
    };

    // Desliza os acordes A PARTIR DO CURSOR uma posição para TRÁS sobre o texto fixo.
    // Apenas acordes cujo índice de início é >= cursorIndex serão movidos.
    const pullBlocksBack = () => {
        if (!line.segments || line.segments.length === 0) return;
        const newSegments = line.segments.map(s => ({ ...s }));
        let count = 0;
        let shifted = false;

        for (let i = 0; i < newSegments.length; i++) {
            const seg = newSegments[i];
            const segStart = count;
            const segLen = seg.text?.length || 0;

            // Só puxa se o acorde começar na ou após a posição do cursor
            if (seg.chord !== null && segStart >= cursorIndex && i > 0) {
                const prevSeg = newSegments[i - 1];
                if (prevSeg.text && prevSeg.text.length > 0) {
                    const lastChar = prevSeg.text[prevSeg.text.length - 1];
                    newSegments[i - 1].text = prevSeg.text.slice(0, -1);
                    newSegments[i].text = lastChar + (seg.text || '');
                    shifted = true;
                }
            }
            count += segLen;
        }

        if (shifted) {
            // Limpeza de segmentos vazios no início
            if (newSegments[0] && newSegments[0].chord === null && (!newSegments[0].text || newSegments[0].text === '')) {
                newSegments.shift();
            }
            onUpdateLine({ ...line, segments: newSegments });
            setCursorIndex(prev => Math.max(0, prev - 1));
        }
    };

    const insertCharAtCursor = (char) => {
        if (!line.segments) return;
        let count = 0;
        const newSegments = [...line.segments];
        
        for (let i = 0; i < newSegments.length; i++) {
            const seg = newSegments[i];
            const segLength = seg.text?.length || 0;
            
            if (count + segLength >= cursorIndex || i === newSegments.length - 1) {
                const innerIndex = Math.max(0, cursorIndex - count);
                const head = (seg.text || '').slice(0, innerIndex);
                const tail = (seg.text || '').slice(innerIndex);
                
                // Inserção direta e simples para manter a cifra ancorada no caractere atual
                newSegments[i] = { ...seg, text: head + char + tail };
                
                onUpdateLine({ ...line, segments: newSegments });
                setCursorIndex(prev => prev + 1);
                break;
            }
            count += segLength;
        }
    };

    const removeCharAtCursor = () => {
        if (cursorIndex <= 0 || !line.segments) return;
        let count = 0;
        const newSegments = [...line.segments];
        
        for (let i = 0; i < newSegments.length; i++) {
            const seg = newSegments[i];
            const segLength = seg.text?.length || 0;
            
            if (count + segLength >= cursorIndex) {
                const innerIndex = cursorIndex - count;
                
                if (innerIndex > 0) {
                    // Remover dentro do segmento
                    const head = seg.text.slice(0, innerIndex - 1);
                    const tail = seg.text.slice(innerIndex);
                    const resultText = head + tail;
                    
                    // Se o texto ficou vazio e não é o único segmento, e não tem acorde importante, podemos considerar remover?
                    // Por enquanto apenas remove o caractere e mantém o segmento "âncora"
                    newSegments[i] = { ...seg, text: resultText };
                } else if (i > 0) {
                    // No início do segmento, apagar o último do anterior
                    const prevSeg = newSegments[i-1];
                    const prevText = prevSeg.text || '';
                    if (prevText.length > 0) {
                        newSegments[i-1] = { ...prevSeg, text: prevText.slice(0, -1) };
                    } else {
                        // Se o anterior já estava vazio, vamos mesclar/remover
                        newSegments.splice(i-1, 1);
                    }
                }
                
                onUpdateLine({ ...line, segments: newSegments });
                setCursorIndex(prev => Math.max(0, prev - 1));
                break;
            }
            count += segLength;
        }
    };

    const startChordEditAtCursor = (firstChar) => {
        if (!line.segments) return;
        let count = 0;
        const newSegments = [...line.segments];
        for (let i = 0; i < newSegments.length; i++) {
            const seg = newSegments[i];
            const innerIndex = cursorIndex - count;
            
            if (innerIndex === 0 && (seg.chord === null || seg.chord === '?')) {
                newSegments[i] = { ...seg, chord: firstChar };
                onUpdateLine({ ...line, segments: newSegments });
                setActiveSegIndex(i);
                break;
            } else if (count + seg.text.length >= cursorIndex) {
                const head = seg.text.slice(0, innerIndex);
                const tail = seg.text.slice(innerIndex);
                newSegments[i] = { ...seg, text: head };
                newSegments.splice(i + 1, 0, { chord: firstChar, text: tail });
                onUpdateLine({ ...line, segments: newSegments });
                setActiveSegIndex(i + 1);
                break;
            }
            count += seg.text.length;
        }
    };
    if (line.type === 'comment') {
        return (
            <div className="flex group">
                {/* Calha de Controle */}
                <div className="w-10 flex flex-col items-center pt-10 opacity-0 group-hover:opacity-100 transition-opacity sticky left-0 z-10">
                   {!isConfirming ? (
                        <button 
                            onClick={() => setIsConfirming(true)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                   ) : (
                        <div className="flex flex-col gap-1 bg-red-50 dark:bg-red-900/20 p-1 rounded-lg border border-red-200 dark:border-red-800 animate-in fade-in zoom-in duration-200">
                             <button onClick={() => onDelete(index)} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"><Check size={12} /></button>
                             <button onClick={() => setIsConfirming(false)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X size={12} /></button>
                        </div>
                   )}
                </div>

                <div className="flex-1 mt-6 mb-2 border-l-4 border-purple-500 dark:border-purple-400 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30 py-2 rounded-r-2xl pr-4 ml-2">
                    <input 
                        type="text"
                        value={line.label}
                        onChange={(e) => onUpdateLine({ ...line, label: e.target.value })}
                        className="font-black tracking-widest uppercase text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none focus:text-purple-600 transition-colors placeholder:opacity-30 pl-4"
                        style={{ fontSize: `${fontSize * 0.7}pt` }}
                        placeholder="NOME DA SEÇÃO"
                    />
                    <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700"></div>
                </div>
            </div>
        );
    }

    // Renderizar Espaçador (Linha Vazia)
    if (line.type === 'spacer') {
        return (
            <div className="flex group min-h-[1.5rem] items-center relative hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors rounded-lg">
                 {/* Calha de Controle */}
                 <div className="w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity sticky left-0 z-10">
                   {!isConfirming ? (
                        <button onClick={() => setIsConfirming(true)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                   ) : (
                        <div className="flex gap-1 bg-red-50 dark:bg-red-900/20 p-1 rounded-lg border border-red-200 dark:border-red-800 animate-in fade-in">
                             <button onClick={() => onDelete(index)} className="p-1 text-red-600"><Check size={12} /></button>
                             <button onClick={() => setIsConfirming(false)} className="p-1 text-slate-400"><X size={12} /></button>
                        </div>
                   )}
                </div>
                
                {/* Indicador de Espaço (Invisível por padrão, visível no hover) */}
                <div className="flex-1 flex items-center gap-4 ml-2 mr-4">
                    <div className="h-[1px] flex-1 border-t border-dashed border-slate-200 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase opacity-0 group-hover:opacity-100 select-none transition-opacity">Espaçamento</span>
                    <div className="h-[1px] flex-1 border-t border-dashed border-slate-200 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            </div>
        );
    }

    // Renderizar Tablatura (Simplificada)
    if (line.type === 'tab') {
        return (
            <div className="flex group">
                 <div className="w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity sticky left-0 z-10">
                   {!isConfirming ? (
                        <button onClick={() => setIsConfirming(true)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                   ) : (
                        <div className="flex gap-1 bg-red-50 dark:bg-red-900/20 p-1 rounded-lg border border-red-200 dark:border-red-800 animate-in fade-in">
                             <button onClick={() => onDelete(index)} className="p-1 text-red-600"><Check size={12} /></button>
                             <button onClick={() => setIsConfirming(false)} className="p-1 text-slate-400"><X size={12} /></button>
                        </div>
                   )}
                </div>
                <div className="flex-1 font-mono whitespace-pre text-slate-600 dark:text-slate-400 py-1 ml-2">
                    <input 
                        type="text"
                        value={line.content}
                        onChange={(e) => onUpdateLine({ ...line, content: e.target.value })}
                        className="bg-transparent border-none outline-none w-full font-mono text-[0.8em]"
                    />
                </div>
            </div>
        );
    }

    const isInstrumental = line.segments?.every(seg => !seg.text || seg.text.trim() === '') ?? false;

    return (
        <div className="flex group relative" data-line-index={index}>
            {/* Calha de Controle Vertical */}
            <div className="w-10 flex flex-col items-center pt-8 opacity-0 group-hover:opacity-100 transition-opacity sticky left-0 z-10">
                {!isConfirming ? (
                    <button 
                        onClick={() => setIsConfirming(true)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        title="Deletar linha"
                    >
                        <Trash2 size={16} />
                    </button>
                ) : (
                    <div className="flex flex-col gap-1 bg-red-50 dark:bg-red-900/20 p-1 rounded-lg border border-red-200 dark:border-red-800 animate-in fade-in zoom-in duration-200 shadow-lg">
                        <button 
                            onClick={() => { onDelete(index); setIsConfirming(false); }}
                            className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                        >
                            <Check size={12} />
                        </button>
                        <button 
                            onClick={() => setIsConfirming(false)}
                            className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Conteúdo da Linha */}
            <div 
                ref={containerRef}
                tabIndex={0}
                onFocus={(e) => { 
                    setIsLineFocused(true); 
                    setIsEditingField(e.target.tagName === 'INPUT');
                    if (cursorIndex < 0) setCursorIndex(totalChars);
                }}
                onBlur={(e) => {
                    // Prevenir perda de foco se clicar dentro dos próprios inputs
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                        setIsLineFocused(false);
                        setIsEditingField(false);
                    }
                }}
                onKeyDown={handleGlobalKeyDown}
                onClick={(e) => {
                    // Se clicar no fundo da linha, vai para o final
                    if (e.target === e.currentTarget) {
                        setCursorIndex(totalChars);
                    }
                }}
                className={`flex-1 flex flex-wrap items-end w-full outline-none focus:bg-slate-50/10 dark:focus:bg-slate-800/10 ${isInstrumental ? 'min-h-0' : 'min-h-[3.5em]'} py-1 border-b border-slate-100/30 dark:border-slate-800/20 hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-all ml-2 rounded-lg gap-0 relative group/chordline cursor-text`}
            >


                {line.segments?.map((seg, i) => {
                    // Calcular offset acumulado para este segmento
                    const offsetBefore = line.segments.slice(0, i).reduce((sum, s) => sum + (s.text?.length || 0), 0);
                    
                    return (
                        <VisualSegment
                            key={i}
                            chord={seg.chord}
                            text={seg.text}
                            fontSize={fontSize}
                            isLast={i === line.segments.length - 1}
                            onUpdate={(updated) => handleSegmentUpdate(i, updated)}
                            onMerge={() => handleMergeSegments(i)}
                            onShift={(direction) => handleShiftCharacter(i, direction)}
                            onAdd={(position) => handleAddSegment(i, position)}
                            onSplit={(charIndex) => handleSplitLine(i, charIndex)}
                            isActive={activeSegIndex === i}
                            onExitChord={(withSpace) => handleExitChord(withSpace)}
                            hasCursor={
                                isLineFocused && 
                                !isEditingField &&
                                cursorIndex >= offsetBefore && 
                                (i === line.segments.length - 1 
                                    ? cursorIndex <= offsetBefore + (seg.text?.length || 0) 
                                    : cursorIndex < offsetBefore + (seg.text?.length || 0)
                                )
                            }
                            localCursorIndex={cursorIndex - offsetBefore}
                            onCursorClick={(localIndex) => {
                                setIsLineFocused(true);
                                setCursorIndex(offsetBefore + localIndex);
                                setActiveSegIndex(-1); // Resetar foco manual se clicar na letra
                            }}
                            onFinishEdit={() => {
                                setActiveSegIndex(-1);
                                // Pequeno timeout para garantir que o input de blur não interfira
                                setTimeout(() => {
                                    const container = document.querySelector(`[data-line-index="${index}"]`);
                                    if (container) container.focus();
                                }, 0);
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
