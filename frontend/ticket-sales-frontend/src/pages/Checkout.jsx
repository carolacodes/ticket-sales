import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getEventById, getEventTicketTypes } from "@/api/events.api.js";
import { createOrderRequest } from "@/api/orders.api.js";
import { createPreferenceRequest } from "@/api/payments.api.js";
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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) return;

    if (!email && user.email) setEmail(user.email);
    if (!fullName && user.username) setFullName(user.username);
  }, [user, email, fullName]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) nav("/login", { replace: true });
  }, [authLoading, isAuth, nav]);

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

        const available = Number(found?.available ?? 0);

        if (available <= 0) {
          setQty(1);
        } else if (qty > available) {
          setQty(available);
        }
      } catch (e) {
        setErrorMsg("No se pudo cargar el checkout. " + (e?.message || ""));
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
    return Math.max(0, available);
  }, [selectedTT]);

  const unitPrice = Number(selectedTT?.price ?? 0);
  const subtotal = unitPrice * qty;

  const now = new Date();

  const eventAlreadyStartedOrPassed = useMemo(() => {
    if (!event?.startAt) return false;
    return new Date(event.startAt) <= now;
  }, [event, now]);

  const saleNotStarted = useMemo(() => {
    if (!selectedTT?.saleStartAt) return false;
    return new Date(selectedTT.saleStartAt) > now;
  }, [selectedTT, now]);

  const saleEnded = useMemo(() => {
    if (!selectedTT?.saleEndAt) return false;
    return new Date(selectedTT.saleEndAt) < now;
  }, [selectedTT, now]);

  const soldOut = maxAllowed <= 0;

  const cannotBuyReason = useMemo(() => {
    if (!selectedTT) return "No se encontró el tipo de entrada seleccionado.";
    if (eventAlreadyStartedOrPassed) return "Este evento ya ocurrió o ya comenzó.";
    if (saleNotStarted) return "La venta de esta entrada todavía no comenzó.";
    if (saleEnded) return "La venta de esta entrada ya finalizó.";
    if (soldOut) return "Este tipo de entrada está agotado.";
    return "";
  }, [selectedTT, eventAlreadyStartedOrPassed, saleNotStarted, saleEnded, soldOut]);

  const canBuy = !cannotBuyReason;

  function decQty() {
    setQty((q) => Math.max(1, q - 1));
  }

  function incQty() {
    if (!maxAllowed) return;
    setQty((q) => Math.min(maxAllowed, q + 1));
  }

  async function onConfirm() {
    try {
      setSubmitting(true);
      setErrorMsg("");

      if (!selectedTT) {
        throw new Error("No ticket type selected");
      }

      if (!canBuy) {
        setErrorMsg(cannotBuyReason);
        return;
      }

      if (qty < 1) {
        throw new Error("Invalid qty");
      }

      const available = Number(selectedTT?.available ?? 0);

      if (available <= 0) {
        setErrorMsg("Este tipo de entrada está agotado.");
        return;
      }

      if (qty > available) {
        setErrorMsg(`Solo quedan ${available} entradas disponibles.`);
        return;
      }

      const createOrderRes = await createOrderRequest({
        eventId,
        items: [{ ticketTypeId: selectedTT.id, qty }],
      });

      const orderId = createOrderRes?.data?.order?._id;

      if (!orderId) {
        throw new Error("Order not created");
      }

      const preferenceRes = await createPreferenceRequest({ orderId });

      const checkoutUrl =
        preferenceRes?.data?.sandboxInitPoint || preferenceRes?.data?.initPoint;

      if (!checkoutUrl) {
        throw new Error("Checkout URL not generated");
      }

      window.location.href = checkoutUrl;
    } catch (e) {
      console.error("CHECKOUT_ERROR:", e);

      const status = e?.response?.status;
      const backendMsg = e?.response?.data?.message;

      const msg =
        backendMsg ||
        (status === 409
          ? "No hay suficiente stock para continuar con la compra."
          : status === 400
          ? "No se pudo iniciar el pago."
          : "Ocurrió un error al generar el checkout.");

      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>

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
            <div className="space-y-6">
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

                            {saleNotStarted ? (
                              <Badge className="border-white/10 bg-yellow-500/20 text-yellow-100">
                                Venta no iniciada
                              </Badge>
                            ) : null}

                            {saleEnded ? (
                              <Badge className="border-white/10 bg-red-500/20 text-red-100">
                                Venta finalizada
                              </Badge>
                            ) : null}

                            {eventAlreadyStartedOrPassed ? (
                              <Badge className="border-white/10 bg-red-500/20 text-red-100">
                                Evento finalizado
                              </Badge>
                            ) : null}
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
                              disabled={submitting || !canBuy}
                            >
                              −
                            </button>

                            <div className="w-10 text-center text-lg font-semibold">
                              {String(qty).padStart(2, "0")}
                            </div>

                            <button
                              onClick={incQty}
                              disabled={
                                submitting || !canBuy || !maxAllowed || qty >= maxAllowed
                              }
                              className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-50"
                              aria-label="increase"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="rounded-full border border-violet-500/25 bg-violet-600/10 px-4 py-2 text-sm text-violet-200">
                          {soldOut
                            ? "SOLD OUT"
                            : eventAlreadyStartedOrPassed
                            ? "EVENT FINISHED"
                            : saleEnded
                            ? "SALE ENDED"
                            : saleNotStarted
                            ? "SALE NOT STARTED"
                            : `⚠️ ${maxAllowed} tickets left!`}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    ℹ️ Serás redirigido a{" "}
                    <span className="text-violet-200">Mercado Pago</span> para
                    completar el pago de forma segura. Tus tickets aparecerán en{" "}
                    <span className="text-violet-200">My Tickets</span> una vez
                    confirmada la compra.
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

              {!errorMsg && cannotBuyReason ? (
                <Card className="border-white/10 bg-white/5">
                  <CardContent className="p-4 text-sm text-yellow-200">
                    {cannotBuyReason}
                  </CardContent>
                </Card>
              ) : null}
            </div>

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
                    disabled={submitting || !selectedTT || !canBuy}
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
                    Serás redirigido al checkout seguro de Mercado Pago para
                    finalizar la compra.
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-5 text-sm text-white/70">
                  <div className="font-semibold text-white/90">Tip</div>
                  <div className="mt-2">
                    Al continuar, se creará tu orden y luego serás redirigido al
                    checkout seguro de{" "}
                    <span className="text-violet-200">Mercado Pago</span>.
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