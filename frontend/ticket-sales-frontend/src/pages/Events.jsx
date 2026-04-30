import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { listPublishedEvents } from "@/api/events.api.js";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toBanner(url) {
  return (
    url ||
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=80"
  );
}

function formatTagLabel(tag = "") {
  const acronyms = {
    ai: "AI",
    saas: "SaaS",
    ux: "UX",
    ui: "UI",
    crm: "CRM",
    api: "API",
    seo: "SEO",
    ads: "Ads",
    b2b: "B2B",
    b2c: "B2C",
  };

  return String(tag)
    .trim()
    .split(/\s+/)
    .map((word) => {
      const clean = word.trim();
      const lower = clean.toLowerCase();
      return acronyms[lower] || lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function TagPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
      {label}
      <button onClick={onRemove} className="text-white/60 hover:text-white">
        ×
      </button>
    </span>
  );
}

function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getThisWeekendRange() {
  const today = startOfToday();
  const day = today.getDay();

  const saturday = new Date(today);
  saturday.setDate(today.getDate() + ((6 - day + 7) % 7));

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return {
    from: toInputDate(saturday),
    to: toInputDate(sunday),
  };
}

function getTomorrowRange() {
  const tomorrow = startOfToday();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    from: toInputDate(tomorrow),
    to: toInputDate(tomorrow),
  };
}

function getThisMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    from: toInputDate(from),
    to: toInputDate(to),
  };
}

function isEventEnded(startAt) {
  if (!startAt) return false;
  return new Date() >= new Date(startAt);
}

