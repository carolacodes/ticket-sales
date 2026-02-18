import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getEventById, getEventTicketTypes } from "@/api/events.api.js";
import { useAuth } from "@/hooks/useAuth.js";

import { SiteNavbar } from "@/components/layout/SiteNavbar";
import { UserNavbar } from "@/components/layout/UserNavbar";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function safeBanner(url) {
    return (
        url ||
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1800&q=80"
    );
}

function priceFrom(ticketTypes) {
    const prices = (ticketTypes ?? [])
        .map((t) => Number(t.price))
        .filter((n) => Number.isFinite(n));
    if (!prices.length) return null;
    return Math.min(...prices);
}

function Money({ value }) {
    if (value == null) return <span>—</span>;
    return (
        <span>
        ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
    );
}

function Chip({ label, value }) {
    return (
        <div className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
        <div className="h-7 w-7 rounded-full bg-violet-600/20 ring-1 ring-violet-500/30" />
        <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-widest text-white/50">
            {label}
            </div>
            <div className="text-sm font-medium text-white/90">{value}</div>
        </div>
        </div>
    );
}

function ProgressBar({ value = 0 }) {
    const v = Math.max(0, Math.min(100, value));
    return (
        <div className="h-2 w-full rounded-full bg-white/10">
        <div
            className="h-2 rounded-full bg-violet-600"
            style={{ width: `${v}%` }}
        />
        </div>
    );
}

