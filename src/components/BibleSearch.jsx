import React, { useState, useEffect } from 'react';
import { Search, BookOpen, ChevronRight, Play, X, Loader2 } from 'lucide-react';

import bibleData from '../assets/bible-nvi.json';

const BOOK_NAME_MAP = {
    'gn': 'Gênesis', 'ex': 'Êxodo', 'lv': 'Levítico', 'nm': 'Números', 'dt': 'Deuteronômio',
    'js': 'Josué', 'jz': 'Juízes', 'rt': 'Rute', '1sm': '1 Samuel', '2sm': '2 Samuel',
    '1rs': '1 Reis', '2rs': '2 Reis', '1cr': '1 Crônicas', '2cr': '2 Crônicas', 'ed': 'Esdras',
    'ne': 'Neemias', 'et': 'Ester', 'jó': 'Jó', 'sl': 'Salmos', 'pv': 'Provérbios',
    'ec': 'Eclesiastes', 'ct': 'Cantares', 'is': 'Isaías', 'jr': 'Jeremias', 'lm': 'Lamentações',
    'ez': 'Ezequiel', 'dn': 'Daniel', 'os': 'Oséias', 'jl': 'Joel', 'am': 'Amós',
    'ob': 'Obadias', 'jn': 'Jonas', 'mq': 'Miquéias', 'na': 'Naum', 'hc': 'Habacuque',
    'zf': 'Sofonias', 'ag': 'Ageu', 'zc': 'Zacarias', 'ml': 'Malaquias',
    'mt': 'Mateus', 'mc': 'Marcos', 'lc': 'Lucas', 'jo': 'João', 'at': 'Atos',
    'rm': 'Romanos', '1co': '1 Coríntios', '2co': '2 Coríntios', 'gl': 'Gálatas', 'ef': 'Efésios',
    'fp': 'Filipenses', 'cl': 'Colossenses', '1ts': '1 Tessalonicenses', '2ts': '2 Tessalonicenses',
    '1tm': '1 Timóteo', '2tm': '2 Timóteo', 'tt': 'Tito', 'fl': 'Filemom', 'hb': 'Hebreus',
    'tg': 'Tiago', '1pe': '1 Pedro', '2pe': '2 Pedro', '1jo': '1 João', '2jo': '2 João',
    '3jo': '3 João', 'jd': 'Judas', 'ap': 'Apocalipse'
};

