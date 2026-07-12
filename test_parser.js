import { extractSlides } from './src/utils/lyricsParser.js';

const mock = `
[Intro]
C G Am F

[Verso 1]
[C]Grande [G]é o [Am]Senhor
[F]Digno de lou[C]vor
[G]Rei [F]meu
[C]Meu [G]Deus

[Refrão]
[C]Ale[G]luia
[Am]Ale[F]luia
`;

console.log(JSON.stringify(extractSlides(mock), null, 2));
