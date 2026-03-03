// Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  Sparkles,
  ArrowUpRight,
  Ticket,
  DollarSign,
  ClipboardList,
  Image as ImageIcon,
  X,
} from "lucide-react";

/* =========================
   Helpers
========================= */
function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function number(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-US");
}
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

const ALLOWED_STATUS = new Set(["DRAFT", "PUBLISHED", "ENDED"]);

/* =========================
   Upload helper (Cloudinary via backend)
   Backend route: POST /api/events/:id/banner (multipart form-data, field "file")
========================= */
async function uploadEventBanner(eventId, file) {
  if (!eventId) throw new Error("Missing eventId for banner upload");
  if (!file) throw new Error("Missing file");

  const form = new FormData();
  form.append("file", file);

  const r = await api.post(`/events/${eventId}/banner`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const data = r?.data || {};
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
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const [q, setQ] = useState("");
  const [activeEventId, setActiveEventId] = useState(null);

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  /* =========================
      CREATE EVENT MODAL (event + ticket drafts)
  ========================= */
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [createErr, setCreateErr] = useState("");

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [startAt, setStartAt] = useState(""); // datetime-local
  const [endAt, setEndAt] = useState(""); // datetime-local

  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");

  const [ticketDrafts, setTicketDrafts] = useState([
    { tmpId: uuid(), name: "GENERAL", price: 20, currency: "USD", capacity: 40 },
    { tmpId: uuid(), name: "VIP", price: 50, currency: "USD", capacity: 40 },
  ]);

  /* =========================
      EDIT EVENT MODAL (event fields + ticket types CRUD)
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

  // edit banner file/preview
  const [eBannerFile, setEBannerFile] = useState(null);
  const [eBannerPreview, setEBannerPreview] = useState("");
  const [eBannerUploading, setEBannerUploading] = useState(false);

  // ticket types (existing + new)
  const [editTicketTypes, setEditTicketTypes] = useState([]);

  async function load() {
    const r = await getMyEventsSummaryRequest();
    setSummary(r.data);
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

  useEffect(() => {
    return () => {
      if (eBannerPreview?.startsWith("blob:")) URL.revokeObjectURL(eBannerPreview);
    };
  }, [eBannerPreview]);

  const events = summary?.events ?? [];
  const totals = summary?.totals ?? {};
  const hasEvents = events.length > 0;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return events;
    return events.filter((x) => (x?.event?.title || "").toLowerCase().includes(s));
  }, [events, q]);

  async function openInsights(eventId) {
    try {
      setActiveEventId(eventId);
      setInsights(null);
      setInsightsLoading(true);
      const r = await getEventSummaryRequest(eventId);
      setInsights(r.data);
    } finally {
      setInsightsLoading(false);
    }
  }

  async function setStatus(eventId, nextStatus) {
    const status = String(nextStatus || "").toUpperCase().trim();
    if (!ALLOWED_STATUS.has(status)) return;

    await updateEventStatusRequest(eventId, { status });
    await load();

    if (activeEventId === eventId) {
      await openInsights(eventId);
    }
  }

  /* =========================
      Create event helpers
  ========================= */
  function resetCreateForm() {
    setTitle("");
    setCity("");
    setVenue("");
    setStartAt("");
    setEndAt("");
    setBannerUrl("");
    setBannerFile(null);
    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setBannerPreview("");
    setCreateErr("");
    setBannerUploading(false);

    setTicketDrafts([
      { tmpId: uuid(), name: "GENERAL", price: 20, currency: "USD", capacity: 40 },
      { tmpId: uuid(), name: "VIP", price: 50, currency: "USD", capacity: 40 },
    ]);
  }

  function onPickBannerFile(file) {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setCreateErr("Please select an image file (PNG/JPG/WebP).");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setCreateErr("Image is too large. Max 6MB.");
      return;
    }

    setCreateErr("");
    setBannerFile(file);
    setBannerUrl("");
    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(URL.createObjectURL(file));
  }

  function clearBanner() {
    setBannerFile(null);
    setBannerUrl("");
    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setBannerPreview("");
  }

  function addTicketDraft() {
    setTicketDrafts((prev) => [
      ...prev,
      { tmpId: uuid(), name: "", price: 0, currency: "USD", capacity: 1 },
    ]);
  }

  function updateTicketDraft(tmpId, patch) {
    setTicketDrafts((prev) => prev.map((t) => (t.tmpId === tmpId ? { ...t, ...patch } : t)));
  }

  function removeTicketDraft(tmpId) {
    setTicketDrafts((prev) => prev.filter((t) => t.tmpId !== tmpId));
  }

  async function onCreate(e) {
    e.preventDefault();
    setCreateErr("");

    if (!title.trim() || title.trim().length < 3)
      return setCreateErr("Title must be at least 3 characters.");
    if (!startAt) return setCreateErr("Start date is required.");
    if (!ticketDrafts?.length) return setCreateErr("Add at least 1 ticket type (GENERAL/VIP).");

    for (const t of ticketDrafts) {
      if (!t.name?.trim()) return setCreateErr("Ticket type name is required.");
      if (!(Number.isFinite(Number(t.price)) && Number(t.price) >= 0))
        return setCreateErr("Ticket price must be a number ≥ 0.");
      if (!(Number.isInteger(Number(t.capacity)) && Number(t.capacity) >= 1))
        return setCreateErr("Capacity must be an integer ≥ 1.");
    }

    try {
      setCreating(true);
      setBannerUploading(false);

      const startIso = new Date(startAt).toISOString();
      const endIso = endAt ? new Date(endAt).toISOString() : undefined;

      // 1) create event first (bannerUrl can be pasted URL)
      const evRes = await createEventRequest({
        title: title.trim(),
        city: city.trim() || undefined,
        venue: venue.trim() || undefined,
        startAt: startIso,
        endAt: endIso,
        bannerUrl: bannerUrl.trim() || undefined,
      });

      const eventId = evRes?.data?.event?._id;
      if (!eventId) throw new Error("createEvent did not return event._id");

      // 2) if user picked a file, upload AFTER create (needs eventId)
      if (bannerFile) {
        setBannerUploading(true);
        const uploadedUrl = await uploadEventBanner(eventId, bannerFile);
        await updateEventRequest(eventId, { bannerUrl: uploadedUrl });
      }

      // 3) create ticket types
      for (const t of ticketDrafts) {
        await createTicketTypeRequest(eventId, {
          name: t.name.trim(),
          price: Number(t.price),
          currency: (t.currency || "USD").toUpperCase(),
          capacity: Number(t.capacity),
        });
      }

      setCreateOpen(false);
      resetCreateForm();
      await load();
    } catch (err) {
      setCreateErr(err?.response?.data?.message || err?.message || "Could not create event.");
    } finally {
      setBannerUploading(false);
      setCreating(false);
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

      // reset banner local file state
      setEBannerFile(null);
      if (eBannerPreview?.startsWith("blob:")) URL.revokeObjectURL(eBannerPreview);
      setEBannerPreview("");

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

      const ttRes = await listTicketTypesByEventRequest(eventId);
      const types = ttRes?.data?.ticketTypes || [];

      setEditTicketTypes(
        types.map((t) => ({
          id: t.id || t._id,
          name: t.name || "",
          price: Number(t.price ?? 0),
          currency: (t.currency || "USD").toUpperCase(),
          capacity: Number(t.capacity ?? 1),
          soldCount: Number(t.soldCount ?? 0),
          isNew: false,
        }))
      );
    } catch (err) {
      setEditErr(err?.response?.data?.message || "Could not load event for editing.");
    } finally {
      setEditLoading(false);
    }
  }

  function onPickEditBannerFile(file) {
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
    setEBannerFile(file);
    // local preview
    if (eBannerPreview?.startsWith("blob:")) URL.revokeObjectURL(eBannerPreview);
    setEBannerPreview(URL.createObjectURL(file));
  }

  function clearEditBannerLocal() {
    setEBannerFile(null);
    if (eBannerPreview?.startsWith("blob:")) URL.revokeObjectURL(eBannerPreview);
    setEBannerPreview("");
  }

  async function uploadEditBannerNow() {
    if (!editEventId) return setEditErr("Missing eventId.");
    if (!eBannerFile) return;

    try {
      setEditErr("");
      setEBannerUploading(true);

      const url = await uploadEventBanner(editEventId, eBannerFile);

      // immediately update input with cloudinary URL (you can still Save later)
      setEBannerUrl(url);
      clearEditBannerLocal();
    } catch (err) {
      setEditErr(err?.response?.data?.message || err?.message || "Upload failed.");
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
    setEditTicketTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function deleteEditTicketType(t) {
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

      // Update event fields
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

      // Sync ticket types
      for (const t of editTicketTypes) {
        if (!t.name?.trim()) throw new Error("Ticket type name is required.");
        if (!Number.isFinite(Number(t.price)) || Number(t.price) < 0)
          throw new Error("Ticket price must be ≥ 0.");
        if (!Number.isInteger(Number(t.capacity)) || Number(t.capacity) < 1)
          throw new Error("Capacity must be ≥ 1.");

        if (!t.isNew && Number(t.capacity) < Number(t.soldCount || 0)) {
          throw new Error(`Capacity can't be lower than sold (${t.soldCount}) for "${t.name}".`);
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
      if (activeEventId === editEventId) await openInsights(editEventId);

      setEditEventOpen(false);
    } catch (err) {
      setEditErr(err?.response?.data?.message || err?.message || "Could not save changes.");
    } finally {
      setEditSaving(false);
    }
  }

  const canPublish = (insights?.ticketTypes?.length || 0) > 0;

  /* =========================
      Render
  ========================= */
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* TOP BAR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/40">
            Admin <span className="text-white/20">›</span> Dashboard
          </div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Here’s what’s happening with your events today.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative w-full md:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events..."
              className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30"
            />
          </div>

          <Button
            onClick={() => {
              resetCreateForm();
              setCreateOpen(true);
            }}
            className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <KpiCard
          loading={loading}
          icon={<DollarSign className="h-5 w-5" />}
          title="Total Revenue"
          value={money(totals.totalRevenuePaid)}
          hint={hasEvents ? "Paid orders only" : "Create your first event to start earning"}
        />
        <KpiCard
          loading={loading}
          icon={<Ticket className="h-5 w-5" />}
          title="Tickets Sold"
          value={number(totals.totalTicketsSoldPaid)}
          hint={hasEvents ? "Paid tickets only" : "No events yet"}
        />
        <KpiCard
          loading={loading}
          icon={<ClipboardList className="h-5 w-5" />}
          title="Orders Paid"
          value={number(totals.ordersPaid)}
          hint={`Pending: ${number(totals.ordersPending)} • Expired: ${number(totals.ordersExpired)}`}
        />
      </div>

      {/* EMPTY STATE */}
      {!loading && !hasEvents ? (
        <Card className="mt-6 border-white/10 bg-white/5">
          <CardContent className="p-10">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/25">
                <Sparkles className="h-6 w-6 text-violet-200" />
              </div>
              <h2 className="mt-5 text-2xl font-bold">No events created yet</h2>
              <p className="mt-2 max-w-md text-sm text-white/60">
                Create your first event to publish tickets, track sales, and manage attendees.
              </p>
              <Button
                className="mt-6 h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
                onClick={() => {
                  resetCreateForm();
                  setCreateOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* EVENTS TABLE + INSIGHTS */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">Your Events</div>
                    <div className="mt-1 text-sm text-white/60">
                      Click an event to view insights.
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    asChild
                  >
                    <Link to="/events">
                      View marketplace <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <Separator className="my-5 bg-white/10" />

                {loading ? (
                  <div className="grid gap-3">
                    <Skeleton className="h-10 w-full rounded-2xl bg-white/10" />
                    <Skeleton className="h-10 w-full rounded-2xl bg-white/10" />
                    <Skeleton className="h-10 w-full rounded-2xl bg-white/10" />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white/60">Event</TableHead>
                          <TableHead className="text-white/60">Status</TableHead>
                          <TableHead className="text-white/60">Start</TableHead>
                          <TableHead className="text-right text-white/60">Tickets</TableHead>
                          <TableHead className="text-right text-white/60">Revenue</TableHead>
                          <TableHead className="text-right text-white/60">Action</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filtered.map((row) => {
                          const e = row.event;
                          const k = row.kpis;
                          const isActive = activeEventId === e.id;

                          return (
                            <TableRow
                              key={e.id}
                              className={[
                                "border-white/10 cursor-pointer",
                                isActive ? "bg-white/5" : "hover:bg-white/5",
                              ].join(" ")}
                              onClick={() => openInsights(e.id)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="text-white">{e.title}</span>
                                  <span className="text-xs text-white/45">
                                    Created: {formatDateTime(e.createdAt)}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  className={[
                                    "rounded-full px-3 py-1 border",
                                    statusBadge(e.status),
                                  ].join(" ")}
                                >
                                  {e.status}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-white/75">
                                {formatDateTime(e.startAt)}
                              </TableCell>

                              <TableCell className="text-right text-white/85">
                                {number(k.totalTicketsSoldPaid)}
                              </TableCell>

                              <TableCell className="text-right text-white/85">
                                {money(k.totalRevenuePaid)}
                              </TableCell>

                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="h-9 w-9 rounded-xl border-white/10 bg-white/5 p-0 hover:bg-white/10"
                                      onClick={(ev) => ev.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent
                                    className="border-white/10 bg-black/85 text-white"
                                    onClick={(ev) => ev.stopPropagation()}
                                  >
                                    <DropdownMenuItem onClick={() => openInsights(e.id)}>
                                      View Insights
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => openEditEvent(e.id)}>
                                      Edit event
                                    </DropdownMenuItem>

                                    {e.status !== "PUBLISHED" ? (
                                      <DropdownMenuItem onClick={() => setStatus(e.id, "PUBLISHED")}>
                                        Publish
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => setStatus(e.id, "DRAFT")}>
                                        Back to Draft
                                      </DropdownMenuItem>
                                    )}

                                    {e.status !== "ENDED" ? (
                                      <DropdownMenuItem onClick={() => setStatus(e.id, "ENDED")}>
                                        Mark as Ended
                                      </DropdownMenuItem>
                                    ) : null}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {filtered.length === 0 ? (
                          <TableRow className="border-white/10">
                            <TableCell colSpan={6} className="py-10 text-center text-sm text-white/50">
                              No events match your search.
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* INSIGHTS PANEL */}
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-6">
                <div className="text-lg font-semibold">Event Insights</div>
                <div className="mt-1 text-sm text-white/60">Ticket types performance and sales.</div>

                <Separator className="my-5 bg-white/10" />

                {!activeEventId ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/60">
                    Select an event to see details.
                  </div>
                ) : insightsLoading ? (
                  <div className="grid gap-3">
                    <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
                    <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
                    <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
                  </div>
                ) : insights ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">{insights.event.title}</div>
                        <Badge
                          className={[
                            "rounded-full px-3 py-1 border",
                            statusBadge(insights.event.status),
                          ].join(" ")}
                        >
                          {insights.event.status}
                        </Badge>
                      </div>

                      <div className="mt-2 text-xs text-white/50">
                        Start: {formatDateTime(insights.event.startAt)}
                        {insights.event.endAt ? ` • End: ${formatDateTime(insights.event.endAt)}` : ""}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <MiniStat label="Revenue (paid)" value={money(insights.kpis.totalRevenuePaid)} />
                        <MiniStat label="Tickets (paid)" value={number(insights.kpis.totalTicketsSoldPaid)} />
                        <MiniStat label="Orders paid" value={number(insights.kpis.ordersPaid)} />
                        <MiniStat label="Avg order" value={money(insights.kpis.avgOrderValuePaid)} />
                      </div>

                      <div className="mt-4 grid gap-3">
                        {insights.event.status !== "PUBLISHED" ? (
                          <>
                            <Button
                              className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
                              disabled={!canPublish}
                              onClick={() => setStatus(insights.event.id, "PUBLISHED")}
                            >
                              Publish event
                            </Button>
                            {!canPublish ? (
                              <div className="text-xs text-amber-200/80">
                                Add at least 1 ticket type (GENERAL/VIP) before publishing.
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <Button
                            className="h-11 rounded-2xl bg-zinc-800 hover:bg-zinc-700"
                            onClick={() => setStatus(insights.event.id, "ENDED")}
                          >
                            End event
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                          onClick={() => openEditEvent(insights.event.id)}
                        >
                          Edit event (details + tickets)
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs uppercase tracking-widest text-white/40">Ticket Types</div>

                    {insights.ticketTypes?.length ? (
                      <div className="grid gap-3">
                        {insights.ticketTypes.map((t) => {
                          const cap = Number(t.capacity || 0);
                          const sold = Number(t.soldCount || 0);
                          const remaining = Number(t.remaining ?? t.available ?? 0);
                          const pct = cap > 0 ? Math.round((sold / cap) * 100) : 0;

                          return (
                            <div key={t.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold">{t.name}</div>
                                <div className="text-sm text-white/80">
                                  {money(t.price)} <span className="text-white/40">/ {t.currency || "USD"}</span>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-white/50">
                                Capacity: {number(t.capacity)} • Remaining: {number(remaining)}
                              </div>

                              <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                                  <span>Sold: {number(sold)}</span>
                                  <span>{pct}%</span>
                                </div>
                                <Progress value={pct} className="h-2 rounded-full" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/60">
                        No ticket types yet. Create some in the editor.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/60">
                    Could not load insights.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* =========================
          CREATE EVENT MODAL
      ========================= */}
      <Dialog.Root
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) resetCreateForm();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <Dialog.Content
            className="
              fixed left-1/2 top-1/2 z-50
              w-[92vw] max-w-lg
              -translate-x-1/2 -translate-y-1/2
              rounded-3xl border border-white/10
              bg-[#0b0812]/95 p-6 shadow-2xl
              max-h-[85vh] overflow-y-auto
            "
          >
            <Dialog.Title className="sr-only">Create event</Dialog.Title>
            <Dialog.Description className="sr-only">
              Create an event and optionally upload a banner image.
            </Dialog.Description>

            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-violet-300">
                  Create Event
                </div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight">
                  New event (DRAFT)
                </div>
              </div>

              <Dialog.Close className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
                ✕
              </Dialog.Close>
            </div>

            <Separator className="my-5 bg-white/10" />

            <form onSubmit={onCreate} className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-widest text-white/60">
                  Title
                </label>
                <Input
                  className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Festival de primavera 2026"
                />
              </div>

              {/* Banner */}
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-widest text-white/60">
                  Event image (optional)
                </label>

                <div className="grid gap-3">
                  {bannerPreview || bannerUrl ? (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      <img
                        src={bannerPreview || bannerUrl}
                        alt="Event banner preview"
                        className="h-40 w-full object-cover opacity-90"
                        onError={() => {
                          if (!bannerPreview) setCreateErr("Invalid image URL.");
                        }}
                      />
                      <button
                        type="button"
                        onClick={clearBanner}
                        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white/80 hover:bg-black/70"
                      >
                        <X className="h-4 w-4" /> Remove
                      </button>
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
                            Pick a file (uploads after Create) or paste a URL.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Input
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    value={bannerUrl}
                    onChange={(e) => {
                      setBannerUrl(e.target.value);
                      if (bannerFile) setBannerFile(null);
                      if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                      setBannerPreview("");
                    }}
                    placeholder="https://... (bannerUrl)"
                  />

                  <div className="grid gap-2">
                    <input
                      id="banner-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickBannerFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                        onClick={() => document.getElementById("banner-file")?.click()}
                        disabled={creating || bannerUploading}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Choose file
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                        onClick={clearBanner}
                        disabled={creating || bannerUploading || (!bannerUrl && !bannerFile && !bannerPreview)}
                      >
                        Clear
                      </Button>
                    </div>

                    <div className="text-[11px] text-white/40 leading-5">
                      🧠 If you choose a file, it uploads to Cloudinary <span className="text-white/70">after</span> event creation (needs eventId).
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    City (optional)
                  </label>
                  <Input
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Corrientes"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    Venue (optional)
                  </label>
                  <Input
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Centro de Convenciones"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    Start (required)
                  </label>
                  <Input
                    type="datetime-local"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    End (optional)
                  </label>
                  <Input
                    type="datetime-local"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </div>
              </div>

              <Separator className="my-1 bg-white/10" />

              {/* Ticket drafts */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    Ticket Types (required)
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={addTicketDraft}
                    disabled={creating || bannerUploading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>

                <div className="grid gap-3">
                  {ticketDrafts.map((t) => (
                    <div
                      key={t.tmpId}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[1.2fr_.8fr_.6fr_auto]">
                        <div className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/45">
                            Name
                          </div>
                          <Input
                            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                            value={t.name}
                            onChange={(e) =>
                              updateTicketDraft(t.tmpId, { name: e.target.value })
                            }
                            placeholder="GENERAL / VIP"
                          />
                        </div>

                        <div className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/45">
                            Price
                          </div>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                            value={t.price}
                            onChange={(e) =>
                              updateTicketDraft(t.tmpId, { price: Number(e.target.value) })
                            }
                          />
                          <p className="text-[11px] text-white/40 leading-4">
                            Price per ticket (0 = free).
                          </p>
                        </div>

                        <div className="grid gap-1">
                          <div className="text-[10px] uppercase tracking-widest text-white/45">
                            Capacity
                          </div>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                            value={t.capacity}
                            onChange={(e) =>
                              updateTicketDraft(t.tmpId, { capacity: Number(e.target.value) })
                            }
                          />
                          <p className="text-[11px] text-white/40 leading-4">
                            Max tickets available for this type.
                          </p>
                        </div>

                        <div className="flex items-end justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                            onClick={() => removeTicketDraft(t.tmpId)}
                            disabled={(creating || bannerUploading) || ticketDrafts.length <= 1}
                            title={
                              ticketDrafts.length <= 1
                                ? "At least 1 ticket type is required"
                                : "Remove"
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {createErr ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {createErr}
                </div>
              ) : null}

              <div className="grid gap-3">
                <Button
                  className="h-12 rounded-2xl bg-violet-600 hover:bg-violet-500"
                  disabled={creating || bannerUploading}
                >
                  {creating ? "CREATING..." : bannerUploading ? "UPLOADING BANNER..." : "CREATE EVENT"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating || bannerUploading}
                >
                  Cancel
                </Button>
              </div>

              <div className="text-center text-[11px] text-white/35">
                After creating, publish when you’re ready.
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* =========================
          EDIT EVENT MODAL
      ========================= */}
      <Dialog.Root
        open={editEventOpen}
        onOpenChange={(v) => {
          setEditEventOpen(v);
          if (!v) {
            setEditErr("");
            setEditEventId(null);
            setEBannerFile(null);
            if (eBannerPreview?.startsWith("blob:")) URL.revokeObjectURL(eBannerPreview);
            setEBannerPreview("");
            setEBannerUploading(false);
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
          >
            <Dialog.Title className="sr-only">Edit event</Dialog.Title>
            <Dialog.Description className="sr-only">
              Update event details, banner image, and ticket types.
            </Dialog.Description>

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

                {/* Banner upload + URL */}
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-widest text-white/60">
                    Banner image
                  </label>

                  {/* preview (either newly picked file preview OR current url) */}
                  {eBannerPreview || eBannerUrl ? (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      <img
                        src={eBannerPreview || eBannerUrl}
                        alt="Banner preview"
                        className="h-44 w-full object-cover opacity-90"
                      />
                      {eBannerPreview ? (
                        <button
                          type="button"
                          onClick={clearEditBannerLocal}
                          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white/80 hover:bg-black/70"
                          disabled={eBannerUploading || editSaving}
                        >
                          <X className="h-4 w-4" /> Remove
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                      No banner yet. Upload one or paste a URL.
                    </div>
                  )}

                  <Input
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                    value={eBannerUrl}
                    onChange={(e) => setEBannerUrl(e.target.value)}
                    placeholder="https://... (bannerUrl)"
                    disabled={eBannerUploading}
                  />

                  <div className="grid gap-2">
                    <input
                      id="edit-banner-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickEditBannerFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                        onClick={() => document.getElementById("edit-banner-file")?.click()}
                        disabled={eBannerUploading || editSaving}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Choose file
                      </Button>

                      <Button
                        type="button"
                        className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
                        onClick={uploadEditBannerNow}
                        disabled={!eBannerFile || eBannerUploading || editSaving}
                      >
                        {eBannerUploading ? "UPLOADING..." : "Upload"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                        onClick={clearEditBannerLocal}
                        disabled={!eBannerFile || eBannerUploading || editSaving}
                      >
                        Clear file
                      </Button>
                    </div>

                    <p className="text-[11px] text-white/40">
                      ✅ Upload sets <span className="text-white/70">bannerUrl</span> automatically. Then hit{" "}
                      <span className="text-white/70">Save Changes</span>.
                    </p>
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
                    disabled={editSaving || eBannerUploading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add type
                  </Button>
                </div>

                <div className="grid gap-3">
                  {editTicketTypes.length ? (
                    editTicketTypes.map((t) => {
                      const cannotDelete = !t.isNew && Number(t.soldCount || 0) > 0;

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
                                  updateEditTicketType(t.id, { name: e.target.value })
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
                                value={Number(t.price ?? 0)}
                                onChange={(e) =>
                                  updateEditTicketType(t.id, { price: Number(e.target.value) })
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
                                value={Number(t.capacity ?? 1)}
                                onChange={(e) =>
                                  updateEditTicketType(t.id, { capacity: Number(e.target.value) })
                                }
                              />
                              <p className="text-[11px] text-white/40 leading-4">
                                Max available (must be ≥ sold: {Number(t.soldCount || 0)}).
                              </p>
                            </div>

                            {/* DELETE */}
                            <div className="flex items-end justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                                disabled={editSaving || eBannerUploading || cannotDelete}
                                title={cannotDelete ? "Cannot delete a ticket type with sales" : "Delete"}
                                onClick={() => deleteEditTicketType(t)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-white/45">
                            Sold: {number(t.soldCount)} {t.isNew ? "• New (not saved yet)" : ""}
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
                    disabled={editSaving || eBannerUploading}
                    onClick={saveEditEvent}
                  >
                    {editSaving ? "SAVING..." : "SAVE CHANGES"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={() => setEditEventOpen(false)}
                    disabled={editSaving || eBannerUploading}
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

/* =========================
    Small UI components
========================= */
function KpiCard({ loading, icon, title, value, hint }) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80">
            {icon}
          </div>
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
            +0.0%
          </div>
        </div>

        <div className="mt-4 text-sm text-white/60">{title}</div>
        {loading ? (
          <div className="mt-2">
            <Skeleton className="h-9 w-40 rounded-2xl bg-white/10" />
            <Skeleton className="mt-3 h-4 w-56 rounded bg-white/10" />
          </div>
        ) : (
          <>
            <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
            <div className="mt-2 text-xs text-white/45">{hint}</div>
          </>
        )}

        <div className="mt-5 h-10 rounded-2xl bg-gradient-to-r from-violet-600/30 via-white/5 to-transparent" />
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-widest text-white/45">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/85">{value}</div>
    </div>
  );
}