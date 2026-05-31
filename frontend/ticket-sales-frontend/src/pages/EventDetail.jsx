import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getEventById, getEventTicketTypes } from "@/api/events.api.js";

const similarEvents = [
  {
    title: "Electric Echoes: Rock Night",
    category: "CONCIERTO",
    location: "Razzmatazz, Barcelona",
    date: "12 Nov",
    price: "$25.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBi3cAdSdN8PBGaSkAu60k-QE5XGjLOhsoWkV3YZnHRIpO9lKKKsyoIQO137ROfesQ-Q98g6rHYn12lOAsV9SUv0V2UUD0eRwZPoEe3dRWkw1JMv8Wwa8of_8qx6KW0bcyh6zuj3OWw50CDjjNUh0rGB2qXH_HjZ2mkP_09fPlkoMfNcd7DwptvR-ahWq54nYW8inWgleEA4Bnk60o6xUZ0KcoIzgB7e86vR8TscQOKWSBjKB5sS-vh-Qo_TT8D6gGu19G1tzGyFJJx",
  },
  {
    title: "Indie Pop Garden Fest",
    category: "FESTIVAL",
    location: "Poble Espanyol",
    date: "20 Nov",
    price: "$45.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBoxpqDfRgj1FJqisIs20EyUw34qvpsv11DlKVs_M3FTMnoa2Zjt01O-9togfKSo7WND7_gTfNcCkws2wbKocrjfbCyvn1sReWYWxclgce6B0iJ6tVIAS1oPwlf3MQjlXSD_iLxiyxGp98UFe2yPm06Q1THTIC9pB7hy4adPe24R-Fki5I1Rx17wmt8lU-nbLaxZzAFoCFgH1IuwyNl-NE_eHK2yYJhul2CKFjmglH9VeMj5RuvioVU9wVTT50hMvQhGMW4YIDfW8IP",
  },
  {
    title: "Beethoven Symphony No. 9",
    category: "CLÁSICA",
    location: "Palau de la Música",
    date: "25 Nov",
    price: "$55.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjKK-HxzWqgRdtLQCsECU27n6_cy83v5Pqi9gCBVa61DnIEgtuMvK3G8xuIrsGd_RqpjGmdYgPCc0FMpRpzIFGcGVi5uSlEKJspCQHEi6VH0IbKVcm0WTuZfaMI-dz_U0RsEvkFMTXDp4_3zdtJvNboxrMoLmA8DHonT4_hwjFqVnX2b5I7ZEQ8FW59QtrF9D1zzqy0U3fTd2OwEaxBFo3U9pj-vI80trRKdJ1P4LzckXgv64jubSLZmsYbfZ_IyEpKDQxY-UWXaD_",
  },
];

function formatTagLabel(tag = "") {
  const dictionary = {
    music: "Concierto",
    musica: "Concierto",
    música: "Concierto",
    concert: "Concierto",
    concerts: "Concierto",
    concierto: "Concierto",
    conciertos: "Concierto",
    sports: "Deportes",
    sport: "Deportes",
    deportes: "Deportes",
    theater: "Teatro",
    theatre: "Teatro",
    teatro: "Teatro",
    festivals: "Festivales",
    festival: "Festivales",
    festivales: "Festivales",
    comedy: "Comedia",
    comedia: "Comedia",
    standup: "Comedia",
    "stand-up": "Comedia",
  };

  const clean = String(tag || "").trim();
  const lower = clean.toLowerCase();

  if (dictionary[lower]) return dictionary[lower];

  return clean
    ? clean
        .split(/\s+/)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ")
    : "Evento";
}

