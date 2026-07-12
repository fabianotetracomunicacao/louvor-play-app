function cleanChordLine(line) {
    // Rejoin separated modifiers (e.g. "F7 M" -> "F7M", "C# m" -> "C#m", "D 7" -> "D7", "G / B" -> "G/B")
    // It looks for a valid chord base, followed by space, followed by a valid modifier
    
    let cleaned = line;
    // Base chord optionally with number: A, C#, F7, Dm7
    // We want to match: (Chord) (Modifier)
    
    // Fix "F7 M" -> "F7M"
    // Match root + optional accidentals + optional numbers, then space, then modifier
    cleaned = cleaned.replace(/([A-G][#b]?\d*)\s+(m|M|maj|min|dim|aug|sus|add)\b/g, '$1$2');
    
    // Fix "D 7" -> "D7"
    cleaned = cleaned.replace(/([A-G][#b]?(?:m|M|maj|min|dim|aug|sus|add)?)\s+(\d{1,2})\b/g, '$1$2');
    
    // Fix "G / B" -> "G/B"
    cleaned = cleaned.replace(/([A-G][#b]?(?:m|M|maj|min|dim|aug|sus|add)?\d*)\s*\/\s*([A-G][#b]?|\d+)\b/g, '$1/$2');

    return cleaned;
}

const lines = [
    "F7 M",
    "C# m7",
    "G / B",
    "D 7",
    "A m",
    "F7 M  G / B",
    "F7M / C",
    "A 4",
    "G 7 M",
    "G 7M",
    "C# m 7(b5)"
];

lines.forEach(l => console.log(`"${l}" -> "${cleanChordLine(l)}"`));
