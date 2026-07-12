import { parseImporter, exportToVisual } from './utils/importer.js';
import { transposeSong, getTransposedNote } from './utils/transposition.js';

const input = `F7M
A minha vida`;

console.log("Input:", input);
const parsed = parseImporter(input);
console.log("parseImporter:", parsed);
const exported = exportToVisual(parsed);
console.log("exportToVisual:\n" + exported);

console.log("Transposed:", transposeSong(parsed, 1));
