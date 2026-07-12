
const guitarDb = require('@tombatossals/chords-db/lib/guitar.json');

function inspect(key, suffix) {
    console.log(`\n--- Inspecting ${key} ${suffix} ---`);
    const chordData = guitarDb.chords[key];
    if (!chordData) {
        console.log(`Key ${key} not found.`);
        return;
    }
    const entry = chordData.find(c => c.suffix === suffix);
    if (!entry) {
        console.log(`Suffix ${suffix} not found for key ${key}.`);
        return;
    }

    entry.positions.forEach((pos, i) => {
        console.log(`Position ${i}: frets=[${pos.frets}], fingers=[${pos.fingers}], baseFret=${pos.baseFret}, barres=[${pos.barres}]`);
    });
}

inspect('E', '/G#');
inspect('A', '9');
