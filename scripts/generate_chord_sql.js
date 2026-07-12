import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import guitarDb from '@tombatossals/chords-db/lib/guitar.json' with { type: "json" }; // Node 22+ JSON import or fallback

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFile = path.join(__dirname, '../populate_chords.sql');

let sql = `-- Script to populate chords table
-- Generated automatically

BEGIN;

-- Optional: Clear existing chords if you want a fresh start
-- DELETE FROM chords;

`;

let count = 0;

// Iterate over keys (C, C#, D...)
Object.keys(guitarDb.chords).forEach(key => {
    const chords = guitarDb.chords[key];

    // Normalize key if necessary (e.g. Csharp -> C# in DB? Or stick to library keys?)
    // Let's stick to library keys for consistency with lookup map.
    // The library uses "Csharp", "Eb", "Fsharp", "Ab", "Bb".

    chords.forEach(chord => {
        const suffix = chord.suffix;
        const positions = JSON.stringify(chord.positions);

        // Escape single quotes in suffix (though rare in suffixes)
        const safeSuffix = suffix.replace(/'/g, "''");

        sql += `INSERT INTO chords (key, suffix, positions) VALUES ('${key}', '${safeSuffix}', '${positions}'::jsonb) ON CONFLICT (key, suffix) DO UPDATE SET positions = EXCLUDED.positions;\n`;
        count++;
    });
});

sql += `
COMMIT;
`;

fs.writeFileSync(outputFile, sql);

console.log(`Generated SQL for ${count} chords at ${outputFile}`);
