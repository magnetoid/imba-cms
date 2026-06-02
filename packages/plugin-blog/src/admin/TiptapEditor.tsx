import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useEffect } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, Heading4, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Image as ImageIcon, Code, Quote, Undo, Redo, Minus,
} from 'lucide-react'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Use the full-width "writing room" layout (BlogPostEdit). */
  variant?: 'compact' | 'full'
}

export default function TiptapEditor({
  value,
  onChange,
  placeholder = 'Start writing your article…',
  variant = 'compact',
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-prose',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value])

  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, title: string, icon: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
    </button>
  )

  const addImage = () => {
    const url = window.prompt('Image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const setLink = () => {
    const url = window.prompt('URL:', editor.getAttributes('link').href)
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const full = variant === 'full'

  return (
    <div className={`${full ? '' : 'border border-input rounded-md overflow-hidden'} bg-background`}>
      {/* Toolbar */}
      <div className={`flex flex-wrap items-center gap-0.5 ${full ? 'sticky top-[58px] z-20 bg-background/95 backdrop-blur border-y border-border py-2 px-4' : 'p-1.5 border-b border-input bg-muted/30'}`}>
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold (⌘B)', <Bold className="w-4 h-4" />)}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic (⌘I)', <Italic className="w-4 h-4" />)}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Underline (⌘U)', <UnderlineIcon className="w-4 h-4" />)}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strikethrough', <Strikethrough className="w-4 h-4" />)}
        <div className="w-px h-5 bg-border mx-1" />
        {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'Heading 1 — only one per page (use sparingly; the post title is already an H1)', <Heading1 className="w-4 h-4" />)}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2 — main sections', <Heading2 className="w-4 h-4" />)}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Heading 3 — subsections', <Heading3 className="w-4 h-4" />)}
        {btn(editor.isActive('heading', { level: 4 }), () => editor.chain().focus().toggleHeading({ level: 4 }).run(), 'Heading 4 — deepest detail', <Heading4 className="w-4 h-4" />)}
        <div className="w-px h-5 bg-border mx-1" />
        {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), 'Align left', <AlignLeft className="w-4 h-4" />)}
        {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), 'Align center', <AlignCenter className="w-4 h-4" />)}
        {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), 'Align right', <AlignRight className="w-4 h-4" />)}
        <div className="w-px h-5 bg-border mx-1" />
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet list', <List className="w-4 h-4" />)}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list', <ListOrdered className="w-4 h-4" />)}
        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Quote', <Quote className="w-4 h-4" />)}
        {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), 'Inline code', <Code className="w-4 h-4" />)}
        <div className="w-px h-5 bg-border mx-1" />
        {btn(editor.isActive('link'), setLink, 'Link', <LinkIcon className="w-4 h-4" />)}
        {btn(false, addImage, 'Insert image', <ImageIcon className="w-4 h-4" />)}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), 'Divider', <Minus className="w-4 h-4" />)}
        <div className="w-px h-5 bg-border mx-1" />
        {btn(false, () => editor.chain().focus().undo().run(), 'Undo', <Undo className="w-4 h-4" />)}
        {btn(false, () => editor.chain().focus().redo().run(), 'Redo', <Redo className="w-4 h-4" />)}
      </div>

      {/* Editor surface */}
      <EditorContent
        editor={editor}
        className={full
          ? 'tiptap-frame tiptap-frame--full'
          : 'tiptap-frame'}
      />
    </div>
  )
}
