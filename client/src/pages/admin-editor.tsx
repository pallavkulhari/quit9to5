import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import RichTextEditor from "@/components/RichTextEditor";
import {
    Loader2, ArrowLeft, Save, Eye, EyeOff,
    Star, StarOff, Image as ImageIcon, Upload, Mail
} from "lucide-react";

export default function AdminEditor() {
    const [, navigate] = useLocation();
    const params = useParams<{ id?: string }>();
    const { isAuthenticated, isChecking, authFetch } = useAdminAuth();
    const isEditing = !!params.id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [savedPostId, setSavedPostId] = useState<number | null>(null);
    const [notifying, setNotifying] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [slugManual, setSlugManual] = useState(false);
    const [excerpt, setExcerpt] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [content, setContent] = useState("");
    const [date, setDate] = useState(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    const [readTime, setReadTime] = useState("5 min read");
    const [readTimeManual, setReadTimeManual] = useState(false);
    const [author, setAuthor] = useState("Pallav Kulhari");
    const [featured, setFeatured] = useState(false);
    const [status, setStatus] = useState<"draft" | "published">("draft");

    // Auth guard
    useEffect(() => {
        if (!isChecking && !isAuthenticated) navigate("/admin");
    }, [isChecking, isAuthenticated, navigate]);

    // Load existing post
    useEffect(() => {
        if (isEditing && isAuthenticated) {
            authFetch(`/api/admin/blogs/${params.id}`)
                .then((res) => res.json())
                .then((post) => {
                    setTitle(post.title);
                    setSlug(post.slug);
                    setSlugManual(true);
                    setExcerpt(post.excerpt);
                    setCoverImage(post.coverImage);
                    // Handle both legacy string[] and new HTML string content
                    if (Array.isArray(post.content)) {
                        setContent(post.content.map((p: string) => `<p>${p}</p>`).join(""));
                    } else {
                        setContent(post.content || "");
                    }
                    setDate(post.date);
                    setReadTime(post.readTime);
                    setReadTimeManual(true);
                    setAuthor(post.author);
                    setFeatured(post.featured);
                    setStatus(post.status);
                })
                .catch(() => setError("Failed to load post"))
                .finally(() => setLoading(false));
        }
    }, [isEditing, isAuthenticated, params.id]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!slugManual && title) {
            setSlug(
                title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .slice(0, 80)
            );
        }
    }, [title, slugManual]);

    // Auto-calculate read time from HTML content
    useEffect(() => {
        if (!readTimeManual && content) {
            const text = content.replace(/<[^>]*>/g, " ");
            const wordCount = text.split(/\s+/).filter(Boolean).length;
            const minutes = Math.max(1, Math.ceil(wordCount / 200));
            setReadTime(`${minutes} min read`);
        }
    }, [content, readTimeManual]);

    // Upload image handler for the rich editor
    const handleEditorImageUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("image", file);
        const res = await authFetch("/api/admin/upload", {
            method: "POST",
            body: formData,
            headers: {},
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Upload failed");
        }
        const { url } = await res.json();
        return url;
    };

    // Save
    const handleSave = async () => {
        setError("");
        if (!title.trim()) { setError("Title is required"); return; }
        if (!slug.trim()) { setError("Slug is required"); return; }
        if (!excerpt.trim()) { setError("Excerpt is required"); return; }
        if (!coverImage.trim()) { setError("Cover image is required"); return; }
        if (!content.trim() || content === "<p></p>") { setError("Content is required"); return; }

        setSaving(true);
        try {
            const body = {
                title, slug, excerpt, coverImage,
                content,
                date, readTime, author, featured, status,
            };
            const url = isEditing ? `/api/admin/blogs/${params.id}` : "/api/admin/blogs";
            const method = isEditing ? "PUT" : "POST";
            const res = await authFetch(url, { method, body: JSON.stringify(body) });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Save failed");
            }
            navigate("/admin/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const handleNotify = async () => {
        if (!savedPostId) return;
        setNotifying(true);
        try {
            await authFetch(`/api/admin/blogs/${savedPostId}/notify`, { method: "POST" });
        } catch {
            // Silently fail — post is already saved
        }
        setNotifying(false);
        setShowEmailModal(false);
        navigate("/admin/dashboard");
    };

    if (isChecking || loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const inputClass =
        "w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
    const labelClass = "block text-xs font-medium text-neutral-400 mb-1.5";

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                    <div className="flex items-center gap-3">
                        {/* Status toggle */}
                        <button
                            type="button"
                            onClick={() => setStatus((s) => (s === "published" ? "draft" : "published"))}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${status === "published"
                                ? "bg-emerald-900/30 text-emerald-400 border-emerald-800/30"
                                : "bg-yellow-900/30 text-yellow-400 border-yellow-800/30"
                                }`}
                        >
                            {status === "published" ? (
                                <><Eye className="h-3.5 w-3.5" /> Published</>
                            ) : (
                                <><EyeOff className="h-3.5 w-3.5" /> Draft</>
                            )}
                        </button>
                        {/* Save */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </header>

            {/* Editor */}
            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg py-2.5 px-4">
                        {error}
                    </div>
                )}

                {/* ── Title ───────────────────────────────────────────── */}
                <div>
                    <label className={labelClass}>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter blog title..."
                        className={`${inputClass} text-lg font-semibold`}
                    />
                </div>

                {/* ── Slug ────────────────────────────────────────────── */}
                <div>
                    <label className={labelClass}>
                        Slug
                        {!slugManual && (
                            <span className="text-neutral-600 ml-1">(auto-generated)</span>
                        )}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => {
                                setSlugManual(true);
                                setSlug(e.target.value);
                            }}
                            placeholder="url-friendly-slug"
                            className={inputClass}
                        />
                        {slugManual && (
                            <button
                                type="button"
                                onClick={() => setSlugManual(false)}
                                className="px-3 text-xs text-neutral-500 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap"
                            >
                                Auto
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Excerpt ─────────────────────────────────────────── */}
                <div>
                    <label className={labelClass}>Excerpt</label>
                    <textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="A short description shown on blog cards..."
                        rows={2}
                        className={`${inputClass} resize-none`}
                    />
                </div>

                {/* ── Cover Image ─────────────────────────────────────── */}
                <div>
                    <label className={labelClass}>
                        <ImageIcon className="h-3.5 w-3.5 inline mr-1" />
                        Cover Image
                    </label>
                    <div className="flex gap-2 items-center">
                        <label className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-lg border border-neutral-800 transition-colors cursor-pointer">
                            <Upload className="h-4 w-4" />
                            {uploading ? "Uploading..." : "Upload Image"}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploading(true);
                                    setError("");
                                    try {
                                        const url = await handleEditorImageUpload(file);
                                        setCoverImage(url);
                                    } catch (err) {
                                        setError(err instanceof Error ? err.message : "Upload failed");
                                    } finally {
                                        setUploading(false);
                                        e.target.value = "";
                                    }
                                }}
                            />
                        </label>
                        <span className="text-xs text-neutral-600">or paste a URL:</span>
                        <input
                            type="text"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            placeholder="https://..."
                            className={`${inputClass} flex-1`}
                        />
                    </div>
                    {coverImage && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-neutral-800 aspect-[2/1] max-w-md">
                            <img
                                src={coverImage}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                        </div>
                    )}
                </div>

                {/* ── Rich Text Content ───────────────────────────────── */}
                <div>
                    <label className={labelClass}>Content</label>
                    <div className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-4">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            onUploadImage={handleEditorImageUpload}
                        />
                    </div>
                </div>

                {/* ── Meta Row: Date, Read Time, Author ────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Date</label>
                        <input
                            type="text"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            placeholder="Mar 5, 2026"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>
                            Read Time
                            {!readTimeManual && (
                                <span className="text-neutral-600 ml-1">(auto)</span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={readTime}
                                onChange={(e) => {
                                    setReadTimeManual(true);
                                    setReadTime(e.target.value);
                                }}
                                placeholder="5 min read"
                                className={inputClass}
                            />
                            {readTimeManual && (
                                <button
                                    type="button"
                                    onClick={() => setReadTimeManual(false)}
                                    className="px-2 text-xs text-neutral-500 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors"
                                >
                                    Auto
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Author</label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Author name"
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* ── Featured Toggle ─────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setFeatured((f) => !f)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${featured
                            ? "bg-yellow-900/30 text-yellow-400 border-yellow-800/40"
                            : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                            }`}
                    >
                        {featured ? (
                            <Star className="h-4 w-4 fill-yellow-400" />
                        ) : (
                            <StarOff className="h-4 w-4" />
                        )}
                        {featured ? "Featured Post" : "Not Featured"}
                    </button>
                    <span className="text-xs text-neutral-600">
                        Featured post appears as the hero card on the blog page
                    </span>
                </div>

                {/* Bottom spacer */}
                <div className="h-12" />
            </main>

            {/* Email notification modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-blue-900/30 border border-blue-800/30">
                                <Mail className="h-5 w-5 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Send Email?</h3>
                        </div>
                        <p className="text-sm text-neutral-400 mb-5">
                            This blog is now published. Would you like to send an email notification to all subscribers?
                        </p>
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => { setShowEmailModal(false); navigate("/admin/dashboard"); }}
                                className="px-4 py-2 text-sm text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                            >
                                No, Skip
                            </button>
                            <button
                                onClick={handleNotify}
                                disabled={notifying}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {notifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {notifying ? "Sending..." : "Yes, Send Email"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
