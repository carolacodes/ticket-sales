import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { listPublishedEvents } from "@/api/events.api.js";
import { useAuth } from "@/hooks/useAuth.js";

import { SiteNavbar } from "@/components/layout/SiteNavbar";
import { UserNavbar } from "@/components/layout/UserNavbar";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function toBanner(url) {
    return (
        url ||
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=80"
    );
}

function TagPill({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
        {label}
        <button onClick={onRemove} className="text-white/60 hover:text-white">
            ×
        </button>
        </span>
    );
}

export function Events() {
    const { isAuth, logout } = useAuth();

    // UI state
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);

    const [selectedTags, setSelectedTags] = useState(["Tech & SaaS"]);
    const [datePreset, setDatePreset] = useState("This Weekend"); // UI only
    const [price, setPrice] = useState([10, 500]); // UI only (si tu backend no filtra por precio)

    // data
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // backend params (solo mandamos lo que realmente soporta tu endpoint)
    const params = useMemo(() => {
        const p = { page, limit: 12 };
        if (q) p.q = q;

        // tu backend soporta tags? (dijiste "tags..." en comments)
        // te lo mando como "tags" (array) por si lo tomás en controller.
        if (selectedTags.length) p.tags = selectedTags.map((t) => t.toLowerCase());

        return p;
    }, [page, q, selectedTags]);

    useEffect(() => {
        let alive = true;

        async function run() {
        try {
            setLoading(true);
            const res = await listPublishedEvents(params);
            const list = res?.data?.events ?? [];
            if (!alive) return;
            setEvents(list);
        } finally {
            if (!alive) return;
            setLoading(false);
        }
        }

        run();
        return () => {
        alive = false;
        };
    }, [params]);

    function toggleTag(label) {
        setPage(1);
        setSelectedTags((prev) =>
        prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
        );
    }

    function clearAll() {
        setQ("");
        setSelectedTags([]);
        setDatePreset("");
        setPrice([10, 500]);
        setPage(1);
    }

    return (
        <>

        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <aside className="space-y-5">
            {/* Categories */}
            <Card className="border-white/10 bg-white/5">
                <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wide text-white/90">
                    CATEGORIES
                    </div>
                    <span className="text-xs text-white/40">⚙️</span>
                </div>

                <div className="grid gap-3 text-sm text-white/80">
                    {["Tech & SaaS", "Music Festivals", "Workshops", "Networking"].map(
                    (t) => (
                        <label key={t} className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={selectedTags.includes(t)}
                            onChange={() => toggleTag(t)}
                            className="h-4 w-4 accent-violet-500"
                        />
                        {t}
                        </label>
                    )
                    )}
                </div>
                </CardContent>
            </Card>

            {/* Date */}
            <Card className="border-white/10 bg-white/5">
                <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wide text-white/90">
                    DATE
                    </div>
                    <span className="text-xs text-white/40">📅</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {["This Weekend", "Tomorrow", "This Month"].map((x) => (
                    <button
                        key={x}
                        onClick={() => setDatePreset(x)}
                        className={[
                        "rounded-full border px-3 py-1 text-xs",
                        datePreset === x
                            ? "border-violet-500/40 bg-violet-600/20 text-violet-100"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                        ].join(" ")}
                    >
                        {x}
                    </button>
                    ))}
                </div>

                <div className="mt-4">
                    <Button
                    variant="outline"
                    className="w-full border-white/10 bg-white/5 hover:bg-white/10"
                    >
                    Select Range
                    </Button>
                </div>
                </CardContent>
            </Card>

            {/* Price */}
            <Card className="border-white/10 bg-white/5">
                <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wide text-white/90">
                    PRICE
                    </div>
                    <span className="text-xs text-white/40">💲</span>
                </div>

                <div className="space-y-3">
                    <input
                    type="range"
                    min={0}
                    max={500}
                    value={price[1]}
                    onChange={(e) => setPrice([price[0], Number(e.target.value)])}
                    className="w-full accent-violet-500"
                    />
                    <div className="flex items-center justify-between text-xs text-white/60">
                    <span>${price[0]}</span>
                    <span>${price[1]}+</span>
                    </div>
                </div>
                </CardContent>
            </Card>
            </aside>

            {/* Main */}
            <main className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                Discover Experiences
                </h1>
                <p className="mt-2 text-sm text-white/60">
                Explore the best futuristic events in your area
                </p>
            </div>

            {/* Search bar */}
            <Card className="border-white/10 bg-white/5">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <Input
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search by artist, venue, or event..."
                    className="border-white/10 bg-white/5"
                    />
                </div>
                <Button className="bg-violet-600 hover:bg-violet-500">
                    Search
                </Button>
                </CardContent>
            </Card>

            {/* Active filters */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-white/60">Active filters:</span>

                {selectedTags.map((t) => (
                <TagPill
                    key={t}
                    label={t}
                    onRemove={() => toggleTag(t)}
                />
                ))}

                {datePreset ? (
                <TagPill
                    label={datePreset}
                    onRemove={() => setDatePreset("")}
                />
                ) : null}

                <TagPill
                label={`$${price[0]} - $${price[1]}`}
                onRemove={() => setPrice([10, 500])}
                />

                <button
                onClick={clearAll}
                className="ml-2 text-xs text-violet-300 hover:text-violet-200"
                >
                Clear all
                </button>
            </div>

            {/* Grid */}
            <Separator className="bg-white/10" />

            {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="border-white/10 bg-white/5">
                    <div className="h-40 w-full animate-pulse bg-white/10" />
                    <CardContent className="p-5">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                        <div className="mt-5 h-2 w-full animate-pulse rounded bg-white/10" />
                    </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e) => (
                    <Card
                    key={e._id}
                    className="overflow-hidden border-white/10 bg-white/5"
                    >
                    <div className="relative h-40 w-full">
                        <img
                        src={toBanner(e.bannerUrl)}
                        alt={e.title}
                        className="h-full w-full object-cover"
                        />
                        <div className="absolute right-3 top-3">
                        <Badge className="border-white/10 bg-black/60 text-white">
                            {e.tags?.includes("free") ? "FREE" : ""}
                        </Badge>
                        </div>
                    </div>

                    <CardContent className="p-5">
                        <div className="mb-2 flex flex-wrap gap-2">
                        {(e.tags ?? []).slice(0, 1).map((t) => (
                            <Badge
                            key={t}
                            className="border-white/10 bg-violet-600/20 text-violet-100"
                            >
                            {t.toUpperCase()}
                            </Badge>
                        ))}
                        </div>

                        <div className="text-lg font-semibold">{e.title}</div>

                        <div className="mt-3 grid gap-1 text-xs text-white/60">
                        <div>📅 {formatDate(e.startAt)}</div>
                        <div>📍 {e.city} • {e.venue}</div>
                        </div>

                        <div className="mt-5 flex justify-end">
                        <Button asChild className="bg-violet-600 hover:bg-violet-500">
                            <Link to={`/events/${e._id}`}>View</Link>
                        </Button>
                        </div>
                    </CardContent>
                    </Card>
                ))}
                </div>
            )}

            {/* Pagination (simple) */}
            <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                ‹
                </Button>

                <span className="grid h-9 w-9 place-items-center rounded-md bg-violet-600 text-sm">
                {page}
                </span>

                <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                disabled={events.length < 12}
                onClick={() => setPage((p) => p + 1)}
                >
                ›
                </Button>
            </div>
            </main>
        </div>
        </>
    );
}