export default function BibleSearch({ onProjectVerse, onClose }) {
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [verses, setVerses] = useState([]);
    const [selectedVerse, setSelectedVerse] = useState(null);
    const [projectedVerseNumber, setProjectedVerseNumber] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load books from local JSON on mount
    useEffect(() => {
        setLoading(true);
        try {
            const booksList = bibleData.map(book => ({
                abbrev: book.abbrev,
                name: BOOK_NAME_MAP[book.abbrev] || book.abbrev.toUpperCase(),
                chapterCount: book.chapters.length,
                data: book.chapters
            })).sort((a, b) => {
                // Keep original order from JSON if possible, or sort alphabetically
                return 0; 
            });
            setBooks(booksList);
        } catch (error) {
            console.error('Error loading local bible data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Filter books by search query
    const filteredBooks = books.filter(book => 
        book.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectBook = (book) => {
        setSelectedBook(book);
        const chaptersList = Array.from({ length: book.chapterCount }, (_, i) => i + 1);
        setChapters(chaptersList);
        setSelectedChapter(null);
        setVerses([]);
        setSelectedVerse(null);
    };

    const handleSelectChapter = (chapter) => {
        setSelectedChapter(chapter);
        const chapterData = selectedBook.data[chapter - 1]; // Chapters are 1-indexed
        if (chapterData) {
            const formattedVerses = chapterData.map((text, index) => ({
                number: index + 1,
                text: text
            }));
            setVerses(formattedVerses);
            return formattedVerses;
        } else {
            setVerses([]);
            return [];
        }
    };

    const handleProject = (verse) => {
        setProjectedVerseNumber(verse.number);
        const payload = {
            type: 'verse',
            reference: `${selectedBook.name} ${selectedChapter}:${verse.number}`,
            text: verse.text,
            lines: splitIntoLines(verse.text)
        };
        onProjectVerse(payload);
    };

    // Keyboard Navigation Logic
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't navigate if user is typing in search
            if (document.activeElement.tagName === 'INPUT') return;
            if (!selectedBook || !selectedChapter) return;

            if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentIndex = verses.findIndex(v => v.number === projectedVerseNumber);
                
                const scrollToVerse = (num) => {
                    setTimeout(() => {
                        const el = document.getElementById(`verse-${num}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                };

                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    if (currentIndex < verses.length - 1) {
                        // Next verse in same chapter
                        handleProject(verses[currentIndex + 1]);
                        scrollToVerse(verses[currentIndex + 1].number);
                    } else if (selectedChapter < selectedBook.chapterCount) {
                        // Next chapter
                        const nextChapter = selectedChapter + 1;
                        const newVerses = handleSelectChapter(nextChapter);
                        if (newVerses.length > 0) {
                            handleProject(newVerses[0]);
                            scrollToVerse(newVerses[0].number);
                        }
                    }
                } else {
                    if (currentIndex > 0) {
                        // Previous verse in same chapter
                        handleProject(verses[currentIndex - 1]);
                        scrollToVerse(verses[currentIndex - 1].number);
                    } else if (selectedChapter > 1) {
                        // Previous chapter
                        const prevChapter = selectedChapter - 1;
                        const newVerses = handleSelectChapter(prevChapter);
                        if (newVerses.length > 0) {
                            const lastVerse = newVerses[newVerses.length - 1];
                            handleProject(lastVerse);
                            scrollToVerse(lastVerse.number);
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedBook, selectedChapter, verses, projectedVerseNumber]);

    // Helper to split long verses into lines for projection
    const splitIntoLines = (text) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + word).length > 35) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });
        if (currentLine.trim()) lines.push(currentLine.trim());
        return lines;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <BookOpen className="text-purple-600" size={20} />
                    <h3 className="font-bold dark:text-white">Bíblia Sagrada</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition">
                    <X size={20} className="text-slate-500" />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Books Column */}
                <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-2 top-2 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Livro..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                        {loading && books.length === 0 ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" size={20} /></div>
                        ) : (
                            filteredBooks.map(book => (
                                <button
                                    key={book.name}
                                    onClick={() => handleSelectBook(book)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedBook?.name === book.name ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    {book.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chapters & Verses Column */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
                    {!selectedBook ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <BookOpen size={48} className="mb-4 opacity-10" />
                            <p className="text-sm">Selecione um livro para começar</p>
                        </div>
                    ) : (
                        <>
                            {/* Chapters Row */}
                            <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Caps:</span>
                                {chapters.map(chapter => (
                                    <button
                                        key={chapter}
                                        onClick={() => handleSelectChapter(chapter)}
                                        className={`shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition-all ${selectedChapter === chapter ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                    >
                                        {chapter}
                                    </button>
                                ))}
                            </div>

                            {/* Verses List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {loading && verses.length === 0 ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-500" size={24} /></div>
                                ) : selectedChapter ? (
                                    verses.map(verse => (
                                        <div 
                                            key={verse.number} 
                                            id={`verse-${verse.number}`}
                                            className={`group relative p-4 rounded-xl border transition-all shadow-sm hover:shadow-md ${projectedVerseNumber === verse.number ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-500 ring-2 ring-purple-500/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500'}`}
                                        >
                                            <div className="flex gap-3">
                                                <span className={`font-bold text-sm leading-tight ${projectedVerseNumber === verse.number ? 'text-purple-600 dark:text-purple-400' : 'text-purple-500'}`}>{verse.number}</span>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                                                    {verse.text}
                                                </p>
                                            </div>
                                            <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleProject(verse);
                                                    }}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-purple-500/20 ${projectedVerseNumber === verse.number ? 'ring-2 ring-white ring-offset-1 ring-offset-purple-600' : ''}`}
                                                >
                                                    <Play size={14} className={projectedVerseNumber === verse.number ? "fill-white" : "fill-current"} />
                                                    {projectedVerseNumber === verse.number ? 'PROJETANDO' : 'PROJETAR'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full">
                                        <p className="text-sm">Selecione o capítulo</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
