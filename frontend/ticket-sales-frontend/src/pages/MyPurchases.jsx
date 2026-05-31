import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getMyOrdersRequest } from "@/api/orders.api.js";
import { createPreferenceRequest } from "@/api/payments.api.js";
import { getEventById } from "@/api/events.api.js";

function normalizeStatus(status = "") {
  return String(status || "").toUpperCase();
}

function getOrderId(order) {
  return order?._id || order?.id;
}

function shortOrderId(order) {
  const id = String(getOrderId(order) || "");
  if (!id) return "—";

  return `TK-${id.slice(-5).toUpperCase()}`;
}

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getOrderEventId(order) {
  return (
    order?.eventId ||
    order?.event?._id ||
    order?.event?.id ||
    order?.items?.[0]?.eventId ||
    order?.items?.[0]?.event?._id ||
    order?.items?.[0]?.event?.id ||
    null
  );
}

function getOrderEventTitle(order, event) {
  return (
    order?.event?.title ||
    event?.title ||
    order?.items?.[0]?.event?.title ||
    "Evento"
  );
}

function getOrderVenue(order, event) {
  return [order?.event?.venue || event?.venue, order?.event?.city || event?.city]
    .filter(Boolean)
    .join(" - ");
}

function countTickets(order) {
  const items = Array.isArray(order?.items) ? order.items : [];

  if (!items.length) return Number(order?.qty || order?.quantity || 0);

  return items.reduce((total, item) => {
    return total + Number(item.qty || item.quantity || 1);
  }, 0);
}

function safeBanner(url, status = "PAID") {
  if (url) return url;

  if (status === "PENDING") {
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuCE_FzVAsJaxi0a4BB-L8eb9BGaigkC1aVE8oatqJKW1V0BQR2gMnlNTWGPaJ1FlN9LPXHINKlzy4euoApSq_45cK398vEdJEaSd566ddn9Y4bOPanL2T_Pbz6NMnjgkze62Bikxs8PF25_lpEqvz3vPPUivwfW9gd9mxXLw-Y0hDgMq3nzVJz02UXtUAk91VSc3Y9T14uDIDC2MztsduCGeL5zPP8z_ALc42amUKckRfq05i8aRSAbBGL2dXiy6UeX0iaOegzSb85i";
  }

  if (status === "EXPIRED" || status === "CANCELED") {
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuCRX7mo87ZBgwlxPDnymaGO_Bf3IO5HHGxAVSmmlNUYilXcc_nnTYvp8dJioMam0MddLP3BU1blpfH-xVmqec3arF-XhkJkMTkIiltiCSXzj_4iNLh39ZGlh6jUKlPOglGtjZQCZu9fGzrihmkjLQREFVUFLcHok4oA0vojknX35wGkvVEdqWNX6EzF1w7iF00_28Y-mn36-y1qohN59PTh5SwZL4rir0vkJIHy4eHKCKoImfzfuc1g83VS68DBmQ3PI4AaXcqh6_t4";
  }

  return "https://lh3.googleusercontent.com/aida-public/AB6AXuDhL_bYeFjx6jDA-Yyi5IEdCQPIiOaKTN-eZzm5kLWz63uVSZfd_V2OVphrEAI2ZQIhN_C48TWq-ybit_hD0Uy-7JwUQNEPo3hFhv3mGiT12WcFLIYthIHIHN_fgUn3weaeSYi-Tc9LTgmne4-_-dx2fycSylCkJN6QdXw5xEeB-WLpnt6u5Ilb5XXE1qoFK3GqF8vle1indYcNDh7zp_VNRRqc1ldadiMLfa10iMpJ1hqXQhAumHbyFKwa9JHeqr9eG3bJKp0Wa-5N";
}

