import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { listPublishedEvents } from "@/api/events.api.js";

const DEFAULT_CATEGORIES = [
  "Conciertos",
  "Deportes",
  "Teatro",
  "Festivales",
  "Comedia",
];

const fallbackImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBj8qZN1tSnX2YgniaUGzkQTVt_6HOVgfuSuX9sqs-dYkZs2M7vfC_t5SnLRsl3VNiMBPohbKhy3LnBcUjC5r5bdejWMHYbEwRnWuO8DKPeP-ES-TxaWKmR9ZFvXo4sZXTlSWFGJybe7GkZwq5NtZnudg_5Fv4NMFBKzzeDwb3lHknOph43YcKAXS8M3dvTWQu7ImpiIPdb-8wVwk-WnIbyIz4Cwqzw076zalXtPE_FYEAtlemhNIDm927LHLviCkWHi53gADj53eJq",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCwN3OIv62oP-Cq3HYX90vPxFyicAXr7NwY9gb9gwIqDYLrM8uRcNkhxJVXKUp1VzD7BbBl7cGoBbPMSgoyiI_jMJbVTEeMW7CxPVrgN5bu8n6VSdDQI7skZ3z6SVkCtruL3f57zY2QTg7x4HDhnYxw6LFBbjZfGLlgyyudBgjwd2X2MB-z9J7aqrfzOvpabhcGvDPM4b5u5Z5i_aGjJE4vzBac1base-Z6Ath_ng6rMkTnPGUjotgp_C9E9j6LpsMZasJUZoJhV6wn",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBzh0dwnbhcNEV1SoxAx_k_i8_VQXVN1ZJrn8f2LLNf-00ZSDOaJxKyl390g_cxBpqj9xOv5u0eUKv_e9fPXmsAcAWR_Qm8wQUWMiJ92d2ifHV3jBFSJiKqfKjRbl0m4PRefDw0m5snQq65t57sXqYrRPieSlqs8WS_SCtznyDzs8PXwCXzFkJ5J4acsY2dkUoRfX96zDTHKPyUiWIkiT-mCRGoqVWyCZx9WosR-6SbhpA5vRPXSOR7cMrtFbw0htrkJQi-XZiULd3S",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAMbYGibXR_mhsbztJuP1TfbyKoLzZtMEyeV0Y9aEGJ6lYZUcgJP03AYYtUfcdu2BdImQ57s1Au_KmSbdIoMdxNDm580tkKfBT4Eh2mz5kPX67IMFvHhI2piDc7BqbKifMs6fw_p4PEcS2wJtB4FpSA_ej47nTBmfUdbfX9BmZOLqSK_N9mt6kapzOhLyClVKpDliVzcy8E5yFGuLKi5p2RXIIjTlBxwZ0tKe8fC4gx7k7-7PXAPzWTIGrsChpKsAFZhFQrxVoWPpDp",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCLt5egk5XvMXCPiZWHfqsuDYPkHFtNpdcwSG5fvaMnyq-uPaN1FXWI7GY7LAwZfHTvJ9358o0vQIR_ciUxpMPWAUAz2qnv13fDZaxOCV8R74bxZt0z23TUHEkLuf4XEhSh4PhBRGoxaSwoe_obEXaUy-5snnm-B-UiwDlRZZ0jiM6Sr6mQqb9S3rBXKAUdny8lLAAIn9V9RvvAgAlhzrkAie9zf4cul4pz9xlj7MvwxnSVobelXI65qPgVwaYcDBE-RPr2vgbcEutJ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD7wv8sWV8OOuJOIaUN87uJ9PFOg3XVRMemvH3KRrk1auHz-zpMvuL7ckilMfPVWfDJ9H8T1hXikRoCWjpuC_wEdEXFL0S-MmdgObh0AyzkW9C6mjHXR85H_hLYmvKJMP7rcLOpM0MTvZG_p-Yywld7HbpoO3L1y2YaZiKvE2oWEESZz3lUcYrrY6FrthEqFlB_Am-y_eY8GbQZFEkMdhMPjWn8Eb6nJnyelTPtxs7XsKGkDDCRmpveogWZo_LcXGXlZc8gUj9ykirN",
];

