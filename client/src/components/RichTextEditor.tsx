import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useCallback, useRef } from "react";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading2, Heading3, Quote, Code, Link as LinkIcon,
    ImageIcon, Youtube as YoutubeIcon, Plus, Minus, BookOpen,
    AlignLeft, AlignCenter, X, List, ListOrdered
} from "lucide-react";

// ── Custom CTA Block Node ──────────────────────────────────────────────

function CtaNodeView() {
    return (
        <NodeViewWrapper className="my-6" contentEditable={false}>
            <div className="rounded-xl border border-blue-800/40 bg-blue-950/30 backdrop-blur-sm p-6 text-center not-editable">
                <div className="mb-2 text-lg font-bold text-white">
                    Enjoying this? The book goes deeper.
                </div>
                <p className="text-sm text-neutral-400 mb-3">
                    Join the waitlist and be the first to know when{" "}
                    <span className="text-white font-medium">Quit 9to5</span> launches.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 text-xs rounded-lg border border-blue-800/30">
                    <BookOpen className="h-3.5 w-3.5" />
                    Waitlist CTA Block (renders live on the blog)
                </div>
            </div>
        </NodeViewWrapper>
    );
}

const CtaBlock = Node.create({
    name: "ctaBlock",
    group: "block",
    atom: true,
    draggable: true,

    parseHTML() {
        return [{ tag: 'div[data-cta="waitlist"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-cta": "waitlist" })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CtaNodeView);
    },
});

// ── Toolbar Button ─────────────────────────────────────────────────────

function ToolBtn({
    active,
    onClick,
    children,
    title,
}: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition-colors ${active
                ? "bg-white/15 text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/10"
                }`}
        >
            {children}
        </button>
    );
}

// ── Main Editor Component ──────────────────────────────────────────────

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    onUploadImage: (file: File) => Promise<string>;
}

export default function RichTextEditor({
    content,
    onChange,
    onUploadImage,
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showInsertMenu, setShowInsertMenu] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Image.configure({
                HTMLAttributes: { class: "rounded-lg max-w-full mx-auto" },
            }),
            Youtube.configure({
                HTMLAttributes: {
                    class: "rounded-lg overflow-hidden mx-auto aspect-video w-full max-w-2xl",
                },
                inline: false,
                nocookie: true,
            }),
            Placeholder.configure({
                placeholder: "Start writing your story...",
            }),
            Underline,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-400 underline hover:text-blue-300",
                },
            }),
            CtaBlock,
        ],
        content: content || "",
        editorProps: {
            attributes: {
                class:
                    "prose-editor min-h-[400px] outline-none text-neutral-200 text-base leading-7",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    const handleImageUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || !editor) return;
            try {
                const url = await onUploadImage(file);
                editor.chain().focus().setImage({ src: url }).run();
            } catch {
                // Error handled by parent
            }
            e.target.value = "";
        },
        [editor, onUploadImage]
    );

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL:", previousUrl);
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    const insertYoutube = useCallback(() => {
        if (!editor) return;
        const url = window.prompt("YouTube URL:");
        if (url) {
            editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }
        setShowInsertMenu(false);
    }, [editor]);

    const insertCta = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().insertContent({ type: "ctaBlock" }).run();
        setShowInsertMenu(false);
    }, [editor]);

    const insertDivider = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().setHorizontalRule().run();
        setShowInsertMenu(false);
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="rich-text-editor">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* ── Fixed Toolbar ──────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-0.5 bg-neutral-900/80 border border-neutral-800 rounded-lg px-2 py-1.5 mb-3">
                {/* Text formatting */}
                <ToolBtn
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive("underline")}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive("strike")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolBtn>

                <div className="w-px h-5 bg-neutral-700 mx-1" />

                {/* Headings */}
                <ToolBtn
                    active={editor.isActive("heading", { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive("heading", { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    title="Heading 3"
                >
                    <Heading3 className="h-4 w-4" />
                </ToolBtn>

                <div className="w-px h-5 bg-neutral-700 mx-1" />

                {/* Block formatting */}
                <ToolBtn
                    active={editor.isActive("blockquote")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    title="Quote"
                >
                    <Quote className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive("code")}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    title="Inline Code"
                >
                    <Code className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive("link")}
                    onClick={setLink}
                    title="Link"
                >
                    <LinkIcon className="h-4 w-4" />
                </ToolBtn>

                <div className="w-px h-5 bg-neutral-700 mx-1" />

                {/* Alignment */}
                <ToolBtn
                    active={editor.isActive({ textAlign: "left" })}
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    title="Align Left"
                >
                    <AlignLeft className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive({ textAlign: "center" })}
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    title="Align Center"
                >
                    <AlignCenter className="h-4 w-4" />
                </ToolBtn>

                <div className="w-px h-5 bg-neutral-700 mx-1" />

                {/* Insert menu */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowInsertMenu(!showInsertMenu)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${showInsertMenu
                            ? "bg-white/15 text-white"
                            : "text-neutral-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Insert
                    </button>

                    {showInsertMenu && (
                        <div className="absolute left-0 top-full mt-1 z-50 bg-neutral-900 border border-neutral-700 rounded-lg py-1 shadow-xl min-w-[180px]">
                            <button
                                type="button"
                                onClick={() => { handleImageUpload(); setShowInsertMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                            >
                                <ImageIcon className="h-4 w-4" />
                                Upload Image
                            </button>
                            <button
                                type="button"
                                onClick={insertYoutube}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                            >
                                <YoutubeIcon className="h-4 w-4" />
                                YouTube Video
                            </button>
                            <button
                                type="button"
                                onClick={insertCta}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                            >
                                <BookOpen className="h-4 w-4" />
                                "Enjoying this?" CTA
                            </button>
                            <div className="h-px bg-neutral-800 my-1" />
                            <button
                                type="button"
                                onClick={insertDivider}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                            >
                                <Minus className="h-4 w-4" />
                                Divider
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Editor area ──────────────────────────────────────────── */}
            <EditorContent editor={editor} />
        </div>
    );
}
