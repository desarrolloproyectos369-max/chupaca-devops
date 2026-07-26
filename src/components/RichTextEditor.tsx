"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Undo, Redo } from 'lucide-react'
import { useEffect } from 'react';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const btnStyle = (isActive: boolean) => ({
    padding: "0.4rem",
    marginRight: "0.2rem",
    borderRadius: "0.25rem",
    border: "none",
    backgroundColor: isActive ? "var(--primary-light, #e0f2fe)" : "transparent",
    color: isActive ? "var(--primary, #0284c7)" : "var(--text-muted, #64748b)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s"
  });

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', padding: '0.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        style={btnStyle(editor.isActive('bold'))}
        title="Negrita"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        style={btnStyle(editor.isActive('italic'))}
        title="Cursiva"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        style={btnStyle(editor.isActive('strike'))}
        title="Tachado"
      >
        <Strikethrough size={16} />
      </button>
      
      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        style={btnStyle(editor.isActive('heading', { level: 1 }))}
        title="Título 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={btnStyle(editor.isActive('heading', { level: 2 }))}
        title="Título 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={btnStyle(editor.isActive('bulletList'))}
        title="Lista de viñetas"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={btnStyle(editor.isActive('orderedList'))}
        title="Lista numerada"
      >
        <ListOrdered size={16} />
      </button>
      
      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>
      
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        style={btnStyle(false)}
        title="Deshacer"
      >
        <Undo size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        style={btnStyle(false)}
        title="Rehacer"
      >
        <Redo size={16} />
      </button>
    </div>
  )
}

export default function RichTextEditor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
        style: 'min-height: 200px; padding: 1rem; max-height: 400px; overflow-y: auto;'
      },
    },
  })

  // Evita re-renderizados innecesarios si cambia desde afuera
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
