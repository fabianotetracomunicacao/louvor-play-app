import React, { useState } from 'react';
import { Trash2, Check, X } from 'lucide-react';
import { VisualSegment } from './VisualSegment';

/**
 * VisualLine: Renderiza uma linha da música composta por segmentos.
 */
export function VisualLine({ line, index, onUpdateLine, onDelete, fontSize }) {
    const [isConfirming, setIsConfirming] = useState(false);
    
    const handleSegmentUpdate = (segIndex, updatedSeg) => {
        const newSegments = [...line.segments];
        newSegments[segIndex] = updatedSeg;
        onUpdateLine({ ...line, segments: newSegments });
    };

    const handleMergeSegments = (segIndex) => {
        if (segIndex <= 0) return;
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
            newSegments.splice(insertAt, 0, { chord: '?', text: '' });
        }
        onUpdateLine({ ...line, segments: newSegments });
    };


    // Renderizar Comentário/Etiqueta única
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

    const isInstrumental = line.segments.every(seg => !seg.text || seg.text.trim() === '');

    return (
        <div className="flex group relative">
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
            <div className={`flex-1 flex flex-wrap items-end w-full ${isInstrumental ? 'min-h-0' : 'min-h-[3.5em]'} py-1 border-b border-slate-100/30 dark:border-slate-800/20 hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-all ml-2 rounded-lg gap-0`}>
                {line.segments.map((seg, i) => (
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
                    />
                ))}
            </div>
        </div>
    );
}
