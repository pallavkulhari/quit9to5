import { useLocation, Link } from "wouter";

export default function Header() {
    const [location] = useLocation();
    const isBlog = location.startsWith("/blog");

    return (
        <header className="sticky top-0 z-50 w-full py-4 md:py-6 px-4 bg-black/95 backdrop-blur-sm border-b border-neutral-800/50">
            <nav className="flex items-center justify-center gap-6 md:gap-8">
                <Link
                    href="/"
                    className="group relative pb-2 text-base md:text-lg font-semibold tracking-wide transition-colors duration-200"
                >
                    <span className={location === "/" ? "text-white" : "text-neutral-500 hover:text-neutral-300"}>
                        Waitlist
                    </span>
                    <span
                        className={`absolute bottom-0 left-0 h-[2px] bg-blue-500 transition-all duration-300 ${location === "/" ? "w-full" : "w-0 group-hover:w-full"
                            }`}
                    />
                </Link>

                <div className="h-5 w-px bg-neutral-700" />

                <Link
                    href="/blog"
                    className="group relative pb-2 text-base md:text-lg font-semibold tracking-wide transition-colors duration-200"
                >
                    <span className={isBlog ? "text-white" : "text-neutral-500 hover:text-neutral-300"}>
                        Blogs
                    </span>
                    <span
                        className={`absolute bottom-0 left-0 h-[2px] bg-blue-500 transition-all duration-300 ${isBlog ? "w-full" : "w-0 group-hover:w-full"
                            }`}
                    />
                </Link>
            </nav>
        </header>
    );
}
