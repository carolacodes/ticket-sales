import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-220px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-violet-700/30 blur-3xl" />
            <div className="absolute left-1/2 top-[120px] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 md:pb-20 md:pt-20">
            <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 border-violet-500/30 bg-violet-600/10 text-violet-200">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-violet-400" />
                NEW ERA OF TICKETING
            </Badge>

            <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
                <span className="text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                EXPERIENCE THE
                </span>
                <br />
                <span className="bg-gradient-to-b from-violet-200 to-violet-500 bg-clip-text text-transparent">
                FUTURE
                </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
                Seamless ticketing, immersive analytics, and futuristic engagement
                tools for the modern organizer. Join the revolution in event
                management.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild className="w-full bg-violet-600 hover:bg-violet-500 sm:w-auto">
                <Link to="/events">Explore Events</Link>
                </Button>

                <Button
                variant="outline"
                className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                onClick={() => alert("Abrir modal/video demo 👀")}
                >
                Watch Demo
                </Button>
            </div>
            </div>
        </div>
        </section>
    );
}
