import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    getMyEventsSummaryRequest,
    getEventSummaryRequest,
    createEventRequest,
    updateEventStatusRequest,
} from "@/api/events.api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import * as Dialog from "@radix-ui/react-dialog";

import {
    Plus,
    Search,
    MoreHorizontal,
    Sparkles,
    ArrowUpRight,
    Ticket,
    DollarSign,
    ClipboardList,
    Image as ImageIcon,
    X,
} from "lucide-react";

function money(n) {
    const v = Number(n || 0);
    return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function number(n) {
    const v = Number(n || 0);
    return v.toLocaleString("en-US");
}
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
    if (status === "PUBLISHED") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
    if (status === "ENDED") return "border-zinc-500/25 bg-zinc-500/10 text-zinc-200";
    return "border-amber-500/25 bg-amber-500/10 text-amber-200"; // DRAFT
}

const ALLOWED_STATUS = new Set(["DRAFT", "PUBLISHED", "ENDED"]);

    export function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);

    const [q, setQ] = useState("");
    const [activeEventId, setActiveEventId] = useState(null);

    const [insightsLoading, setInsightsLoading] = useState(false);
    const [insights, setInsights] = useState(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createErr, setCreateErr] = useState("");

    const [title, setTitle] = useState("");
    const [city, setCity] = useState("");
    const [venue, setVenue] = useState("");
    const [startAt, setStartAt] = useState(""); // datetime-local
    const [endAt, setEndAt] = useState(""); // datetime-local

    // ✅ Banner (opcional): por ahora mandamos bannerUrl (string) al backend
    // Si querés subir archivo real, más abajo te digo qué endpoint haría falta.
    const [bannerUrl, setBannerUrl] = useState("");
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState("");

    async function load() {
        const r = await getMyEventsSummaryRequest();
        setSummary(r.data);
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

    // cleanup preview blob url
    useEffect(() => {
        return () => {
        if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
        };
    }, [bannerPreview]);

    const events = summary?.events ?? [];
    const totals = summary?.totals ?? {};

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return events;
        return events.filter((x) => (x?.event?.title || "").toLowerCase().includes(s));
    }, [events, q]);

    const hasEvents = events.length > 0;

    async function openInsights(eventId) {
        try {
        setActiveEventId(eventId);
        setInsights(null);
        setInsightsLoading(true);
        const r = await getEventSummaryRequest(eventId);
        setInsights(r.data);
        } finally {
        setInsightsLoading(false);
        }
    }

    // ✅ FIX publish: manda { status }
    async function setStatus(eventId, nextStatus) {
        const status = String(nextStatus || "").toUpperCase().trim();
        if (!ALLOWED_STATUS.has(status)) {
        console.error("Invalid status attempted:", nextStatus);
        return;
        }

        try {
        await updateEventStatusRequest(eventId, { status });
        await load();

        if (activeEventId === eventId) {
            await openInsights(eventId);
        }
        } catch (err) {
        console.log("DASHBOARD_UPDATE_STATUS_ERR", err?.response?.data || err?.message);
        throw err;
        }
    }

    function resetCreateForm() {
        setTitle("");
        setCity("");
        setVenue("");
        setStartAt("");
        setEndAt("");
        setBannerUrl("");
        setBannerFile(null);
        if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
        setBannerPreview("");
        setCreateErr("");
    }

    function onPickBannerFile(file) {
        if (!file) return;

        // opcional: validación básica
        if (!file.type?.startsWith("image/")) {
        setCreateErr("Please select an image file (PNG/JPG/WebP).");
        return;
        }
        if (file.size > 6 * 1024 * 1024) {
        setCreateErr("Image is too large. Max 6MB.");
        return;
        }

        setCreateErr("");
        setBannerFile(file);
        setBannerUrl(""); // si elegimos file, limpiamos url
        if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
        setBannerPreview(URL.createObjectURL(file));
    }

    function clearBanner() {
        setBannerFile(null);
        setBannerUrl("");
        if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
        setBannerPreview("");
    }

    async function onCreate(e) {
        e.preventDefault();
        setCreateErr("");

        if (!title.trim() || title.trim().length < 3) {
        setCreateErr("Title must be at least 3 characters.");
        return;
        }
        if (!startAt) {
        setCreateErr("Start date is required.");
        return;
        }

        try {
        setCreating(true);

        const startIso = new Date(startAt).toISOString();
        const endIso = endAt ? new Date(endAt).toISOString() : undefined;

        // ✅ IMPORTANTE:
        // Tu backend (createEventSchema) acepta bannerUrl (string URL).
        // Entonces:
        // - Si el user pega URL -> mandamos bannerUrl.
        // - Si el user selecciona archivo -> por ahora NO lo podemos subir
        //   sin un endpoint de upload (multipart/form-data). En ese caso
        //   mostramos error suave pidiendo URL (o implementamos upload).
        if (bannerFile) {
            setCreateErr(
            "Ahora mismo el backend solo acepta bannerUrl (URL). Para subir archivo necesitamos un endpoint de upload. Pegá una URL por ahora 🙂"
            );
            return;
        }

        await createEventRequest({
            title: title.trim(),
            city: city.trim() || undefined,
            venue: venue.trim() || undefined,
            startAt: startIso,
            endAt: endIso,
            bannerUrl: bannerUrl.trim() || undefined, // ✅ opcional
        });

        setCreateOpen(false);
        resetCreateForm();
        await load();
        } catch (err) {
        setCreateErr(err?.response?.data?.message || "Could not create event.");
        } finally {
        setCreating(false);
        }
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
        {/* TOP BAR */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
            <div className="text-xs uppercase tracking-widest text-white/40">
                Admin <span className="text-white/20">›</span> Dashboard
            </div>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
                Dashboard Overview
            </h1>
            <p className="mt-2 text-sm text-white/60">
                Here’s what’s happening with your events today.
            </p>
            </div>

            <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="relative w-full md:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search events..."
                className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30"
                />
            </div>

            <Button
                onClick={() => {
                resetCreateForm();
                setCreateOpen(true);
                }}
                className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
            >
                <Plus className="mr-2 h-4 w-4" />
                Create Event
            </Button>
            </div>
        </div>

        {/* KPI ROW */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
            <KpiCard
            loading={loading}
            icon={<DollarSign className="h-5 w-5" />}
            title="Total Revenue"
            value={money(totals.totalRevenuePaid)}
            hint={hasEvents ? "Paid orders only" : "Create your first event to start earning"}
            />
            <KpiCard
            loading={loading}
            icon={<Ticket className="h-5 w-5" />}
            title="Tickets Sold"
            value={number(totals.totalTicketsSoldPaid)}
            hint={hasEvents ? "Paid tickets only" : "No events yet"}
            />
            <KpiCard
            loading={loading}
            icon={<ClipboardList className="h-5 w-5" />}
            title="Orders Paid"
            value={number(totals.ordersPaid)}
            hint={`Pending: ${number(totals.ordersPending)} • Expired: ${number(totals.ordersExpired)}`}
            />
        </div>

        {/* EMPTY STATE */}
        {!loading && !hasEvents ? (
            <Card className="mt-6 border-white/10 bg-white/5">
            <CardContent className="p-10">
                <div className="flex flex-col items-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/25">
                    <Sparkles className="h-6 w-6 text-violet-200" />
                </div>
                <h2 className="mt-5 text-2xl font-bold">No events created yet</h2>
                <p className="mt-2 max-w-md text-sm text-white/60">
                    Create your first event to publish tickets, track sales, and manage attendees.
                </p>
                <Button
                    className="mt-6 h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
                    onClick={() => {
                    resetCreateForm();
                    setCreateOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                </Button>
                </div>
            </CardContent>
            </Card>
        ) : (
            <>
            {/* EVENTS TABLE + INSIGHTS */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold">Your Events</div>
                        <div className="mt-1 text-sm text-white/60">
                        Click an event to view insights.
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                        asChild
                    >
                        <Link to="/events">
                        View marketplace <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    </div>

                    <Separator className="my-5 bg-white/10" />

                    {loading ? (
                    <div className="grid gap-3">
                        <Skeleton className="h-10 w-full rounded-2xl bg-white/10" />
                        <Skeleton className="h-10 w-full rounded-2xl bg-white/10" />
                        <Skeleton className="h-10 w-full rounded-2xl bg-white/10" />
                    </div>
                    ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20">
                        <Table>
                        <TableHeader>
                            <TableRow className="border-white/10">
                            <TableHead className="text-white/60">Event</TableHead>
                            <TableHead className="text-white/60">Status</TableHead>
                            <TableHead className="text-white/60">Start</TableHead>
                            <TableHead className="text-right text-white/60">Tickets</TableHead>
                            <TableHead className="text-right text-white/60">Revenue</TableHead>
                            <TableHead className="text-right text-white/60">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filtered.map((row) => {
                            const e = row.event;
                            const k = row.kpis;
                            const isActive = activeEventId === e.id;

                            return (
                                <TableRow
                                key={e.id}
                                className={[
                                    "border-white/10 cursor-pointer",
                                    isActive ? "bg-white/5" : "hover:bg-white/5",
                                ].join(" ")}
                                onClick={() => openInsights(e.id)}
                                >
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                    <span className="text-white">{e.title}</span>
                                    <span className="text-xs text-white/45">
                                        Created: {formatDateTime(e.createdAt)}
                                    </span>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Badge className={["rounded-full px-3 py-1 border", statusBadge(e.status)].join(" ")}>
                                    {e.status}
                                    </Badge>
                                </TableCell>

                                <TableCell className="text-white/75">
                                    {formatDateTime(e.startAt)}
                                </TableCell>

                                <TableCell className="text-right text-white/85">
                                    {number(k.totalTicketsSoldPaid)}
                                </TableCell>

                                <TableCell className="text-right text-white/85">
                                    {money(k.totalRevenuePaid)}
                                </TableCell>

                                <TableCell className="text-right">
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                        variant="outline"
                                        className="h-9 w-9 rounded-xl border-white/10 bg-white/5 p-0 hover:bg-white/10"
                                        onClick={(ev) => ev.stopPropagation()}
                                        >
                                        <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        className="border-white/10 bg-black/85 text-white"
                                        onClick={(ev) => ev.stopPropagation()}
                                    >
                                        <DropdownMenuItem onClick={() => openInsights(e.id)}>
                                        View Insights
                                        </DropdownMenuItem>

                                        {e.status !== "PUBLISHED" ? (
                                        <DropdownMenuItem onClick={() => setStatus(e.id, "PUBLISHED")}>
                                            Publish
                                        </DropdownMenuItem>
                                        ) : (
                                        <DropdownMenuItem onClick={() => setStatus(e.id, "DRAFT")}>
                                            Back to Draft
                                        </DropdownMenuItem>
                                        )}

                                        {e.status !== "ENDED" ? (
                                        <DropdownMenuItem onClick={() => setStatus(e.id, "ENDED")}>
                                            Mark as Ended
                                        </DropdownMenuItem>
                                        ) : null}
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                </TableRow>
                            );
                            })}

                            {filtered.length === 0 ? (
                            <TableRow className="border-white/10">
                                <TableCell colSpan={6} className="py-10 text-center text-sm text-white/50">
                                No events match your search.
                                </TableCell>
                            </TableRow>
                            ) : null}
                        </TableBody>
                        </Table>
                    </div>
                    )}
                </CardContent>
                </Card>

                {/* INSIGHTS PANEL */}
                <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6">
                    <div className="text-lg font-semibold">Event Insights</div>
                    <div className="mt-1 text-sm text-white/60">
                    Ticket types performance and sales.
                    </div>

                    <Separator className="my-5 bg-white/10" />

                    {!activeEventId ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/60">
                        Select an event to see details.
                    </div>
                    ) : insightsLoading ? (
                    <div className="grid gap-3">
                        <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
                        <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
                        <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
                    </div>
                    ) : insights ? (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-white">{insights.event.title}</div>
                            <Badge className={["rounded-full px-3 py-1 border", statusBadge(insights.event.status)].join(" ")}>
                            {insights.event.status}
                            </Badge>
                        </div>
                        <div className="mt-2 text-xs text-white/50">
                            Start: {formatDateTime(insights.event.startAt)}
                            {insights.event.endAt ? ` • End: ${formatDateTime(insights.event.endAt)}` : ""}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <MiniStat label="Revenue (paid)" value={money(insights.kpis.totalRevenuePaid)} />
                            <MiniStat label="Tickets (paid)" value={number(insights.kpis.totalTicketsSoldPaid)} />
                            <MiniStat label="Orders paid" value={number(insights.kpis.ordersPaid)} />
                            <MiniStat label="Avg order" value={money(insights.kpis.avgOrderValuePaid)} />
                        </div>

                        <div className="mt-4 grid gap-3">
                            {insights.event.status !== "PUBLISHED" ? (
                            <Button
                                className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
                                onClick={() => setStatus(insights.event.id, "PUBLISHED")}
                            >
                                Publish event
                            </Button>
                            ) : (
                            <Button
                                className="h-11 rounded-2xl bg-zinc-800 hover:bg-zinc-700"
                                onClick={() => setStatus(insights.event.id, "ENDED")}
                            >
                                End event
                            </Button>
                            )}
                        </div>
                        </div>

                        <div className="text-xs uppercase tracking-widest text-white/40">
                        Ticket Types
                        </div>

                        {insights.ticketTypes?.length ? (
                        <div className="grid gap-3">
                            {insights.ticketTypes.map((t) => {
                            const cap = Number(t.capacity || 0);
                            const sold = Number(t.soldCount || 0);
                            const pct = cap > 0 ? Math.round((sold / cap) * 100) : 0;

                            return (
                                <div key={t.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-semibold">{t.name}</div>
                                    <div className="text-sm text-white/80">
                                    {money(t.price)}{" "}
                                    <span className="text-white/40">/ {t.currency}</span>
                                    </div>
                                </div>

                                <div className="mt-2 text-xs text-white/50">
                                    Capacity: {number(t.capacity)} • Remaining: {number(t.remaining)}
                                </div>

                                <div className="mt-4">
                                    <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                                    <span>Sold: {number(sold)}</span>
                                    <span>{pct}%</span>
                                    </div>
                                    <Progress value={pct} className="h-2 rounded-full" />
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <MiniStat label="Revenue (paid)" value={money(t.revenuePaid)} />
                                    <MiniStat label="Tickets (paid)" value={number(t.ticketsSoldPaid)} />
                                </div>

                                <div className="mt-3 text-xs text-white/45">
                                    Sale window:{" "}
                                    {t.saleStartAt ? formatDateTime(t.saleStartAt) : "—"}{" "}
                                    → {t.saleEndAt ? formatDateTime(t.saleEndAt) : "—"}
                                </div>
                                </div>
                            );
                            })}
                        </div>
                        ) : (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/60">
                            No ticket types yet. Create some in the event editor.
                        </div>
                        )}
                    </div>
                    ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/60">
                        Could not load insights.
                    </div>
                    )}
                </CardContent>
                </Card>
            </div>
            </>
        )}

        {/* CREATE EVENT MODAL */}
        <Dialog.Root
            open={createOpen}
            onOpenChange={(v) => {
            setCreateOpen(v);
            if (!v) resetCreateForm();
            }}
        >
            <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
            <Dialog.Content
                className="
                fixed left-1/2 top-1/2 z-50
                w-[92vw] max-w-lg
                -translate-x-1/2 -translate-y-1/2
                rounded-3xl border border-white/10
                bg-[#0b0812]/95 p-6 shadow-2xl
                max-h-[85vh] overflow-y-auto
                "
            >
                <div className="flex items-start justify-between">
                <div>
                    <div className="text-xs uppercase tracking-widest text-violet-300">
                    Create Event
                    </div>
                    <div className="mt-2 text-2xl font-extrabold tracking-tight">
                    New event (DRAFT)
                    </div>
                </div>

                <Dialog.Close className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
                    ✕
                </Dialog.Close>
                </div>

                <Separator className="my-5 bg-white/10" />

                <form onSubmit={onCreate} className="grid gap-4">
                <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                    Title
                    </label>
                    <Input
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Festival de primavera 2026"
                    />
                </div>

                {/* ✅ Banner (optional): URL o File */}
                <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                    Event image (optional)
                    </label>

                    <div className="grid gap-3">
                    {/* preview */}
                    {bannerPreview || bannerUrl ? (
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                        <img
                            src={bannerPreview || bannerUrl}
                            alt="Event banner preview"
                            className="h-40 w-full object-cover opacity-90"
                            onError={() => {
                            if (!bannerPreview) setCreateErr("Invalid image URL.");
                            }}
                        />
                        <button
                            type="button"
                            onClick={clearBanner}
                            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white/80 hover:bg-black/70"
                        >
                            <X className="h-4 w-4" /> Remove
                        </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center gap-3 text-sm text-white/70">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                            <ImageIcon className="h-5 w-5 text-white/70" />
                            </div>
                            <div>
                            <div className="font-semibold text-white/85">Add a banner image</div>
                            <div className="text-xs text-white/45">
                                You can paste a URL or pick a file.
                            </div>
                            </div>
                        </div>
                        </div>
                    )}

                    {/* URL input */}
                    <Input
                        className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                        value={bannerUrl}
                        onChange={(e) => {
                        setBannerUrl(e.target.value);
                        if (bannerFile) setBannerFile(null);
                        if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                        setBannerPreview("");
                        }}
                        placeholder="https://... (bannerUrl)"
                    />

                    {/* File picker */}
                    <div className="grid gap-2">
                        <input
                        id="banner-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickBannerFile(e.target.files?.[0] || null)}
                        />
                        <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                            onClick={() => document.getElementById("banner-file")?.click()}
                        >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Upload image
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                            onClick={clearBanner}
                            disabled={!bannerUrl && !bannerFile && !bannerPreview}
                        >
                            Clear
                        </Button>
                        </div>

                        <div className="text-[11px] text-white/40 leading-5">
                        ✅ If you paste an URL, it will be sent as <span className="text-white/70">bannerUrl</span>. <br />
                        ⛔ File upload needs an upload endpoint (multipart) to store the image and return an URL.
                        </div>
                    </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                        City (optional)
                    </label>
                    <Input
                        className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Corrientes"
                    />
                    </div>
                    <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                        Venue (optional)
                    </label>
                    <Input
                        className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="Centro de Convenciones"
                    />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                        Start (required)
                    </label>
                    <Input
                        type="datetime-local"
                        className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                    />
                    </div>
                    <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                        End (optional)
                    </label>
                    <Input
                        type="datetime-local"
                        className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                    />
                    </div>
                </div>

                {createErr ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {createErr}
                    </div>
                ) : null}

                <div className="grid gap-3">
                    <Button
                    className="h-12 rounded-2xl bg-violet-600 hover:bg-violet-500"
                    disabled={creating}
                    >
                    {creating ? "CREATING..." : "CREATE EVENT"}
                    </Button>

                    <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={() => setCreateOpen(false)}
                    >
                    Cancel
                    </Button>
                </div>

                <div className="text-center text-[11px] text-white/35">
                    After creating, publish when you’re ready.
                </div>
                </form>
            </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
        </div>
    );
    }

    function KpiCard({ loading, icon, title, value, hint }) {
    return (
        <Card className="border-white/10 bg-white/5">
        <CardContent className="p-6">
            <div className="flex items-start justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80">
                {icon}
            </div>
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                +0.0%
            </div>
            </div>

            <div className="mt-4 text-sm text-white/60">{title}</div>
            {loading ? (
            <div className="mt-2">
                <Skeleton className="h-9 w-40 rounded-2xl bg-white/10" />
                <Skeleton className="mt-3 h-4 w-56 rounded bg-white/10" />
            </div>
            ) : (
            <>
                <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
                <div className="mt-2 text-xs text-white/45">{hint}</div>
            </>
            )}

            <div className="mt-5 h-10 rounded-2xl bg-gradient-to-r from-violet-600/30 via-white/5 to-transparent" />
        </CardContent>
        </Card>
    );
    }

    function MiniStat({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-[10px] uppercase tracking-widest text-white/45">{label}</div>
        <div className="mt-1 text-sm font-semibold text-white/85">{value}</div>
        </div>
    );
    }