function toBanner(url, index = 0) {
  return url || fallbackImages[index % fallbackImages.length];
}

function formatTagLabel(tag = "") {
  const dictionary = {
    music: "Conciertos",
    musica: "Conciertos",
    música: "Conciertos",
    concert: "Conciertos",
    concerts: "Conciertos",
    concierto: "Conciertos",
    conciertos: "Conciertos",
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

  const clean = String(tag).trim();
  const lower = clean.toLowerCase();

  if (dictionary[lower]) return dictionary[lower];

  return clean
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getDateParts(iso) {
  if (!iso) return { day: "--", month: "---" };

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return { day: "--", month: "---" };
  }

  return {
    day: date.toLocaleDateString("es-AR", { day: "2-digit" }),
    month: date
      .toLocaleDateString("es-AR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  };
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

function getTodayRange() {
  const today = startOfToday();

  return {
    from: toInputDate(today),
    to: toInputDate(today),
  };
}

function getThisWeekRange() {
  const today = startOfToday();
  const day = today.getDay();

  const start = new Date(today);
  start.setDate(today.getDate() - day);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    from: toInputDate(start),
    to: toInputDate(end),
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
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") || searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [q, setQ] = useState(initialSearch);
  const [page, setPage] = useState(1);

  const [selectedTags, setSelectedTags] = useState(
    initialCategory ? [initialCategory] : []
  );

  const [datePreset, setDatePreset] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("500");

  const [city, setCity] = useState("");
  const [sort, setSort] = useState("recent");

  const [events, setEvents] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);

  const safeTotalPages = Math.max(1, Number(pagination.totalPages || 1));
  const safeCurrentPage = Math.min(
    safeTotalPages,
    Math.max(1, Number(pagination.page || page || 1))
  );

  const visibleCategories = useMemo(() => {
    const formatted = availableTags.map(formatTagLabel);
    const merged = [...DEFAULT_CATEGORIES, ...formatted];

    return [...new Set(merged)].slice(0, 8);
  }, [availableTags]);

  const cityOptions = useMemo(() => {
    const values = events
      .map((event) => event.city)
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean);

    return [...new Set(values)];
  }, [events]);

  const params = useMemo(() => {
    const p = {
      page,
      limit: 6,
    };

    if (q.trim()) p.q = q.trim();
    if (selectedTags.length) p.tags = selectedTags.join(",");
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;
    if (minPrice !== "") p.minPrice = Number(minPrice);
    if (maxPrice !== "") p.maxPrice = Number(maxPrice);
    if (city) p.city = city;
    if (sort) p.sort = sort;

    return p;
  }, [page, q, selectedTags, dateFrom, dateTo, minPrice, maxPrice, city, sort]);

  useEffect(() => {
    const nextParams = {};

    if (q.trim()) nextParams.search = q.trim();
    if (selectedTags.length) nextParams.category = selectedTags[0];

    setSearchParams(nextParams, { replace: true });
  }, [q, selectedTags, setSearchParams]);

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
          limit: 6,
          total: nextEvents.length,
          totalPages: 1,
        };

        setEvents(Array.isArray(nextEvents) ? nextEvents : []);
        setAvailableTags(
          Array.isArray(res?.data?.availableTags) ? res.data.availableTags : []
        );

        setPagination({
          page: Number(nextPagination.page ?? page),
          limit: Number(nextPagination.limit ?? 6),
          total: Number(nextPagination.total ?? nextEvents.length ?? 0),
          totalPages: Math.max(1, Number(nextPagination.totalPages ?? 1)),
        });
      } catch (error) {
        console.error("Error loading events:", error);

        if (!alive) return;

        setEvents([]);
        setPagination({
          page: 1,
          limit: 6,
          total: 0,
          totalPages: 1,
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

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(1);
  }

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

    if (preset === "today") {
      const range = getTodayRange();
      setDateFrom(range.from);
      setDateTo(range.to);
      return;
    }

    if (preset === "week") {
      const range = getThisWeekRange();
      setDateFrom(range.from);
      setDateTo(range.to);
      return;
    }

    if (preset === "month") {
      const range = getThisMonthRange();
      setDateFrom(range.from);
      setDateTo(range.to);
      return;
    }

    if (preset === "custom") {
      setDateFrom("");
      setDateTo("");
    }
  }

  function clearFilters() {
    setQ("");
    setSelectedTags([]);
    setDatePreset("");
    setDateFrom("");
    setDateTo("");
    setMinPrice("");
    setMaxPrice("500");
    setCity("");
    setSort("recent");
    setPage(1);
  }

  function goToPage(nextPage) {
    setPage(Math.min(safeTotalPages, Math.max(1, nextPage)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadMore() {
    goToPage(Math.min(safeTotalPages, safeCurrentPage + 1));
  }

  return (
    <div className="ticketify-events bg-[#f3faff] text-[#001f29]">
      <style>{`
        .filled-icon {
          font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24;
        }

        .event-card-shadow {
          box-shadow: 0px 4px 20px rgba(23, 86, 118, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .event-card-shadow:hover {
          box-shadow: 0px 10px 30px rgba(23, 86, 118, 0.15);
          transform: translateY(-2px);
        }

        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        input[type="checkbox"],
        input[type="radio"] {
          accent-color: #b20024;
        }
      `}</style>

      <main className="pb-20 pt-12">
        <section className="tf-container mb-12">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-[32px] font-extrabold leading-[40px] tracking-[-0.01em] text-[#215d7d] md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
              Explorar eventos
            </h1>

            <p className="mb-8 text-[18px] font-normal leading-7 text-[#5b403f]">
              Descubre los conciertos más esperados, los mejores partidos y las
              obras de teatro que no te puedes perder.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center">
              <span className="material-symbols-outlined text-[#215d7d]">
                search
              </span>
            </div>

            <input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
              className="h-16 w-full rounded-xl border-none bg-white py-0 pl-14 pr-32 text-[18px] leading-7 text-[#001f29] shadow-lg outline-none transition-all placeholder:text-[#001f29]/75 focus:ring-2 focus:ring-[#d62839]"
              placeholder="Buscar por artista, evento, categoría o ciudad"
              type="text"
            />

            <button
              type="submit"
              className="absolute bottom-2 right-4 top-2 rounded-lg bg-[#d62839] px-8 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:opacity-90"
            >
              Buscar
            </button>
          </form>
        </section>

        <section className="tf-container grid grid-cols-1 gap-6 md:grid-cols-4">
          <aside className="space-y-8">
            <div>
              <h3 className="mb-4 text-[24px] font-bold leading-8 text-[#215d7d]">
                Categoría
              </h3>

              <div className="space-y-3">
                {visibleCategories.map((category) => {
                  const checked = selectedTags.includes(category);

                  return (
                    <label
                      key={category}
                      className="group flex cursor-pointer items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTag(category)}
                        className="h-5 w-5 rounded border-[#906f6e] text-[#b20024] focus:ring-[#b20024]"
                      />

                      <span
                        className={[
                          "text-[16px] leading-6 transition-colors group-hover:text-[#b20024]",
                          checked
                            ? "font-bold text-[#b20024]"
                            : "text-[#001f29]",
                        ].join(" ")}
                      >
                        {category}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-[24px] font-bold leading-8 text-[#215d7d]">
                Rango de precio
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                    Min
                  </label>

                  <input
                    value={minPrice}
                    onChange={(event) => {
                      setMinPrice(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] p-3 text-[#001f29] outline-none focus:border-[#b20024]"
                    placeholder="$0"
                    type="number"
                    min="0"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                    Max
                  </label>

                  <input
                    value={maxPrice}
                    onChange={(event) => {
                      setMaxPrice(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] p-3 text-[#001f29] outline-none focus:border-[#b20024]"
                    placeholder="$500"
                    type="number"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-[24px] font-bold leading-8 text-[#215d7d]">
                Fecha
              </h3>

              <div className="space-y-3">
                <DateOption
                  label="Hoy"
                  value="today"
                  checked={datePreset === "today"}
                  onChange={applyDatePreset}
                />

                <DateOption
                  label="Esta semana"
                  value="week"
                  checked={datePreset === "week"}
                  onChange={applyDatePreset}
                />

                <DateOption
                  label="Este mes"
                  value="month"
                  checked={datePreset === "month"}
                  onChange={applyDatePreset}
                />

                <DateOption
                  label="Fecha personalizada"
                  value="custom"
                  checked={datePreset === "custom"}
                  onChange={applyDatePreset}
                  highlight
                />
              </div>

              {datePreset === "custom" ? (
                <div className="mt-4 grid gap-3">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => {
                      setDateFrom(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] p-3 text-[#001f29] outline-none focus:border-[#b20024]"
                  />

                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => {
                      setDateTo(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] p-3 text-[#001f29] outline-none focus:border-[#b20024]"
                  />
                </div>
              ) : null}
            </div>

            <div>
              <h3 className="mb-4 text-[24px] font-bold leading-8 text-[#215d7d]">
                Ciudad
              </h3>

              <select
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] p-3 text-[16px] leading-6 text-[#001f29] outline-none focus:border-[#b20024]"
              >
                <option value="">Todas las ciudades</option>

                {cityOptions.length > 0 ? (
                  cityOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Buenos Aires">Buenos Aires</option>
                    <option value="CABA">CABA</option>
                    <option value="Madrid">Madrid</option>
                    <option value="Barcelona">Barcelona</option>
                  </>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-[#c9eeff] bg-white px-5 py-3 text-sm font-bold text-[#215d7d] transition-all hover:border-[#215d7d]"
            >
              Limpiar filtros
            </button>
          </aside>

          <div className="md:col-span-3">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-[16px] leading-6 text-[#5b403f]">
                {loading ? (
                  "Cargando eventos..."
                ) : (
                  <>
                    <span className="font-bold text-[#001f29]">
                      {pagination.total}
                    </span>{" "}
                    eventos encontrados
                  </>
                )}
              </p>

              <div className="flex items-center gap-3">
                <span className="text-[14px] font-semibold leading-5 text-[#5b403f]">
                  Ordenar por:
                </span>

                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                  className="cursor-pointer border-none bg-transparent font-bold text-[#b20024] outline-none focus:ring-0"
                >
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="popular">Más populares</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="event-card-shadow overflow-hidden rounded-xl bg-white"
                  >
                    <div className="h-48 animate-pulse bg-[#d8f2ff]" />

                    <div className="space-y-4 p-5">
                      <div className="h-4 w-24 animate-pulse rounded bg-[#d8f2ff]" />
                      <div className="h-6 w-3/4 animate-pulse rounded bg-[#d8f2ff]" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-[#d8f2ff]" />
                      <div className="h-10 w-full animate-pulse rounded bg-[#d8f2ff]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="event-card-shadow rounded-xl border border-[#c9eeff] bg-white p-8 text-[#5b403f]">
                No encontramos eventos con esos filtros.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event, index) => {
                  const eventId = event._id || event.id;
                  const ended = isEventEnded(event.startAt);
                  const date = getDateParts(event.startAt);
                  const min = Number(event.minPrice ?? 0);
                  const primaryTag = formatTagLabel(
                    event.tags?.[0] || event.category || "Evento"
                  );
                  const location = [event.venue, event.city]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <article
                      key={eventId}
                      className={[
                        "event-card-shadow group flex flex-col overflow-hidden rounded-xl bg-white",
                        ended ? "opacity-75" : "",
                      ].join(" ")}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          src={toBanner(event.bannerUrl, index)}
                          alt={event.title}
                        />

                        <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1 text-center shadow-md backdrop-blur-sm">
                          <span className="block text-[24px] font-bold leading-none text-[#b20024]">
                            {date.day}
                          </span>

                          <span className="block text-[14px] font-semibold uppercase tracking-wider text-[#5b403f]">
                            {date.month}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="absolute right-4 top-4 rounded-full bg-white/20 p-2 backdrop-blur-md transition-all hover:bg-white/40"
                          aria-label="Guardar favorito"
                        >
                          <span className="material-symbols-outlined text-white">
                            favorite
                          </span>
                        </button>
                      </div>

                      <div className="flex flex-grow flex-col p-5">
                        <div className="mb-2">
                          <span className="rounded-full bg-[#d8f2ff] px-2 py-0.5 text-[12px] font-bold uppercase tracking-tight text-[#215d7d]">
                            {ended ? "Finalizado" : primaryTag}
                          </span>
                        </div>

                        <h4 className="mb-2 line-clamp-1 text-[24px] font-bold leading-8 text-[#001f29]">
                          {event.title}
                        </h4>

                        <div className="mb-4 flex items-center gap-2 text-[16px] leading-6 text-[#5b403f]">
                          <span className="material-symbols-outlined text-[18px]">
                            location_on
                          </span>

                          <span className="line-clamp-1">
                            {location || "Ubicación a confirmar"}
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between border-t border-[#baeaff] pt-4">
                          <div>
                            <span className="block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                              Desde
                            </span>

                            <span className="text-[20px] font-bold leading-6 text-[#b20024]">
                              {ended ? "Cerrado" : `$${min.toFixed(2)}`}
                            </span>
                          </div>

                          <Link
                            to={`/events/${eventId}`}
                            className="rounded-lg bg-[#d62839] px-4 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:opacity-90"
                          >
                            Ver evento
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && events.length > 0 ? (
              <div className="mt-16 flex flex-col items-center gap-6">
                {safeCurrentPage < safeTotalPages ? (
                  <button
                    type="button"
                    onClick={loadMore}
                    className="rounded-xl border-2 border-transparent bg-[#d8f2ff] px-12 py-4 text-[18px] font-bold leading-7 text-[#215d7d] transition-all hover:border-[#215d7d] hover:bg-[#a2e3ff] active:scale-95"
                  >
                    Cargar más eventos
                  </button>
                ) : null}

                {safeTotalPages > 1 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {Array.from({ length: safeTotalPages })
                      .slice(0, 5)
                      .map((_, index) => {
                        const pageNumber = index + 1;
                        const active = pageNumber === safeCurrentPage;

                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => goToPage(pageNumber)}
                            className={[
                              "flex h-10 w-10 items-center justify-center rounded-lg font-bold transition-colors",
                              active
                                ? "bg-[#b20024] text-white"
                                : "text-[#5b403f] hover:bg-[#d8f2ff]",
                            ].join(" ")}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                    {safeTotalPages > 5 ? (
                      <>
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-[#5b403f]">
                          ...
                        </span>

                        <button
                          type="button"
                          onClick={() => goToPage(safeTotalPages)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-[#5b403f] transition-colors hover:bg-[#d8f2ff]"
                        >
                          {safeTotalPages}
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

function DateOption({ label, value, checked, onChange, highlight = false }) {
  return (
    <label
      className={[
        "flex cursor-pointer items-center gap-3",
        highlight ? "text-[#b20024]" : "text-[#001f29]",
      ].join(" ")}
    >
      <input
        checked={checked}
        onChange={() => onChange(value)}
        className="h-5 w-5 border-[#906f6e] text-[#b20024] focus:ring-[#b20024]"
        name="date"
        type="radio"
      />

      <span className="text-[16px] leading-6">{label}</span>
    </label>
  );
}