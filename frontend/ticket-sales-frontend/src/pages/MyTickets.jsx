import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getMyTickets } from "@/api/tickets.api.js";
import { getEventById, getEventTicketTypes } from "@/api/events.api.js";

import { SiteNavbar } from "@/components/layout/SiteNavbar";
import { UserNavbar } from "@/components/layout/UserNavbar";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import * as Dialog from "@radix-ui/react-dialog";
import { QRCodeCanvas } from "qrcode.react";
import {
    Search,
    Ticket,
    X,
    Copy,
    Download,
    MapPin,
    Calendar,
} from "lucide-react";

function safeBanner(url) {
    return (
        url ||
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80"
    );
}

function formatDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    const date = d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
    const time = d.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
    });
    return `${date} • ${time}`;
}

function statusBadge(status) {
    const s = (status || "").toUpperCase();
    if (s === "VALID")
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    if (s === "USED")
        return "border-yellow-500/20 bg-yellow-500/10 text-yellow-200";
    return "border-white/10 bg-white/10 text-white";
}

function typeBadge(name) {
    const n = (name || "").toUpperCase();
    if (n === "VIP") return "border-violet-500/20 bg-violet-600/15 text-violet-200";
    return "border-sky-500/20 bg-sky-500/10 text-sky-200";
}