export function EventDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { isAuth, logout } = useAuth();

    const [event, setEvent] = useState(null);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const minPrice = useMemo(() => priceFrom(ticketTypes), [ticketTypes]);

    useEffect(() => {
        let alive = true;

        async function run() {
        try {
            setLoading(true);

            const [evRes, ttRes] = await Promise.all([
            getEventById(id),
            getEventTicketTypes(id),
            ]);

            if (!alive) return;

            const ev = evRes?.data?.event ?? evRes?.data ?? null;
            const tts = ttRes?.data?.ticketTypes ?? [];

            setEvent(ev);
            setTicketTypes(Array.isArray(tts) ? tts : []);
        } finally {
            if (!alive) return;
            setLoading(false);
        }
        }

        run();
        return () => {
        alive = false;
        };
    }, [id]);

    function goCheckout(ticketTypeId) {
        nav(`/checkout/${id}`, { state: { ticketTypeId } });
    }
    if (loading) {
        return (
        <>
            <div className="mx-auto max-w-6xl px-4 py-10">
            <Card className="border-white/10 bg-white/5">
                <div className="h-72 animate-pulse bg-white/10" />
                <CardContent className="p-6">
                <div className="h-7 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                <div className="mt-6 h-24 w-full animate-pulse rounded bg-white/10" />
                </CardContent>
            </Card>
            </div>
        </>
        );
    }

    if (!event) {
        return (
        <>
            <div className="mx-auto max-w-6xl px-4 py-10">
            <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6 text-white/80">
                No se encontró el evento.
                </CardContent>
            </Card>
            </div>
        </>
        );
    }

    return (
        <>
        

        <div className="mx-auto max-w-6xl px-4 py-8">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <img
                src={safeBanner(event.bannerUrl)}
                alt={event.title}
                className="h-[360px] w-full object-cover md:h-[420px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                <Badge className="border-white/10 bg-violet-600/40 text-white">
                {(event.tags?.[0] ?? "EVENT").toUpperCase()}
                </Badge>
                <Badge className="border-white/10 bg-emerald-500/20 text-emerald-100">
                {event.status === "PUBLISHED" ? "ON SALE" : event.status}
                </Badge>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                {event.title}
                </h1>

                <div className="mt-5 flex flex-wrap gap-3">
                <Chip label="Location" value={event.venue || "—"} />
                <Chip label="Date" value={formatDate(event.startAt)} />
                <Chip
                    label="Time"
                    value={`${formatTime(event.startAt)} - ${formatTime(event.endAt)}`}
                />
                <Chip label="City" value={event.city || "—"} />
                </div>
            </div>
            </div>

            {/* CONTENT */}
            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_340px]">
            {/* LEFT */}
            <div className="space-y-6">
                <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                    <div className="h-6 w-1 rounded-full bg-violet-600" />
                    <h2 className="text-lg font-semibold">About the Event</h2>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-white/70">
                    {event.description || "—"}
                    </p>
                </CardContent>
                </Card>

                {/* Ticket tiers */}
                <div id="ticket-tiers" className="pt-2">
                <h3 className="text-center text-xl font-semibold">
                    Available Ticket Tiers
                </h3>
                <p className="mt-2 text-center text-sm text-white/60">
                    Elegí tu tipo de entrada y continuá al checkout.
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {(ticketTypes ?? []).map((t) => {
                    const sold = Number(t.soldCount ?? 0);
                    const cap = Number(t.capacity ?? 0);
                    const percent = cap > 0 ? Math.round((sold / cap) * 100) : 0;
                    const isSoldOut = Number(t.available ?? 0) <= 0;
                    const isVip = (t.name ?? "").toUpperCase() === "VIP";

                    return (
                        <Card
                        key={t.id}
                        className={[
                            "border-white/10 bg-white/5",
                            isVip ? "ring-1 ring-violet-500/30" : "",
                        ].join(" ")}
                        >
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-lg font-semibold">
                                {t.name}
                                </div>
                                <div className="mt-1 text-sm text-white/60">
                                {cap
                                    ? `${cap} capacity • ${t.available} available`
                                    : `${t.available} available`}
                                </div>
                            </div>

                            <Badge
                                className={
                                isSoldOut
                                    ? "border-white/10 bg-red-500/20 text-red-100"
                                    : "border-white/10 bg-emerald-500/15 text-emerald-100"
                                }
                            >
                                {isSoldOut ? "SOLD OUT" : "AVAILABLE"}
                            </Badge>
                            </div>

                            <Separator className="my-5 bg-white/10" />

                            <div>
                            <div className="flex items-center justify-between text-xs text-white/60">
                                <span>Capacity</span>
                                <span>{percent}% sold</span>
                            </div>
                            <div className="mt-2">
                                <ProgressBar value={percent} />
                            </div>
                            </div>

                            <div className="mt-5 flex items-end justify-between">
                            <div className="text-2xl font-bold">
                                <Money value={t.price} />
                            </div>

                            <Button
                                className="bg-violet-600 hover:bg-violet-500"
                                disabled={isSoldOut}
                                onClick={() => goCheckout(t.id)}
                            >
                                {isVip ? "Go VIP" : "Select"}
                            </Button>
                            </div>
                        </CardContent>
                        </Card>
                    );
                    })}
                </div>

                {ticketTypes.length === 0 ? (
                    <Card className="mt-6 border-white/10 bg-white/5">
                    <CardContent className="p-6 text-sm text-white/70">
                        Este evento todavía no tiene tipos de entradas disponibles.
                    </CardContent>
                    </Card>
                ) : null}
                </div>

                {/* Location section (simple) */}
                <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                    <div className="h-6 w-1 rounded-full bg-violet-600" />
                    <h2 className="text-lg font-semibold">Location & Venue</h2>
                    </div>

                    <div className="mt-4 text-sm text-white/70">
                    <div className="font-medium text-white/85">{event.venue}</div>
                    <div className="mt-1">{event.city}</div>

                    <div className="mt-4">
                        <Button
                        variant="outline"
                        className="border-white/10 bg-white/5 hover:bg-white/10"
                        asChild
                        >
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${event.venue} ${event.city}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Get Directions
                        </a>
                        </Button>
                    </div>
                    </div>
                </CardContent>
                </Card>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">
                <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                    <div className="text-sm text-white/60">Tickets from</div>
                    <div className="text-2xl font-bold">
                        <Money value={minPrice} />
                    </div>
                    </div>

                    <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-white/60">
                        <span>Venue Capacity</span>
                        <span>—</span>
                    </div>
                    <div className="mt-2">
                        <ProgressBar value={65} />
                    </div>
                    <div className="mt-2 text-[11px] text-white/45">
                        *Demo visual (cuando tengas sold/capacity real lo conectamos)
                    </div>
                    </div>

                    <div className="mt-6 grid gap-3">
                    <Button
                        className="bg-violet-600 hover:bg-violet-500"
                        onClick={() => {
                        const el = document.getElementById("ticket-tiers");
                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                    >
                        Buy Tickets Now
                    </Button>

                    <Button
                        variant="outline"
                        className="border-white/10 bg-white/5 hover:bg-white/10"
                    >
                        Add to Wishlist
                    </Button>
                    </div>

                    <Separator className="my-6 bg-white/10" />

                    <div className="grid grid-cols-2 gap-3 text-xs text-white/60">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                        ✅ SECURE
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                        ♻️ RESALEABLE
                    </div>
                    </div>
                </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6 text-sm text-white/70">
                    <div className="font-semibold text-white/90">Quick actions</div>
                    <div className="mt-3 grid gap-2">
                    <Link
                        className="text-violet-300 hover:text-violet-200"
                        to="/events"
                    >
                        ← Back to events
                    </Link>
                    </div>
                </CardContent>
                </Card>
            </div>
            </div>
        </div>
        </>
    );
}
