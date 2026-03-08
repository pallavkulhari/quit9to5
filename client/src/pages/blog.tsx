import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { BlogPost } from "@shared/schema";

// ── Adapt BlogPost to card interface ────────────────────────────────────
interface CardPost {
    id: number;
    title: string;
    excerpt: string;
    image: string;
    date: string;
    readTime: string;
}

function toCard(post: BlogPost): CardPost {
    return {
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        image: post.coverImage,
        date: post.date,
        readTime: post.readTime,
    };
}

// ── Card Components ─────────────────────────────────────────────────────

function BlogCard({
    post,
    className = "",
    imageClassName = "",
    showExcerpt = false,
}: {
    post: CardPost;
    className?: string;
    imageClassName?: string;
    showExcerpt?: boolean;
}) {
    return (
        <Link href={`/blog/${post.id}`} className={`block ${className}`}>
            <article className="group cursor-pointer overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/50 transition-all duration-300 hover:border-neutral-600 hover:bg-neutral-900 h-full">
                <div className={`overflow-hidden ${imageClassName}`}>
                    <img
                        src={post.image}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
                <div className="p-4 md:p-5">
                    <div className="mb-2 flex items-center gap-3 text-xs text-neutral-500">
                        <span>{post.date}</span>
                        <span className="h-1 w-1 rounded-full bg-neutral-600" />
                        <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-sm md:text-base font-semibold text-white leading-snug group-hover:text-blue-400 transition-colors duration-200">
                        {post.title}
                    </h3>
                    {showExcerpt && (
                        <p className="mt-2 text-xs md:text-sm text-neutral-400 leading-relaxed line-clamp-2">
                            {post.excerpt}
                        </p>
                    )}
                </div>
            </article>
        </Link>
    );
}

function HeroCard({ post }: { post: CardPost }) {
    return (
        <Link href={`/blog/${post.id}`} className="block">
            <article className="group cursor-pointer overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all duration-300 hover:border-neutral-600 hover:bg-neutral-900">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                    <div className="flex flex-col justify-center p-6 md:p-10">
                        <div className="mb-3 flex items-center gap-3 text-xs text-neutral-500">
                            <span className="rounded-full bg-blue-900/40 px-2.5 py-0.5 text-blue-400 border border-blue-800/50">
                                Featured
                            </span>
                            <span>{post.date}</span>
                            <span className="h-1 w-1 rounded-full bg-neutral-600" />
                            <span>{post.readTime}</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white leading-tight group-hover:text-blue-400 transition-colors duration-200">
                            {post.title}
                        </h2>
                        <p className="mt-3 text-sm text-neutral-400 leading-relaxed line-clamp-3">
                            {post.excerpt}
                        </p>
                        <div className="mt-5">
                            <span className="inline-flex items-center gap-1.5 text-sm text-blue-400 font-medium group-hover:gap-2.5 transition-all duration-200">
                                Read more
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}

function WideCard({ post }: { post: CardPost }) {
    return (
        <Link href={`/blog/${post.id}`} className="block h-full">
            <article className="group cursor-pointer overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/50 transition-all duration-300 hover:border-neutral-600 hover:bg-neutral-900 h-full">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                    <div className="aspect-[16/10] md:aspect-auto overflow-hidden md:col-span-1">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                    <div className="flex flex-col justify-center p-5 md:p-6 md:col-span-2">
                        <div className="mb-2 flex items-center gap-3 text-xs text-neutral-500">
                            <span>{post.date}</span>
                            <span className="h-1 w-1 rounded-full bg-neutral-600" />
                            <span>{post.readTime}</span>
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-white leading-snug group-hover:text-blue-400 transition-colors duration-200">
                            {post.title}
                        </h3>
                        <p className="mt-2 text-xs md:text-sm text-neutral-400 leading-relaxed line-clamp-2">
                            {post.excerpt}
                        </p>
                    </div>
                </div>
            </article>
        </Link>
    );
}

// ── Main Blog Page ──────────────────────────────────────────────────────

export default function Blog() {
    const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
        queryKey: ["blogs"],
        queryFn: async () => {
            const res = await fetch("/api/blogs");
            if (!res.ok) throw new Error("Failed to fetch blogs");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-72px)] bg-black text-white flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
        );
    }

    if (error || !posts || posts.length === 0) {
        return (
            <div className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-72px)] bg-black text-white flex items-center justify-center">
                <p className="text-neutral-500">No blog posts yet. Check back soon!</p>
            </div>
        );
    }

    // Find featured post, fallback to first
    const featuredPost = posts.find((p) => p.featured) || posts[0];
    const rest = posts.filter((p) => p.id !== featuredPost.id);
    const gridPosts = rest.slice(0, 4);
    const bottomPosts = rest.slice(4);

    const featured = toCard(featuredPost);

    return (
        <div className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-72px)] bg-black text-white">
            <div className="mx-auto max-w-6xl px-4 py-6 md:py-12 space-y-6 md:space-y-10">
                {/* Section title */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        The Blog
                    </h1>
                    <p className="text-neutral-500 text-sm">
                        Ideas on quitting the grind and building a life you own.
                    </p>
                </div>

                {/* ── Row 1: Featured hero post ──────────────────────────── */}
                <HeroCard post={featured} />

                {/* ── Row 2: 4-column grid ───────────────────────────────── */}
                {gridPosts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {gridPosts.map((post) => (
                            <BlogCard
                                key={post.id}
                                post={toCard(post)}
                                imageClassName="aspect-[4/3]"
                            />
                        ))}
                    </div>
                )}

                {/* ── Row 3: 1 small card + 1 wide card ─────────────────── */}
                {bottomPosts.length >= 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <BlogCard
                            post={toCard(bottomPosts[0])}
                            showExcerpt
                            imageClassName="aspect-[4/3]"
                        />
                        <div className="md:col-span-2">
                            <WideCard post={toCard(bottomPosts[1])} />
                        </div>
                    </div>
                )}

                {/* Extra posts if more than 6 */}
                {bottomPosts.length > 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {bottomPosts.slice(2).map((post) => (
                            <BlogCard
                                key={post.id}
                                post={toCard(post)}
                                showExcerpt
                                imageClassName="aspect-[4/3]"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
