import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getOrderByIdRequest } from "@/api/orders.api.js";
import { generatePurchasePdf } from "@/utils/purchasePdf.js";

function formatDate(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Money({ value, currency = "ARS", className = "" }) {
  return (
    <span className={className}>
      ${Number(value || 0).toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}
      {currency ? (
        <span className="ml-1 text-xs opacity-60">{currency}</span>
      ) : null}
    </span>
  );
}

function safeBanner(url) {
  return (
    url ||
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=80"
  );
}

function normalizeStatus(status) {
  return String(status || "").toUpperCase();
}

function statusLabel(status) {
  const clean = normalizeStatus(status);

  if (clean === "PAID") return "Pagado";
  if (clean === "PENDING") return "Pendiente";
  if (clean === "EXPIRED") return "Expirado";
  if (clean === "CANCELED") return "Cancelado";

  return clean || "—";
}

function statusClass(status) {
  const clean = normalizeStatus(status);

  if (clean === "PAID") {
    return "bg-green-100 text-green-700";
  }

  if (clean === "PENDING") {
    return "bg-amber-100 text-amber-800";
  }

  if (clean === "EXPIRED" || clean === "CANCELED") {
    return "bg-[#ffdad6] text-[#93000a]";
  }

  return "bg-[#e5f6ff] text-[#215d7d]";
}

function ticketStatusLabel(status) {
  const clean = normalizeStatus(status);

  if (clean === "VALID") return "Válido";
  if (clean === "USED") return "Usado";
  if (clean === "VOID") return "Anulado";

  return clean || "—";
}

function ticketStatusClass(status) {
  const clean = normalizeStatus(status);

  if (clean === "VALID") {
    return "bg-[#d62839] text-white";
  }

  if (clean === "USED") {
    return "bg-[#e4bdbc] text-[#5b403f]";
  }

  if (clean === "VOID") {
    return "bg-[#ffdad6] text-[#93000a]";
  }

  return "bg-[#e5f6ff] text-[#215d7d]";
}

function getTicketTypeName(ticket, order) {
  const item = (order?.items || []).find(
    (entry) =>
      entry.ticketTypeId === ticket.ticketTypeId ||
      entry.ticketTypeId === ticket.ticketType?._id ||
      entry.ticketTypeId === ticket.ticketType?.id
  );

  return (
    ticket?.ticketType?.name ||
    ticket?.ticketTypeName ||
    item?.name ||
    "Entrada"
  );
}

function getTicketHolder(ticket, index) {
  return (
    ticket?.buyer?.username ||
    ticket?.buyer?.name ||
    ticket?.holderName ||
    ticket?.ownerName ||
    `Titular ${index + 1}`
  );
}

function getTicketId(ticket) {
  return ticket?._id || ticket?.id || ticket?.code;
}

function getSubtotal(order) {
  const items = order?.items || [];

  if (!items.length) return Number(order?.total || 0);

  const subtotal = items.reduce((acc, item) => {
    const lineTotal =
      item.lineTotal ??
      Number(item.unitPrice || 0) * Number(item.qty || 0);

    return acc + Number(lineTotal || 0);
  }, 0);

  return subtotal || Number(order?.total || 0);
}

function getServiceFee(order, subtotal) {
  const total = Number(order?.total || 0);
  const fee = total - Number(subtotal || 0);

  return fee > 0 ? fee : 0;
}

export function PurchaseDetail() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await getOrderByIdRequest(id);

        if (!alive) return;

        setOrder(res?.data?.order ?? null);
      } catch (error) {
        setErrorMsg(
          error?.response?.data?.message ||
            "No se pudo cargar el detalle de compra."
        );
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

  const event = order?.event;
  const tickets = order?.tickets ?? [];

  const orderStatus = normalizeStatus(order?.status);
  const isPaid = orderStatus === "PAID";
  const isPending = orderStatus === "PENDING";
  const isCanceledOrExpired = orderStatus === "CANCELED" || orderStatus === "EXPIRED";

  const subtotal = useMemo(() => getSubtotal(order), [order]);
  const serviceFee = useMemo(
    () => getServiceFee(order, subtotal),
    [order, subtotal]
  );
  const discounts = 0;

  function handlePrint() {
    if (!order || !isPaid) return;
    generatePurchasePdf(order);
  }

  if (loading) {
    return (
      <div className="ticketify-purchase bg-[#f3faff] text-[#001f29]">
        <PurchaseStyles />

        <main className="tf-container px-4 py-10">
          <div className="rounded-xl border border-[#baeaff] bg-white p-6 shadow-[0_4px_20px_rgba(23,86,118,0.08)]">
            <div className="h-7 w-1/3 animate-pulse rounded bg-[#d8f2ff]" />
            <div className="mt-6 h-56 w-full animate-pulse rounded-xl bg-[#d8f2ff]" />
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="ticketify-purchase bg-[#f3faff] text-[#001f29]">
        <PurchaseStyles />

        <main className="tf-container flex min-h-[60vh] items-center justify-center px-4 py-10">
          <section className="w-full max-w-xl rounded-xl border border-[#ffdad6] bg-white p-8 text-center shadow-[0_4px_20px_rgba(23,86,118,0.08)]">
            <span className="material-symbols-outlined mb-4 text-6xl text-[#ba1a1a]">
              error
            </span>

            <h1 className="text-[32px] font-bold leading-10 text-[#001f29]">
              Compra no encontrada
            </h1>

            <p className="mt-2 text-[16px] leading-6 text-[#5b403f]">
              {errorMsg || "No encontramos el detalle de esta compra."}
            </p>

            <Link
              to="/my-purchases"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#d62839] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024]"
            >
              Volver a mis compras
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="ticketify-purchase bg-[#f3faff] text-[#001f29]">
      <PurchaseStyles />

      <main className="tf-container px-4 pb-24 pt-10">
        <div className="mb-8">
          <Link
            to="/my-purchases"
            className="mb-3 inline-flex items-center gap-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#215d7d] transition-colors hover:text-[#b20024]"
          >
            <span className="material-symbols-outlined text-lg">
              arrow_back
            </span>
            Volver a mis compras
          </Link>

          <h1 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29]">
            Detalle de compra
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_rgba(23,86,118,0.08)] md:flex">
              <div className="h-56 overflow-hidden md:h-auto md:w-1/3">
                <img
                  src={safeBanner(event?.bannerUrl)}
                  alt={event?.title || "Evento"}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-center p-6 md:w-2/3">
                <div className="mb-2 flex items-center gap-2 text-[#b20024]">
                  <span className="material-symbols-outlined text-lg">
                    music_note
                  </span>

                  <span className="text-[14px] font-bold uppercase leading-5 tracking-[0.08em]">
                    {(event?.tags?.[0] || "Evento").toString()}
                  </span>
                </div>

                <h2 className="mb-3 text-[24px] font-bold leading-8 text-[#003545]">
                  {event?.title || "Evento"}
                </h2>

                <div className="space-y-2 text-[16px] leading-6 text-[#5b403f]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-[#215d7d]">
                      calendar_today
                    </span>
                    {formatDate(event?.startAt)}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-[#215d7d]">
                      location_on
                    </span>
                    {[event?.venue, event?.city].filter(Boolean).join(", ") ||
                      "Ubicación a confirmar"}
                  </div>
                </div>

                <p className="mt-4 line-clamp-2 text-[16px] leading-6 text-[#5b403f]">
                  {event?.description ||
                    "Detalle del evento asociado a esta compra."}
                </p>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-[24px] font-bold leading-8 text-[#003545]">
                Tickets de esta compra
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {tickets.length === 0 ? (
                  <div className="rounded-xl border border-[#e4bdbc] bg-white p-6 text-[16px] leading-6 text-[#5b403f] shadow-sm md:col-span-2">
                    {isPending
                      ? "Los tickets se generarán automáticamente cuando el pago sea confirmado."
                      : "Todavía no hay tickets generados para esta compra."}
                  </div>
                ) : (
                  tickets.map((ticket, index) => {
                    const ticketId = getTicketId(ticket);

                    return (
                      <article
                        key={ticketId}
                        className="ticket-bg-pattern relative overflow-hidden rounded-xl border border-[#e4bdbc] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div
                          className={[
                            "absolute right-0 top-0 rounded-bl-xl px-4 py-1 text-[14px] font-semibold leading-5 tracking-[0.05em]",
                            ticketStatusClass(ticket.status),
                          ].join(" ")}
                        >
                          {ticketStatusLabel(ticket.status)}
                        </div>

                        <div className="mb-5">
                          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5b403f]">
                            Código
                          </span>

                          <p className="mt-1 break-all text-[24px] font-bold leading-8 text-[#003545]">
                            {ticket.code || "—"}
                          </p>
                        </div>

                        <div className="mb-6 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5b403f]">
                              Tipo
                            </span>

                            <p className="mt-1 font-bold text-[#001f29]">
                              {getTicketTypeName(ticket, order)}
                            </p>
                          </div>

                          <div>
                            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5b403f]">
                              Titular
                            </span>

                            <p className="mt-1 font-bold text-[#001f29]">
                              {getTicketHolder(ticket, index)}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/my-tickets?ticketId=${ticketId}`}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#b20024] text-[14px] font-bold leading-5 tracking-[0.05em] text-[#b20024] transition-all hover:bg-[#b20024] hover:text-white"
                        >
                          <span className="material-symbols-outlined">
                            qr_code_2
                          </span>
                          Ver ticket
                        </Link>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            {order.items?.length ? (
              <section>
                <h3 className="mb-4 text-[24px] font-bold leading-8 text-[#003545]">
                  Detalle unitario de la compra
                </h3>

                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <article
                      key={`${item.ticketTypeId || item.name || index}`}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-[#baeaff] bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-[18px] font-bold leading-7 text-[#001f29]">
                          {item.name || "Entrada"}
                        </p>

                        <p className="mt-1 text-[14px] leading-5 text-[#5b403f]">
                          Cantidad: {item.qty || 0} · Precio unitario:{" "}
                          <Money
                            value={item.unitPrice}
                            currency={item.currency || order.currency || "ARS"}
                          />
                        </p>
                      </div>

                      <p className="text-[20px] font-bold leading-6 text-[#b20024]">
                        <Money
                          value={
                            item.lineTotal ??
                            Number(item.unitPrice || 0) * Number(item.qty || 0)
                          }
                          currency={item.currency || order.currency || "ARS"}
                        />
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <section className="sticky top-24 rounded-xl border border-[#e4bdbc] bg-white p-6 shadow-[0_4px_20px_rgba(23,86,118,0.08)]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <span className="break-all text-[16px] leading-6 text-[#5b403f]">
                  Pedido #{String(order._id || order.id || "").slice(-8)}
                </span>

                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[14px] font-semibold leading-5 tracking-[0.05em]",
                    statusClass(order.status),
                  ].join(" ")}
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isPaid ? "check_circle" : "info"}
                  </span>
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="mb-8 space-y-4 border-b border-[#d8f2ff] pb-6">
                <SummaryRow
                  label="Orden creada"
                  value={formatDateShort(order.createdAt)}
                />

                <SummaryRow
                  label={isPaid ? "Pagado el" : "Pago confirmado"}
                  value={isPaid ? formatDateShort(order.paidAt) : "Pendiente"}
                />

                <SummaryRow
                  label="Proveedor"
                  value={order.paymentProvider || "—"}
                />

                {order.paymentRef ? (
                  <div>
                    <span className="block text-[16px] leading-6 text-[#5b403f]">
                      Referencia de pago
                    </span>

                    <span className="mt-1 block break-all text-[13px] font-bold leading-5 text-[#001f29]">
                      {order.paymentRef}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="mb-8 space-y-3">
                <SummaryMoneyRow
                  label={`Subtotal ${
                    tickets.length || order.items?.length
                      ? `(${tickets.length || order.items?.length} tickets)`
                      : ""
                  }`}
                  value={subtotal}
                  currency={order.currency || "ARS"}
                />

                <SummaryMoneyRow
                  label="Impuestos & Service fee"
                  value={serviceFee}
                  currency={order.currency || "ARS"}
                />

                <div className="flex justify-between text-[16px] leading-6 text-[#5b403f]">
                  <span>Descuentos</span>
                  <span className="text-green-600">
                    -<Money value={discounts} currency="" />
                  </span>
                </div>

                <div className="mt-2 flex justify-between gap-4 border-t border-[#d8f2ff] pt-4">
                  <span className="text-[24px] font-bold leading-8 text-[#003545]">
                    {isPaid ? "Total pagado" : "Total"}
                  </span>

                  <Money
                    value={order.total}
                    currency={order.currency || "ARS"}
                    className="text-[24px] font-bold leading-8 text-[#b20024]"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!isPaid}
                onClick={handlePrint}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#d62839] px-5 text-[18px] font-bold leading-7 text-white shadow-lg transition-all hover:bg-[#b20024] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined">download</span>
                Descargar comprobante PDF
              </button>

              <p className="mt-4 px-4 text-center text-[12px] font-semibold leading-5 tracking-[0.04em] text-[#5b403f]">
                {isPaid
                  ? "Este comprobante no es válido para el ingreso al evento. Debes presentar tus tickets QR."
                  : "El comprobante PDF estará disponible cuando el pago sea confirmado."}
              </p>
            </section>

            <HelpCard
              isPending={isPending}
              isPaid={isPaid}
              isCanceledOrExpired={isCanceledOrExpired}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[16px] leading-6 text-[#5b403f]">{label}</span>
      <span className="text-right text-[16px] font-bold leading-6 text-[#001f29]">
        {value || "—"}
      </span>
    </div>
  );
}

function SummaryMoneyRow({ label, value, currency }) {
  return (
    <div className="flex justify-between gap-4 text-[16px] leading-6 text-[#5b403f]">
      <span>{label}</span>

      <Money value={value} currency={currency} />
    </div>
  );
}

function HelpCard({ isPending, isPaid, isCanceledOrExpired }) {
  let title = "¿Necesitas ayuda?";
  let icon = "help_outline";
  let message =
    "Si tienes problemas con tu compra, contacta a nuestro centro de atención al cliente.";
  let linkLabel = "Contactar soporte";
  let linkTo = "/start";

  if (isPending) {
    title = "Pago pendiente";
    icon = "pending_actions";
    message =
      "Tu orden fue creada, pero el pago todavía no fue confirmado. Cuando el pago se apruebe, tus tickets se generarán automáticamente.";
    linkLabel = "Volver a mis compras";
    linkTo = "/my-purchases";
  }

  if (isPaid) {
    title = "Compra confirmada";
    icon = "verified";
    message =
      "Tu pago fue confirmado. Podés ver tus tickets QR desde la sección Mis entradas.";
    linkLabel = "Ver mis tickets";
    linkTo = "/my-tickets";
  }

  if (isCanceledOrExpired) {
    title = "Orden no disponible";
    icon = "error_outline";
    message =
      "Esta orden fue cancelada o expiró. Si querés asistir al evento, volvé a iniciar el proceso de compra.";
    linkLabel = "Explorar eventos";
    linkTo = "/events";
  }

  return (
    <section className="rounded-xl border border-[#97cdf2] bg-[#e5f6ff] p-6">
      <h4 className="mb-2 flex items-center gap-2 font-bold text-[#001e2e]">
        <span className="material-symbols-outlined text-[#215d7d]">
          {icon}
        </span>
        {title}
      </h4>

      <p className="mb-4 text-[16px] leading-6 text-[#034c6b]">
        {message}
      </p>

      <Link
        to={linkTo}
        className="text-[14px] font-bold leading-5 tracking-[0.05em] text-[#b20024] hover:underline"
      >
        {linkLabel}
      </Link>
    </section>
  );
}

function PurchaseStyles() {
  return (
    <style>{`
      .ticket-bg-pattern {
        background-color: #ffffff;
        background-image:
          radial-gradient(#d8f2ff 0.5px, transparent 0.5px),
          radial-gradient(#d8f2ff 0.5px, #ffffff 0.5px);
        background-size: 20px 20px;
        background-position: 0 0, 10px 10px;
      }

      @media print {
        header,
        footer,
        .print\\:hidden {
          display: none !important;
        }

        main {
          padding-top: 0 !important;
        }
      }
    `}</style>
  );
}