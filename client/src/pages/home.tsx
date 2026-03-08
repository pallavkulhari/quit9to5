import { WaitlistFormVertical } from "@/components/WaitlistForm";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-72px)] flex flex-col items-center justify-center px-4 py-6 md:py-8 bg-black text-white">
      {/* Book-like container with border */}
      <div className="w-72 h-[460px] sm:w-80 sm:h-[500px] md:w-96 md:h-[600px] border-2 border-neutral-700 p-6 sm:p-8 md:p-10 bg-gradient-to-b from-neutral-900/20 to-black/50 backdrop-blur-sm shadow-2xl animate-fadeIn flex flex-col justify-between">

        {/* Top tagline */}
        <div className="text-center">
          <p className="text-neutral-400 text-xs font-light">First principles from an IITian who chose freedom</p>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-6">
          {/* Book Title Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight w-full whitespace-nowrap">
              Quit 9to5
            </h1>
            <div className="w-16 h-0.5 bg-white mx-auto" />
            <h2 className="text-sm md:text-base text-neutral-300 font-light leading-relaxed w-full">
              Redesign your career<br />without taking a financial hit
            </h2>
          </div>

          {/* Shared Waitlist Form */}
          <WaitlistFormVertical />
        </div>

        {/* Author Footer */}
        <div className="text-center">
          <p className="text-neutral-400 text-xs">
            A book by{" "}
            <a
              href="https://www.linkedin.com/in/pallavkulhari/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
            >
              Pallav Kulhari
            </a>
          </p>
        </div>

      </div>
      {/* 1:1 Call CTA outside the book */}
      <div className="mt-4 text-center">
        <p className="text-neutral-400 text-xs">
          Can't wait?{" "}
          <a
            href="https://topmate.io/pallavkulhari"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
          >
            Book a 1:1 call here
          </a>
        </p>
      </div>
    </div>
  );
}
