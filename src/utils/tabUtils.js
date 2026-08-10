/**
 * Tablature and Tab Block detection utilities.
 */

/**
 * Checks if a line is a Tab Section Header or Part Label.
 * Matches: {c: TAB - INTRO}, TAB - SOLO, Parte 1 de 2, Parte 1, Riff 1, [Parte 1], etc.
 */
export function isTabHeaderOrLabel(line) {
    if (!line) return false;
    const trimmed = line.trim();
    if (!trimmed) return false;

    // 1. Check if section label or comment contains TAB (e.g. {c: TAB - INTRO}, {tag: TAB - SOLO}, [TAB - PRIMEIRA PARTE], TAB - INTRO)
    const isTabSection = /(?:\{tag:\s*|\{(?:c|comment):\s*|\[?\s*)TAB(?:\s*[-:]|\s+|$)/i.test(trimmed);
    if (isTabSection) return true;

    // 2. Check if part header pattern (e.g. Parte 1 de 2, Parte 1, Parte 2 de 4, Riff 1, [Parte 1])
    const isPartHeader = /^(?:\[?\s*Parte\s*\d+(?:\s+de\s+\d+)?\s*\]?|\[?\s*Riff\s*\d+\s*\]?|\[?\s*Parte\s+[A-Z]\s*\]?)$/i.test(trimmed);
    if (isPartHeader) return true;

    return false;
}

/**
 * Checks if a line consists purely of chords or parenthesized chord instructions.
 */
export function isPureChordLine(line) {
    if (!line) return false;
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Remove brackets e.g. [F9] -> F9
    const clean = trimmed.replace(/\[/g, ' ').replace(/\]/g, ' ');
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return false;

    const chordRegex = /^([A-G][#b]?)(m|M|maj|min|dim|aug|sus|add|\+|°|ø|2|4|5|6|7|9|11|13|\(|\))*(\/([A-G][#b]?|[0-9]+))?$/;
    return parts.every(p => chordRegex.test(p) || /^\(.*\)$/.test(p));
}

/**
 * Checks if a line is a guitar tab line (e.g. E|---0---) or explicit {sot} / {eot} marker.
 */
export function isTabLine(line) {
    if (!line) return false;
    const trimmed = line.trim();
    if (!trimmed) return false;

    if (trimmed === '{sot}' || trimmed === '{start_of_tab}' || trimmed === '{eot}' || trimmed === '{end_of_tab}') {
        return true;
    }

    return /^[A-Ga-g]\|/.test(trimmed) && (trimmed.match(/-/g) || []).length > 2;
}

/**
 * Multi-pass analyzer that computes a boolean array `isTabFlags` for all lines in `lines`.
 * Returns an array of booleans of length equal to `lines.length`.
 */
export function analyzeTabLines(lines) {
    if (!lines || lines.length === 0) return [];

    const isTabFlags = new Array(lines.length).fill(false);
    let inSotBlock = false;

    // Pass 1: Mark explicit/implicit tab lines and {sot}...{eot} blocks
    lines.forEach((line, i) => {
        const trimmed = line.trim();

        if (trimmed === '{sot}' || trimmed === '{start_of_tab}') {
            inSotBlock = true;
            isTabFlags[i] = true;
            return;
        }
        if (trimmed === '{eot}' || trimmed === '{end_of_tab}') {
            isTabFlags[i] = true;
            inSotBlock = false;
            return;
        }

        if (inSotBlock) {
            isTabFlags[i] = true;
            return;
        }

        if (isTabLine(line)) {
            isTabFlags[i] = true;
        }
    });

    // Pass 2: Mark tab headers, part labels, and tab chords associated with tab blocks
    lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Case A: Tab section header or part label (e.g. TAB - INTRO, Parte 1 de 2)
        if (isTabHeaderOrLabel(line)) {
            // Check if there is a tab line (isTabFlags[j] === true) within 12 lines after i
            let hasNearbyTab = false;
            for (let j = i + 1; j < Math.min(lines.length, i + 13); j++) {
                if (isTabFlags[j] || isTabLine(lines[j])) {
                    hasNearbyTab = true;
                    break;
                }
                // Stop scanning if we hit a non-tab section header
                if (lines[j].trim().startsWith('{c:') && !isTabHeaderOrLabel(lines[j])) break;
            }

            if (hasNearbyTab) {
                isTabFlags[i] = true;
            }
        }

        // Case B: Chord line directly attached to a tab part or preceding a tab line
        if (isPureChordLine(line)) {
            // Look around +/- 2 lines for tab lines or tab part headers
            let isTabChord = false;
            for (let offset = -2; offset <= 2; offset++) {
                const targetIdx = i + offset;
                if (targetIdx >= 0 && targetIdx < lines.length && targetIdx !== i) {
                    if (isTabFlags[targetIdx] || isTabLine(lines[targetIdx]) || isTabHeaderOrLabel(lines[targetIdx])) {
                        isTabChord = true;
                        break;
                    }
                }
            }

            if (isTabChord) {
                isTabFlags[i] = true;
            }
        }
    });

    // Pass 3: Re-verify headers/labels preceding newly flagged tab chord lines
    for (let i = lines.length - 1; i >= 0; i--) {
        if (isTabHeaderOrLabel(lines[i]) && !isTabFlags[i]) {
            if (i < lines.length - 1 && isTabFlags[i + 1]) {
                isTabFlags[i] = true;
            }
        }
    }

    return isTabFlags;
}

/**
 * Groups contiguous segments into word wrappers without modifying segment text.
 * If seg[i].text does NOT end with whitespace, seg[i] and seg[i+1] belong to the same word wrapper.
 * This prevents flexbox from breaking mid-word when a chord is placed inside a word,
 * while preserving 100% exact text character widths and chord alignments.
 */
export function groupContiguousSegments(segments) {
    if (!segments || segments.length === 0) return [];

    const wordGroups = [];
    let currentGroup = [];

    segments.forEach((seg) => {
        currentGroup.push(seg);
        const text = seg.text || '';
        if (!text || /\s$/.test(text)) {
            wordGroups.push(currentGroup);
            currentGroup = [];
        }
    });

    if (currentGroup.length > 0) {
        wordGroups.push(currentGroup);
    }

    return wordGroups;
}
