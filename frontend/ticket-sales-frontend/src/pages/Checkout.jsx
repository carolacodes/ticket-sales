// src/pages/Checkout.jsx

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { getEventById, getEventTicketTypes } from "@/api/events.api.js";
import { createOrderRequest } from "@/api/orders.api.js";
import { createPreferenceRequest } from "@/api/payments.api.js";
import { useAuth } from "@/hooks/useAuth.js";

const SERVICE_CHARGE_PERCENT = 0.1;

function safeBanner(url) {
  return (
    url ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDHgIKE4akJ9mWWgFA4AaKF-Rn4SD1-UBrp8JWLNS8a3866sy2EE_gLog1tOaVEt3aikvQ8Jd_qBfgH2VIZVYzpf73Vng3D4Re9yCOOSpMhjiv1sffGiWgeOI6AxvCDlFXhx3an1GvWiQ2aTnJO9opwBtfu5b1fu1rTdwSbhzJT43446tGCdyGBt7E0fmfJGxMYe8I0-L7LE6znfRJm34d8iyc1j_V7RpDMjv-ztu2eGKCDacHhq8wwaxFVUZ7iCIcOBadPjFpjxqhJ"
  );
}

function getTicketId(ticket) {
  return ticket?._id || ticket?.id;
}

function formatDateLong(iso) {
  if (!iso) return "Fecha a confirmar";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "Fecha a confirmar";

  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso) {
  if (!iso) return "Hora a confirmar";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "Hora a confirmar";

  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value) {
  const amount = Number(value || 0);

  return `$${amount.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function isEventEnded(startAt) {
  if (!startAt) return false;
  return new Date(startAt) <= new Date();
}

export function Checkout() {
  const { id: eventId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { isAuth, loading: authLoading, user } = useAuth();

  const initialTicketTypeId = state?.ticketTypeId || null;

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTT, setSelectedTT] = useState(null);

  const [qty, setQty] = useState(1);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuth) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuth, navigate]);

  useEffect(() => {
    if (!user) return;

    if (!email && user.email) setEmail(user.email);

    if (!fullName && (user.fullName || user.username || user.name)) {
      setFullName(user.fullName || user.username || user.name);
    }
  }, [user, email, fullName]);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErrorMsg("");

        const [eventResponse, ticketResponse] = await Promise.all([
          getEventById(eventId),
          getEventTicketTypes(eventId),
        ]);

        if (!alive) return;

        const nextEvent =
          eventResponse?.data?.event ?? eventResponse?.data ?? null;

        const nextTicketTypes = ticketResponse?.data?.ticketTypes ?? [];

        const safeTicketTypes = Array.isArray(nextTicketTypes)
          ? nextTicketTypes
          : [];

        const selectedFromState = safeTicketTypes.find(
          (ticket) => getTicketId(ticket) === initialTicketTypeId
        );

        const firstAvailable = safeTicketTypes.find(
          (ticket) => Number(ticket.available ?? 0) > 0
        );

        const nextSelected =
          selectedFromState || firstAvailable || safeTicketTypes[0] || null;

        setEvent(nextEvent);
        setTicketTypes(safeTicketTypes);
        setSelectedTT(nextSelected);

        const available = Number(nextSelected?.available ?? 0);

        if (available > 0) {
          setQty((current) => Math.min(Math.max(1, current), available));
        } else {
          setQty(1);
        }
      } catch (error) {
        console.error("CHECKOUT_LOAD_ERROR:", error);
        setErrorMsg("No se pudo cargar el checkout.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [eventId, initialTicketTypeId]);

  const now = new Date();

  const maxAllowed = useMemo(() => {
    return Math.max(0, Number(selectedTT?.available ?? 0));
  }, [selectedTT]);

  const eventAlreadyStartedOrPassed = useMemo(() => {
    return isEventEnded(event?.startAt);
  }, [event]);

  const saleNotStarted = useMemo(() => {
    if (!selectedTT?.saleStartAt) return false;
    return new Date(selectedTT.saleStartAt) > now;
  }, [selectedTT]); // eslint-disable-line react-hooks/exhaustive-deps

  const saleEnded = useMemo(() => {
    if (!selectedTT?.saleEndAt) return false;
    return new Date(selectedTT.saleEndAt) < now;
  }, [selectedTT]); // eslint-disable-line react-hooks/exhaustive-deps

  const soldOut = maxAllowed <= 0;

  const cannotBuyReason = useMemo(() => {
    if (!selectedTT) return "No se encontró el tipo de entrada seleccionado.";
    if (eventAlreadyStartedOrPassed) return "Este evento ya ocurrió o ya comenzó.";
    if (saleNotStarted) return "La venta de esta entrada todavía no comenzó.";
    if (saleEnded) return "La venta de esta entrada ya finalizó.";
    if (soldOut) return "Este tipo de entrada está agotado.";
    return "";
  }, [
    selectedTT,
    eventAlreadyStartedOrPassed,
    saleNotStarted,
    saleEnded,
    soldOut,
  ]);

  const canBuy = !cannotBuyReason;

  const unitPrice = Number(selectedTT?.price ?? 0);
  const subtotal = unitPrice * qty;
  const serviceCharge = subtotal * SERVICE_CHARGE_PERCENT;
  const total = subtotal + serviceCharge;

  function decQty() {
    setQty((current) => Math.max(1, current - 1));
  }

  function incQty() {
    if (!maxAllowed) return;
    setQty((current) => Math.min(maxAllowed, current + 1));
  }

  async function onConfirm() {
    try {
      setSubmitting(true);
      setErrorMsg("");

      if (!selectedTT) {
        setErrorMsg("No se encontró el tipo de entrada seleccionado.");
        return;
      }

      if (!canBuy) {
        setErrorMsg(cannotBuyReason);
        return;
      }

      if (qty < 1) {
        setErrorMsg("La cantidad mínima debe ser 1.");
        return;
      }

      if (qty > maxAllowed) {
        setErrorMsg(`Solo quedan ${maxAllowed} entradas disponibles.`);
        return;
      }

      const selectedTicketTypeId = getTicketId(selectedTT);

      const orderResponse = await createOrderRequest({
        eventId,
        items: [
          {
            ticketTypeId: selectedTicketTypeId,
            qty,
          },
        ],
      });

      const orderId =
        orderResponse?.data?.order?._id || orderResponse?.data?.order?.id;

      if (!orderId) {
        throw new Error("Order not created");
      }

      const preferenceResponse = await createPreferenceRequest({ orderId });

      const checkoutUrl =
        preferenceResponse?.data?.sandboxInitPoint ||
        preferenceResponse?.data?.sandbox_init_point ||
        preferenceResponse?.data?.initPoint ||
        preferenceResponse?.data?.init_point;

      if (!checkoutUrl) {
        throw new Error("Checkout URL not generated");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("CHECKOUT_ERROR:", error);

      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message;

      const message =
        backendMessage ||
        (status === 409
          ? "No hay suficiente stock para continuar con la compra."
          : status === 400
            ? "No se pudo iniciar el pago."
            : "Ocurrió un error al generar el checkout.");

      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ticketify-checkout bg-[#f3faff] text-[#001f29]">
      <CheckoutStyles />

      <main className="tf-container py-12">
        <div className="mb-10">
          <h1 className="mb-2 text-[32px] font-extrabold leading-[40px] tracking-[-0.01em] text-[#215d7d] md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
            Finalizar compra
          </h1>

          <p className="text-[16px] leading-6 text-[#5b403f]">
            Estás a pocos pasos de asegurar tus entradas.
          </p>
        </div>

        {loading || authLoading ? (
          <div className="checkout-shadow rounded-xl border border-[#d8f2ff] bg-white p-6">
            <div className="h-32 animate-pulse rounded-lg bg-[#d8f2ff]" />
            <div className="mt-6 h-6 w-1/2 animate-pulse rounded bg-[#d8f2ff]" />
            <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-[#d8f2ff]" />
          </div>
        ) : errorMsg && !event ? (
          <div className="checkout-shadow rounded-xl border border-[#d8f2ff] bg-white p-6 text-[#5b403f]">
            {errorMsg}
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <section className="checkout-shadow rounded-xl border border-[#d8f2ff] bg-white p-6">
                <h2 className="mb-6 flex items-center gap-2 text-[24px] font-bold leading-8 text-[#215d7d]">
                  <span className="material-symbols-outlined">
                    confirmation_number
                  </span>
                  Resumen del Evento
                </h2>

                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="h-32 w-full shrink-0 overflow-hidden rounded-lg md:w-48">
                    <img
                      src={safeBanner(event?.bannerUrl)}
                      alt={event?.title || "Evento"}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-[24px] font-bold leading-8 text-[#001f29]">
                      {event?.title || "Evento"}
                    </h3>

                    <div className="grid grid-cols-1 gap-4 text-[16px] leading-6 text-[#5b403f] sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#215d7d]">
                          calendar_month
                        </span>
                        {formatDateLong(event?.startAt)}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#215d7d]">
                          schedule
                        </span>
                        {formatTime(event?.startAt)} HS
                      </div>

                      <div className="flex items-center gap-2 sm:col-span-2">
                        <span className="material-symbols-outlined text-sm text-[#215d7d]">
                          location_on
                        </span>
                        {[event?.venue, event?.city].filter(Boolean).join(", ") ||
                          "Ubicación a confirmar"}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="checkout-shadow rounded-xl border border-[#d8f2ff] bg-white p-6">
                <h2 className="mb-6 text-[24px] font-bold leading-8 text-[#215d7d]">
                  Selección de Entradas
                </h2>

                {ticketTypes.length > 1 ? (
                  <div className="mb-4 grid gap-3">
                    {ticketTypes.map((ticketType) => {
                      const ticketTypeId = getTicketId(ticketType);
                      const active = ticketTypeId === getTicketId(selectedTT);
                      const available = Number(ticketType.available ?? 0);

                      return (
                        <button
                          key={ticketTypeId}
                          type="button"
                          onClick={() => {
                            setSelectedTT(ticketType);
                            setQty(1);
                            setErrorMsg("");
                          }}
                          className={[
                            "flex items-center justify-between rounded-lg border p-4 text-left transition-all",
                            active
                              ? "border-[#d62839] bg-[#fff2f1]"
                              : "border-[#baeaff] bg-[#e5f6ff] hover:border-[#215d7d]",
                          ].join(" ")}
                        >
                          <div>
                            <p className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#d62839]">
                              {ticketType.name || "Entrada"}
                            </p>

                            <p className="text-xs text-[#5b403f]">
                              {available} disponibles
                            </p>
                          </div>

                          <p className="text-[18px] font-bold text-[#001f29]">
                            {money(ticketType.price)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="flex items-center justify-between rounded-lg border border-[#baeaff] bg-[#e5f6ff] p-4">
                  <div>
                    <p className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#d62839]">
                      {selectedTT?.name || "Entrada"}
                    </p>

                    <p className="text-xs text-[#5b403f]">
                      Tickets disponibles: {maxAllowed}
                    </p>

                    {cannotBuyReason ? (
                      <p className="mt-1 text-xs font-semibold text-[#ba1a1a]">
                        {cannotBuyReason}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-4 rounded-full border border-[#e4bdbc] bg-white px-2 py-1">
                    <button
                      type="button"
                      onClick={decQty}
                      disabled={submitting || !canBuy || qty <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#215d7d] transition-colors hover:bg-[#d8f2ff] disabled:opacity-40"
                      aria-label="Disminuir cantidad"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>

                    <span className="w-6 text-center text-[20px] font-bold leading-6 text-[#001f29]">
                      {qty}
                    </span>

                    <button
                      type="button"
                      onClick={incQty}
                      disabled={submitting || !canBuy || qty >= maxAllowed}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#215d7d] transition-colors hover:bg-[#d8f2ff] disabled:opacity-40"
                      aria-label="Aumentar cantidad"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>
              </section>

              <section className="checkout-shadow rounded-xl border border-[#d8f2ff] bg-white p-6">
                <h2 className="mb-6 text-[24px] font-bold leading-8 text-[#215d7d]">
                  Información del Comprador
                </h2>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                      Nombre completo
                    </label>

                    <input
                      value={fullName}
                      onChange={(eventInput) =>
                        setFullName(eventInput.target.value)
                      }
                      className="h-12 w-full rounded-lg border border-[#906f6e] bg-[#f3faff] px-4 text-[#001f29] outline-none transition-all focus:border-[#215d7d] focus:ring-1 focus:ring-[#215d7d]"
                      placeholder="Ej: Juan Pérez"
                      type="text"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                      Email
                    </label>

                    <input
                      value={email}
                      onChange={(eventInput) => setEmail(eventInput.target.value)}
                      className="h-12 w-full rounded-lg border border-[#906f6e] bg-[#f3faff] px-4 text-[#001f29] outline-none transition-all focus:border-[#215d7d] focus:ring-1 focus:ring-[#215d7d]"
                      placeholder="juan@ejemplo.com"
                      type="email"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                      Celular
                    </label>

                    <input
                      value={phone}
                      onChange={(eventInput) => setPhone(eventInput.target.value)}
                      className="h-12 w-full rounded-lg border border-[#906f6e] bg-[#f3faff] px-4 text-[#001f29] outline-none transition-all focus:border-[#215d7d] focus:ring-1 focus:ring-[#215d7d]"
                      placeholder="+54 11 1234 5678"
                      type="tel"
                    />
                  </div>
                </div>
              </section>

              <div className="flex items-start gap-4 rounded-xl border-l-4 border-[#215d7d] bg-[#c9eeff] p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  <span
                    className="material-symbols-outlined text-[#215d7d]"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    security
                  </span>
                </div>

                <div>
                  <h4 className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#215d7d]">
                    Pago Seguro vía Mercado Pago
                  </h4>

                  <p className="mt-1 text-sm leading-6 text-[#5b403f]">
                    Al hacer clic en "Pagar", serás redirigido a la plataforma
                    segura de Mercado Pago para completar tu transacción. Tus
                    datos financieros están protegidos por encriptación de nivel
                    bancario.
                  </p>
                </div>
              </div>

              {errorMsg ? (
                <div className="rounded-xl border border-[#ffdad6] bg-[#ffdad6] p-4 text-sm font-semibold text-[#93000a]">
                  {errorMsg}
                </div>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-24 lg:col-span-4">
              <div className="checkout-summary-shadow rounded-xl border border-[#baeaff] bg-white p-8">
                <h2 className="mb-6 text-[24px] font-bold leading-8 text-[#215d7d]">
                  Resumen de Compra
                </h2>

                <div className="mb-8 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="max-w-[70%]">
                      <p className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#001f29]">
                        {event?.title || "Evento"}
                      </p>

                      <p className="text-xs text-[#5b403f]">
                        {selectedTT?.name || "Entrada"} x {qty}
                      </p>
                    </div>

                    <p className="text-[20px] font-bold leading-6 text-[#001f29]">
                      {money(subtotal)}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-[#baeaff] pt-4">
                    <div className="flex justify-between text-sm text-[#5b403f]">
                      <span>Subtotal</span>
                      <span>{money(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-[#5b403f]">
                      <span>Service Charge</span>
                      <span>{money(serviceCharge)}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex gap-2">
                      <input
                        value={coupon}
                        onChange={(eventInput) =>
                          setCoupon(eventInput.target.value)
                        }
                        className="h-10 flex-1 rounded-lg border border-[#906f6e] px-3 text-sm text-[#001f29] outline-none focus:border-[#215d7d] focus:ring-1 focus:ring-[#215d7d]"
                        placeholder="Código de descuento"
                        type="text"
                      />

                      <button
                        type="button"
                        disabled
                        className="rounded-lg bg-[#3e7697] px-4 text-sm font-semibold text-white opacity-80"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#001f29]/10 pt-6">
                    <span className="text-[24px] font-bold leading-8 text-[#001f29]">
                      Total
                    </span>

                    <span className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#d62839]">
                      {money(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={submitting || !selectedTT || !canBuy}
                  onClick={onConfirm}
                  className={[
                    "flex w-full items-center justify-center gap-3 rounded-xl py-4 text-[24px] font-bold leading-8 shadow-lg transition-all active:scale-95",
                    submitting || !selectedTT || !canBuy
                      ? "cursor-not-allowed bg-[#906f6e] text-white/60"
                      : "bg-[#d62839] text-white hover:shadow-xl",
                  ].join(" ")}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    payments
                  </span>
                  {submitting ? "Procesando..." : "Pagar con Mercado Pago"}
                </button>

                <div className="mt-6 flex flex-wrap justify-center gap-4 opacity-50 grayscale transition-all duration-300 hover:grayscale-0">
                  <span className="rounded bg-[#001f29]/20 px-3 py-1 text-xs font-bold text-[#001f29]">
                    MP
                  </span>
                  <span className="rounded bg-[#001f29]/20 px-3 py-1 text-xs font-bold text-[#001f29]">
                    VISA
                  </span>
                  <span className="rounded bg-[#001f29]/20 px-3 py-1 text-xs font-bold text-[#001f29]">
                    MC
                  </span>
                </div>
              </div>

              <div className="mt-6 px-4 text-center">
                <p className="flex items-center justify-center gap-1 text-xs text-[#5b403f]">
                  <span className="material-symbols-outlined text-[14px]">
                    info
                  </span>
                  ¿Necesitás ayuda? Visitá nuestro{" "}
                  <Link to="/start" className="text-[#215d7d] underline">
                    Centro de Ayuda
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function CheckoutStyles() {
  return (
    <style>{`
      .checkout-shadow {
        box-shadow: 0px 4px 20px rgba(23, 86, 118, 0.08);
      }

      .checkout-summary-shadow {
        box-shadow: 0px 10px 40px rgba(23, 86, 118, 0.12);
      }
    `}</style>
  );
}