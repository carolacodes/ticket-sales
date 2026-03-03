// MyEvents.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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
  Calendar,
  MapPin,
  ArrowUpRight,
  Image as ImageIcon,
  X,
} from "lucide-react";

/* =========================
   Helpers
========================= */
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
  if (status === "PUBLISHED")
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  if (status === "ENDED")
    return "border-zinc-500/25 bg-zinc-500/10 text-zinc-200";
  return "border-amber-500/25 bg-amber-500/10 text-amber-200";
}

function statusLabel(status) {
  if (status === "PUBLISHED") return "LIVE";
  if (status === "ENDED") return "ENDED";
  return "DRAFT";
}

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

const ALLOWED_STATUS = new Set(["DRAFT", "PUBLISHED", "ENDED"]);

export function MyEvents() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | DRAFT | PUBLISHED | ENDED

  /* =========================
      EDIT EVENT MODAL (same as dashboard)
  ========================= */
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");

  const [editEventId, setEditEventId] = useState(null);

  // event fields
  const [eTitle, setETitle] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eVenue, setEVenue] = useState("");
  const [eCity, setECity] = useState("");
  const [eStartAt, setEStartAt] = useState("");
  const [eEndAt, setEEndAt] = useState("");
  const [eBannerUrl, setEBannerUrl] = useState("");
  const [eTags, setETags] = useState("");

  // banner upload in edit modal
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // ticket types (existing + new)
  const [editTicketTypes, setEditTicketTypes] = useState([]);

  async function load() {
    const r = await getMyEventsRequest();
    setEvents(r.data?.events ?? []);
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

  useEffect(() => {
    return () => {
      if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return events
      .filter((e) => (filter === "ALL" ? true : e.status === filter))
      .filter((e) => (!s ? true : (e.title || "").toLowerCase().includes(s)));
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
      throw err;
    }
  }

  /* =========================
      Banner upload helpers (edit modal)
  ========================= */
  function pickBannerFile(file) {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setEditErr("Please select an image file (PNG/JPG/WebP).");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setEditErr("Image is too large. Max 6MB.");
      return;
    }

    setEditErr("");
    setBannerFile(file);
    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(URL.createObjectURL(file));
  }

  function clearPickedBanner() {
    setBannerFile(null);
    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setBannerPreview("");
  }

  async function uploadBannerNow() {
    if (!editEventId) return;
    if (!bannerFile) {
      setEditErr("Pick an image first.");
      return;
    }

    try {
      setUploadingBanner(true);
      setEditErr("");

      const fd = new FormData();
      fd.append("file", bannerFile);

      const r = await uploadEventBannerRequest(editEventId, fd);

      const url =
        r?.data?.bannerUrl ||
        r?.data?.url ||
        r?.data?.secure_url ||
        r?.data?.file?.path ||
        r?.data?.uploaded?.path ||
        r?.data?.imageUrl ||
        null;

      if (!url) {
        setEditErr("Upload OK but no URL returned. Ensure uploadBanner returns { bannerUrl }.");
        return;
      }

      setEBannerUrl(url);
      clearPickedBanner();
      await load();
    } catch (err) {
      setEditErr(err?.response?.data?.message || err?.message || "Could not upload banner.");
    } finally {
      setUploadingBanner(false);
    }
  }

  /* =========================
      Edit event modal logic
  ========================= */
  async function openEditEvent(eventId) {
    try {
      setEditErr("");
      setEditEventId(eventId);
      setEditEventOpen(true);
      setEditLoading(true);

      clearPickedBanner();

      // 1) evento completo
      const evRes = await getEventById(eventId);
      const ev = evRes?.data?.event;

      setETitle(ev?.title || "");
      setEDescription(ev?.description || "");
      setEVenue(ev?.venue || "");
      setECity(ev?.city || "");
      setEStartAt(toDatetimeLocal(ev?.startAt));
      setEEndAt(toDatetimeLocal(ev?.endAt));
      setEBannerUrl(ev?.bannerUrl || "");
      setETags(tagsToString(ev?.tags));

      // 2) ticket types
      const ttRes = await listTicketTypesByEventRequest(eventId);
      const types = ttRes?.data?.ticketTypes || [];

      setEditTicketTypes(
        types.map((t) => ({
          id: t.id || t._id,
          name: t.name || "",
          price: safeNumber(t.price, 0),
          currency: (t.currency || "USD").toUpperCase(),
          capacity: safeNumber(t.capacity, 1),
          soldCount: safeNumber(t.soldCount, 0),
          isNew: false,
        }))
      );
    } catch (err) {
      setEditErr(err?.response?.data?.message || "Could not load event for editing.");
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
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }

  async function deleteEditTicketType(t) {
    // regla: NO se puede eliminar si ya tiene ventas
    if (!t?.isNew && Number(t.soldCount || 0) > 0) {
      setEditErr("You can’t delete a ticket type with sales.");
      return;
    }

    try {
      setEditSaving(true);
      setEditErr("");

      if (t.isNew) {
        setEditTicketTypes((prev) => prev.filter((x) => x.id !== t.id));
        return;
      }

      await deleteTicketTypeRequest(t.id);
      setEditTicketTypes((prev) => prev.filter((x) => x.id !== t.id));
    } catch (err) {
      setEditErr(err?.response?.data?.message || "Could not delete ticket type.");
    } finally {
      setEditSaving(false);
    }
  }

  async function saveEditEvent() {
    if (!editEventId) return;

    try {
      setEditSaving(true);
      setEditErr("");

      // update event
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

      // sync ticket types
      for (const t of editTicketTypes) {
        if (!t.name?.trim()) throw new Error("Ticket type name is required.");
        if (!Number.isFinite(Number(t.price)) || Number(t.price) < 0)
          throw new Error("Ticket price must be ≥ 0.");
        if (!Number.isInteger(Number(t.capacity)) || Number(t.capacity) < 1)
          throw new Error("Capacity must be ≥ 1.");

        // regla: capacity no puede ser < sold
        if (!t.isNew && Number(t.capacity) < Number(t.soldCount || 0)) {
          throw new Error(
            `Capacity can't be lower than sold (${t.soldCount}) for "${t.name}".`
          );
        }

        if (t.isNew) {
          await createTicketTypeRequest(editEventId, {
            name: t.name.trim(),
            price: Number(t.price),
            currency: (t.currency || "USD").toUpperCase(),
            capacity: Number(t.capacity),
          });
        } else {
          await updateTicketTypeRequest(t.id, {
            name: t.name.trim(),
            price: Number(t.price),
            currency: (t.currency || "USD").toUpperCase(),
            capacity: Number(t.capacity),
          });
        }
      }

      await load();
      setEditEventOpen(false);
    } catch (err) {
      setEditErr(
        err?.response?.data?.message || err?.message || "Could not save changes."
      );
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
            MY EVENTS
          </h1>
          <p className="mt-3 text-white/60">
            Manage your published events and drafts.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative w-full md:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your events..."
              className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30"
            />
          </div>

          <Button
            className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
            onClick={() => nav("/dashboard")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {["ALL", "DRAFT", "PUBLISHED", "ENDED"].map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={[
              "rounded-full border px-3 py-1.5 text-sm transition",
              filter === k
                ? "border-violet-500/30 bg-violet-600/15 text-violet-200"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            {k === "ALL" ? "All" : k}
          </button>
        ))}
      </div>

      <Separator className="my-6 bg-white/10" />

      {/* EMPTY */}
      {!loading && !hasEvents ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-10">
            <div className="flex flex-col items-center text-center">
              <div className="text-2xl font-bold">No events yet 🥲</div>
              <p className="mt-2 max-w-md text-sm text-white/60">
                Create your first event to start selling tickets.
              </p>
              <Button
                className="mt-6 h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
                onClick={() => nav("/dashboard")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* GRID */}
          <div className="grid gap-5 md:grid-cols-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-white/10 bg-white/5">
                  <CardContent className="p-6">
                    <div className="h-36 animate-pulse rounded-2xl bg-white/10" />
                    <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-white/10" />
                    <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                    <div className="mt-5 h-10 w-full animate-pulse rounded-2xl bg-white/10" />
                  </CardContent>
                </Card>
              ))
            ) : (
              filtered.map((e) => (
                <EventCard
                  key={e._id}
                  e={e}
                  onStatus={setStatus}
                  onEdit={() => openEditEvent(e._id)}
                />
              ))
            )}
          </div>

          {!loading && filtered.length === 0 ? (
            <div className="mt-10 text-center text-sm text-white/50">
              No events match your filters.
            </div>
          ) : null}
        </>
      )}

      {/* =========================
          EDIT EVENT MODAL (shared)
      ========================= */}
      <Dialog.Root
        open={editEventOpen}
        onOpenChange={(v) => {
          setEditEventOpen(v);
          if (!v) {
            setEditErr("");
            setEditEventId(null);
            clearPickedBanner();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />

          <Dialog.Content
            className="
              fixed left-1/2 top-1/2 z-50
              w-[92vw] max-w-2xl
              -translate-x-1/2 -translate-y-1/2
              rounded-3xl border border-white/10
              bg-[#0b0812]/95 p-6 shadow-2xl
              max-h-[85vh] overflow-y-auto
            "
            aria-describedby={undefined}
          >
            {/* ✅ Radix a11y requirements */}
            <Dialog.Title className="sr-only">Edit Event</Dialog.Title>

            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-violet-300">
                  Edit event
                </div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight">
                  Update details & tickets
                </div>
                <div className="mt-1 text-sm text-white/60">
                  You can edit published events too.
                </div>
              </div>

              <Dialog.Close className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
                ✕
              </Dialog.Close>
            </div>

            <Separator className="my-5 bg-white/10" />

            {editLoading ? (
              <div className="grid gap-3">
                <Skeleton className="h-10 w-full rounded-2xl bg-white/10" />
                <Skeleton className="h-10 w-full rounded-2xl bg-white/10" />
                <Skeleton className="h-40 w-full rounded-2xl bg-white/10" />
              </div>
            ) : (
              <div className="grid gap-4">
                {/* EVENT FIELDS */}
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    Title
                  </label>
                  <Input
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                    value={eTitle}
                    onChange={(e) => setETitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    Description
                  </label>
                  <textarea
                    className="min-h-[110px] rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none"
                    value={eDescription}
                    onChange={(e) => setEDescription(e.target.value)}
                    placeholder="Describe your event..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                      City
                    </label>
                    <Input
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                      value={eCity}
                      onChange={(e) => setECity(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                      Venue
                    </label>
                    <Input
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                      value={eVenue}
                      onChange={(e) => setEVenue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                      Start
                    </label>
                    <Input
                      type="datetime-local"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                      value={eStartAt}
                      onChange={(e) => setEStartAt(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-widest text-white/60">
                      End
                    </label>
                    <Input
                      type="datetime-local"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                      value={eEndAt}
                      onChange={(e) => setEEndAt(e.target.value)}
                    />
                  </div>
                </div>

                {/* Banner uploader */}
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    Event banner
                  </label>

                  <div className="grid gap-3">
                    {bannerPreview || eBannerUrl ? (
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <img
                          src={bannerPreview || eBannerUrl}
                          alt="Event banner preview"
                          className="h-40 w-full object-cover opacity-90"
                        />
                        {bannerPreview ? (
                          <button
                            type="button"
                            onClick={clearPickedBanner}
                            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white/80 hover:bg-black/70"
                          >
                            <X className="h-4 w-4" /> Remove
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center gap-3 text-sm text-white/70">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                            <ImageIcon className="h-5 w-5 text-white/70" />
                          </div>
                          <div>
                            <div className="font-semibold text-white/85">
                              Add a banner image
                            </div>
                            <div className="text-xs text-white/45">
                              Upload to Cloudinary and auto-save bannerUrl.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <input
                        id="event-banner-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => pickBannerFile(e.target.files?.[0] || null)}
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                          onClick={() =>
                            document.getElementById("event-banner-file")?.click()
                          }
                          disabled={editSaving || uploadingBanner}
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Pick image
                        </Button>

                        <Button
                          type="button"
                          className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
                          onClick={uploadBannerNow}
                          disabled={!bannerFile || uploadingBanner}
                        >
                          {uploadingBanner ? "UPLOADING..." : "Upload & Set"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                          onClick={clearPickedBanner}
                          disabled={!bannerFile || uploadingBanner}
                        >
                          Clear
                        </Button>
                      </div>

                      <div className="text-[11px] text-white/40 leading-5">
                        Current URL:{" "}
                        <span className="text-white/70 break-all">
                          {eBannerUrl || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    Tags
                  </label>
                  <Input
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                    value={eTags}
                    onChange={(e) => setETags(e.target.value)}
                    placeholder="music, festival, live"
                  />
                  <p className="text-[11px] text-white/40">Comma-separated.</p>
                </div>

                <Separator className="my-2 bg-white/10" />

                {/* TICKET TYPES */}
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-widest text-white/40">
                    Ticket Types
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={addEditTicketType}
                    disabled={editSaving}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add type
                  </Button>
                </div>

                <div className="grid gap-3">
                  {editTicketTypes.length ? (
                    editTicketTypes.map((t) => {
                      const cannotDelete =
                        !t.isNew && Number(t.soldCount || 0) > 0;

                      return (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <div className="grid gap-3 md:grid-cols-[1.2fr_.8fr_.6fr_auto]">
                            {/* NAME */}
                            <div className="grid gap-1">
                              <Input
                                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                                value={t.name}
                                onChange={(e) =>
                                  updateEditTicketType(t.id, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="VIP / GENERAL"
                              />
                              <p className="text-[11px] text-white/40">
                                Name shown to buyers.
                              </p>
                            </div>

                            {/* PRICE */}
                            <div className="grid gap-1">
                              <Input
                                type="number"
                                min={0}
                                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                                value={safeNumber(t.price, 0)}
                                onChange={(e) =>
                                  updateEditTicketType(t.id, {
                                    price: Number(e.target.value),
                                  })
                                }
                              />
                              <p className="text-[11px] text-white/40 leading-4">
                                Price per ticket (0 = free).
                              </p>
                            </div>

                            {/* CAPACITY */}
                            <div className="grid gap-1">
                              <Input
                                type="number"
                                min={1}
                                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                                value={safeNumber(t.capacity, 1)}
                                onChange={(e) =>
                                  updateEditTicketType(t.id, {
                                    capacity: Number(e.target.value),
                                  })
                                }
                              />
                              <p className="text-[11px] text-white/40 leading-4">
                                Max available (must be ≥ sold:{" "}
                                {safeNumber(t.soldCount, 0)}).
                              </p>
                            </div>

                            {/* DELETE */}
                            <div className="flex items-end justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                                disabled={editSaving || cannotDelete}
                                title={
                                  cannotDelete
                                    ? "Cannot delete a ticket type with sales"
                                    : "Delete"
                                }
                                onClick={() => deleteEditTicketType(t)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-white/45">
                            Sold: {safeNumber(t.soldCount, 0)}{" "}
                            {t.isNew ? "• New (not saved yet)" : ""}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                      No ticket types yet.
                    </div>
                  )}
                </div>

                {editErr ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {editErr}
                  </div>
                ) : null}

                <div className="grid gap-3">
                  <Button
                    type="button"
                    className="h-12 rounded-2xl bg-violet-600 hover:bg-violet-500"
                    disabled={editSaving || uploadingBanner}
                    onClick={saveEditEvent}
                  >
                    {editSaving ? "SAVING..." : "SAVE CHANGES"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={() => setEditEventOpen(false)}
                    disabled={editSaving || uploadingBanner}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function EventCard({ e, onStatus, onEdit }) {
  const cover = e.bannerUrl;

  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="p-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="h-40 w-full object-cover opacity-80"
            />
          ) : (
            <div className="h-40 w-full bg-gradient-to-r from-violet-600/20 via-white/5 to-transparent" />
          )}

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <Badge
              className={[
                "rounded-full px-3 py-1 border",
                statusBadge(e.status),
              ].join(" ")}
            >
              {statusLabel(e.status)}
            </Badge>
          </div>

          {/* actions */}
          <div className="absolute right-3 top-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-9 rounded-xl border-white/10 bg-black/40 p-0 hover:bg-black/60"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="border-white/10 bg-black/85 text-white"
                onClick={(ev) => ev.stopPropagation()}
              >
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    View Insights <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onEdit}>Edit event</DropdownMenuItem>

                {e.status !== "PUBLISHED" ? (
                  <DropdownMenuItem onClick={() => onStatus(e._id, "PUBLISHED")}>
                    Publish
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onStatus(e._id, "DRAFT")}>
                    Back to Draft
                  </DropdownMenuItem>
                )}

                {e.status !== "ENDED" ? (
                  <DropdownMenuItem onClick={() => onStatus(e._id, "ENDED")}>
                    Mark as Ended
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold tracking-tight">
              {(e.title || "EVENT").toUpperCase()}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/65">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-white/40" />
                {formatDateTime(e.startAt)}
              </span>

              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-white/40" />
                {e.venue || "—"}
                {e.city ? `, ${e.city}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {e.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {e.tags.slice(0, 4).map((t) => (
              <Badge
                key={t}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70"
              >
                {t.toUpperCase()}
              </Badge>
            ))}
          </div>
        ) : null}

        <Separator className="my-5 bg-white/10" />

        {/* Footer buttons */}
        <div className="grid gap-3 md:grid-cols-2">
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
            asChild
          >
            <Link to="/dashboard">View Insights</Link>
          </Button>

          {e.status !== "PUBLISHED" ? (
            <Button
              className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
              onClick={() => onStatus(e._id, "PUBLISHED")}
            >
              Publish
            </Button>
          ) : (
            <Button
              className="h-11 rounded-2xl bg-rose-500 hover:bg-rose-500"
              onClick={() => onStatus(e._id, "ENDED")}
            >
              End Event
            </Button>
          )}
        </div>

        <div className="mt-4 text-xs text-white/35">
          Created: {formatDateTime(e.createdAt)} • Updated:{" "}
          {formatDateTime(e.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}