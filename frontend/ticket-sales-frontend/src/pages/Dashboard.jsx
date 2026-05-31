// src/pages/Dashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";

import { useMercadoPago } from "@/hooks/useMercadoPago";
import { api } from "@/api/axios";

import {
  getMyEventsSummaryRequest,
  getEventSummaryRequest,
  createEventRequest,
  updateEventStatusRequest,
  getEventById,
  updateEventRequest,
} from "@/api/events.api";

import {
  listTicketTypesByEventRequest,
  createTicketTypeRequest,
  updateTicketTypeRequest,
  deleteTicketTypeRequest,
} from "@/api/ticketTypes.api";

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function money(value) {
  const amount = Number(value || 0);

  return `$${amount.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function number(value) {
  return Number(value || 0).toLocaleString("es-AR");
}

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

function toDatetimeLocal(iso) {
  if (!iso) return "";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (value) => String(value).padStart(2, "0");

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
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getEventId(event) {
  return event?.id || event?._id;
}

function safeEventImage(url) {
  return (
    url ||
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80"
  );
}

function statusLabel(status) {
  const clean = String(status || "").toUpperCase();

  if (clean === "PUBLISHED") return "Activo";
  if (clean === "ENDED") return "Finalizado";
  if (clean === "DRAFT") return "Draft";

  return clean || "—";
}

function statusClass(status) {
  const clean = String(status || "").toUpperCase();

  if (clean === "PUBLISHED") {
    return "bg-green-100 text-green-700";
  }

  if (clean === "ENDED") {
    return "bg-[#ffdad6] text-[#93000a]";
  }

  return "bg-[#c7e7ff] text-[#215d7d]";
}

const ALLOWED_STATUS = new Set(["DRAFT", "PUBLISHED", "ENDED"]);

async function uploadEventBanner(eventId, file) {
  if (!eventId) throw new Error("Missing eventId for banner upload");
  if (!file) throw new Error("Missing file");

  const form = new FormData();
  form.append("file", file);

  const response = await api.post(`/events/${eventId}/banner`, form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const data = response?.data || {};

  const url =
    data.bannerUrl ||
    data.url ||
    data.secure_url ||
    data?.file?.path ||
    data?.uploaded?.path ||
    data?.imageUrl;

  if (!url) {
    throw new Error(
      "Upload OK but no URL returned. Ensure uploadBanner controller returns { bannerUrl }."
    );
  }

  return String(url);
}

export function Dashboard() {
  const { connected, loading: mpLoading, connect } = useMercadoPago();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [q, setQ] = useState("");

  const [activeEventId, setActiveEventId] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [createErr, setCreateErr] = useState("");

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");

  const [ticketDrafts, setTicketDrafts] = useState([
    {
      tmpId: uuid(),
      name: "General",
      price: 20,
      currency: "USD",
      capacity: 40,
    },
  ]);

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

  const [eBannerFile, setEBannerFile] = useState(null);
  const [eBannerPreview, setEBannerPreview] = useState("");
  const [eBannerUploading, setEBannerUploading] = useState(false);

  const [editTicketTypes, setEditTicketTypes] = useState([]);

  async function load() {
    const response = await getMyEventsSummaryRequest();
    setSummary(response.data);
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

  useEffect(() => {
    return () => {
      if (eBannerPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(eBannerPreview);
      }
    };
  }, [eBannerPreview]);

  const events = summary?.events ?? [];
  const totals = summary?.totals ?? {};
  const hasEvents = events.length > 0;

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    if (!search) return events;

    return events.filter((row) =>
      String(row?.event?.title || "")
        .toLowerCase()
        .includes(search)
    );
  }, [events, q]);

  const canPublish = (insights?.ticketTypes?.length || 0) > 0;

  async function openInsights(eventId) {
    try {
      setActiveEventId(eventId);
      setInsights(null);
      setInsightsLoading(true);

      const response = await getEventSummaryRequest(eventId);

      setInsights(response.data);
    } finally {
      setInsightsLoading(false);
    }
  }

  async function setStatus(eventId, nextStatus) {
    const status = String(nextStatus || "").toUpperCase().trim();

    if (!ALLOWED_STATUS.has(status)) return;

    if (status === "PUBLISHED" && !connected) {
      alert("Necesitás conectar Mercado Pago antes de publicar eventos.");
      return;
    }

    await updateEventStatusRequest(eventId, { status });
    await load();

    if (activeEventId === eventId) {
      await openInsights(eventId);
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
    setCreateErr("");
    setBannerUploading(false);

    if (bannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }

    setBannerPreview("");

    setTicketDrafts([
      {
        tmpId: uuid(),
        name: "General",
        price: 20,
        currency: "USD",
        capacity: 40,
      },
    ]);
  }

  function onPickBannerFile(file) {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setCreateErr("Seleccioná una imagen válida.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setCreateErr("La imagen es demasiado pesada. Máximo 6MB.");
      return;
    }

    setCreateErr("");
    setBannerFile(file);
    setBannerUrl("");

    if (bannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }

    setBannerPreview(URL.createObjectURL(file));
  }

  function clearBanner() {
    setBannerFile(null);
    setBannerUrl("");

    if (bannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }

    setBannerPreview("");
  }

  function addTicketDraft() {
    setTicketDrafts((prev) => [
      ...prev,
      {
        tmpId: uuid(),
        name: "",
        price: 0,
        currency: "USD",
        capacity: 1,
      },
    ]);
  }

  function updateTicketDraft(tmpId, patch) {
    setTicketDrafts((prev) =>
      prev.map((ticket) =>
        ticket.tmpId === tmpId ? { ...ticket, ...patch } : ticket
      )
    );
  }

  function removeTicketDraft(tmpId) {
    setTicketDrafts((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((ticket) => ticket.tmpId !== tmpId);
    });
  }

  async function onCreate(event) {
    event.preventDefault();

    setCreateErr("");

    if (!title.trim() || title.trim().length < 3) {
      setCreateErr("El nombre del evento debe tener al menos 3 caracteres.");
      return;
    }

    if (!startAt) {
      setCreateErr("La fecha de inicio es obligatoria.");
      return;
    }

    if (!ticketDrafts?.length) {
      setCreateErr("Agregá al menos un tipo de entrada.");
      return;
    }

    for (const ticket of ticketDrafts) {
      if (!ticket.name?.trim()) {
        setCreateErr("El nombre del tipo de entrada es obligatorio.");
        return;
      }

      if (!Number.isFinite(Number(ticket.price)) || Number(ticket.price) < 0) {
        setCreateErr("El precio debe ser un número mayor o igual a 0.");
        return;
      }

      if (
        !Number.isInteger(Number(ticket.capacity)) ||
        Number(ticket.capacity) < 1
      ) {
        setCreateErr("La capacidad debe ser un número entero mayor o igual a 1.");
        return;
      }
    }

    try {
      setCreating(true);
      setBannerUploading(false);

      const eventResponse = await createEventRequest({
        title: title.trim(),
        city: city.trim() || undefined,
        venue: venue.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        bannerUrl: bannerUrl.trim() || undefined,
      });

      const eventId =
        eventResponse?.data?.event?._id || eventResponse?.data?.event?.id;

      if (!eventId) {
        throw new Error("createEvent did not return event._id");
      }

      if (bannerFile) {
        setBannerUploading(true);

        const uploadedUrl = await uploadEventBanner(eventId, bannerFile);

        await updateEventRequest(eventId, {
          bannerUrl: uploadedUrl,
        });
      }

      for (const ticket of ticketDrafts) {
        await createTicketTypeRequest(eventId, {
          name: ticket.name.trim(),
          price: Number(ticket.price),
          currency: (ticket.currency || "USD").toUpperCase(),
          capacity: Number(ticket.capacity),
        });
      }

      setCreateOpen(false);
      resetCreateForm();
      await load();
    } catch (err) {
      setCreateErr(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo crear el evento."
      );
    } finally {
      setBannerUploading(false);
      setCreating(false);
    }
  }

  async function openEditEvent(eventId) {
    try {
      setEditErr("");
      setEditEventId(eventId);
      setEditEventOpen(true);
      setEditLoading(true);

      setEBannerFile(null);

      if (eBannerPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(eBannerPreview);
      }

      setEBannerPreview("");

      const eventResponse = await getEventById(eventId);
      const eventData = eventResponse?.data?.event ?? eventResponse?.data;

      setETitle(eventData?.title || "");
      setEDescription(eventData?.description || "");
      setEVenue(eventData?.venue || "");
      setECity(eventData?.city || "");
      setEStartAt(toDatetimeLocal(eventData?.startAt));
      setEEndAt(toDatetimeLocal(eventData?.endAt));
      setEBannerUrl(eventData?.bannerUrl || "");
      setETags(tagsToString(eventData?.tags));

      const ticketTypesResponse = await listTicketTypesByEventRequest(eventId);
      const types = ticketTypesResponse?.data?.ticketTypes || [];

      setEditTicketTypes(
        types.map((ticket) => ({
          id: ticket.id || ticket._id,
          name: ticket.name || "",
          price: Number(ticket.price ?? 0),
          currency: (ticket.currency || "USD").toUpperCase(),
          capacity: Number(ticket.capacity ?? 1),
          soldCount: Number(ticket.soldCount ?? 0),
          isNew: false,
        }))
      );
    } catch (err) {
      setEditErr(
        err?.response?.data?.message || "No se pudo cargar el evento."
      );
    } finally {
      setEditLoading(false);
    }
  }

  function onPickEditBannerFile(file) {
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
    setEBannerFile(file);

    if (eBannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(eBannerPreview);
    }

    setEBannerPreview(URL.createObjectURL(file));
  }

  function clearEditBannerLocal() {
    setEBannerFile(null);

    if (eBannerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(eBannerPreview);
    }

    setEBannerPreview("");
  }

  async function uploadEditBannerNow() {
    if (!editEventId) {
      setEditErr("Falta el ID del evento.");
      return;
    }

    if (!eBannerFile) return;

    try {
      setEditErr("");
      setEBannerUploading(true);

      const uploadedUrl = await uploadEventBanner(editEventId, eBannerFile);

      setEBannerUrl(uploadedUrl);
      clearEditBannerLocal();
    } catch (err) {
      setEditErr(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo subir la imagen."
      );
    } finally {
      setEBannerUploading(false);
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
      prev.map((ticket) => (ticket.id === id ? { ...ticket, ...patch } : ticket))
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

      if (activeEventId === editEventId) {
        await openInsights(editEventId);
      }

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
    <div className="ticketify-dashboard bg-[#f3faff] text-[#001f29]">
      <DashboardStyles />

      <main className="tf-container px-4 pb-24 pt-10">
        <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29] md:text-[40px] md:leading-[48px]">
              Dashboard del vendedor
            </h1>

            <p className="mt-2 max-w-xl text-[18px] leading-7 text-[#5b403f]">
              Gestioná tus eventos, ventas e insights desde un solo lugar.
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#5b403f]">
                search
              </span>

              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="h-12 w-full rounded-xl border border-[#e4bdbc] bg-white pl-12 pr-4 text-[#001f29] outline-none transition-all placeholder:text-[#5b403f]/70 focus:border-[#215d7d] focus:ring-2 focus:ring-[#215d7d]/20"
                placeholder="Buscar eventos publicados"
                type="text"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setCreateOpen(true);
              }}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b20024] px-8 text-[16px] font-bold text-white shadow-lg transition-all hover:bg-[#d62839] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">add</span>
              Crear evento
            </button>
          </div>
        </section>

        {!mpLoading && !connected ? (
          <section className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#d62839] bg-[#d62839]/10 p-4 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d62839] text-white">
                <span className="material-symbols-outlined">
                  account_balance_wallet
                </span>
              </div>

              <p className="text-[16px] font-bold leading-6 text-[#001f29]">
                Conectá Mercado Pago para recibir tus pagos de forma segura.
              </p>
            </div>

            <button
              type="button"
              onClick={connect}
              className="rounded-lg bg-[#d62839] px-6 py-3 text-[14px] font-bold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024] active:scale-[0.98]"
            >
              Conectar ahora
            </button>
          </section>
        ) : null}

        <section className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          <KpiCard
            loading={loading}
            icon="payments"
            label="Total ganado"
            value={money(totals.totalRevenuePaid)}
            trend="+12.5%"
            tone="blue"
          />

          <KpiCard
            loading={loading}
            icon="confirmation_number"
            label="Total vendido"
            value={`${number(totals.totalTicketsSoldPaid)} tickets`}
            trend="+8.2%"
            tone="red"
          />

          <KpiCard
            loading={loading}
            icon="check_circle"
            label="Órdenes pagadas"
            value={number(totals.ordersPaid)}
            trend="Mes actual"
            tone="blue"
            mutedTrend
          />
        </section>

        {!loading && !hasEvents ? (
          <section className="rounded-2xl border border-[#baeaff] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d8f2ff] text-[#215d7d]">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>

            <h2 className="mt-5 text-[24px] font-bold leading-8 text-[#001f29]">
              Todavía no creaste eventos
            </h2>

            <p className="mx-auto mt-2 max-w-md text-[16px] leading-6 text-[#5b403f]">
              Creá tu primer evento para publicar entradas, seguir ventas y
              administrar asistentes.
            </p>

            <button
              type="button"
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#d62839] px-8 text-[16px] font-bold text-white shadow-lg transition-all hover:bg-[#b20024] active:scale-[0.98]"
              onClick={() => {
                resetCreateForm();
                setCreateOpen(true);
              }}
            >
              <span className="material-symbols-outlined">add</span>
              Crear evento
            </button>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-[24px] font-bold leading-8 text-[#001f29]">
                  Eventos activos
                </h2>

                <Link
                  to="/my-events"
                  className="text-[14px] font-bold leading-5 tracking-[0.05em] text-[#b20024] hover:underline"
                >
                  Ver todos
                </Link>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#baeaff] bg-white shadow-sm">
                <div className="hidden grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr_0.5fr] gap-4 border-b border-[#e4bdbc] bg-[#e5f6ff] px-6 py-4 text-[14px] font-bold leading-5 tracking-[0.05em] text-[#5b403f] md:grid">
                  <span>Evento</span>
                  <span>Estado</span>
                  <span>Tickets</span>
                  <span className="text-right">Ingresos</span>
                  <span />
                </div>

                {loading ? (
                  <div className="space-y-4 p-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-16 animate-pulse rounded-xl bg-[#d8f2ff]"
                      />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-10 text-center text-[#5b403f]">
                    No hay eventos que coincidan con tu búsqueda.
                  </div>
                ) : (
                  <div className="divide-y divide-[#e4bdbc]">
                    {filtered.map((row) => {
                      const event = row.event;
                      const kpis = row.kpis || {};
                      const eventId = getEventId(event);
                      const sold = Number(kpis.totalTicketsSoldPaid || 0);
                      const totalCapacity = Number(
                        kpis.totalCapacity || event?.capacity || 0
                      );
                      const isActive = activeEventId === eventId;

                      return (
                        <button
                          key={eventId}
                          type="button"
                          onClick={() => openInsights(eventId)}
                          className={[
                            "grid w-full grid-cols-1 gap-4 px-6 py-5 text-left transition-colors hover:bg-[#f3faff] md:grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr_0.5fr] md:items-center",
                            isActive ? "bg-[#e5f6ff]" : "bg-white",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={safeEventImage(event?.bannerUrl)}
                              alt={event?.title || "Evento"}
                              className="h-11 w-11 rounded-lg object-cover"
                            />

                            <div>
                              <p className="font-bold text-[#001f29]">
                                {event?.title || "Evento"}
                              </p>

                              <p className="text-xs text-[#5b403f]">
                                {formatDateTime(event?.startAt)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <span
                              className={[
                                "rounded-full px-3 py-1 text-xs font-bold",
                                statusClass(event?.status),
                              ].join(" ")}
                            >
                              {statusLabel(event?.status)}
                            </span>
                          </div>

                          <p className="text-[#5b403f]">
                            {number(sold)}{" "}
                            {totalCapacity ? `/ ${number(totalCapacity)}` : ""}
                          </p>

                          <p className="font-bold text-[#001f29] md:text-right">
                            {money(kpis.totalRevenuePaid)}
                          </p>

                          <span className="flex items-center gap-1 font-bold text-[#215d7d] md:justify-end">
                            Insights
                            <span className="material-symbols-outlined text-sm">
                              chevron_right
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <aside className="xl:col-span-1">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-[24px] font-bold leading-8 text-[#001f29]">
                  Resumen de evento
                </h2>

                <span className="material-symbols-outlined text-[#5b403f]">
                  info
                </span>
              </div>

              <div className="sticky top-28 rounded-3xl bg-[#001f29] p-8 text-white shadow-xl">
                {!activeEventId ? (
                  <div>
                    <p className="text-[14px] font-semibold uppercase leading-5 tracking-[0.05em] text-[#baeaff]/70">
                      Seleccioná un evento
                    </p>

                    <p className="mt-4 text-[#dff4ff]">
                      Hacé click en un evento de la tabla para ver ingresos,
                      tickets vendidos y performance por tipo de entrada.
                    </p>
                  </div>
                ) : insightsLoading ? (
                  <div className="space-y-4">
                    <div className="h-8 animate-pulse rounded bg-white/10" />
                    <div className="h-20 animate-pulse rounded bg-white/10" />
                    <div className="h-20 animate-pulse rounded bg-white/10" />
                  </div>
                ) : insights ? (
                  <>
                    <div className="mb-8">
                      <p className="text-[14px] font-semibold uppercase leading-5 tracking-[0.05em] text-[#baeaff]/70">
                        Total de ingresos
                      </p>

                      <h3 className="mt-2 text-[40px] font-light leading-tight">
                        {money(insights.kpis?.totalRevenuePaid)}
                      </h3>

                      <div className="mt-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#fd647f]">
                          shopping_cart
                        </span>

                        <span className="font-bold">
                          {number(insights.kpis?.totalTicketsSoldPaid)} tickets
                          pagados
                        </span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {insights.ticketTypes?.length ? (
                        insights.ticketTypes.map((ticketType) => {
                          const capacity = Number(ticketType.capacity || 0);
                          const soldCount = Number(ticketType.soldCount || 0);
                          const percent =
                            capacity > 0
                              ? Math.round((soldCount / capacity) * 100)
                              : 0;

                          return (
                            <div key={ticketType.id || ticketType._id}>
                              <div className="mb-2 flex justify-between">
                                <span className="font-semibold">
                                  {ticketType.name}
                                </span>
                                <span className="font-bold">{percent}%</span>
                              </div>

                              <div className="h-2 w-full overflow-hidden rounded-full bg-[#baeaff]/20">
                                <div
                                  className="h-full rounded-full bg-[#d62839]"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-[#dff4ff]/80">
                          Este evento todavía no tiene tipos de ticket.
                        </p>
                      )}
                    </div>

                    <div className="mt-10 grid gap-3">
                      {insights.event?.status !== "PUBLISHED" ? (
                        <button
                          type="button"
                          disabled={!canPublish}
                          onClick={() =>
                            setStatus(getEventId(insights.event), "PUBLISHED")
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d62839] py-4 font-bold text-white transition-colors hover:bg-[#b20024] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Publicar evento
                          <span className="material-symbols-outlined">
                            publish
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setStatus(getEventId(insights.event), "ENDED")
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3e7697] py-4 font-bold text-white transition-colors hover:bg-[#215d7d]"
                        >
                          Finalizar evento
                          <span className="material-symbols-outlined">
                            event_busy
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditEvent(getEventId(insights.event))}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#baeaff]/30 py-4 font-bold transition-colors hover:bg-white/10"
                      >
                        Editar evento
                        <span className="material-symbols-outlined">edit</span>
                      </button>

                      <Link
                        to={`/check-in?eventId=${getEventId(insights.event)}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#baeaff]/30 py-4 font-bold transition-colors hover:bg-white/10"
                      >
                        Abrir check-in
                        <span className="material-symbols-outlined">
                          qr_code_scanner
                        </span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-[#dff4ff]/80">
                    No se pudieron cargar los insights.
                  </p>
                )}
              </div>
            </aside>
          </section>
        )}
      </main>

      <CreateEventModal
        open={createOpen}
        setOpen={setCreateOpen}
        resetCreateForm={resetCreateForm}
        onCreate={onCreate}
        mpLoading={mpLoading}
        connected={connected}
        connect={connect}
        title={title}
        setTitle={setTitle}
        city={city}
        setCity={setCity}
        venue={venue}
        setVenue={setVenue}
        startAt={startAt}
        setStartAt={setStartAt}
        endAt={endAt}
        setEndAt={setEndAt}
        bannerUrl={bannerUrl}
        setBannerUrl={setBannerUrl}
        bannerFile={bannerFile}
        setBannerFile={setBannerFile}
        bannerPreview={bannerPreview}
        setBannerPreview={setBannerPreview}
        onPickBannerFile={onPickBannerFile}
        clearBanner={clearBanner}
        ticketDrafts={ticketDrafts}
        addTicketDraft={addTicketDraft}
        updateTicketDraft={updateTicketDraft}
        removeTicketDraft={removeTicketDraft}
        createErr={createErr}
        creating={creating}
        bannerUploading={bannerUploading}
      />

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
        eBannerFile={eBannerFile}
        setEBannerFile={setEBannerFile}
        eBannerPreview={eBannerPreview}
        setEBannerPreview={setEBannerPreview}
        eBannerUploading={eBannerUploading}
        onPickEditBannerFile={onPickEditBannerFile}
        clearEditBannerLocal={clearEditBannerLocal}
        uploadEditBannerNow={uploadEditBannerNow}
        editTicketTypes={editTicketTypes}
        addEditTicketType={addEditTicketType}
        updateEditTicketType={updateEditTicketType}
        deleteEditTicketType={deleteEditTicketType}
        saveEditEvent={saveEditEvent}
      />
    </div>
  );
}

