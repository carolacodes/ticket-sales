import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getMyTickets } from "@/api/tickets.api.js";
import { getEventById, getEventTicketTypes } from "@/api/events.api.js";

import { QRCodeCanvas } from "qrcode.react";

function safeBanner(url, status = "VALID") {
  if (url) return url;

  if (String(status).toUpperCase() === "USED") {
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuAVgphyeqCY_4qt9lACpj_q9Rm2yccGt0r5JXo4ThKLI_4qBWGNxjSJDUOoSjIEfp5IhlFrP_Oj6LluhWGd6pzY_zhEuRf65gAuHa9FWS0jYNE4wXvPs905ufnGw0YSpdPPniyPmMMIpzlEG5gOY8D-1DhkQ_ddxbo0s0wPCm0pcSKViQszb5ZnIz-dQmSy81ZNA5sNCcF7DlyXJ4Q57K9W2BdqocAsj7Os8nW2ssOpO26Nsxv3_BtykqtuHoL_vaV827f5D8EM-X0h";
  }

  return "https://lh3.googleusercontent.com/aida-public/AB6AXuCdRcjj_b9gynAjOsMUp2HWZdC54tMjJ1UqNkyztYZDEeihjwxTonkchnYAbgayOD15s43J5PfxGy1_mfaY7c3YiZJm5X2v_GE3_orioUOagKKiJRtg7ti0GhBhWSHeVfCMohqp0iwMDxNtajieh5uWagaVQxkiyGNwdy7stl4Wf3BFVGE80BzQxEoLhP-0l9QbiGk5AtYI65ELQSBfL4O7o3hXxKQf8OMs01qpXu0U1vH_cVMaCdM0YKJl19DUVPoSdtgg34WDWiL9";
}

function normalizeStatus(status = "") {
  return String(status || "").toUpperCase();
}

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

