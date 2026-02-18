import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getEventById, getEventTicketTypes } from "@/api/events.api.js";
import { createOrderRequest, confirmOrderRequest } from "@/api/orders.api.js";
import { useAuth } from "@/hooks/useAuth.js";

import { SiteNavbar } from "@/components/layout/SiteNavbar";
import { UserNavbar } from "@/components/layout/UserNavbar";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function safeBanner(url) {
    return (
        url ||
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=80"
    );
}

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function Money({ value, currency = "USD" }) {
    if (value == null) return <span>—</span>;
    return (
        <span>
        ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
        <span className="text-xs text-white/50">{currency}</span>
        </span>
    );
}

export function Checkout() {
    const { id: eventId } = useParams();
    const { state } = useLocation();
    const nav = useNavigate();

    const { isAuth, loading: authLoading, user, logout } = useAuth();

    const ticketTypeId = state?.ticketTypeId;

    const [event, setEvent] = useState(null);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [selectedTT, setSelectedTT] = useState(null);

    const [qty, setQty] = useState(1);

    // Buyer info (MVP: no se envía al backend todavía)
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Prefill buyer fields si hay user
    useEffect(() => {
        if (!user) return;
        // si tu user tiene email/username, se pre-llenan
        if (!email && user.email) setEmail(user.email);
        if (!fullName && user.username) setFullName(user.username);
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    // Requiere auth
    useEffect(() => {
        if (authLoading) return;
        if (!isAuth) nav("/login", { replace: true });
    }, [authLoading, isAuth, nav]);

    // Si entró directo sin state.ticketTypeId → volver al detalle
    useEffect(() => {
        if (!ticketTypeId) {
        nav(`/events/${eventId}`, { replace: true });
        }
    }, [ticketTypeId, eventId, nav]);

    useEffect(() => {
        let alive = true;

        async function run() {
        try {
            setLoading(true);
            setErrorMsg("");

            const [evRes, ttRes] = await Promise.all([
            getEventById(eventId),
            getEventTicketTypes(eventId),
            ]);

            if (!alive) return;

            const ev = evRes?.data?.event ?? null;
            const tts = ttRes?.data?.ticketTypes ?? [];

            setEvent(ev);
            setTicketTypes(Array.isArray(tts) ? tts : []);

            const found = (tts || []).find((t) => t.id === ticketTypeId) ?? null;
            setSelectedTT(found);

            // Ajuste qty si supera available
            const available = Number(found?.available ?? 0);
            if (available > 0 && qty > available) setQty(available);
            if (available === 0) setQty(1);
        } catch (e) {
            setErrorMsg("No se pudo cargar el checkout." + e.message);
        } finally {
            if (!alive) return;
            setLoading(false);
        }
        }

        run();
        return () => {
        alive = false;
        };
    }, [eventId, ticketTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

    const maxAllowed = useMemo(() => {
        const available = Number(selectedTT?.available ?? 0);
        // zod: max 20
        return Math.max(0, Math.min(20, available || 0));
    }, [selectedTT]);

    const unitPrice = Number(selectedTT?.price ?? 0);
    const subtotal = unitPrice * qty;

    function decQty() {
        setQty((q) => Math.max(1, q - 1));
    }

    function incQty() {
        // respeta max 20 y available
        const cap = maxAllowed || 1;
        setQty((q) => Math.min(cap, q + 1));
    }

    async function onConfirm() {
        try {
        setSubmitting(true);
        setErrorMsg("");

        if (!selectedTT) throw new Error("No ticket type selected");
        if (qty < 1) throw new Error("Invalid qty");
        if (qty > 20) throw new Error("Qty max 20");

        const available = Number(selectedTT.available ?? 0);
        if (available <= 0) {
            setErrorMsg("Este tipo de entrada está agotado.");
            return;
        }
        if (qty > available) {
            setErrorMsg(`Solo quedan ${available} entradas disponibles.`);
            return;
        }

        // 1) Create order (PENDING)
        const createRes = await createOrderRequest({
            eventId,
            items: [{ ticketTypeId: selectedTT.id, qty }],
        });

        const orderId = createRes?.data?.order?._id;
        if (!orderId) throw new Error("Order not created");

        // 2) Confirm order (fake payment) -> PAID + tickets
        await confirmOrderRequest(orderId, {}); // confirm schema vacío

        // 3) Go to history
        nav("/my-tickets", { replace: true });
        } catch (e) {
        const status = e?.response?.status;
        const msg =
            e?.response?.data?.message ||
            (status === 409
            ? "No hay suficiente stock para confirmar la compra."
            : status === 400
            ? "La orden no se pudo confirmar (posible expiración)."
            : "Ocurrió un error al confirmar la compra.");
        setErrorMsg(msg);
        } finally {
        setSubmitting(false);
        }
    }

    return (
        <>
        {isAuth ? <UserNavbar onLogout={logout} /> : <SiteNavbar />}

        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-8">
            <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
                CHECKOUT
            </h1>
            <div className="mt-3 h-1 w-16 rounded-full bg-violet-600" />
            </div>

            {loading ? (
            <Card className="border-white/10 bg-white/5">
                <div className="h-64 animate-pulse bg-white/10" />
                <CardContent className="p-6">
                <div className="h-6 w-1/2 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-white/10" />
                </CardContent>
            </Card>
            ) : errorMsg && !event ? (
            <Card className="border-white/10 bg-white/5">
                <CardContent className="p-6 text-sm text-white/80">
                {errorMsg}
                </CardContent>
            </Card>
            ) : (
            <div className="grid gap-6 md:grid-cols-[1fr_360px]">
                {/* LEFT */}
                <div className="space-y-6">
                {/* Event / quantity card */}
                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-[120px_1fr]">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <img
                            src={safeBanner(event?.bannerUrl)}
                            alt={event?.title}
                            className="h-28 w-full object-cover"
                        />
                        </div>

                        <div className="flex flex-col justify-between gap-4">
                        <div>
                            <div className="text-xs uppercase tracking-widest text-violet-300">
                            Upcoming event
                            </div>
                            <div className="mt-1 text-2xl font-semibold">
                            {event?.title}
                            </div>

                            <div className="mt-2 text-sm text-white/60">
                            📅 {formatDate(event?.startAt)}{" "}
                            <span className="mx-2">•</span>
                            📍 {event?.venue}
                            </div>

                            {selectedTT ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge className="border-white/10 bg-violet-600/20 text-violet-100">
                                {selectedTT.name}
                                </Badge>
                                <Badge className="border-white/10 bg-white/10 text-white">
                                <Money value={selectedTT.price} />
                                </Badge>
                            </div>
                            ) : null}
                        </div>

                        <Separator className="bg-white/10" />

                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                            <div className="text-xs uppercase tracking-widest text-white/50">
                                Quantity
                            </div>

                            <div className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                                <button
                                onClick={decQty}
                                className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/80 hover:bg-white/10"
                                aria-label="decrease"
                                >
                                −
                                </button>

                                <div className="w-10 text-center text-lg font-semibold">
                                {String(qty).padStart(2, "0")}
                                </div>

                                <button
                                onClick={incQty}
                                disabled={!maxAllowed || qty >= maxAllowed}
                                className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-50"
                                aria-label="increase"
                                >
                                +
                                </button>
                            </div>
                            </div>

                            <div className="rounded-full border border-violet-500/25 bg-violet-600/10 px-4 py-2 text-sm text-violet-200">
                            {maxAllowed > 0
                                ? `⚠️ ${maxAllowed} tickets left!`
                                : "SOLD OUT"}
                            </div>
                        </div>
                        </div>
                    </div>
                    </CardContent>
                </Card>

                {/* Buyer info */}
                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-600/20 ring-1 ring-violet-500/30">
                        👤
                        </div>
                        <div className="text-lg font-semibold">Buyer Information</div>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                        <Label className="text-white/70">Full Name</Label>
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="border-white/10 bg-white/5"
                        />
                        </div>

                        <div className="grid gap-2">
                        <Label className="text-white/70">Email Address</Label>
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="border-white/10 bg-white/5"
                        />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                        <Label className="text-white/70">
                            Phone Number (Optional)
                        </Label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+54 11 1234-5678"
                            className="border-white/10 bg-white/5"
                        />
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-600/10 p-4 text-sm text-white/70">
                        ℹ️ Tickets will be created after confirmation and will appear in{" "}
                        <span className="text-violet-200">My Tickets</span>.
                    </div>
                    </CardContent>
                </Card>

                {errorMsg ? (
                    <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-4 text-sm text-red-200">
                        {errorMsg}
                    </CardContent>
                    </Card>
                ) : null}
                </div>

                {/* RIGHT */}
                <div className="space-y-6">
                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-6">
                    <div className="text-lg font-semibold">Payment Summary</div>

                    <div className="mt-5 grid gap-3 text-sm text-white/70">
                        <div className="flex items-center justify-between">
                        <span>Subtotal ({qty}x Ticket)</span>
                        <span>
                            <Money value={subtotal} />
                        </span>
                        </div>

                        <div className="flex items-center justify-between">
                        <span>Service Fees</span>
                        <span>$0.00</span>
                        </div>
                    </div>

                    <Separator className="my-5 bg-white/10" />

                    <div className="text-xs uppercase tracking-widest text-violet-300">
                        Total amount
                    </div>
                    <div className="mt-2 text-4xl font-extrabold">
                        <Money value={subtotal} />
                    </div>

                    <Button
                        className="mt-6 h-12 w-full rounded-2xl bg-violet-600 text-white hover:bg-violet-500"
                        disabled={submitting || !selectedTT || maxAllowed <= 0}
                        onClick={onConfirm}
                    >
                        {submitting ? "Procesando..." : "🔒 Confirmar / Pagar"}
                    </Button>

                    <div className="mt-4 text-center text-[11px] uppercase tracking-widest text-white/40">
                        ENCRYPTED SECURE CHECKOUT
                    </div>

                    <Separator className="my-5 bg-white/10" />

                    <div className="flex items-center justify-between gap-3">
                        <Input
                        placeholder="Promo code"
                        className="border-white/10 bg-white/5"
                        disabled
                        />
                        <Button
                        variant="outline"
                        className="border-white/10 bg-white/5 hover:bg-white/10"
                        disabled
                        >
                        Apply
                        </Button>
                    </div>

                    <div className="mt-4 text-xs text-white/50">
                        * MVP: sin pasarela. Esto confirma la orden y emite tickets.
                    </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-5 text-sm text-white/70">
                    <div className="font-semibold text-white/90">Tip</div>
                    <div className="mt-2">
                        Si más adelante integrás MercadoPago, este botón va a crear la
                        order y después redirigir al <span className="text-violet-200">init_point</span>.
                    </div>
                    </CardContent>
                </Card>
                </div>
            </div>
            )}
        </div>
        </>
    );
}
