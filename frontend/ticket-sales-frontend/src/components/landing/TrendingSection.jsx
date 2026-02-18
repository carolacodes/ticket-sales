import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TrendingSection({ events = [] }) {
    return (
        <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between">
            <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                TRENDING EXPERIENCES
            </h2>
            <p className="mt-2 text-sm text-white/60">
                Discover the hottest events happening in the metaverse and beyond.
            </p>
            </div>

            <a href="/events" className="text-sm text-violet-300 hover:text-violet-200">
            View all →
            </a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            {events.slice(0, 3).map((e) => (
            <Card
                key={e.id}
                className="overflow-hidden border-white/10 bg-white/5 backdrop-blur"
            >
                <div className="relative h-44 w-full">
                <img
                    src={e.image}
                    alt={e.title}
                    className="h-full w-full object-cover"
                />
                <div className="absolute left-4 top-4">
                    <Badge
                    className={[
                        "border-white/10 text-white",
                        e.tagColor === "violet" ? "bg-violet-600/70" : "",
                        e.tagColor === "blue" ? "bg-sky-600/70" : "",
                        e.tagColor === "pink" ? "bg-pink-600/70" : "",
                    ].join(" ")}
                    >
                    {e.category}
                    </Badge>
                </div>
                </div>

                <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{e.date} • {e.time}</span>
                    <span>📍 {e.location}</span>
                </div>

                <div className="mt-3 text-lg font-semibold">{e.title}</div>

                <Button
                    className="mt-5 w-full bg-white/10 text-white hover:bg-white/15"
                    variant="secondary"
                >
                    Get Tickets
                </Button>
                </CardContent>
            </Card>
            ))}
        </div>
        </section>
    );
}