function formatDateLong(iso) {
  if (!iso) return "Fecha a confirmar";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "Fecha a confirmar";

  return date.toLocaleDateString("es-AR", {
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

function safeBanner(url) {
  return (
    url ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuACH0mGVRuAsNl0D2sELFmhL43Vvo0ogJaItEvmOx7NqqCKKUiFjd_0sOY0we08rHwa8hjgkIGSUoE6zEBKLwUxfNKWhU3SZzFJ9C3VSVMnl8nO6elaaxz_SV849DOqD_m97X2IM7rqcGBX_XuqBBGJZVFWqPxaPce5O5NiQuVPjSS4nvFXqzMIFWeJdjnkU1VanJeTh5O58dgBt62G03dkPLYmdq3Q27N28zt6Ur4bYiOiq-ho3sYhrZnGqr_Lja5knsfYz1LiRG-f"
  );
}

function safeMapImage() {
  return "https://lh3.googleusercontent.com/aida-public/AB6AXuCyPsfa3tvZd99WCTRVmsPlUUv82315VA5j1s_ABW4hDAs1CvpPHmcKQEuW_KvFmT4bH4oWHxSXIFF8mJVsob4aNZKbY6_uZC3v4IWYDNTWa5z_jDz9uLRxsOPrDUuyWoHzGMHPVv8OsTYD9IruovH73TY99gGFda9ozij4S-mXTyy9zY2ToPxIMgaqBvYDVODQdHfYqoUd7TjU5ngYhPVfjyqkEvDW32fu15_IB9XfA5HqqW2PBhmkxpD4IkmKNlAMsPOZH500gjf1";
}

function money(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";

  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isEventEnded(startAt) {
  if (!startAt) return false;
  return new Date() >= new Date(startAt);
}

function getTicketId(ticket) {
  return ticket?._id || ticket?.id;
}

function getTicketDescription(ticket) {
  if (ticket?.description) return ticket.description;

  const name = String(ticket?.name || "").toLowerCase();

  if (name.includes("vip")) return "Backstage access + Drink";
  if (name.includes("premium")) return "Asientos preferenciales";
  if (name.includes("general")) return "Acceso estándar";

  return "Entrada para el evento";
}

function priceFrom(ticketTypes) {
  const prices = (ticketTypes ?? [])
    .filter((ticket) => Number(ticket.available ?? 0) > 0)
    .map((ticket) => Number(ticket.price))
    .filter((price) => Number.isFinite(price));

  if (!prices.length) return null;

  return Math.min(...prices);
}

export function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();

  const isExpired = useMemo(() => {
    return isEventEnded(event?.startAt);
  }, [event]);

  const activeTicketTypes = useMemo(() => {
    return (ticketTypes ?? []).filter((ticket) => {
      const available = Number(ticket.available ?? 0);
      const saleStartAt = ticket.saleStartAt
        ? new Date(ticket.saleStartAt)
        : null;
      const saleEndAt = ticket.saleEndAt ? new Date(ticket.saleEndAt) : null;

      const saleNotStarted = saleStartAt && now < saleStartAt;
      const saleEnded = saleEndAt && now > saleEndAt;

      return available > 0 && !saleNotStarted && !saleEnded && !isExpired;
    });
  }, [ticketTypes, isExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  const minPrice = useMemo(() => {
    if (isExpired) return null;
    return priceFrom(activeTicketTypes);
  }, [activeTicketTypes, isExpired]);

  const selectedTicket = useMemo(() => {
    return ticketTypes.find(
      (ticket) => getTicketId(ticket) === selectedTicketTypeId
    );
  }, [ticketTypes, selectedTicketTypeId]);

  const primaryTag = formatTagLabel(
    event?.tags?.[0] || event?.category || "Evento"
  );

  const mapsQuery = encodeURIComponent(
    [event?.venue, event?.address, event?.city].filter(Boolean).join(", ")
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);

        const [eventResponse, ticketResponse] = await Promise.all([
          getEventById(id),
          getEventTicketTypes(id),
        ]);

        if (!alive) return;

        const nextEvent =
          eventResponse?.data?.event ?? eventResponse?.data ?? null;
        const nextTicketTypes = ticketResponse?.data?.ticketTypes ?? [];

        setEvent(nextEvent);
        setTicketTypes(Array.isArray(nextTicketTypes) ? nextTicketTypes : []);

        const firstAvailable = Array.isArray(nextTicketTypes)
          ? nextTicketTypes.find(
              (ticket) => Number(ticket.available ?? 0) > 0
            )
          : null;

        setSelectedTicketTypeId(
          firstAvailable ? getTicketId(firstAvailable) : null
        );
      } catch (error) {
        console.error("Error loading event detail:", error);

        if (!alive) return;

        setEvent(null);
        setTicketTypes([]);
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

  function goCheckout(ticketTypeId = selectedTicketTypeId) {
    if (isExpired || !ticketTypeId) return;

    navigate(`/checkout/${id}`, {
      state: {
        ticketTypeId,
      },
    });
  }

  function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: event?.title || "Ticketify",
        url,
      });
      return;
    }

    navigator.clipboard?.writeText(url);
  }

  if (loading) {
    return (
      <div className="ticketify-detail bg-[#f3faff] text-[#001f29]">
        <DetailStyles />

        <main className="tf-container py-10">
          <div className="card-shadow rounded-xl bg-white p-6">
            <div className="h-[360px] animate-pulse rounded-xl bg-[#d8f2ff]" />
            <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-[#d8f2ff]" />
            <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-[#d8f2ff]" />
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="ticketify-detail bg-[#f3faff] text-[#001f29]">
        <DetailStyles />

        <main className="tf-container py-10">
          <div className="card-shadow rounded-xl bg-white p-8 text-[#5b403f]">
            No se encontró el evento.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ticketify-detail bg-[#f3faff] text-[#001f29]">
      <DetailStyles />

      <main className="tf-container px-0 pb-20 pt-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {isExpired ? (
                <span className="flex items-center gap-1 rounded-full bg-[#ffdad6] px-3 py-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#93000a]">
                  <span className="h-2 w-2 rounded-full bg-[#ba1a1a]" />
                  Finalizado
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Activo
                </span>
              )}

              <span className="rounded-full bg-[#c9eeff] px-3 py-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#215d7d]">
                {primaryTag}
              </span>
            </div>

            <h1 className="text-[32px] font-extrabold leading-[40px] tracking-[-0.01em] text-[#001f29] md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
              {event.title}
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 rounded-lg border border-[#906f6e] px-4 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#001f29] transition-colors hover:bg-[#e5f6ff]"
            >
              <span className="material-symbols-outlined">share</span>
              Compartir
            </button>

            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-[#906f6e] px-4 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#001f29] transition-colors hover:bg-[#e5f6ff]"
            >
              <span className="material-symbols-outlined">favorite</span>
              Guardar
            </button>
          </div>
        </div>

        <section className="mb-6">
          <div className="card-shadow relative aspect-[21/9] w-full overflow-hidden rounded-xl">
            <img
              alt={event.title}
              className="h-full w-full object-cover"
              src={safeBanner(event.bannerUrl)}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </section>

        <section className="card-shadow mb-20 grid grid-cols-1 gap-8 rounded-xl bg-white p-8 md:grid-cols-4">
          <InfoItem
            icon="calendar_today"
            label="Fecha"
            value={formatDateLong(event.startAt)}
          />

          <InfoItem
            icon="schedule"
            label="Hora"
            value={formatTime(event.startAt)}
          />

          <InfoItem
            icon="location_on"
            label="Lugar"
            value={event.venue || "Lugar a confirmar"}
          />

          <InfoItem
            icon="public"
            label="Ciudad"
            value={event.city || "Ciudad a confirmar"}
          />
        </section>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="space-y-20 lg:col-span-2">
            <section>
              <h2 className="mb-6 text-[32px] font-bold leading-10 text-[#001f29]">
                Descripción del evento
              </h2>

              <div className="max-w-none space-y-4 text-[18px] leading-7 text-[#5b403f]">
                {event.description ? (
                  event.description
                    .split("\n")
                    .filter(Boolean)
                    .map((paragraph, index) => <p key={index}>{paragraph}</p>)
                ) : (
                  <p>Este evento todavía no tiene descripción disponible.</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-6 text-[32px] font-bold leading-10 text-[#001f29]">
                Ubicación
              </h2>

              <div className="card-shadow overflow-hidden rounded-xl bg-[#d8f2ff]">
                <div className="flex flex-col justify-between gap-4 bg-white p-6 md:flex-row md:items-center">
                  <div>
                    <p className="text-[18px] font-bold leading-7 text-[#001f29]">
                      {event.venue || "Lugar a confirmar"}
                    </p>

                    <p className="text-[#5b403f]">
                      {[event.address, event.city].filter(Boolean).join(", ") ||
                        "Dirección a confirmar"}
                    </p>
                  </div>

                  <a
                    className="flex items-center gap-1 font-bold text-[#b20024] hover:underline"
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver en Google Maps
                    <span className="material-symbols-outlined text-sm">
                      open_in_new
                    </span>
                  </a>
                </div>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-[21/9] bg-[#c9eeff]"
                >
                  <img
                    alt="Mapa de ubicación"
                    className="h-full w-full object-cover opacity-60 grayscale transition-all duration-700 hover:grayscale-0"
                    src={safeMapImage()}
                  />

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 animate-bounce items-center justify-center rounded-full border-4 border-white bg-[#d62839] shadow-lg">
                      <span
                        className="material-symbols-outlined text-xl text-white"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        location_on
                      </span>
                    </div>
                  </div>
                </a>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 border-y border-[#e4bdbc] py-8 md:grid-cols-3">
              <TrustItem
                icon="verified_user"
                title="Compra segura"
                text="Transacciones cifradas de extremo a extremo."
              />

              <TrustItem
                icon="confirmation_number"
                title="Ticket digital"
                text="Recibe tus entradas al instante en tu email."
              />

              <TrustItem
                icon="qr_code_2"
                title="Acceso con QR"
                text="Entrada rápida sin necesidad de imprimir."
              />
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="card-shadow rounded-xl border border-[#d8f2ff] bg-white p-6">
                <h2 className="mb-6 text-[24px] font-bold leading-8 text-[#001f29]">
                  Entradas disponibles
                </h2>

                {ticketTypes.length === 0 ? (
                  <div className="rounded-xl border border-[#e4bdbc] bg-[#f3faff] p-4 text-sm text-[#5b403f]">
                    Este evento todavía no tiene tipos de entradas disponibles.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ticketTypes.map((ticket) => {
                      const ticketId = getTicketId(ticket);
                      const available = Number(ticket.available ?? 0);
                      const soldOut = available <= 0;

                      const saleStartAt = ticket.saleStartAt
                        ? new Date(ticket.saleStartAt)
                        : null;
                      const saleEndAt = ticket.saleEndAt
                        ? new Date(ticket.saleEndAt)
                        : null;

                      const saleNotStarted = saleStartAt && now < saleStartAt;
                      const saleEnded = saleEndAt && now > saleEndAt;

                      const unavailable =
                        isExpired || soldOut || saleNotStarted || saleEnded;

                      const selected = selectedTicketTypeId === ticketId;

                      let availabilityLabel = `${available} disponibles`;
                      let availabilityClass = "text-green-600";

                      if (isExpired) {
                        availabilityLabel = "Evento finalizado";
                        availabilityClass = "text-[#ba1a1a]";
                      } else if (soldOut) {
                        availabilityLabel = "Agotado";
                        availabilityClass = "text-[#ba1a1a]";
                      } else if (saleNotStarted) {
                        availabilityLabel = "Venta no iniciada";
                        availabilityClass = "text-[#b26a00]";
                      } else if (saleEnded) {
                        availabilityLabel = "Venta finalizada";
                        availabilityClass = "text-[#ba1a1a]";
                      }

                      return (
                        <div
                          key={ticketId}
                          className={[
                            "rounded-xl border p-4 transition-all",
                            selected
                              ? "border-[#d62839] bg-[#fff2f1]"
                              : "border-[#e4bdbc] bg-white hover:border-[#d62839]",
                            unavailable ? "opacity-60" : "cursor-pointer",
                          ].join(" ")}
                          onClick={() => {
                            if (!unavailable) setSelectedTicketTypeId(ticketId);
                          }}
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[18px] font-bold leading-7 text-[#001f29]">
                                {ticket.name}
                              </p>

                              <p className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                                {getTicketDescription(ticket)}
                              </p>
                            </div>

                            <p className="text-[20px] font-bold leading-6 text-[#001f29]">
                              {money(ticket.price)}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span
                              className={[
                                "text-[14px] font-semibold leading-5 tracking-[0.05em]",
                                availabilityClass,
                              ].join(" ")}
                            >
                              {availabilityLabel}
                            </span>

                            <button
                              type="button"
                              disabled={unavailable}
                              onClick={(eventClick) => {
                                eventClick.stopPropagation();
                                if (!unavailable) {
                                  setSelectedTicketTypeId(ticketId);
                                }
                              }}
                              className={[
                                "rounded-lg px-4 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] transition-all",
                                unavailable
                                  ? "cursor-not-allowed bg-[#906f6e] text-white/50"
                                  : selected
                                    ? "bg-[#d62839] text-white"
                                    : "bg-[#215d7d] text-white hover:bg-[#3e7697]",
                              ].join(" ")}
                            >
                              {selected
                                ? "Seleccionado"
                                : "Seleccionar ticket"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-8 border-t border-[#e4bdbc] pt-6">
                  <button
                    type="button"
                    disabled={!selectedTicket || isExpired}
                    onClick={() => goCheckout()}
                    className={[
                      "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[18px] font-bold leading-7 shadow-lg transition-all active:scale-[0.98]",
                      selectedTicket && !isExpired
                        ? "bg-[#d62839] text-white hover:shadow-xl"
                        : "cursor-not-allowed bg-[#906f6e] text-white/60",
                    ].join(" ")}
                  >
                    Finalizar compra
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>

                  <p className="mt-4 text-center text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                    {minPrice != null
                      ? `Entradas desde ${money(minPrice)}.`
                      : "Precios incluyen impuestos y cargos por servicio."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-20">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-[32px] font-bold leading-10 text-[#001f29]">
              Eventos similares
            </h2>

            <Link
              to="/events"
              className="flex items-center gap-1 font-bold text-[#b20024] hover:underline"
            >
              Ver todos
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {similarEvents.map((similar) => (
              <Link
                key={similar.title}
                to="/events"
                className="card-shadow group overflow-hidden rounded-xl bg-white transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48">
                  <img
                    alt={similar.title}
                    className="h-full w-full object-cover"
                    src={similar.image}
                  />

                  <span className="absolute left-4 top-4 rounded-lg bg-white px-3 py-1 text-[14px] font-bold leading-5 tracking-[0.05em] text-[#001f29] shadow-sm">
                    {similar.date}
                  </span>
                </div>

                <div className="p-6">
                  <p className="mb-1 text-[14px] font-bold leading-5 tracking-[0.05em] text-[#b20024]">
                    {similar.category}
                  </p>

                  <h3 className="mb-2 text-[18px] font-bold leading-7 text-[#001f29] transition-colors group-hover:text-[#b20024]">
                    {similar.title}
                  </h3>

                  <div className="mb-4 flex items-center gap-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    {similar.location}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[20px] font-bold leading-6 text-[#001f29]">
                      {similar.price}
                    </p>

                    <span className="text-[14px] font-bold uppercase leading-5 tracking-[0.05em] text-[#215d7d]">
                      Tickets
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function DetailStyles() {
  return (
    <style>{`
      .card-shadow {
        box-shadow: 0px 4px 20px rgba(23, 86, 118, 0.08);
      }
    `}</style>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c9eeff] text-[#215d7d]">
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      <div>
        <p className="text-[14px] font-semibold uppercase leading-5 tracking-wider text-[#5b403f]">
          {label}
        </p>

        <p className="text-[18px] font-bold leading-7 text-[#001f29]">
          {value}
        </p>
      </div>
    </div>
  );
}

function TrustItem({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center space-y-2 text-center">
      <span className="material-symbols-outlined text-4xl text-[#215d7d]">
        {icon}
      </span>

      <p className="font-bold text-[#001f29]">{title}</p>

      <p className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
        {text}
      </p>
    </div>
  );
}