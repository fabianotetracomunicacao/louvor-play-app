import { parseLyricsToSlides } from './src/utils/lyricParser.js';

const sampleText = `
[Verso 1]
G               D9
Quero trazer a memória
Em11               Cmaj7
Aquilo que me dá esperança

G               D/F#
Como é bom poder pertencer
Em7               C
A um Deus de amor

[Refrão]
G           D
Aleluia, aleluia
Em           C
Tu és Santo, Senhor
`;

console.log(JSON.stringify(parseLyricsToSlides(sampleText), null, 2));