export function MyTickets() {

    const [tickets, setTickets] = useState([]);
    const [eventsMap, setEventsMap] = useState({});
    const [ttMap, setTtMap] = useState({}); // ticketTypeId -> { name, price, ... }

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // UI controls
    const [query, setQuery] = useState("");
    const [tab, setTab] = useState("VALID"); // VALID | USED

    // Modal
    const [open, setOpen] = useState(false);
    const [activeTicket, setActiveTicket] = useState(null);
    const qrCanvasRef = useRef(null);

    useEffect(() => {
        let alive = true;

        async function run() {
        try {
            setLoading(true);
            setErr("");

            // 1) Tickets del usuario
            const res = await getMyTickets();
            const list = res?.data?.tickets ?? [];
            if (!alive) return;

            setTickets(Array.isArray(list) ? list : []);

            // 2) Enriquecer (eventos + ticketTypes)
            const uniqueEventIds = [...new Set((list || []).map((t) => t.eventId).filter(Boolean))];

            // Traemos todos los eventos
            const evPairs = await Promise.all(
            uniqueEventIds.map(async (eid) => {
                const r = await getEventById(eid);
                return [eid, r?.data?.event ?? null];
            })
            );

            const nextEventsMap = Object.fromEntries(evPairs.filter(([, ev]) => ev));
            if (!alive) return;
            setEventsMap(nextEventsMap);

            // Traemos ticket types por evento y armamos map global por id
            const ttByEvent = await Promise.all(
            uniqueEventIds.map(async (eid) => {
                const r = await getEventTicketTypes(eid);
                return r?.data?.ticketTypes ?? [];
            })
            );

            const flatTT = ttByEvent.flat().filter(Boolean);
            const nextTTMap = {};
            for (const tt of flatTT) {
            // tu response usa "id" como key
            if (tt?.id) nextTTMap[tt.id] = tt;
            }
            if (!alive) return;
            setTtMap(nextTTMap);
        } catch (e) {
            setErr("No se pudieron cargar tus tickets. Error: " + e.message);
        } finally {
            if (!alive) return;
            setLoading(false);
        }
        }

        run();
        return () => {
        alive = false;
        };
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return (tickets || [])
        .filter((t) => {
            // tab filter
            const st = (t.status || "").toUpperCase();
            if (tab === "VALID") return st === "VALID";
            if (tab === "USED") return st === "USED";
            return true;
        })
        .filter((t) => {
            if (!q) return true;

            const ev = eventsMap[t.eventId];
            const tt = ttMap[t.ticketTypeId];

            const hay = [
            ev?.title,
            ev?.venue,
            ev?.city,
            tt?.name,
            t.code,
            ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

            return hay.includes(q);
        });
    }, [tickets, tab, query, eventsMap, ttMap]);

    function openTicketModal(t) {
        setActiveTicket(t);
        setOpen(true);
    }

    function closeModal() {
        setOpen(false);
        setActiveTicket(null);
    }

    async function copyCode() {
        if (!activeTicket?.code) return;
        try {
        await navigator.clipboard.writeText(activeTicket.code);
        } catch {
        // fallback: nada
        }
    }

    function downloadQR() {
        // QRCodeCanvas renderiza un <canvas> -> lo descargamos como PNG
        const canvas = qrCanvasRef.current;
        if (!canvas) return;
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `ticket-qr-${activeTicket?.code?.slice(0, 8) || "qr"}.png`;
        a.click();
    }

    const activeEvent = activeTicket ? eventsMap[activeTicket.eventId] : null;
    const activeTT = activeTicket ? ttMap[activeTicket.ticketTypeId] : null;

    return (
        <>

        <div className="mx-auto max-w-6xl px-4 py-10">
            {/* Header row */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
                <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
                MY TICKETS
                </h1>
                <p className="mt-3 text-sm text-white/60">
                Manage and access your digital event passes.
                </p>
            </div>

            {/* Search + tabs */}
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                <div className="relative w-full md:w-[320px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search events..."
                    className="h-11 rounded-full border-white/10 bg-white/5 pl-10"
                />
                </div>

                <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                <button
                    onClick={() => setTab("VALID")}
                    className={[
                    "h-9 rounded-full px-5 text-sm transition",
                    tab === "VALID"
                        ? "bg-violet-600 text-white"
                        : "text-white/70 hover:text-white",
                    ].join(" ")}
                >
                    Valid
                </button>
                <button
                    onClick={() => setTab("USED")}
                    className={[
                    "h-9 rounded-full px-5 text-sm transition",
                    tab === "USED"
                        ? "bg-violet-600 text-white"
                        : "text-white/70 hover:text-white",
                    ].join(" ")}
                >
                    Used
                </button>
                </div>
            </div>
            </div>

            {/* Content */}
            <div className="mt-10">
            {loading ? (
                <div className="grid gap-6 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="border-white/10 bg-white/5">
                    <div className="h-44 animate-pulse bg-white/10" />
                    <CardContent className="p-6">
                        <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
                        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                        <div className="mt-6 h-11 w-full animate-pulse rounded-2xl bg-white/10" />
                    </CardContent>
                    </Card>
                ))}
                </div>
            ) : err ? (
                <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6 text-sm text-white/70">{err}</CardContent>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6 text-sm text-white/70">
                    No hay tickets para mostrar.
                    <div className="mt-3">
                    <Link className="text-violet-300 hover:text-violet-200" to="/events">
                        → Ir a Events
                    </Link>
                    </div>
                </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                {filtered.map((t) => {
                    const ev = eventsMap[t.eventId];
                    const tt = ttMap[t.ticketTypeId];

                    return (
                    <Card
                        key={t._id}
                        className="overflow-hidden rounded-3xl border-white/10 bg-white/5"
                    >
                        <div className="relative">
                        <img
                            src={safeBanner(ev?.bannerUrl)}
                            alt={ev?.title || "Event"}
                            className="h-44 w-full object-cover"
                        />
                        <div className="absolute right-4 top-4">
                            <Badge className={["rounded-full px-3 py-1", statusBadge(t.status)].join(" ")}>
                            {(t.status || "—").toUpperCase()}
                            </Badge>
                        </div>
                        </div>

                        <CardContent className="p-6">
                        <div className="text-lg font-semibold leading-tight">
                            {(ev?.title || "Event").toUpperCase()}
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-violet-300" />
                            <span>{formatDateTime(ev?.startAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-violet-300" />
                            <span>{ev?.venue || "—"}{ev?.city ? `, ${ev.city}` : ""}</span>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Badge className={["rounded-full px-3 py-1", typeBadge(tt?.name)].join(" ")}>
                            {(tt?.name || "TICKET").toUpperCase()}
                            </Badge>
                            <Badge className="rounded-full border-white/10 bg-white/10 px-3 py-1 text-white">
                            <Ticket className="mr-1 inline h-4 w-4" />
                            {t.code?.slice(0, 8)}…
                            </Badge>
                        </div>

                        <Button
                            className="mt-6 h-11 w-full rounded-2xl bg-violet-600 hover:bg-violet-500"
                            onClick={() => openTicketModal(t)}
                        >
                            ▣ VIEW QR TICKET
                        </Button>
                        </CardContent>
                    </Card>
                    );
                })}
                </div>
            )}
            </div>

            {/* Help Card */}
            <Card className="mt-10 border-white/10 bg-white/5">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/25">
                    ?
                </div>
                <div>
                    <div className="font-semibold text-white/90">Need help with your tickets?</div>
                    <div className="text-sm text-white/60">
                    Visit our help center or contact our 24/7 support.
                    </div>
                </div>
                </div>
                <Button
                variant="outline"
                className="rounded-full border-violet-500/25 bg-white/5 hover:bg-white/10"
                onClick={() => alert("Luego lo conectamos 😉")}
                >
                SUPPORT CENTER
                </Button>
            </CardContent>
            </Card>
        </div>

        {/* QR MODAL */}
        <Dialog.Root open={open} onOpenChange={(v) => (v ? null : closeModal())}>
            <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />

            <Dialog.Content
                className="
                    fixed left-1/2 top-1/2 z-50
                    w-[92vw] max-w-md
                    -translate-x-1/2 -translate-y-1/2
                    rounded-3xl border border-white/10
                    bg-[#0b0812]/95 shadow-2xl
                    max-h-[85vh] overflow-y-auto
                "
                >
                {/* HEADER STICKY */}
                <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0812]/95 px-6 pt-6 pb-4 backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                    <div className="text-xs uppercase tracking-widest text-violet-300">
                        Your entry pass
                    </div>
                    <button
                        onClick={closeModal}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    </div>

                    <div className="mt-2 text-3xl font-extrabold">
                    {(activeEvent?.title || "EVENT").toUpperCase()}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={["rounded-full px-3 py-1", typeBadge(activeTT?.name)].join(" ")}>
                        {(activeTT?.name || "TICKET").toUpperCase()}
                    </Badge>
                    <Badge className={["rounded-full px-3 py-1", statusBadge(activeTicket?.status)].join(" ")}>
                        {(activeTicket?.status || "—").toUpperCase()}
                    </Badge>
                    </div>
                </div>

                {/* BODY SCROLLABLE */}
                <div className="px-6 pb-6 pt-5">

                    {/* QR */}
                    <div className="grid place-items-center">
                    <div className="rounded-2xl bg-white p-4 shadow-xl">
                        <QRCodeCanvas
                        value={activeTicket?.code || ""}
                        size={190}
                        includeMargin
                        ref={qrCanvasRef}
                        />
                    </div>
                    </div>

                    {/* Ticket ID */}
                    <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-600/10 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">
                        Ticket ID
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="font-mono text-lg font-semibold text-white">
                        {activeTicket?.code || "—"}
                        </div>
                        <button
                        onClick={copyCode}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                        aria-label="Copy code"
                        >
                        <Copy className="h-4 w-4" />
                        </button>
                    </div>
                    </div>

                    {/* Info */}
                    <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-white/70">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/45">
                        Date & Time
                        </div>
                        <div className="mt-1 text-white/85">
                        {formatDateTime(activeEvent?.startAt)}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/45">
                        Location
                        </div>
                        <div className="mt-1 text-white/85">
                        {activeEvent?.venue || "—"}
                        </div>
                    </div>
                    </div>

                    <Separator className="my-6 bg-white/10" />

                    <Button
                    className="h-11 w-full rounded-2xl bg-violet-600 hover:bg-violet-500"
                    onClick={downloadQR}
                    disabled={!activeTicket?.code}
                    >
                    <Download className="mr-2 h-4 w-4" />
                    DOWNLOAD QR (PNG)
                    </Button>

                </div>
            </Dialog.Content>

            </Dialog.Portal>
        </Dialog.Root>
        </>
    );
}
