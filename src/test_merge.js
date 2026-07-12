function isChord(token) {
    if (!token) return false;
    const chordRegex = /^([A-G][#b]?)(m|M|maj|min|dim|aug|sus|add|\+|°|ø|2|4|5|6|7|9|11|13|\(|\))*(\/([A-G][#b]?|[0-9]+))?$/;
    return chordRegex.test(token);
}

function mergeSeparatedChords(line) {
    let oldLine = "";
    let newLine = line;

    while (oldLine !== newLine) {
        oldLine = newLine;
        const tokens = newLine.split(/(\s+)/);
        let mergedTokens = [];
        
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t.trim().length > 0 && mergedTokens.length >= 2) {
                const prevSpace = mergedTokens[mergedTokens.length - 1];
                const prevText = mergedTokens[mergedTokens.length - 2];
                
                if (prevSpace.trim().length === 0) {
                    const combined = prevText + t;
                    if (isChord(combined) && (!isChord(prevText) || !isChord(t))) {
                        mergedTokens.pop(); 
                        mergedTokens.pop(); 
                        mergedTokens.push(combined); 
                        continue;
                    }
                }
            }
            mergedTokens.push(t);
        }
        newLine = mergedTokens.join('');
    }
    return newLine;
}

function preClean(line) {
    return line.replace(/\s*\/\s*/g, '/');
}

const lines = [
    "F7 M",
    "A m",
    "D 7",
    "G / B",
    "F7 M  C# m7",
    "G 7 M",
    "A  m  7",
    "C  maj  7"
];

lines.forEach(l => {
    let pre = preClean(l);
    let out = mergeSeparatedChords(pre);
    console.log(`"${l}" -> "${out}"`);
});