export function Events() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [selectedTags, setSelectedTags] = useState([]);
  const [datePreset, setDatePreset] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [price, setPrice] = useState([0, 500]);

  const [events, setEvents] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);

  const safeTotalPages = Math.max(1, Number(pagination.totalPages || 1));
  const safeCurrentPage = Math.min(
    safeTotalPages,
    Math.max(1, Number(pagination.page || page || 1))
  );

  const params = useMemo(() => {
    const p = {
      page,
      limit: 12,
    };

    if (q.trim()) p.q = q.trim();
    if (selectedTags.length) p.tags = selectedTags.join(",");
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;
    if (price[0] > 0) p.minPrice = price[0];
    if (price[1] < 500) p.maxPrice = price[1];

    return p;
  }, [page, q, selectedTags, dateFrom, dateTo, price]);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);

        const res = await listPublishedEvents(params);

        if (!alive) return;

        const nextEvents = res?.data?.events ?? [];
        const nextPagination = res?.data?.pagination ?? {
          page,
          limit: 12,
          total: nextEvents.length,
          totalPages: 1,
        };

        setEvents(Array.isArray(nextEvents) ? nextEvents : []);
        setAvailableTags(res?.data?.availableTags ?? []);

        setPagination({
          page: Number(nextPagination.page ?? page),
          limit: Number(nextPagination.limit ?? 12),
          total: Number(nextPagination.total ?? nextEvents.length ?? 0),
          totalPages: Math.max(1, Number(nextPagination.totalPages ?? 1)),
        });
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [params, page]);

  function toggleTag(label) {
    setPage(1);
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  }

  function applyDatePreset(preset) {
    setPage(1);

    if (preset === datePreset) {
      setDatePreset("");
      setDateFrom("");
      setDateTo("");
      return;
    }

    setDatePreset(preset);

    if (preset === "This Weekend") {
      const range = getThisWeekendRange();
      setDateFrom(range.from);
      setDateTo(range.to);
      return;
    }

    if (preset === "Tomorrow") {
      const range = getTomorrowRange();
      setDateFrom(range.from);
      setDateTo(range.to);
      return;
    }

    if (preset === "This Month") {
      const range = getThisMonthRange();
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }

  function clearAll() {
    setQ("");
    setSelectedTags([]);
    setDatePreset("");
    setDateFrom("");
    setDateTo("");
    setPrice([0, 500]);
    setPage(1);
  }

  function goPrevPage() {
    setPage((p) => Math.max(1, p - 1));
  }

  function goNextPage() {
    setPage((p) => Math.min(safeTotalPages, p + 1));
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="space-y-5">
        {/* Categories */}
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold tracking-wide text-white/90">
                CATEGORIES
              </div>
              <span className="text-xs text-white/40">🏷️</span>
            </div>

            <div className="grid gap-3 text-sm text-white/80">
              {availableTags.length === 0 ? (
                <div className="text-xs text-white/40">No tags available</div>
              ) : (
                availableTags.map((t) => (
                  <label key={t} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(t)}
                      onChange={() => toggleTag(t)}
                      className="h-4 w-4 accent-violet-500"
                    />
                    {formatTagLabel(t)}
                  </label>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date */}
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold tracking-wide text-white/90">
                DATE
              </div>
              <span className="text-xs text-white/40">📅</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {["This Weekend", "Tomorrow", "This Month"].map((x) => (
                <button
                  key={x}
                  onClick={() => applyDatePreset(x)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs",
                    datePreset === x
                      ? "border-violet-500/40 bg-violet-600/20 text-violet-100"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                  ].join(" ")}
                >
                  {x}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <div className="mb-1 text-xs text-white/45">From</div>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDatePreset("");
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="border-white/10 bg-white/5"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-white/45">To</div>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDatePreset("");
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="border-white/10 bg-white/5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price */}
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold tracking-wide text-white/90">
                PRICE
              </div>
              <span className="text-xs text-white/40">💲</span>
            </div>

            <div className="space-y-3">
              <input
                type="range"
                min={0}
                max={500}
                value={price[1]}
                onChange={(e) => {
                  setPrice([0, Number(e.target.value)]);
                  setPage(1);
                }}
                className="w-full accent-violet-500"
              />

              <div className="flex items-center justify-between text-xs text-white/60">
                <span>${price[0]}</span>
                <span>${price[1]}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Main */}
      <main className="space-y-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Discover Experiences
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Explore the best futuristic events in your area
          </p>
        </div>

        {/* Search bar */}
        <Card className="border-white/10 bg-white/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by artist, venue, or event..."
                className="border-white/10 bg-white/5"
              />
            </div>

            <Button
              className="bg-violet-600 hover:bg-violet-500"
              onClick={() => setPage(1)}
            >
              Search
            </Button>
          </CardContent>
        </Card>

        {/* Active filters */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-white/60">Active filters:</span>

          {selectedTags.map((t) => (
            <TagPill
              key={t}
              label={formatTagLabel(t)}
              onRemove={() => toggleTag(t)}
            />
          ))}

          {datePreset ? (
            <TagPill
              label={datePreset}
              onRemove={() => {
                setDatePreset("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            />
          ) : null}

          {(dateFrom || dateTo) && !datePreset ? (
            <TagPill
              label={`${dateFrom || "Any"} → ${dateTo || "Any"}`}
              onRemove={() => {
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            />
          ) : null}

          <TagPill
            label={`$${price[0]} - $${price[1]}`}
            onRemove={() => {
              setPrice([0, 500]);
              setPage(1);
            }}
          />

          <button
            onClick={clearAll}
            className="ml-2 text-xs text-violet-300 hover:text-violet-200"
          >
            Clear all
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-white/50">
          <span>
            {loading ? "Loading events..." : `${pagination.total} event(s) found`}
          </span>

          {!loading && pagination.total > 0 ? (
            <span>
              Page {safeCurrentPage} of {safeTotalPages}
            </span>
          ) : null}
        </div>

        <Separator className="bg-white/10" />

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-white/10 bg-white/5">
                <div className="h-40 w-full animate-pulse bg-white/10" />
                <CardContent className="p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                  <div className="mt-5 h-2 w-full animate-pulse rounded bg-white/10" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6 text-sm text-white/60">
              No events match your current filters.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => {
              const eventId = e._id || e.id;
              const ended = isEventEnded(e.startAt);
              const minPrice = Number(e.minPrice ?? 0);

              return (
                <Card
                  key={eventId}
                  className={[
                    "overflow-hidden border-white/10 bg-white/5",
                    ended ? "opacity-80" : "",
                  ].join(" ")}
                >
                  <div className="relative h-40 w-full">
                    <img
                      src={toBanner(e.bannerUrl)}
                      alt={e.title}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      {ended ? (
                        <Badge className="border-white/5 bg-red-800 text-red-100">
                          EVENT ENDED
                        </Badge>
                      ) : (
                        <Badge className="border-white/5 bg-emerald-500 text-emerald-100">
                          ON SALE
                        </Badge>
                      )}
                    </div>

                    <div className="absolute right-3 top-3">
                      {minPrice === 0 ? (
                        <Badge className="border-white/10 bg-black/60 text-white">
                          FREE
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <div className="mb-2 flex flex-wrap gap-2">
                      {(e.tags ?? []).slice(0, 2).map((t) => (
                        <Badge
                          key={t}
                          className="border-white/10 bg-violet-600/20 text-violet-100"
                        >
                          {formatTagLabel(t)}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-lg font-semibold">{e.title}</div>

                    <div className="mt-3 grid gap-1 text-xs text-white/60">
                      <div>📅 {formatDate(e.startAt)}</div>
                      <div>
                        📍 {e.city} • {e.venue}
                      </div>
                      <div>
                        💲{" "}
                        {ended
                          ? "Sales closed"
                          : `From $${Number(e.minPrice ?? 0)}`}
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Button
                        asChild
                        className={
                          ended
                            ? "bg-white/10 text-white/70 hover:bg-white/10"
                            : "bg-violet-600 hover:bg-violet-500"
                        }
                      >
                        <Link to={`/events/${eventId}`}>
                          {ended ? "View details" : "View"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && safeTotalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 pt-6">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10"
              disabled={safeCurrentPage <= 1}
              onClick={goPrevPage}
            >
              ‹ Previous
            </Button>

            <span className="grid h-9 min-w-24 place-items-center rounded-md bg-violet-600 px-3 text-sm">
              {safeCurrentPage} / {safeTotalPages}
            </span>

            <Button
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10"
              disabled={safeCurrentPage >= safeTotalPages}
              onClick={goNextPage}
            >
              Next ›
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}