import React, { useState } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Mark, mergeAttributes } from '@tiptap/core';
import { Bold, Italic, Type, Plus, Eye, Edit3, Save, Music, Mic } from 'lucide-react';

// Custom Extension for Chords
const ChordExtension = Mark.create({
    name: 'chord',

    parseHTML() {
        return [
            {
                tag: 'span',
                getAttrs: element => element.classList.contains('chord-tag') && null,
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'chord-tag' }), 0]
    },

    addCommands() {
        return {
            toggleChord: () => ({ commands }) => {
                return commands.toggleMark(this.name)
            },
            setChord: () => ({ commands }) => {
                return commands.setMark(this.name)
            },
        }
    },
})

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-slate-700 ${editor.isActive('bold') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                title="Negrito"
            >
                <Bold size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-slate-700 ${editor.isActive('italic') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                title="Itálico"
            >
                <Italic size={18} />
            </button>

            {/* Basic Color Palette for Chords/Highlights */}
            <div className="w-px h-6 bg-slate-700 mx-1"></div>

            <button
                onClick={() => editor.chain().focus().setColor('#ef4444').run()}
                className={`w-6 h-6 rounded-full border border-slate-600 bg-red-500 hover:scale-110 transition`}
                title="Vermelho"
            />
            <button
                onClick={() => editor.chain().focus().setColor('#3b82f6').run()}
                className={`w-6 h-6 rounded-full border border-slate-600 bg-blue-500 hover:scale-110 transition`}
                title="Azul"
            />
            <button
                onClick={() => editor.chain().focus().unsetColor().run()}
                className={`w-6 h-6 rounded-full border border-slate-600 bg-slate-200 hover:scale-110 transition`}
                title="Padrão"
            />

            <div className="w-px h-6 bg-slate-700 mx-1"></div>

            <button
                onClick={() => {
                    const chord = prompt('Digite a cifra (ex: Am7):');
                    if (chord) {
                        // Insert as text then mark it, or insert HTML directly
                        // Ideally we want [Am7] as a single marked unit
                        editor.chain().focus()
                            .insertContent(` `) // space before
                            .insertContent({ type: 'text', text: `[${chord}]` })
                            .setTextSelection({ from: editor.state.selection.from - (chord.length + 2), to: editor.state.selection.from })
                            .setMark('chord')
                            .setTextSelection(editor.state.selection.from) // collapse
                            .insertContent(` `) // space after
                            .run();
                    }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600/20 text-yellow-500 rounded hover:bg-yellow-600/30 font-bold text-sm"
            >
                <Plus size={14} /> Cifra
            </button>
        </div>
    );
};

export function SongEditor() {
    const [isEditing, setIsEditing] = useState(true);
    const [title, setTitle] = useState('');
    const [showChords, setShowChords] = useState(true);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            ChordExtension,
        ],
        content: `
            <h3>Digite aqui sua música...</h3>
            <p>Use o botão de <strong>Cifra</strong> para inserir acordes.</p>
            <p>Exemplo:</p>
            <p><span class="chord-tag">[Am]</span> Eu quero tchu...</p>
        `,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
    });

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 gap-4">
            {/* Top Controls */}
            <div className="flex items-center justify-between">
                <input
                    type="text"
                    placeholder="Título da Música"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent text-2xl font-bold placeholder:text-slate-600 focus:outline-none border-b border-transparent focus:border-blue-500 w-full mr-4"
                />

                <div className="flex gap-2">
                    {/* Mode Toggle inside Editor */}
                    {!isEditing && (
                        <button
                            onClick={() => setShowChords(!showChords)}
                            className={`p-2 rounded-lg transition ${showChords ? 'bg-yellow-600/20 text-yellow-500' : 'bg-slate-700 text-slate-400'}`}
                            title="Alternar Cifras"
                        >
                            <Music size={20} />
                        </button>
                    )}

                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                        title={isEditing ? "Visualizar" : "Editar"}
                    >
                        {isEditing ? <Eye size={20} /> : <Edit3 size={20} />}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition">
                        <Save size={18} /> Salvar
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div
                className={`
                    flex-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 flex flex-col
                    ${!isEditing ? 'border-blue-500/50' : ''}
                    ${!showChords && !isEditing ? 'mode-lyrics-only' : ''}
                `}
            >
                {isEditing && <MenuBar editor={editor} />}

                {/*
                   When not editing (View Mode), we rely on the CSS class 'mode-lyrics-only'
                   on the parent container to hide .chord-tag elements.
                */}
                <div className="flex-1 overflow-y-auto">
                    <EditorContent editor={editor} disabled={!isEditing} />
                </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                <span>{isEditing ? 'Modo de Edição' : 'Modo de Visualização'}</span>
                {!isEditing && <span>Cifras: {showChords ? 'Visíveis' : 'Ocultas'}</span>}
            </div>
        </div>
    );
}
