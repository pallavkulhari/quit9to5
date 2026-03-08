import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { WaitlistFormInline } from "@/components/WaitlistForm";
import type { BlogPost } from "@shared/schema";
import { useMemo, useEffect } from "react";

/**
 * Split HTML content at CTA markers and render WaitlistFormInline
 * components inline within the React tree (keeps providers intact).
 */
function BlogContent({ html }: { html: string }) {
    const parts = useMemo(() => {
        // Split on <div data-cta="waitlist"></div> markers
        return html.split(/<div\s+data-cta="waitlist"\s*><\/div>/gi);
    }, [html]);

    if (parts.length === 1) {
        // No CTA blocks — render as a single chunk
        return (
            <div
                className="prose-blog mb-10 md:mb-14"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }

    // Interleave HTML chunks with live CTA components
    return (
        <div className="prose-blog mb-10 md:mb-14">
            {parts.map((chunk, i) => (
                <div key={i}>
                    {chunk && (
                        <div dangerouslySetInnerHTML={{ __html: chunk }} />
                    )}
                    {/* Insert CTA between chunks (not after the last one) */}
                    {i < parts.length - 1 && (
                        <div className="my-8">
                            <WaitlistFormInline />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function BlogDetail() {
    const params = useParams<{ id: string }>();

    const { data: post, isLoading, error } = useQuery<BlogPost>({
        queryKey: ["blog", params.id],
        queryFn: async () => {
            const res = await fetch(`/api/blogs/${params.id}`);
            if (!res.ok) throw new Error("Post not found");
            return res.json();
        },
        enabled: !!params.id,
    });

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-72px)] flex items-center justify-center bg-black text-white">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-72px)] flex flex-col items-center justify-center bg-black text-white">
                <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                <Link
                    href="/blog"
                    className="text-blue-400 hover:text-blue-300 underline text-sm"
                >
                    ← Back to all posts
                </Link>
            </div>
        );
    }

    // Determine if content is legacy (string[]) or new (HTML string)
    const isLegacyContent = Array.isArray(post.content);
    const htmlContent = isLegacyContent
        ? (post.content as unknown as string[]).map((p) => `<p>${p}</p>`).join("")
        : (post.content as string);

    // Dynamic SEO meta tags
    useEffect(() => {
        const pageTitle = post.seoTitle || post.title;
        const pageDesc = post.metaDescription || post.excerpt;
        document.title = `${pageTitle} | Quit 9to5`;

        const setMeta = (name: string, content: string) => {
            let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
            if (!el) {
                el = document.createElement("meta");
                if (name.startsWith("og:") || name.startsWith("twitter:")) {
                    el.setAttribute("property", name);
                } else {
                    el.setAttribute("name", name);
                }
                document.head.appendChild(el);
            }
            el.setAttribute("content", content);
        };

        setMeta("description", pageDesc);
        setMeta("og:title", pageTitle);
        setMeta("og:description", pageDesc);
        setMeta("og:image", post.coverImage);
        setMeta("og:type", "article");
        setMeta("twitter:card", "summary_large_image");
        setMeta("twitter:title", pageTitle);
        setMeta("twitter:description", pageDesc);
        setMeta("twitter:image", post.coverImage);

        return () => { document.title = "Quit 9to5"; };
    }, [post]);

    return (
        <div className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-72px)] bg-black text-white">
            <article className="mx-auto max-w-3xl px-4 py-6 md:py-14">
                {/* Back link */}
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors duration-200 mb-5 md:mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to all posts
                </Link>

                {/* ── Hero Section ──────────────────────────────────── */}
                <header className="mb-8 md:mb-10">
                    <div className="rounded-lg md:rounded-xl overflow-hidden aspect-[16/9] md:aspect-[2/1] mb-4 md:mb-6">
                        <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
                        <span>{post.date}</span>
                        <span className="h-1 w-1 rounded-full bg-neutral-600" />
                        <span>{post.readTime}</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight">
                        {post.title}
                    </h1>
                    <p className="mt-3 text-neutral-400 text-base md:text-lg leading-relaxed">
                        {post.excerpt}
                    </p>
                    <div className="mt-5 h-px bg-neutral-800" />
                </header>

                {/* ── Blog Content ──────────────────────────────────── */}
                <BlogContent html={htmlContent} />

                {/* ── Bottom Waitlist CTA ────────────────────────────── */}
                <WaitlistFormInline />

                {/* ── LinkedIn Follow ───────────────────────────────── */}
                <p className="text-center text-sm text-neutral-500 mt-8">
                    Meanwhile you can also follow me on{" "}
                    <a
                        href="https://www.linkedin.com/in/pallavkulhari/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                    >
                        LinkedIn
                    </a>{" "}
                    for regular posts on career, healthy habits and spirituality.
                </p>

                {/* ── Footer spacer ─────────────────────────────────── */}
                <div className="h-16" />
            </article>
        </div>
    );
}