function CreateEventModal({
  open,
  setOpen,
  resetCreateForm,
  onCreate,
  mpLoading,
  connected,
  connect,
  title,
  setTitle,
  city,
  setCity,
  venue,
  setVenue,
  startAt,
  setStartAt,
  endAt,
  setEndAt,
  bannerUrl,
  setBannerUrl,
  bannerFile,
  setBannerFile,
  bannerPreview,
  setBannerPreview,
  onPickBannerFile,
  clearBanner,
  ticketDrafts,
  addTicketDraft,
  updateTicketDraft,
  removeTicketDraft,
  createErr,
  creating,
  bannerUploading,
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) resetCreateForm();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#001f29]/40 backdrop-blur-md" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[94vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <Dialog.Title className="sr-only">Crear evento</Dialog.Title>
          <Dialog.Description className="sr-only">
            Completa los detalles del evento y los tipos de entrada.
          </Dialog.Description>

          <header className="flex items-start justify-between border-b border-[#e4bdbc] p-6">
            <div>
              <h2 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29]">
                Crear evento
              </h2>

              <p className="mt-1 text-[16px] leading-6 text-[#5b403f]">
                Completa los detalles para publicar tu próximo gran evento.
              </p>
            </div>

            <Dialog.Close className="grid h-10 w-10 place-items-center rounded-full text-[#001f29] transition-colors hover:bg-[#e5f6ff]">
              <span className="material-symbols-outlined">close</span>
            </Dialog.Close>
          </header>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
            {!mpLoading && !connected ? (
              <div className="mb-6 rounded-xl border border-[#d62839] bg-[#d62839]/10 p-4">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#d62839] text-white">
                      <span className="material-symbols-outlined">
                        account_balance_wallet
                      </span>
                    </div>

                    <p className="text-[14px] font-bold leading-5 tracking-[0.05em] text-[#001f29]">
                      Conectá Mercado Pago para recibir tus pagos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={connect}
                    className="rounded-lg bg-[#d62839] px-5 py-2.5 text-[14px] font-bold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024] active:scale-[0.98]"
                  >
                    Conectar ahora
                  </button>
                </div>
              </div>
            ) : null}

            <form id="create-event-form" onSubmit={onCreate} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                <div className="md:col-span-5">
                  <label className="mb-3 block text-[14px] font-semibold uppercase leading-5 tracking-[0.08em] text-[#5b403f]">
                    Imagen del evento
                  </label>

                  <div className="group relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-[#e4bdbc] bg-[#d8f2ff]">
                    <img
                      src={
                        bannerPreview ||
                        bannerUrl ||
                        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80"
                      }
                      alt="Vista previa del evento"
                      className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-[#001f29]/15" />

                    <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center">
                      <span className="material-symbols-outlined mb-2 text-5xl text-[#b20024]">
                        add_a_photo
                      </span>

                      <p className="text-[16px] font-bold leading-6 text-[#001f29]">
                        Cargar imagen
                      </p>

                      <p className="mt-1 text-xs text-[#5b403f]">
                        Recomendado: 1080x1080px
                      </p>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById("dashboard-create-banner")
                            ?.click()
                        }
                        disabled={creating || bannerUploading}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#001f29] shadow-sm transition-colors hover:bg-[#f3faff] disabled:opacity-60"
                      >
                        Cargar imagen
                      </button>

                      <button
                        type="button"
                        onClick={clearBanner}
                        disabled={
                          creating ||
                          bannerUploading ||
                          (!bannerFile && !bannerPreview && !bannerUrl)
                        }
                        className="rounded-lg bg-[#ba1a1a] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#93000a] disabled:opacity-60"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <input
                    id="dashboard-create-banner"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      onPickBannerFile(event.target.files?.[0] || null)
                    }
                  />

                  <input
                    value={bannerUrl}
                    onChange={(event) => {
                      setBannerUrl(event.target.value);

                      if (bannerFile) setBannerFile(null);

                      if (bannerPreview?.startsWith("blob:")) {
                        URL.revokeObjectURL(bannerPreview);
                      }

                      setBannerPreview("");
                    }}
                    className="mt-3 h-11 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-sm text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d] focus:ring-2 focus:ring-[#215d7d]/20"
                    placeholder="O pegá una URL de imagen"
                    type="url"
                  />
                </div>

                <div className="space-y-6 md:col-span-7">
                  <TextField
                    label="Nombre del evento"
                    value={title}
                    onChange={setTitle}
                    placeholder="Ej: Festival de Verano 2024"
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label="Ciudad"
                      value={city}
                      onChange={setCity}
                      placeholder="Ciudad"
                      icon="location_on"
                    />

                    <TextField
                      label="Lugar / Venue"
                      value={venue}
                      onChange={setVenue}
                      placeholder="Estadio / Teatro"
                      icon="stadium"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label="Fecha de inicio"
                      value={startAt}
                      onChange={setStartAt}
                      type="datetime-local"
                    />

                    <TextField
                      label="Fecha de fin"
                      value={endAt}
                      onChange={setEndAt}
                      type="datetime-local"
                    />
                  </div>
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
                    onClick={addTicketDraft}
                    disabled={creating || bannerUploading}
                    className="flex items-center gap-1 text-[14px] font-bold leading-5 tracking-[0.05em] text-[#b20024] transition-colors hover:underline disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-xl">
                      add_circle
                    </span>
                    Agregar otro tipo de entrada
                  </button>
                </div>

                <div className="space-y-3">
                  {ticketDrafts.map((ticket) => (
                    <div
                      key={ticket.tmpId}
                      className="grid grid-cols-1 items-end gap-4 rounded-xl border border-[#e4bdbc] bg-[#e5f6ff] p-4 md:grid-cols-12"
                    >
                      <TicketInput
                        className="md:col-span-5"
                        label="Nombre de entrada"
                        value={ticket.name}
                        onChange={(value) =>
                          updateTicketDraft(ticket.tmpId, { name: value })
                        }
                        placeholder="Ej: General Early Bird"
                      />

                      <TicketInput
                        className="md:col-span-3"
                        label="Precio"
                        value={ticket.price}
                        onChange={(value) =>
                          updateTicketDraft(ticket.tmpId, {
                            price: Number(value),
                          })
                        }
                        placeholder="0.00"
                        type="number"
                        prefix="$"
                      />

                      <TicketInput
                        className="md:col-span-3"
                        label="Capacidad"
                        value={ticket.capacity}
                        onChange={(value) =>
                          updateTicketDraft(ticket.tmpId, {
                            capacity: Number(value),
                          })
                        }
                        placeholder="100"
                        type="number"
                      />

                      <div className="flex justify-end md:col-span-1 md:justify-center md:pb-1">
                        <button
                          type="button"
                          onClick={() => removeTicketDraft(ticket.tmpId)}
                          disabled={
                            creating ||
                            bannerUploading ||
                            ticketDrafts.length <= 1
                          }
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

              {createErr ? (
                <div className="rounded-lg border border-[#ffdad6] bg-[#ffdad6] px-4 py-3 text-sm font-semibold text-[#93000a]">
                  {createErr}
                </div>
              ) : null}
            </form>
          </div>

          <footer className="flex flex-col justify-end gap-4 border-t border-[#e4bdbc] bg-[#e5f6ff] p-6 md:flex-row">
            <Dialog.Close
              disabled={creating || bannerUploading}
              className="order-2 h-12 rounded-lg px-8 font-bold text-[#001f29] transition-colors hover:bg-[#d8f2ff] disabled:opacity-60 md:order-1"
            >
              Cancelar
            </Dialog.Close>

            <button
              form="create-event-form"
              type="submit"
              disabled={creating || bannerUploading}
              className="order-1 h-12 rounded-lg bg-[#b20024] px-10 font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-[#d62839] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:order-2"
            >
              {creating
                ? "Creando..."
                : bannerUploading
                  ? "Subiendo imagen..."
                  : "Crear evento"}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

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
  eBannerFile,
  setEBannerFile,
  eBannerPreview,
  setEBannerPreview,
  eBannerUploading,
  onPickEditBannerFile,
  clearEditBannerLocal,
  uploadEditBannerNow,
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
          setEBannerFile(null);

          if (eBannerPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(eBannerPreview);
          }

          setEBannerPreview("");
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
              <h2 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29]">
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
                          eBannerPreview ||
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
                      id="dashboard-edit-banner"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        onPickEditBannerFile(event.target.files?.[0] || null)
                      }
                    />

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById("dashboard-edit-banner")
                            ?.click()
                        }
                        disabled={editSaving || eBannerUploading}
                        className="rounded-lg border border-[#215d7d] px-3 py-2 text-sm font-bold text-[#215d7d] hover:bg-[#e5f6ff] disabled:opacity-60"
                      >
                        Elegir
                      </button>

                      <button
                        type="button"
                        onClick={uploadEditBannerNow}
                        disabled={!eBannerFile || editSaving || eBannerUploading}
                        className="rounded-lg bg-[#215d7d] px-3 py-2 text-sm font-bold text-white hover:bg-[#3e7697] disabled:opacity-60"
                      >
                        {eBannerUploading ? "Subiendo..." : "Subir"}
                      </button>

                      <button
                        type="button"
                        onClick={clearEditBannerLocal}
                        disabled={!eBannerPreview || editSaving || eBannerUploading}
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
                    <TextField
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
                      <TextField
                        label="Ciudad"
                        value={eCity}
                        onChange={setECity}
                        placeholder="Ciudad"
                        icon="location_on"
                      />

                      <TextField
                        label="Lugar / Venue"
                        value={eVenue}
                        onChange={setEVenue}
                        placeholder="Lugar"
                        icon="stadium"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        label="Fecha de inicio"
                        value={eStartAt}
                        onChange={setEStartAt}
                        type="datetime-local"
                      />

                      <TextField
                        label="Fecha de fin"
                        value={eEndAt}
                        onChange={setEEndAt}
                        type="datetime-local"
                      />
                    </div>

                    <TextField
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
                            {number(ticket.soldCount)}
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
              disabled={editSaving || eBannerUploading}
              className="order-2 h-12 rounded-lg px-8 font-bold text-[#001f29] transition-colors hover:bg-[#d8f2ff] disabled:opacity-60 md:order-1"
            >
              Cancelar
            </Dialog.Close>

            <button
              type="button"
              onClick={saveEditEvent}
              disabled={editLoading || editSaving || eBannerUploading}
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