function statusLabel(status) {
  const safeStatus = normalizeStatus(status);

  if (safeStatus === "PAID") return "Pagado";
  if (safeStatus === "PENDING") return "Pendiente";
  if (safeStatus === "EXPIRED") return "Expirado";
  if (safeStatus === "CANCELED") return "Cancelado";

  return safeStatus || "—";
}

function statusClasses(status) {
  const safeStatus = normalizeStatus(status);

  if (safeStatus === "PAID") {
    return "border-green-200 bg-green-100 text-green-700";
  }

  if (safeStatus === "PENDING") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  if (safeStatus === "EXPIRED" || safeStatus === "CANCELED") {
    return "border-[#e4bdbc] bg-[#baeaff] text-[#5b403f]";
  }

  return "border-[#e4bdbc] bg-[#e5f6ff] text-[#5b403f]";
}

export function MyPurchases() {
  const [orders, setOrders] = useState([]);
  const [eventsMap, setEventsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [payingOrderId, setPayingOrderId] = useState("");

  const [tab, setTab] = useState("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErrorMsg("");

        const response = await getMyOrdersRequest();

        if (!alive) return;

        const nextOrders = Array.isArray(response?.data?.orders)
          ? response.data.orders
          : [];

        setOrders(nextOrders);

        const eventIds = [
          ...new Set(nextOrders.map(getOrderEventId).filter(Boolean)),
        ];

        const eventPairs = await Promise.all(
          eventIds.map(async (eventId) => {
            try {
              const eventResponse = await getEventById(eventId);

              return [
                eventId,
                eventResponse?.data?.event ?? eventResponse?.data ?? null,
              ];
            } catch {
              return [eventId, null];
            }
          })
        );

        if (!alive) return;

        setEventsMap(
          Object.fromEntries(eventPairs.filter(([, event]) => Boolean(event)))
        );
      } catch (error) {
        setErrorMsg(
          error?.response?.data?.message || "No se pudieron cargar tus compras."
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
  }, []);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      paid: orders.filter((order) => normalizeStatus(order.status) === "PAID")
        .length,
      pending: orders.filter(
        (order) => normalizeStatus(order.status) === "PENDING"
      ).length,
      expired: orders.filter((order) =>
        ["EXPIRED", "CANCELED"].includes(normalizeStatus(order.status))
      ).length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();

    return orders
      .filter((order) => {
        const status = normalizeStatus(order.status);

        if (tab === "PAID") return status === "PAID";
        if (tab === "PENDING") return status === "PENDING";
        if (tab === "EXPIRED") {
          return status === "EXPIRED" || status === "CANCELED";
        }

        return true;
      })
      .filter((order) => {
        if (!search) return true;

        const event = eventsMap[getOrderEventId(order)];

        const searchable = [
          getOrderId(order),
          shortOrderId(order),
          getOrderEventTitle(order, event),
          getOrderVenue(order, event),
          order.paymentRef,
          order.paymentProvider,
          order.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(search);
      });
  }, [orders, eventsMap, query, tab]);

  async function completePayment(order) {
    try {
      const orderId = getOrderId(order);

      if (!orderId) return;

      setPayingOrderId(orderId);

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
      setErrorMsg(
        error?.response?.data?.message ||
          "No se pudo reanudar el pago de esta orden."
      );
    } finally {
      setPayingOrderId("");
    }
  }

  return (
    <div className="ticketify-purchases bg-[#f3faff] text-[#001f29]">
      <style>{`
        .purchase-card-shadow {
          box-shadow: 0px 4px 20px rgba(23, 86, 118, 0.08);
        }
      `}</style>

      <main className="tf-container py-12">
        <section className="mb-12">
          <h1 className="mb-2 text-[40px] font-extrabold leading-tight tracking-[-0.01em] text-[#001f29] md:text-[48px]">
            Mis compras
          </h1>

          <p className="text-[18px] leading-7 text-[#5b403f] opacity-80">
            Consultá tu historial de órdenes, pagos y compras realizadas.
          </p>
        </section>

        <section className="mb-20 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total de órdenes" value={stats.total} tone="red" />
          <StatCard label="Pagadas" value={stats.paid} tone="blue" />
          <StatCard label="Pendientes" value={stats.pending} tone="berry" />
          <StatCard label="Expiradas" value={stats.expired} tone="muted" />
        </section>

        <section className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            <FilterButton active={tab === "ALL"} onClick={() => setTab("ALL")}>
              Todas
            </FilterButton>

            <FilterButton active={tab === "PAID"} onClick={() => setTab("PAID")}>
              Pagadas
            </FilterButton>

            <FilterButton
              active={tab === "PENDING"}
              onClick={() => setTab("PENDING")}
            >
              Pendientes
            </FilterButton>

            <FilterButton
              active={tab === "EXPIRED"}
              onClick={() => setTab("EXPIRED")}
            >
              Expiradas
            </FilterButton>
          </div>

          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#215d7d]">
              search
            </span>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-full border border-[#baeaff] bg-white py-3 pl-12 pr-4 text-[16px] text-[#001f29] outline-none transition-all placeholder:text-[#5b403f]/70 focus:border-[#d62839] focus:ring-2 focus:ring-[#d62839]/20"
              placeholder="Buscar por número de orden o evento"
              type="text"
            />
          </div>
        </section>

        {loading ? (
          <section className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="purchase-card-shadow rounded-xl border border-[#baeaff] bg-white p-6 md:p-8"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="h-24 w-24 animate-pulse rounded-lg bg-[#d8f2ff]" />

                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-56 animate-pulse rounded bg-[#d8f2ff]" />
                    <div className="h-4 w-80 animate-pulse rounded bg-[#d8f2ff]" />
                    <div className="h-4 w-48 animate-pulse rounded bg-[#d8f2ff]" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : errorMsg ? (
          <section className="rounded-xl border border-[#ffdad6] bg-[#ffdad6] p-6 text-[#93000a]">
            {errorMsg}
          </section>
        ) : filteredOrders.length === 0 ? (
          <section className="purchase-card-shadow flex flex-col items-center justify-center rounded-xl border border-[#baeaff] bg-white py-20 text-center">
            <span className="material-symbols-outlined mb-6 text-8xl text-[#a2e3ff]">
              shopping_bag
            </span>

            <h2 className="mb-2 text-[24px] font-bold leading-8 text-[#001f29]">
              No tenés compras recientes
            </h2>

            <p className="mb-8 max-w-sm text-[16px] leading-6 text-[#5b403f]">
              Explorá los próximos eventos y asegurá tus entradas ahora mismo.
            </p>

            <Link
              to="/events"
              className="rounded-full bg-[#d62839] px-8 py-3 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white shadow-lg transition-all hover:brightness-110"
            >
              Explorar eventos
            </Link>
          </section>
        ) : (
          <section className="space-y-6">
            {filteredOrders.map((order) => {
              const orderId = getOrderId(order);
              const status = normalizeStatus(order.status);
              const event = eventsMap[getOrderEventId(order)];
              const eventTitle = getOrderEventTitle(order, event);
              const venue = getOrderVenue(order, event);
              const ticketCount = countTickets(order);
              const expired = status === "EXPIRED" || status === "CANCELED";
              const paid = status === "PAID";
              const pending = status === "PENDING";

              return (
                <article
                  key={orderId}
                  className={[
                    "flex flex-col items-start gap-6 rounded-xl border border-[#baeaff] bg-white p-6 shadow-sm transition-all duration-300 md:flex-row md:items-center md:p-8",
                    expired
                      ? "opacity-70 grayscale"
                      : "hover:-translate-y-0.5 hover:shadow-md",
                  ].join(" ")}
                >
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#f3faff]">
                    <img
                      alt={eventTitle}
                      className="h-full w-full object-cover"
                      src={safeBanner(event?.bannerUrl, status)}
                    />
                  </div>

                  <div className="flex-grow space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[24px] font-bold leading-8 text-[#001f29]">
                        Order #{shortOrderId(order)}
                      </h3>

                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
                          statusClasses(status),
                        ].join(" ")}
                      >
                        {statusLabel(status)}
                      </span>
                    </div>

                    <p className="text-[16px] leading-6 text-[#5b403f] opacity-70">
                      {[eventTitle, venue].filter(Boolean).join(" - ")}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <div className="flex items-center gap-1 text-[#5b403f]">
                        <span className="material-symbols-outlined text-sm">
                          calendar_today
                        </span>

                        <span className="text-[14px] font-semibold leading-5 tracking-[0.05em]">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      {ticketCount > 0 ? (
                        <div className="flex items-center gap-1 text-[#5b403f]">
                          <span className="material-symbols-outlined text-sm">
                            confirmation_number
                          </span>

                          <span className="text-[14px] font-semibold leading-5 tracking-[0.05em]">
                            {ticketCount}{" "}
                            {ticketCount === 1 ? "Entrada" : "Entradas"}
                          </span>
                        </div>
                      ) : null}

                      {pending ? (
                        <div className="flex items-center gap-1 text-amber-600">
                          <span className="material-symbols-outlined text-sm">
                            warning
                          </span>

                          <span className="text-[14px] font-semibold leading-5 tracking-[0.05em]">
                            Pago pendiente
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex w-full flex-col items-end gap-2 md:w-auto">
                    <span
                      className={[
                        "text-[20px] font-bold leading-6",
                        expired ? "text-[#5b403f]" : "text-[#b20024]",
                      ].join(" ")}
                    >
                      {money(order.total)}
                    </span>

                    <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                      {pending ? (
                        <button
                          type="button"
                          onClick={() => completePayment(order)}
                          disabled={payingOrderId === orderId}
                          className="w-full rounded-lg bg-[#b20024] px-6 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white shadow-sm transition-colors hover:bg-[#d62839] disabled:opacity-60 md:w-auto"
                        >
                          {payingOrderId === orderId
                            ? "Abriendo..."
                            : "Completar pago"}
                        </button>
                      ) : null}

                      <Link
                        to={`/my-purchases/${orderId}`}
                        className={[
                          "w-full rounded-lg px-6 py-2 text-center text-[14px] font-semibold leading-5 tracking-[0.05em] transition-colors md:w-auto",
                          expired
                            ? "border border-[#baeaff] text-[#5b403f] hover:bg-[#baeaff]"
                            : "border border-[#b20024] text-[#b20024] hover:bg-[#b20024]/5",
                        ].join(" ")}
                      >
                        Ver detalle
                      </Link>

                      {paid ? (
                        <Link
                          to="/my-tickets"
                          className="w-full rounded-lg bg-[#b20024] px-6 py-2 text-center text-[14px] font-semibold leading-5 tracking-[0.05em] text-white shadow-sm transition-colors hover:bg-[#d62839] md:w-auto"
                        >
                          Ver ticket
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneClasses = {
    red: "text-[#b20024]",
    blue: "text-[#215d7d]",
    berry: "text-[#af2a48]",
    muted: "text-[#906f6e]",
  };

  return (
    <div className="rounded-xl border border-[#baeaff] bg-[#e5f6ff] p-6 shadow-sm transition-transform hover:scale-[1.02]">
      <p className="mb-1 text-[14px] font-semibold uppercase leading-5 tracking-[0.05em] text-[#5b403f]">
        {label}
      </p>

      <p className={`text-[32px] font-bold leading-10 ${toneClasses[tone]}`}>
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-6 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] transition-all",
        active
          ? "bg-[#d62839] text-white shadow-md"
          : "bg-[#baeaff] text-[#5b403f] hover:bg-[#d8f2ff] hover:text-[#b20024]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}