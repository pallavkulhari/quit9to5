import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2, Plus, Settings, Trash2, LogOut, Star, Eye, EyeOff, ExternalLink } from "lucide-react";
import type { BlogPost } from "@shared/schema";

export default function AdminDashboard() {
    const [, navigate] = useLocation();
    const { isAuthenticated, isChecking, logout, authFetch } = useAdminAuth();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!isChecking && !isAuthenticated) {
            navigate("/admin");
        }
    }, [isChecking, isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated) fetchPosts();
    }, [isAuthenticated]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/admin/blogs");
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch { }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        setDeleting(true);
        try {
            const res = await authFetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPosts((prev) => prev.filter((p) => p.id !== id));
                setDeleteId(null);
            }
        } catch { }
        setDeleting(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate("/admin");
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            {/* Admin header */}
            <header className="sticky top-0 z-50 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold">Admin Panel</h1>
                        <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">Blogs</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/editor"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" /> New Post
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-lg transition-colors"
                        >
                            <LogOut className="h-4 w-4" /> Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-neutral-500 mb-4">No blog posts yet.</p>
                        <Link
                            href="/admin/editor"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Plus className="h-4 w-4" /> Create your first post
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-800 text-neutral-500 text-xs uppercase tracking-wider">
                                    <th className="text-left py-3 px-2 font-medium">Title</th>
                                    <th className="text-left py-3 px-2 font-medium hidden md:table-cell">Date</th>
                                    <th className="text-center py-3 px-2 font-medium">Status</th>
                                    <th className="text-center py-3 px-2 font-medium hidden sm:table-cell">Featured</th>
                                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="border-b border-neutral-800/50 hover:bg-neutral-900/50 transition-colors"
                                    >
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-3">
                                                {post.coverImage && (
                                                    <img
                                                        src={post.coverImage}
                                                        alt=""
                                                        className="w-10 h-10 rounded object-cover hidden sm:block flex-shrink-0"
                                                    />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-medium text-white truncate max-w-[200px] md:max-w-[350px]">
                                                        {post.title}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 truncate max-w-[200px] md:max-w-[350px]">
                                                        {post.excerpt}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-neutral-400 whitespace-nowrap hidden md:table-cell">
                                            {post.date}
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            {post.status === "published" ? (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800/30">
                                                    <Eye className="h-3 w-3" /> Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-800/30">
                                                    <EyeOff className="h-3 w-3" /> Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-2 text-center hidden sm:table-cell">
                                            {post.featured && (
                                                <Star className="h-4 w-4 text-yellow-400 mx-auto fill-yellow-400" />
                                            )}
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Preview blog */}
                                                <a
                                                    href={`/blog/${post.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                                                    title="Preview"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                                {/* Edit / Settings */}
                                                <Link
                                                    href={`/admin/editor/${post.id}`}
                                                    className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                                                    title="Edit"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Link>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => setDeleteId(post.id)}
                                                    className="p-1.5 rounded hover:bg-red-900/30 text-neutral-400 hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Delete confirmation modal */}
            {deleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-white mb-2">Delete Post</h3>
                        <p className="text-sm text-neutral-400 mb-5">
                            Are you sure you want to delete this post? This action cannot be undone.
                        </p>
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-sm text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
