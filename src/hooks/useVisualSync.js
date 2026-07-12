import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar a sincronia entre ChordPro (String) e Estrutura do Editor Visual (JSON).
 */
export function useVisualSync(initialContent = '') {
    
    // Converte ChordPro para JSON
    const parseChordProToJSON = (content) => {
        const lines = content.split('\n');
        const jsonLines = [];
        let currentTag = null;

        lines.forEach((line) => {
            const trimmed = line.trim();

            // Detectar Início de Bloco Taggeado
            const tagMatch = trimmed.match(/^\{tag:\s*(.*?)\}$/i);
            if (tagMatch) {
                currentTag = tagMatch[1];
                return;
            }

            // Detectar Fim de Bloco Taggeado
            if (trimmed === '{endtag}') {
                currentTag = null;
                return;
            }

            // Detectar Comentário/Etiqueta única
            const commentMatch = trimmed.match(/^\{(?:c|comment):\s*(.*?)\}$/i);
            if (commentMatch) {
                jsonLines.push({ type: 'comment', label: commentMatch[1], tag: currentTag });
                return;
            }

            // Detectar Linha de Espaço (vazia)
            if (trimmed === '') {
                jsonLines.push({ type: 'spacer', tag: currentTag });
                return;
            }

            // Detectar Tablatura
            if (trimmed.startsWith('{sot}') || trimmed.startsWith('{start_of_tab}') || /^[A-Ga-g]\|/.test(trimmed)) {
                // Simplificação: por enquanto tratamos tabs como texto simples em bloco
                jsonLines.push({ type: 'tab', content: line, tag: currentTag });
                return;
            }

            // Linha Normal de Cifra/Letra
            const parts = line.split(/(\[.*?\])/);
            const segments = [];
            let currentChord = null;

            parts.forEach(part => {
                if (part.startsWith('[') && part.endsWith(']')) {
                    if (currentChord !== null) {
                        segments.push({ chord: currentChord, text: '' });
                    }
                    currentChord = part.slice(1, -1);
                } else {
                    segments.push({ chord: currentChord, text: part || '' });
                    currentChord = null;
                }
            });
            
            if (currentChord !== null) {
                segments.push({ chord: currentChord, text: '' });
            }

            // Se a linha estiver vazia, adicionamos um segmento vazio para manter a linha
            if (segments.length === 0) {
                segments.push({ chord: null, text: '' });
            }

            jsonLines.push({ type: 'line', segments, tag: currentTag });
        });

        return jsonLines;
    };

    // Converte JSON para ChordPro
    const parseJSONToChordPro = (jsonLines) => {
        let output = [];
        let lastTag = null;

        jsonLines.forEach((line) => {
            // Fechar tag anterior se mudou
            if (lastTag && line.tag !== lastTag) {
                output.push('{endtag}');
                lastTag = null;
            }

            // Abrir nova tag
            if (line.tag && line.tag !== lastTag) {
                output.push(`{tag: ${line.tag}}`);
                lastTag = line.tag;
            }

            if (line.type === 'comment') {
                output.push(`{c: ${line.label}}`);
            } else if (line.type === 'spacer') {
                output.push(''); 
            } else if (line.type === 'tab') {
                output.push(line.content);
            } else {
                let lineStr = '';
                line.segments.forEach(seg => {
                    if (seg.chord) {
                        lineStr += `[${seg.chord}]`;
                    }
                    lineStr += seg.text;
                });
                output.push(lineStr);
            }
        });

        if (lastTag) {
            output.push('{endtag}');
        }

        return output.join('\n');
    };

    const [songStructure, setSongStructure] = useState(() => parseChordProToJSON(initialContent));

    const updateFromChordPro = useCallback((content) => {
        setSongStructure(parseChordProToJSON(content));
    }, []);

    const getChordPro = useCallback(() => {
        return parseJSONToChordPro(songStructure);
    }, [songStructure]);

    return {
        songStructure,
        setSongStructure,
        updateFromChordPro,
        getChordPro
    };
}
