import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getMyEventsRequest, updateEventStatusRequest } from "@/api/events.api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Plus,
    Search,
    MoreHorizontal,
    Calendar,
    MapPin,
    ArrowUpRight,
} from "lucide-react";

function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function statusBadge(status) {
    if (status === "PUBLISHED")
        return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
    if (status === "ENDED")
        return "border-zinc-500/25 bg-zinc-500/10 text-zinc-200";
    return "border-amber-500/25 bg-amber-500/10 text-amber-200"; // DRAFT
}

function statusLabel(status) {
    if (status === "PUBLISHED") return "LIVE";
    if (status === "ENDED") return "ENDED";
    return "DRAFT";
}

const ALLOWED_STATUS = new Set(["DRAFT", "PUBLISHED", "ENDED"]);

export function MyEvents() {
    const nav = useNavigate();

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);

    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("ALL"); // ALL | DRAFT | PUBLISHED | ENDED

    async function load() {
        const r = await getMyEventsRequest();
        setEvents(r.data?.events ?? []);
    }

    useEffect(() => {
        let alive = true;
        (async () => {
        try {
            setLoading(true);
            await load();
        } finally {
            if (alive) setLoading(false);
        }
        })();
        return () => (alive = false);
    }, []);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return events
        .filter((e) => (filter === "ALL" ? true : e.status === filter))
        .filter((e) => (!s ? true : (e.title || "").toLowerCase().includes(s)));
    }, [events, q, filter]);

    const hasEvents = events.length > 0;

    // ✅ FIX: mandamos { status: "PUBLISHED" } (objeto) y normalizamos
    async function setStatus(id, nextStatus) {
        const status = String(nextStatus || "").toUpperCase().trim();

        if (!ALLOWED_STATUS.has(status)) {
        console.error("Invalid status attempted:", nextStatus);
        return;
        }

        try {
        await updateEventStatusRequest(id, { status }); // ✅
        await load();
        } catch (err) {
        // para ver el error real del backend
        console.log("UPDATE_STATUS_ERR", err?.response?.data || err?.message);
        throw err;
        }
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
            <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
                MY EVENTS
            </h1>
            <p className="mt-3 text-white/60">
                Manage your published events and drafts.
            </p>
            </div>

            <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="relative w-full md:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search your events..."
                className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30"
                />
            </div>

            <Button
                className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
                onClick={() => nav("/dashboard")} // por ahora abrimos el modal create desde dashboard
            >
                <Plus className="mr-2 h-4 w-4" />
                Create
            </Button>
            </div>
        </div>

        {/* FILTERS */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
            {["ALL", "DRAFT", "PUBLISHED", "ENDED"].map((k) => (
            <button
                key={k}
                onClick={() => setFilter(k)}
                className={[
                "rounded-full border px-3 py-1.5 text-sm transition",
                filter === k
                    ? "border-violet-500/30 bg-violet-600/15 text-violet-200"
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
                ].join(" ")}
            >
                {k === "ALL" ? "All" : k}
            </button>
            ))}
        </div>

        <Separator className="my-6 bg-white/10" />

        {/* EMPTY */}
        {!loading && !hasEvents ? (
            <Card className="border-white/10 bg-white/5">
            <CardContent className="p-10">
                <div className="flex flex-col items-center text-center">
                <div className="text-2xl font-bold">No events yet 🥲</div>
                <p className="mt-2 max-w-md text-sm text-white/60">
                    Create your first event to start selling tickets.
                </p>
                <Button
                    className="mt-6 h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
                    onClick={() => nav("/dashboard")}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                </Button>
                </div>
            </CardContent>
            </Card>
        ) : (
            <>
            {/* GRID */}
            <div className="grid gap-5 md:grid-cols-2">
                {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-white/10 bg-white/5">
                    <CardContent className="p-6">
                        <div className="h-36 animate-pulse rounded-2xl bg-white/10" />
                        <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-white/10" />
                        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                        <div className="mt-5 h-10 w-full animate-pulse rounded-2xl bg-white/10" />
                    </CardContent>
                    </Card>
                ))
                ) : (
                filtered.map((e) => (
                    <EventCard key={e._id} e={e} onStatus={setStatus} />
                ))
                )}
            </div>

            {!loading && filtered.length === 0 ? (
                <div className="mt-10 text-center text-sm text-white/50">
                No events match your filters.
                </div>
            ) : null}
            </>
        )}
        </div>
    );
}

function EventCard({ e, onStatus }) {
    const cover = e.bannerUrl;

    return (
        <Card className="border-white/10 bg-white/5">
        <CardContent className="p-6">
            {/* Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            {cover ? (
                <img
                src={cover}
                alt=""
                className="h-40 w-full object-cover opacity-80"
                />
            ) : (
                <div className="h-40 w-full bg-gradient-to-r from-violet-600/20 via-white/5 to-transparent" />
            )}

            <div className="absolute left-4 top-4 flex items-center gap-2">
                <Badge
                className={[
                    "rounded-full px-3 py-1 border",
                    statusBadge(e.status),
                ].join(" ")}
                >
                {statusLabel(e.status)}
                </Badge>
            </div>

            {/* actions */}
            <div className="absolute right-3 top-3">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                    variant="outline"
                    className="h-9 w-9 rounded-xl border-white/10 bg-black/40 p-0 hover:bg-black/60"
                    >
                    <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="border-white/10 bg-black/85 text-white">
                    <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                        View Insights <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                    </DropdownMenuItem>

                    {e.status !== "PUBLISHED" ? (
                    <DropdownMenuItem onClick={() => onStatus(e._id, "PUBLISHED")}>
                        Publish
                    </DropdownMenuItem>
                    ) : (
                    <DropdownMenuItem onClick={() => onStatus(e._id, "DRAFT")}>
                        Back to Draft
                    </DropdownMenuItem>
                    )}

                    {e.status !== "ENDED" ? (
                    <DropdownMenuItem onClick={() => onStatus(e._id, "ENDED")}>
                        Mark as Ended
                    </DropdownMenuItem>
                    ) : null}
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
            </div>

            {/* Title */}
            <div className="mt-4 flex items-start justify-between gap-3">
            <div>
                <div className="text-xl font-extrabold tracking-tight">
                {(e.title || "EVENT").toUpperCase()}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/65">
                <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-white/40" />
                    {formatDateTime(e.startAt)}
                </span>

                <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-white/40" />
                    {e.venue || "—"}
                    {e.city ? `, ${e.city}` : ""}
                </span>
                </div>
            </div>
            </div>

            {/* Tags */}
            {e.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
                {e.tags.slice(0, 4).map((t) => (
                <Badge
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70"
                >
                    {t.toUpperCase()}
                </Badge>
                ))}
            </div>
            ) : null}

            <Separator className="my-5 bg-white/10" />

            {/* Footer buttons */}
            <div className="grid gap-3 md:grid-cols-2">
            <Button
                variant="outline"
                className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                asChild
            >
                <Link to="/dashboard">View Insights</Link>
            </Button>

            {e.status !== "PUBLISHED" ? (
                <Button
                className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
                onClick={() => onStatus(e._id, "PUBLISHED")}
                >
                Publish
                </Button>
            ) : (
                <Button
                className="h-11 rounded-2xl bg-zinc-800 hover:bg-zinc-700"
                onClick={() => onStatus(e._id, "ENDED")}
                >
                End Event
                </Button>
            )}
            </div>

            <div className="mt-4 text-xs text-white/35">
            Created: {formatDateTime(e.createdAt)} • Updated:{" "}
            {formatDateTime(e.updatedAt)}
            </div>
        </CardContent>
        </Card>
    );
}
