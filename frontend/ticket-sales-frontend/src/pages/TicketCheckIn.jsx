import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

import { checkInTicket, getEventTicketsForCheckIn } from "@/api/tickets.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  ScanLine,
  Ticket,
  Clock3,
  Search,
  User,
  Mail,
  ArrowLeft,
} from "lucide-react";

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

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeApiError(err) {
  const msg = err?.response?.data?.message || err?.message || "Invalid ticket";

  if (msg.includes("USED")) return "Ticket already used";
  if (msg.includes("VOID")) return "Ticket voided";
  if (msg.toLowerCase().includes("not found")) return "Ticket not found";

  return msg;
}

function playBeep(type = "success") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      oscillator.frequency.value = 880;
      gain.gain.value = 0.05;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
    } else {
      oscillator.frequency.value = 220;
      gain.gain.value = 0.06;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.22);
    }
  } catch {
    // nada
  }
}

function statusBadge(status) {
  const s = String(status || "").toUpperCase();
  if (s === "VALID") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (s === "USED") return "border-yellow-500/20 bg-yellow-500/10 text-yellow-200";
  if (s === "VOID") return "border-red-500/20 bg-red-500/10 text-red-200";
  return "border-white/10 bg-white/10 text-white";
}

export function TicketCheckIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const eventId = params.get("eventId");

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [eventData, setEventData] = useState(null);

  const [tab, setTab] = useState("VALID");
  const [search, setSearch] = useState("");

  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);

  const [result, setResult] = useState(null);

  const scannerRef = useRef(null);
  const lockRef = useRef(false);
  const lastScanRef = useRef({ code: "", at: 0 });

  async function loadTickets() {
    if (!eventId) return;

    try {
      setLoading(true);
      setLoadErr("");
      const res = await getEventTicketsForCheckIn(eventId);
      setEventData(res?.data || null);
    } catch (err) {
      setLoadErr(
        err?.response?.data?.message || err?.message || "Could not load event tickets."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, [eventId]);

  async function handleCheckIn(ticketCode) {
    const cleanCode = String(ticketCode || "").trim();
    if (!cleanCode || busy) return;

    setBusy(true);
    setResult(null);

    try {
      await checkInTicket(cleanCode);

      setResult({
        type: "success",
        title: "Access Granted",
        message: "Ticket accepted successfully.",
        code: cleanCode,
      });

      playBeep("success");
      setCode(cleanCode);

      await loadTickets();
      setTab("USED");
    } catch (err) {
      const friendly = normalizeApiError(err);

      setResult({
        type: "error",
        title: "Check-In Failed",
        message: friendly,
        code: cleanCode,
      });

      playBeep("error");
      setCode(cleanCode);
    } finally {
      setBusy(false);
    }
  }

  async function handleManualCheck() {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    await handleCheckIn(cleanCode);
  }

  async function startScanner() {
    if (scanning) return;

    setResult(null);
    setScanning(true);

    const scanner = new Html5Qrcode("ticket-checkin-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          const now = Date.now();
          const sameAsLast =
            lastScanRef.current.code === decodedText &&
            now - lastScanRef.current.at < 2500;

          if (lockRef.current || sameAsLast) return;

          lockRef.current = true;
          lastScanRef.current = { code: decodedText, at: now };

          setCode(decodedText);
          await handleCheckIn(decodedText);

          setTimeout(() => {
            lockRef.current = false;
          }, 1200);
        },
        () => {}
      );
    } catch {
      setScanning(false);
      setResult({
        type: "error",
        title: "Camera Error",
        message: "No se pudo iniciar la cámara o no diste permisos.",
      });
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current && scanning) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {
      // nada
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const tickets = eventData?.tickets || [];
  const stats = eventData?.stats || { total: 0, valid: 0, used: 0 };
  const event = eventData?.event || null;

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets
      .filter((t) => {
        if (tab === "VALID") return t.status === "VALID";
        if (tab === "USED") return t.status === "USED";
        return true;
      })
      .filter((t) => {
        if (!q) return true;

        const hay = [
          t.code,
          t.buyer?.username,
          t.buyer?.email,
          t.ticketType?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      });
  }, [tickets, tab, search]);

  if (!eventId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-white">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="text-xl font-semibold">Missing eventId</div>
            <p className="mt-2 text-white/60">
              Entrá al check-in desde el dashboard de un evento.
            </p>
            <Button className="mt-4" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 text-white">
      <div className="mb-8 flex flex-col gap-4">
        <Button
          variant="outline"
          className="w-fit rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-violet-300">
              Event Check-In
            </div>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
              {event?.title || "CHECK-IN"}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {event?.venue || "—"}{event?.city ? `, ${event.city}` : ""} • {formatDateTime(event?.startAt)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-widest text-white/40">Total</div>
                <div className="mt-1 text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-widest text-white/40">Valid</div>
                <div className="mt-1 text-2xl font-bold text-emerald-300">{stats.valid}</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-widest text-white/40">Used</div>
                <div className="mt-1 text-2xl font-bold text-yellow-300">{stats.used}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.95fr]">
        {/* LEFT */}
        <Card className="overflow-hidden rounded-3xl border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-violet-300">
                  Live Scanner
                </div>
                <div className="mt-1 text-lg font-semibold">
                  Scan ticket QR with camera
                </div>
              </div>

              {!scanning ? (
                <Button
                  onClick={startScanner}
                  className="rounded-2xl bg-violet-600 hover:bg-violet-500"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start camera
                </Button>
              ) : (
                <Button
                  onClick={stopScanner}
                  variant="destructive"
                  className="rounded-2xl"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  Stop camera
                </Button>
              )}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
              {!scanning ? (
                <div className="grid min-h-[320px] place-items-center p-8">
                  <div className="text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/25">
                      <ScanLine className="h-8 w-8 text-violet-300" />
                    </div>
                    <div className="mt-4 text-lg font-semibold">
                      Camera scanner is off
                    </div>
                    <p className="mt-2 max-w-md text-sm text-white/50">
                      Start the camera to scan a QR code in real time, or use the
                      manual field below.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div id="ticket-checkin-reader" className="min-h-[320px] w-full" />
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-violet-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.20)]" />
                    <div className="absolute left-1/2 top-1/2 h-[2px] w-[220px] -translate-x-1/2 -translate-y-1/2 bg-violet-300 shadow-[0_0_18px_rgba(167,139,250,0.9)] animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="mb-2 text-xs uppercase tracking-widest text-white/45">
                Manual fallback
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste or type ticket code"
                  className="h-12 rounded-2xl border-white/10 bg-white/5"
                />
                <Button
                  onClick={handleManualCheck}
                  disabled={!code.trim() || busy}
                  className="h-12 rounded-2xl bg-violet-600 px-6 hover:bg-violet-500"
                >
                  {busy ? "Checking..." : "Check ticket"}
                </Button>
              </div>
            </div>

            {result ? (
              <div
                className={[
                  "mt-6 rounded-3xl border p-5",
                  result.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "grid h-11 w-11 place-items-center rounded-2xl",
                      result.type === "success"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300",
                    ].join(" ")}
                  >
                    {result.type === "success" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                  </div>

                  <div>
                    <div className="text-lg font-semibold">{result.title}</div>
                    <p className="mt-1 text-sm text-white/75">{result.message}</p>
                    {result.code ? (
                      <div className="mt-2 font-mono text-xs text-white/45">
                        {result.code}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {loadErr ? (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {loadErr}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* RIGHT */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-violet-300">
                    Event Tickets
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    Select or search a ticket
                  </div>
                </div>

                <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                  <button
                    onClick={() => setTab("VALID")}
                    className={[
                      "h-9 rounded-full px-5 text-sm transition",
                      tab === "VALID"
                        ? "bg-violet-600 text-white"
                        : "text-white/70 hover:text-white",
                    ].join(" ")}
                  >
                    Valid
                  </button>
                  <button
                    onClick={() => setTab("USED")}
                    className={[
                      "h-9 rounded-full px-5 text-sm transition",
                      tab === "USED"
                        ? "bg-violet-600 text-white"
                        : "text-white/70 hover:text-white",
                    ].join(" ")}
                  >
                    Used
                  </button>
                </div>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by code, username or email..."
                  className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10"
                />
              </div>

              <div className="mt-5 space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="text-sm text-white/50">Loading tickets...</div>
                ) : filteredTickets.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
                    No tickets found.
                  </div>
                ) : (
                  filteredTickets.map((ticket) => {
                    const canCheck = ticket.status === "VALID";

                    return (
                      <div
                        key={ticket._id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-mono text-sm text-white/90">
                              {ticket.code}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge className={statusBadge(ticket.status)}>
                                {ticket.status}
                              </Badge>
                              {ticket.ticketType?.name ? (
                                <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-200">
                                  {ticket.ticketType.name}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          {canCheck ? (
                            <Button
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-500"
                              onClick={() => handleCheckIn(ticket.code)}
                              disabled={busy}
                            >
                              Check-In
                            </Button>
                          ) : (
                            <div className="text-xs text-white/45">
                              {ticket.checkedInAt ? formatTime(ticket.checkedInAt) : "Already used"}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-white/70">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-violet-300" />
                            <span>{ticket.buyer?.username || "Unknown user"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-violet-300" />
                            <span>{ticket.buyer?.email || "No email"}</span>
                          </div>
                          {ticket.checkedInAt ? (
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-violet-300" />
                              <span>Checked in at {formatDateTime(ticket.checkedInAt)}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}