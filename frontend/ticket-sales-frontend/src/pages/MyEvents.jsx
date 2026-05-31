// src/pages/MyEvents.jsx

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import * as Dialog from "@radix-ui/react-dialog";

import {
  getMyEventsRequest,
  updateEventStatusRequest,
  getEventById,
  updateEventRequest,
  uploadEventBannerRequest,
} from "@/api/events.api";

import {
  listTicketTypesByEventRequest,
  createTicketTypeRequest,
  updateTicketTypeRequest,
  deleteTicketTypeRequest,
} from "@/api/ticketTypes.api";

/* =========================
   Helpers
========================= */

function formatDateTime(iso) {
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

function formatCardDate(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocal(iso) {
  if (!iso) return "";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function tagsToString(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

function stringToTags(str) {
  return String(str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function safeNumber(n, fallback = 0) {
  const value = Number(n);
  return Number.isFinite(value) ? value : fallback;
}

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getEventId(event) {
  return event?._id || event?.id;
}

function safeBanner(url) {
  return (
    url ||
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80"
  );
}

function getStatus(status) {
  return String(status || "DRAFT").toUpperCase();
}

function statusLabel(status) {
  const clean = getStatus(status);

  if (clean === "PUBLISHED") return "Publicado";
  if (clean === "ENDED") return "Finalizado";

  return "Borrador";
}

function statusClass(status) {
  const clean = getStatus(status);

  if (clean === "PUBLISHED") {
    return "border-green-200 bg-green-100 text-green-800";
  }

  if (clean === "ENDED") {
    return "border-blue-200 bg-blue-100 text-blue-800";
  }

  return "border-gray-200 bg-gray-100 text-gray-800";
}

function getEventSold(event) {
  return safeNumber(
    event?.kpis?.totalTicketsSoldPaid ??
      event?.totalTicketsSoldPaid ??
      event?.ticketsSold ??
      event?.soldCount ??
      event?.sold,
    0
  );
}

function getEventCapacity(event) {
  return safeNumber(
    event?.kpis?.totalCapacity ??
      event?.totalCapacity ??
      event?.capacity ??
      event?.totalTickets,
    0
  );
}

function getEventRevenue(event) {
  return safeNumber(
    event?.kpis?.totalRevenuePaid ??
      event?.totalRevenuePaid ??
      event?.revenue ??
      event?.totalRevenue,
    0
  );
}

const ALLOWED_STATUS = new Set(["DRAFT", "PUBLISHED", "ENDED"]);

/* =========================
   Page
========================= */

export function MyEvents() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");

  const [editEventId, setEditEventId] = useState(null);

  const [eTitle, setETitle] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eVenue, setEVenue] = useState("");
  const [eCity, setECity] = useState("");
  const [eStartAt, setEStartAt] = useState("");
  const [eEndAt, setEEndAt] = useState("");
  const [eBannerUrl, setEBannerUrl] = useState("");
  const [eTags, setETags] = useState("");

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [editTicketTypes, setEditTicketTypes] = useState([]);

  async function load() {
    const response = await getMyEventsRequest();
    setEvents(response.data?.events ?? []);
  }

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        await load();
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (bannerPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview]);

  const stats = useMemo(() => {
    return {
      total: events.length,
      published: events.filter((event) => getStatus(event.status) === "PUBLISHED")
        .length,
      drafts: events.filter((event) => getStatus(event.status) === "DRAFT")
        .length,
      ended: events.filter((event) => getStatus(event.status) === "ENDED")
        .length,
    };
  }, [events]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    return events
      .filter((event) => {
        if (filter === "ALL") return true;
        return getStatus(event.status) === filter;
      })
      .filter((event) => {
        if (!search) return true;

        const searchable = [
          event?.title,
          event?.venue,
          event?.city,
          event?.status,
          ...(event?.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(search);
      });
  }, [events, q, filter]);

  const hasEvents = events.length > 0;

  async function setStatus(id, nextStatus) {
    const status = String(nextStatus || "").toUpperCase().trim();

    if (!ALLOWED_STATUS.has(status)) return;

    try {
      await updateEventStatusRequest(id, { status });
      await load();
    } catch (err) {
      console.log("UPDATE_STATUS_ERR", err?.response?.data || err?.message);
      setEditErr(err?.response?.data?.message || "No se pudo cambiar el estado.");
    }
  }

  function pickBannerFile(file) {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setEditErr("Seleccioná una imagen válida.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setEditErr("La imagen es demasiado pesada. Máximo 6MB.");
      return;
    }

    setEditErr("");
    setBannerFile(file);

    if (bannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }

    setBannerPreview(URL.createObjectURL(file));
  }

  function clearPickedBanner() {
    setBannerFile(null);

    if (bannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }

    setBannerPreview("");
  }

  async function uploadBannerNow() {
  if (!editEventId) return;

  if (!bannerFile) {
    setEditErr("Elegí una imagen primero.");
    return;
  }

  try {
    setUploadingBanner(true);
    setEditErr("");

    const response = await uploadEventBannerRequest(editEventId, bannerFile);

    const url =
      response?.data?.bannerUrl ||
      response?.data?.event?.bannerUrl ||
      response?.data?.url ||
      response?.data?.secure_url ||
      response?.data?.file?.path ||
      response?.data?.uploaded?.path ||
      response?.data?.imageUrl ||
      null;

    if (!url) {
      setEditErr(
        "La imagen se subió, pero el backend no devolvió la URL del banner."
      );
      return;
    }

    setEBannerUrl(url);
    clearPickedBanner();
    await load();
  } catch (err) {
    setEditErr(
      err?.response?.data?.message ||
        err?.message ||
        "No se pudo subir el banner."
    );
  } finally {
    setUploadingBanner(false);
  }
}

  async function openEditEvent(eventId) {
    try {
      setEditErr("");
      setEditEventId(eventId);
      setEditEventOpen(true);
      setEditLoading(true);

      clearPickedBanner();

      const eventResponse = await getEventById(eventId);
      const event = eventResponse?.data?.event ?? eventResponse?.data ?? null;

      setETitle(event?.title || "");
      setEDescription(event?.description || "");
      setEVenue(event?.venue || "");
      setECity(event?.city || "");
      setEStartAt(toDatetimeLocal(event?.startAt));
      setEEndAt(toDatetimeLocal(event?.endAt));
      setEBannerUrl(event?.bannerUrl || "");
      setETags(tagsToString(event?.tags));

      const ticketTypesResponse = await listTicketTypesByEventRequest(eventId);
      const types = ticketTypesResponse?.data?.ticketTypes || [];

      setEditTicketTypes(
        types.map((ticket) => ({
          id: ticket.id || ticket._id,
          name: ticket.name || "",
          price: safeNumber(ticket.price, 0),
          currency: (ticket.currency || "USD").toUpperCase(),
          capacity: safeNumber(ticket.capacity, 1),
          soldCount: safeNumber(ticket.soldCount, 0),
          isNew: false,
        }))
      );
    } catch (err) {
      setEditErr(
        err?.response?.data?.message || "No se pudo cargar el evento para editar."
      );
    } finally {
      setEditLoading(false);
    }
  }

  function addEditTicketType() {
    setEditTicketTypes((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: "",
        price: 0,
        currency: "USD",
        capacity: 1,
        soldCount: 0,
        isNew: true,
      },
    ]);
  }

  function updateEditTicketType(id, patch) {
    setEditTicketTypes((prev) =>
      prev.map((ticket) =>
        ticket.id === id ? { ...ticket, ...patch } : ticket
      )
    );
  }

  async function deleteEditTicketType(ticket) {
    if (!ticket?.isNew && Number(ticket.soldCount || 0) > 0) {
      setEditErr("No podés eliminar un tipo de entrada que ya tiene ventas.");
      return;
    }

    try {
      setEditSaving(true);
      setEditErr("");

      if (ticket.isNew) {
        setEditTicketTypes((prev) =>
          prev.filter((item) => item.id !== ticket.id)
        );
        return;
      }

      await deleteTicketTypeRequest(ticket.id);

      setEditTicketTypes((prev) =>
        prev.filter((item) => item.id !== ticket.id)
      );
    } catch (err) {
      setEditErr(
        err?.response?.data?.message ||
          "No se pudo eliminar el tipo de entrada."
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function saveEditEvent() {
    if (!editEventId) return;

    try {
      setEditSaving(true);
      setEditErr("");

      await updateEventRequest(editEventId, {
        title: eTitle.trim() || undefined,
        description: eDescription.trim() || undefined,
        venue: eVenue.trim() || undefined,
        city: eCity.trim() || undefined,
        startAt: eStartAt ? new Date(eStartAt).toISOString() : undefined,
        endAt: eEndAt ? new Date(eEndAt).toISOString() : undefined,
        bannerUrl: eBannerUrl.trim() || undefined,
        tags: stringToTags(eTags),
      });

      for (const ticket of editTicketTypes) {
        if (!ticket.name?.trim()) {
          throw new Error("El nombre del tipo de entrada es obligatorio.");
        }

        if (!Number.isFinite(Number(ticket.price)) || Number(ticket.price) < 0) {
          throw new Error("El precio debe ser mayor o igual a 0.");
        }

        if (
          !Number.isInteger(Number(ticket.capacity)) ||
          Number(ticket.capacity) < 1
        ) {
          throw new Error("La capacidad debe ser mayor o igual a 1.");
        }

        if (
          !ticket.isNew &&
          Number(ticket.capacity) < Number(ticket.soldCount || 0)
        ) {
          throw new Error(
            `La capacidad no puede ser menor que las ventas (${ticket.soldCount}) para "${ticket.name}".`
          );
        }

        if (ticket.isNew) {
          await createTicketTypeRequest(editEventId, {
            name: ticket.name.trim(),
            price: Number(ticket.price),
            currency: (ticket.currency || "USD").toUpperCase(),
            capacity: Number(ticket.capacity),
          });
        } else {
          await updateTicketTypeRequest(ticket.id, {
            name: ticket.name.trim(),
            price: Number(ticket.price),
            currency: (ticket.currency || "USD").toUpperCase(),
            capacity: Number(ticket.capacity),
          });
        }
      }

      await load();
      setEditEventOpen(false);
    } catch (err) {
      setEditErr(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudieron guardar los cambios."
      );
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div className="ticketify-organizer bg-[#f3faff] text-[#001f29]">
      <style>{`
        .event-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0px 12px 24px rgba(23, 86, 118, 0.12);
        }

        .fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #baeaff;
          border-radius: 999px;
        }
      `}</style>

      <main className="tf-container flex-grow px-4 py-10">
        <header className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-[32px] font-bold leading-10 text-[#001f29]">
              Mis eventos
            </h1>

            <p className="text-[18px] leading-7 text-[#5b403f]">
              Gestioná todos tus eventos publicados, borradores y finalizados.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 rounded-lg bg-[#d62839] px-8 py-4 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">add</span>
            Crear evento
          </button>
        </header>

        <section className="mb-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatCard label="Total de eventos" value={stats.total} />
          <StatCard label="Publicados" value={stats.published} />
          <StatCard label="Borradores" value={stats.drafts} />
          <StatCard label="Finalizados" value={stats.ended} />
        </section>

        <section className="mb-8 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#5b403f]">
              search
            </span>

            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="w-full rounded-lg border-none bg-[#e5f6ff] py-3 pl-12 pr-4 text-[16px] text-[#001f29] outline-none placeholder:text-[#5b403f] focus:ring-2 focus:ring-[#d62839]/30"
              placeholder="Buscar eventos por nombre"
              type="text"
            />
          </div>

          <div className="flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
            <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
              Todos
            </FilterChip>

            <FilterChip
              active={filter === "PUBLISHED"}
              onClick={() => setFilter("PUBLISHED")}
            >
              Publicados
            </FilterChip>

            <FilterChip
              active={filter === "DRAFT"}
              onClick={() => setFilter("DRAFT")}
            >
              Borrador
            </FilterChip>

            <FilterChip
              active={filter === "ENDED"}
              onClick={() => setFilter("ENDED")}
            >
              Finalizados
            </FilterChip>
          </div>
        </section>

        {loading ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-xl border border-[#baeaff] bg-white"
              >
                <div className="h-48 animate-pulse bg-[#d8f2ff]" />

                <div className="space-y-4 p-6">
                  <div className="h-8 w-2/3 animate-pulse rounded bg-[#d8f2ff]" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-[#d8f2ff]" />
                  <div className="h-20 animate-pulse rounded bg-[#d8f2ff]" />
                </div>
              </article>
            ))}
          </section>
        ) : !hasEvents ? (
          <EmptyState onCreate={() => navigate("/dashboard")} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No hay eventos en este estado"
            description="Probá ajustando los filtros o volviendo a ver todos los eventos."
            buttonLabel="Ver todos los eventos"
            onCreate={() => setFilter("ALL")}
          />
        ) : (
          <section className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard
                key={getEventId(event)}
                event={event}
                onEdit={() => openEditEvent(getEventId(event))}
                onStatus={setStatus}
              />
            ))}
          </section>
        )}
      </main>

      <EditEventModal
        open={editEventOpen}
        setOpen={setEditEventOpen}
        editLoading={editLoading}
        editSaving={editSaving}
        editErr={editErr}
        setEditErr={setEditErr}
        editEventId={editEventId}
        setEditEventId={setEditEventId}
        eTitle={eTitle}
        setETitle={setETitle}
        eDescription={eDescription}
        setEDescription={setEDescription}
        eVenue={eVenue}
        setEVenue={setEVenue}
        eCity={eCity}
        setECity={setECity}
        eStartAt={eStartAt}
        setEStartAt={setEStartAt}
        eEndAt={eEndAt}
        setEEndAt={setEEndAt}
        eBannerUrl={eBannerUrl}
        setEBannerUrl={setEBannerUrl}
        eTags={eTags}
        setETags={setETags}
        bannerFile={bannerFile}
        setBannerFile={setBannerFile}
        bannerPreview={bannerPreview}
        setBannerPreview={setBannerPreview}
        uploadingBanner={uploadingBanner}
        pickBannerFile={pickBannerFile}
        clearPickedBanner={clearPickedBanner}
        uploadBannerNow={uploadBannerNow}
        editTicketTypes={editTicketTypes}
        addEditTicketType={addEditTicketType}
        updateEditTicketType={updateEditTicketType}
        deleteEditTicketType={deleteEditTicketType}
        saveEditEvent={saveEditEvent}
      />
    </div>
  );
}

/* =========================
   UI components
========================= */

function StatCard({ label, value }) {
  return (
    <article className="rounded-xl border border-[#baeaff] bg-white p-6 shadow-sm">
      <p className="mb-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#215d7d]">
        {label}
      </p>

      <p className="text-[32px] font-bold leading-10 text-[#001f29]">
        {value}
      </p>
    </article>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-full px-6 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] transition-colors",
        active
          ? "bg-[#b20024] text-white"
          : "bg-[#baeaff] text-[#5b403f] hover:bg-[#d8f2ff]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function EventCard({ event, onEdit, onStatus }) {
  const id = getEventId(event);
  const sold = getEventSold(event);
  const capacity = getEventCapacity(event);
  const revenue = getEventRevenue(event);
  const status = getStatus(event.status);

  return (
    <article className="event-card-hover fade-in flex flex-col overflow-hidden rounded-xl border border-[#baeaff] bg-white transition-all duration-300">
      <div className="relative h-48 w-full">
        <img
          className="h-full w-full object-cover"
          src={safeBanner(event.bannerUrl)}
          alt={event.title || "Evento"}
        />

        <div className="absolute left-4 top-4 rounded-md bg-white/95 px-3 py-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#b20024] shadow-sm backdrop-blur-sm">
          {formatCardDate(event.startAt)}
        </div>

        <div
          className={[
            "absolute right-4 top-4 rounded-full border px-3 py-1 text-[14px] font-semibold leading-5 tracking-[0.05em]",
            statusClass(status),
          ].join(" ")}
        >
          {statusLabel(status)}
        </div>
      </div>

      <div className="flex flex-grow flex-col p-6">
        <h3 className="mb-2 text-[24px] font-bold leading-8 text-[#001f29]">
          {event.title || "Evento sin nombre"}
        </h3>

        <div className="mb-4 flex items-center gap-2 text-[#5b403f]">
          <span className="material-symbols-outlined text-base">
            location_on
          </span>

          <span className="text-[16px] leading-6">
            {[event.venue, event.city].filter(Boolean).join(", ") ||
              "Ubicación a confirmar"}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-[#e5f6ff] p-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#215d7d]">
              Ventas
            </p>

            <p className="text-[20px] font-bold leading-6 text-[#001f29]">
              {sold} {capacity ? `/ ${capacity}` : ""}
            </p>
          </div>

          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#215d7d]">
              Ingresos
            </p>

            <p className="text-[20px] font-bold leading-6 text-[#001f29]">
              {money(revenue)}
            </p>
          </div>
        </div>

        <div className="mt-auto flex gap-3">
          <Link
            to="/dashboard"
            className="flex-grow rounded-lg bg-[#d62839] py-3 text-center text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:brightness-110"
          >
            Ver insights
          </Link>

          <details className="relative">
            <summary className="flex h-full cursor-pointer list-none items-center rounded-lg bg-[#baeaff] p-3 text-[#5b403f] transition-colors hover:bg-[#d8f2ff]">
              <span className="material-symbols-outlined">more_vert</span>
            </summary>

            <div className="absolute bottom-full right-0 z-20 mb-2 w-44 overflow-hidden rounded-lg border border-[#baeaff] bg-white shadow-xl">
              <button
                type="button"
                onClick={onEdit}
                className="block w-full px-4 py-3 text-left text-sm text-[#5b403f] hover:bg-[#e5f6ff]"
              >
                Editar evento
              </button>

              {status !== "PUBLISHED" ? (
                <button
                  type="button"
                  onClick={() => onStatus(id, "PUBLISHED")}
                  className="block w-full px-4 py-3 text-left text-sm text-[#5b403f] hover:bg-[#e5f6ff]"
                >
                  Publicar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStatus(id, "DRAFT")}
                  className="block w-full px-4 py-3 text-left text-sm text-[#5b403f] hover:bg-[#e5f6ff]"
                >
                  Pasar a borrador
                </button>
              )}

              {status !== "ENDED" ? (
                <button
                  type="button"
                  onClick={() => onStatus(id, "ENDED")}
                  className="block w-full px-4 py-3 text-left text-sm text-[#ba1a1a] hover:bg-[#ffdad6]"
                >
                  Finalizar
                </button>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  title = "No hay eventos todavía",
  description = "Creá tu primer evento para empezar a vender tickets.",
  buttonLabel = "Crear evento",
  onCreate,
}) {
  return (
    <section className="flex flex-col items-center justify-center py-24 text-center">
      <span
        className="material-symbols-outlined mb-6 text-7xl text-[#a2e3ff]"
        style={{ fontVariationSettings: "'wght' 200" }}
      >
        event_busy
      </span>

      <h2 className="mb-2 text-[24px] font-bold leading-8 text-[#001f29]">
        {title}
      </h2>

      <p className="mb-8 max-w-md text-[16px] leading-6 text-[#5b403f]">
        {description}
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="rounded-lg bg-[#b20024] px-8 py-3 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:brightness-110"
      >
        {buttonLabel}
      </button>
    </section>
  );
}

/* =========================
   Edit Modal
========================= */

function EditEventModal({
  open,
  setOpen,
  editLoading,
  editSaving,
  editErr,
  setEditErr,
  editEventId,
  setEditEventId,
  eTitle,
  setETitle,
  eDescription,
  setEDescription,
  eVenue,
  setEVenue,
  eCity,
  setECity,
  eStartAt,
  setEStartAt,
  eEndAt,
  setEEndAt,
  eBannerUrl,
  setEBannerUrl,
  eTags,
  setETags,
  bannerFile,
  setBannerFile,
  bannerPreview,
  setBannerPreview,
  uploadingBanner,
  pickBannerFile,
  clearPickedBanner,
  uploadBannerNow,
  editTicketTypes,
  addEditTicketType,
  updateEditTicketType,
  deleteEditTicketType,
  saveEditEvent,
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (!value) {
          setEditErr("");
          setEditEventId(null);
          setBannerFile(null);

          if (bannerPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(bannerPreview);
          }

          setBannerPreview("");
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#001f29]/40 backdrop-blur-md" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[94vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <Dialog.Title className="sr-only">Editar evento</Dialog.Title>
          <Dialog.Description className="sr-only">
            Actualizar datos del evento, imagen y tipos de entrada.
          </Dialog.Description>

          <header className="flex items-start justify-between border-b border-[#e4bdbc] p-6">
            <div>
              <h2 className="text-[32px] font-extrabold leading-10 text-[#001f29]">
                Editar evento
              </h2>

              <p className="mt-1 text-[16px] leading-6 text-[#5b403f]">
                Actualizá los detalles, imagen y entradas disponibles.
              </p>
            </div>

            <Dialog.Close className="grid h-10 w-10 place-items-center rounded-full text-[#001f29] transition-colors hover:bg-[#e5f6ff]">
              <span className="material-symbols-outlined">close</span>
            </Dialog.Close>
          </header>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
            {editLoading ? (
              <div className="space-y-4">
                <div className="h-12 animate-pulse rounded-lg bg-[#d8f2ff]" />
                <div className="h-12 animate-pulse rounded-lg bg-[#d8f2ff]" />
                <div className="h-40 animate-pulse rounded-lg bg-[#d8f2ff]" />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <label className="mb-3 block text-[14px] font-semibold uppercase leading-5 tracking-[0.08em] text-[#5b403f]">
                      Imagen del evento
                    </label>

                    <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-[#e4bdbc] bg-[#d8f2ff]">
                      <img
                        src={
                          bannerPreview ||
                          eBannerUrl ||
                          "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80"
                        }
                        alt="Banner del evento"
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />

                      <div className="absolute inset-0 bg-[#001f29]/10" />

                      <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center">
                        <span className="material-symbols-outlined mb-2 text-5xl text-[#b20024]">
                          image
                        </span>

                        <p className="text-[16px] font-bold leading-6 text-[#001f29]">
                          Imagen actual
                        </p>
                      </div>
                    </div>

                    <input
                      id="my-events-edit-banner"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        pickBannerFile(event.target.files?.[0] || null)
                      }
                    />

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById("my-events-edit-banner")
                            ?.click()
                        }
                        disabled={editSaving || uploadingBanner}
                        className="rounded-lg border border-[#215d7d] px-3 py-2 text-sm font-bold text-[#215d7d] hover:bg-[#e5f6ff] disabled:opacity-60"
                      >
                        Elegir
                      </button>

                      <button
                        type="button"
                        onClick={uploadBannerNow}
                        disabled={!bannerFile || editSaving || uploadingBanner}
                        className="rounded-lg bg-[#215d7d] px-3 py-2 text-sm font-bold text-white hover:bg-[#3e7697] disabled:opacity-60"
                      >
                        {uploadingBanner ? "Subiendo..." : "Subir"}
                      </button>

                      <button
                        type="button"
                        onClick={clearPickedBanner}
                        disabled={!bannerPreview || editSaving || uploadingBanner}
                        className="rounded-lg border border-[#e4bdbc] px-3 py-2 text-sm font-bold text-[#5b403f] hover:bg-[#e5f6ff] disabled:opacity-60"
                      >
                        Limpiar
                      </button>
                    </div>

                    <input
                      value={eBannerUrl}
                      onChange={(event) => setEBannerUrl(event.target.value)}
                      className="mt-3 h-11 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-sm text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d]"
                      placeholder="URL de imagen"
                      type="url"
                    />
                  </div>

                  <div className="space-y-6 md:col-span-7">
                    <InputField
                      label="Nombre del evento"
                      value={eTitle}
                      onChange={setETitle}
                      placeholder="Nombre"
                    />

                    <div>
                      <label className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                        Descripción
                      </label>

                      <textarea
                        value={eDescription}
                        onChange={(event) => setEDescription(event.target.value)}
                        className="min-h-28 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 py-3 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d]"
                        placeholder="Descripción del evento"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <InputField
                        label="Ciudad"
                        value={eCity}
                        onChange={setECity}
                        placeholder="Ciudad"
                      />

                      <InputField
                        label="Lugar / Venue"
                        value={eVenue}
                        onChange={setEVenue}
                        placeholder="Lugar"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <InputField
                        label="Fecha de inicio"
                        value={eStartAt}
                        onChange={setEStartAt}
                        type="datetime-local"
                      />

                      <InputField
                        label="Fecha de fin"
                        value={eEndAt}
                        onChange={setEEndAt}
                        type="datetime-local"
                      />
                    </div>

                    <InputField
                      label="Tags"
                      value={eTags}
                      onChange={setETags}
                      placeholder="Conciertos, Música, Festival"
                    />
                  </div>
                </div>

                <section className="space-y-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <h3 className="flex items-center gap-2 text-[24px] font-bold leading-8 text-[#001f29]">
                      <span className="material-symbols-outlined text-[#b20024]">
                        confirmation_number
                      </span>
                      Tipos de entrada
                    </h3>

                    <button
                      type="button"
                      onClick={addEditTicketType}
                      disabled={editSaving}
                      className="flex items-center gap-1 text-[14px] font-bold leading-5 tracking-[0.05em] text-[#b20024] transition-colors hover:underline disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-xl">
                        add_circle
                      </span>
                      Agregar entrada
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editTicketTypes.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="grid grid-cols-1 items-end gap-4 rounded-xl border border-[#e4bdbc] bg-[#e5f6ff] p-4 md:grid-cols-12"
                      >
                        <TicketInput
                          className="md:col-span-4"
                          label="Nombre"
                          value={ticket.name}
                          onChange={(value) =>
                            updateEditTicketType(ticket.id, { name: value })
                          }
                          placeholder="General"
                        />

                        <TicketInput
                          className="md:col-span-2"
                          label="Precio"
                          value={ticket.price}
                          onChange={(value) =>
                            updateEditTicketType(ticket.id, {
                              price: Number(value),
                            })
                          }
                          type="number"
                          prefix="$"
                        />

                        <TicketInput
                          className="md:col-span-2"
                          label="Capacidad"
                          value={ticket.capacity}
                          onChange={(value) =>
                            updateEditTicketType(ticket.id, {
                              capacity: Number(value),
                            })
                          }
                          type="number"
                        />

                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.05em] text-[#5b403f]">
                            Vendidos
                          </label>

                          <div className="flex h-11 items-center rounded-lg border border-[#e4bdbc] bg-white px-4 text-[#5b403f]">
                            {safeNumber(ticket.soldCount)}
                          </div>
                        </div>

                        <div className="flex justify-end md:col-span-2 md:justify-center md:pb-1">
                          <button
                            type="button"
                            onClick={() => deleteEditTicketType(ticket)}
                            disabled={editSaving}
                            className="rounded-lg p-2 text-[#5b403f] transition-colors hover:bg-[#ffdad6] hover:text-[#ba1a1a] disabled:opacity-40"
                          >
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {editErr ? (
                  <div className="rounded-lg border border-[#ffdad6] bg-[#ffdad6] px-4 py-3 text-sm font-semibold text-[#93000a]">
                    {editErr}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <footer className="flex flex-col justify-end gap-4 border-t border-[#e4bdbc] bg-[#e5f6ff] p-6 md:flex-row">
            <Dialog.Close
              disabled={editSaving || uploadingBanner}
              className="order-2 h-12 rounded-lg px-8 font-bold text-[#001f29] transition-colors hover:bg-[#d8f2ff] disabled:opacity-60 md:order-1"
            >
              Cancelar
            </Dialog.Close>

            <button
              type="button"
              onClick={saveEditEvent}
              disabled={editLoading || editSaving || uploadingBanner}
              className="order-1 h-12 rounded-lg bg-[#b20024] px-10 font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-[#d62839] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:order-2"
            >
              {editSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d]"
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}

function TicketInput({
  className = "",
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.05em] text-[#5b403f]">
        {label}
      </label>

      <div className="relative">
        {prefix ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#5b403f]">
            {prefix}
          </span>
        ) : null}

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={[
            "h-11 w-full rounded-lg border border-[#e4bdbc] bg-white px-4 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d]",
            prefix ? "pl-7" : "",
          ].join(" ")}
          placeholder={placeholder}
          type={type}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "1" : undefined}
        />
      </div>
    </div>
  );
}