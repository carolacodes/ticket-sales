import { HeroSection } from "@/components/landing/HeroSection";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { TrendingSection } from "@/components/landing/TrendingSection";

const demoEvents = [
    {
        id: "1",
        category: "MUSIC",
        tagColor: "violet",
        title: "CYBERPUNK NIGHT 2024",
        date: "Nov 12",
        time: "8:00 PM",
        location: "Neo Tokyo",
        image:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: "2",
        category: "TECH",
        tagColor: "blue",
        title: "TECH SUMMIT ALPHA",
        date: "Dec 05",
        time: "9:00 AM",
        location: "Silicon Valley",
        image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: "3",
        category: "FESTIVAL",
        tagColor: "pink",
        title: "NEON MUSIC FESTIVAL",
        date: "Jan 20",
        time: "6:00 PM",
        location: "Miami Beach",
        image:
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80",
    },
    ];

    export function Start() {
    // TODO: reemplazar demoEvents por fetch real
    return (
        <>
        <main>
            <HeroSection />
            <StatsStrip />
            <TrendingSection events={demoEvents} />
        </main>
        </>
    );
}