function getDateParts(iso) {
  if (!iso) return { day: "--", month: "---" };

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return { day: "--", month: "---" };

  return {
    day: date.toLocaleDateString("es-AR", { day: "2-digit" }),
    month: date
      .toLocaleDateString("es-AR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  };
}

function formatTime(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  const dateText = date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timeText = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateText} • ${timeText}`;
}

function getTicketId(ticket) {
  return ticket?._id || ticket?.id;
}

export function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [eventsMap, setEventsMap] = useState({});
  const [ttMap, setTtMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("ALL");

  const [open, setOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErr("");

        const response = await getMyTickets();
        const list = response?.data?.tickets ?? [];

        if (!alive) return;

        const safeTickets = Array.isArray(list) ? list : [];

        setTickets(safeTickets);

        const uniqueEventIds = [
          ...new Set(
            safeTickets.map((ticket) => ticket.eventId).filter(Boolean)
          ),
        ];

        const eventPairs = await Promise.all(
          uniqueEventIds.map(async (eventId) => {
            const eventResponse = await getEventById(eventId);

            return [
              eventId,
              eventResponse?.data?.event ?? eventResponse?.data ?? null,
            ];
          })
        );

        if (!alive) return;

        const nextEventsMap = Object.fromEntries(
          eventPairs.filter(([, event]) => Boolean(event))
        );

        setEventsMap(nextEventsMap);

        const ticketTypesByEvent = await Promise.all(
          uniqueEventIds.map(async (eventId) => {
            const ticketTypesResponse = await getEventTicketTypes(eventId);
            return ticketTypesResponse?.data?.ticketTypes ?? [];
          })
        );

        if (!alive) return;

        const nextTicketTypesMap = {};

        ticketTypesByEvent
          .flat()
          .filter(Boolean)
          .forEach((ticketType) => {
            const id = ticketType.id || ticketType._id;
            if (id) nextTicketTypesMap[id] = ticketType;
          });

        setTtMap(nextTicketTypesMap);
      } catch (error) {
        console.error("MY_TICKETS_ERROR:", error);
        setErr("No se pudieron cargar tus tickets.");
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

  const filteredTickets = useMemo(() => {
    const search = query.trim().toLowerCase();

    return (tickets || [])
      .filter((ticket) => {
        const status = normalizeStatus(ticket.status);

        if (tab === "VALID") return status === "VALID";
        if (tab === "USED") return status === "USED";

        return true;
      })
      .filter((ticket) => {
        if (!search) return true;

        const event = eventsMap[ticket.eventId];
        const ticketType = ttMap[ticket.ticketTypeId];

        const searchable = [
          event?.title,
          event?.venue,
          event?.city,
          event?.category,
          ...(event?.tags || []),
          ticketType?.name,
          ticket.code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(search);
      });
  }, [tickets, tab, query, eventsMap, ttMap]);

  const activeEvent = activeTicket ? eventsMap[activeTicket.eventId] : null;
  const activeTT = activeTicket ? ttMap[activeTicket.ticketTypeId] : null;

  function openTicketModal(ticket) {
    setActiveTicket(ticket);
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
      // ignore clipboard errors
    }
  }

  function downloadQR() {
    const canvas = qrCanvasRef.current;

    if (!canvas) return;

    const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
    const anchor = document.createElement("a");

    anchor.href = jpgUrl;
    anchor.download = `ticket-qr-${activeTicket?.code?.slice(0, 8) || "qr"}.jpg`;
    anchor.click();
  }

  return (
    <div className="ticketify-tickets bg-[#f3faff] text-[#001f29]">
      <style>{`
        .ticket-card-shadow {
          box-shadow: 0px 4px 20px rgba(23, 86, 118, 0.08);
        }

        .modal-backdrop {
          background-color: rgba(0, 31, 41, 0.6);
          backdrop-filter: blur(4px);
        }
      `}</style>

      <main className="tf-container py-12">
        <header className="mb-12">
          <h1 className="mb-2 text-[32px] font-bold leading-10 text-[#215d7d]">
            Mis entradas
          </h1>

          <p className="text-[18px] leading-7 text-[#5b403f]">
            Revisá tus tickets comprados y accedé a tus códigos QR.
          </p>
        </header>

        <section className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="relative w-full md:w-1/2">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#215d7d]">
              search
            </span>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border border-[#e4bdbc] bg-white py-3 pl-12 pr-4 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#d62839] focus:ring-2 focus:ring-[#d62839]/20"
              placeholder="Buscar por nombre del evento, categoría o ubicación"
              type="text"
            />
          </div>

          <div className="flex w-full overflow-x-auto rounded-xl bg-[#e5f6ff] p-1 md:w-auto">
            <TabButton active={tab === "ALL"} onClick={() => setTab("ALL")}>
              Todos
            </TabButton>

            <TabButton active={tab === "VALID"} onClick={() => setTab("VALID")}>
              Válidos
            </TabButton>

            <TabButton active={tab === "USED"} onClick={() => setTab("USED")}>
              Usados
            </TabButton>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="ticket-card-shadow overflow-hidden rounded-xl border border-[#e4bdbc] bg-white"
              >
                <div className="h-48 animate-pulse bg-[#d8f2ff]" />

                <div className="space-y-4 p-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-[#d8f2ff]" />
                  <div className="h-7 w-2/3 animate-pulse rounded bg-[#d8f2ff]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[#d8f2ff]" />
                  <div className="h-12 w-full animate-pulse rounded bg-[#d8f2ff]" />
                </div>
              </div>
            ))}
          </div>
        ) : err ? (
          <div className="ticket-card-shadow rounded-xl border border-[#e4bdbc] bg-white p-6 text-[#5b403f]">
            {err}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="ticket-card-shadow rounded-xl border border-[#e4bdbc] bg-white p-6 text-[#5b403f]">
            No hay tickets para mostrar.
            <div className="mt-3">
              <Link className="font-bold text-[#b20024] hover:underline" to="/events">
                Ir a explorar eventos
              </Link>
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTickets.map((ticket) => {
              const event = eventsMap[ticket.eventId];
              const ticketType = ttMap[ticket.ticketTypeId];
              const status = normalizeStatus(ticket.status);
              const isUsed = status === "USED";
              const date = getDateParts(event?.startAt);
              const category = formatTagLabel(
                event?.tags?.[0] || event?.category || "Evento"
              );

              return (
                <article
                  key={getTicketId(ticket)}
                  className={[
                    "ticket-card-shadow group overflow-hidden rounded-xl border border-[#e4bdbc] bg-white transition-transform duration-300 hover:-translate-y-1",
                    isUsed ? "opacity-80 grayscale-[0.6]" : "",
                  ].join(" ")}
                >
                  <div className="relative h-48">
                    <img
                      src={safeBanner(event?.bannerUrl, status)}
                      alt={event?.title || "Evento"}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute left-4 top-4 rounded-md bg-white/95 px-3 py-1 text-center backdrop-blur-sm">
                      <span
                        className={[
                          "block text-[24px] font-bold leading-none",
                          isUsed ? "text-[#5b403f]" : "text-[#b20024]",
                        ].join(" ")}
                      >
                        {date.day}
                      </span>

                      <span
                        className={[
                          "block text-xs font-bold uppercase",
                          isUsed ? "text-[#5b403f]" : "text-[#215d7d]",
                        ].join(" ")}
                      >
                        {date.month}
                      </span>
                    </div>

                    <div
                      className={[
                        "absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-sm",
                        isUsed
                          ? "bg-[#e4bdbc] text-[#5b403f]"
                          : "bg-[#fd647f] text-[#680020]",
                      ].join(" ")}
                    >
                      {isUsed ? "Usado" : "Válido"}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-2 flex items-start justify-between">
                      <span
                        className={[
                          "text-xs font-bold uppercase tracking-widest",
                          isUsed ? "text-[#5b403f]" : "text-[#b20024]",
                        ].join(" ")}
                      >
                        {category}
                      </span>

                      <span className="text-xs text-[#5b403f]">
                        {formatTime(event?.startAt)} hs
                      </span>
                    </div>

                    <h3
                      className={[
                        "mb-3 text-[24px] font-bold leading-8 transition-colors",
                        isUsed
                          ? "text-[#5b403f]"
                          : "text-[#215d7d] group-hover:text-[#b20024]",
                      ].join(" ")}
                    >
                      {event?.title || "Evento"}
                    </h3>

                    <div className="mb-6 space-y-2">
                      <div className="flex items-center gap-2 text-[#5b403f]">
                        <span className="material-symbols-outlined text-sm">
                          location_on
                        </span>

                        <span className="text-[14px] font-semibold leading-5 tracking-[0.05em]">
                          {[event?.venue, event?.city].filter(Boolean).join(", ") ||
                            "Ubicación a confirmar"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[#5b403f]">
                        <span className="material-symbols-outlined text-sm">
                          confirmation_number
                        </span>

                        <span className="text-[14px] font-semibold leading-5 tracking-[0.05em]">
                          {ticketType?.name || "Entrada"}
                        </span>
                      </div>
                    </div>

                    {isUsed ? (
                      <button
                        type="button"
                        disabled
                        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#906f6e] py-3 text-[16px] font-bold text-white"
                      >
                        <span className="material-symbols-outlined">history</span>
                        Ticket Usado
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openTicketModal(ticket)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d62839] py-3 text-[16px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined">qr_code_2</span>
                        Ver QR
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {open ? (
        <QrModal
          activeTicket={activeTicket}
          activeEvent={activeEvent}
          activeTT={activeTT}
          qrCanvasRef={qrCanvasRef}
          onClose={closeModal}
          onCopy={copyCode}
          onDownload={downloadQR}
        />
      ) : null}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-8 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] transition-all",
        active
          ? "bg-[#b20024] text-white"
          : "text-[#5b403f] hover:text-[#b20024]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function QrModal({
  activeTicket,
  activeEvent,
  activeTT,
  qrCanvasRef,
  onClose,
  onCopy,
  onDownload,
}) {
  const date = getDateParts(activeEvent?.startAt);
  const status = normalizeStatus(activeTicket?.status);
  const isUsed = status === "USED";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <button
        type="button"
        className="modal-backdrop absolute inset-0"
        onClick={onClose}
        aria-label="Cerrar modal"
      />

      <div className="relative z-10 max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#215d7d] p-6 text-white">
          <h2 className="text-[24px] font-bold leading-8">
            Tu Ticket Digital
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="material-symbols-outlined rounded-full p-1 transition-colors hover:bg-white/10"
          >
            close
          </button>
        </div>

        <div className="flex flex-col items-center p-8">
          <div className="relative mb-8 flex h-64 w-64 items-center justify-center rounded-xl border-8 border-[#d8f2ff] bg-white">
            <QRCodeCanvas
              value={activeTicket?.code || ""}
              size={210}
              includeMargin
              ref={qrCanvasRef}
            />

            <div className="absolute -bottom-3 rounded-full bg-[#b20024] px-3 py-1 text-[10px] font-bold text-white">
              ESCANEAME EN EL ACCESO
            </div>
          </div>

          <div className="mb-8 w-full space-y-4 text-center">
            <div>
              <h4 className="text-[24px] font-bold leading-8 text-[#215d7d]">
                {activeEvent?.title || "Evento"}
              </h4>

              <p className="text-[#5b403f]">
                {date.day} {date.month} •{" "}
                {activeEvent?.venue || "Lugar a confirmar"}
              </p>
            </div>

            <div className="grid grid-cols-2 border-t border-[#e4bdbc] pt-4">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b403f]">
                  Ticket
                </p>

                <p className="font-bold text-[#215d7d]">
                  {activeTT?.name || "Entrada"}
                </p>
              </div>

              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b403f]">
                  Código
                </p>

                <button
                  type="button"
                  onClick={onCopy}
                  className="font-bold text-[#215d7d] hover:underline"
                >
                  {activeTicket?.code || "—"}
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-[#e5f6ff] p-4 text-left">
              <p className="text-sm text-[#5b403f]">
                <strong>Fecha y hora:</strong>{" "}
                {formatDateTime(activeEvent?.startAt)}
              </p>

              <p className="mt-1 text-sm text-[#5b403f]">
                <strong>Ubicación:</strong>{" "}
                {[activeEvent?.venue, activeEvent?.city]
                  .filter(Boolean)
                  .join(", ") || "Ubicación a confirmar"}
              </p>

              <p className="mt-1 text-sm text-[#5b403f]">
                <strong>Estado:</strong> {isUsed ? "Usado" : "Válido"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDownload}
            disabled={!activeTicket?.code}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#215d7d] py-4 font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            <span className="material-symbols-outlined">download</span>
            Descargar QR en JPG
          </button>

          <p className="mt-4 text-center text-xs text-[#5b403f]">
            Mostrá este código al personal de seguridad en la entrada del evento.
          </p>
        </div>
      </div>
    </div>
  );
}