function KpiCard({ loading, icon, label, value, trend, mutedTrend, tone }) {
  const iconClass =
    tone === "red"
      ? "bg-[#d8f2ff] text-[#d62839]"
      : "bg-[#d8f2ff] text-[#215d7d]";

  return (
    <article className="rounded-2xl border border-[#baeaff] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl ${iconClass}`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>

        <span
          className={[
            "text-sm font-bold",
            mutedTrend ? "text-[#5b403f]" : "text-emerald-600",
          ].join(" ")}
        >
          {trend}
          {!mutedTrend ? (
            <span className="material-symbols-outlined text-sm">
              trending_up
            </span>
          ) : null}
        </span>
      </div>

      <p className="text-[16px] leading-6 text-[#5b403f]">{label}</p>

      {loading ? (
        <div className="mt-2 h-9 w-40 animate-pulse rounded bg-[#d8f2ff]" />
      ) : (
        <h3 className="mt-1 text-[32px] font-extrabold leading-10 text-[#001f29]">
          {value}
        </h3>
      )}
    </article>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
}) {
  return (
    <div>
      <label className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
        {label}
      </label>

      <div className="relative">
        {icon ? (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5b403f]">
            {icon}
          </span>
        ) : null}

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={[
            "h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d] focus:ring-2 focus:ring-[#215d7d]/20",
            icon ? "pl-10" : "",
          ].join(" ")}
          placeholder={placeholder}
          type={type}
        />
      </div>
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
            "h-11 w-full rounded-lg border border-[#e4bdbc] bg-white px-4 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d] focus:ring-1 focus:ring-[#215d7d]",
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

function DashboardStyles() {
  return (
    <style>{`
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
  );
}