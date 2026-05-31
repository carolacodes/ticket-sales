// src/pages/TicketCheckIn.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

import { checkInTicket, getEventTicketsForCheckIn } from "@/api/tickets.api";

function formatShortDate(iso) {
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

function formatTime(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeApiError(err) {
  const msg = err?.response?.data?.message || err?.message || "Ticket inválido";

  if (msg.includes("USED")) return "El ticket ya fue utilizado.";
  if (msg.includes("VOID")) return "El ticket fue anulado.";
  if (msg.toLowerCase().includes("not found")) return "Ticket no encontrado.";

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
    // ignore audio errors
  }
}

function vibrate(type = "success") {
  if (!navigator.vibrate) return;

  if (type === "success") {
    navigator.vibrate([80]);
  } else {
    navigator.vibrate([120, 60, 120]);
  }
}

function getBackCamera(devices = []) {
  const backCamera = devices.find((device) => {
    const label = String(device.label || "").toLowerCase();

    return (
      label.includes("back") ||
      label.includes("rear") ||
      label.includes("environment") ||
      label.includes("trasera") ||
      label.includes("posterior")
    );
  });

  return backCamera || devices[devices.length - 1] || devices[0];
}

function ticketStatusLabel(status) {
  const value = String(status || "").toUpperCase();

  if (value === "VALID") return "Válido";
  if (value === "USED") return "Usado";
  if (value === "VOID") return "Anulado";

  return value || "—";
}

function getTicketTypeName(ticket) {
  return ticket?.ticketType?.name || ticket?.ticketTypeName || "GENERAL";
}

function getBuyerName(ticket) {
  return ticket?.buyer?.username || ticket?.buyer?.name || "Sin nombre";
}

function getBuyerEmail(ticket) {
  return ticket?.buyer?.email || "Sin email";
}

function percent(value, total) {
  const safeValue = Number(value || 0);
  const safeTotal = Number(total || 0);

  if (!safeTotal) return 0;

  return Math.min(100, Math.round((safeValue / safeTotal) * 100));
}

export function TicketCheckIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const eventId = params.get("eventId");

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [eventData, setEventData] = useState(null);

  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");

  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);

  const [result, setResult] = useState(null);

  const [cameras, setCameras] = useState([]);
  const [cameraIndex, setCameraIndex] = useState(0);

  const scannerRef = useRef(null);
  const lockRef = useRef(false);
  const lastScanRef = useRef({ code: "", at: 0 });

  async function loadTickets() {
    if (!eventId) return;

    try {
      setLoading(true);
      setLoadErr("");

      const response = await getEventTicketsForCheckIn(eventId);

      setEventData(response?.data || null);
    } catch (err) {
      setLoadErr(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudieron cargar los tickets del evento."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        title: "Ticket validado correctamente",
        message: "El asistente ya puede ingresar al recinto.",
        code: cleanCode,
      });

      playBeep("success");
      vibrate("success");

      setCode(cleanCode);

      await loadTickets();
      setTab("USED");
    } catch (err) {
      const friendly = normalizeApiError(err);

      setResult({
        type: "error",
        title: "No se pudo validar el ticket",
        message: friendly,
        code: cleanCode,
      });

      playBeep("error");
      vibrate("error");

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

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {
      // ignore scanner stop errors
    } finally {
      scannerRef.current = null;
      setScanning(false);
      lockRef.current = false;
    }
  }

  async function initScanner() {
    try {
      const scanner = new Html5Qrcode("ticket-checkin-reader");
      scannerRef.current = scanner;

      let devices = cameras;

      if (!devices.length) {
        devices = await Html5Qrcode.getCameras();
        setCameras(devices);

        const backCamera = getBackCamera(devices);
        const backIndex = devices.findIndex(
          (device) => device.id === backCamera?.id
        );

        setCameraIndex(backIndex >= 0 ? backIndex : 0);
      }

      if (!devices || devices.length === 0) {
        throw new Error("No camera found");
      }

      const selectedCamera =
        devices[cameraIndex] || getBackCamera(devices) || devices[0];

      await scanner.start(
        selectedCamera.id,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          const scannedCode = String(decodedText || "").trim();

          if (!scannedCode) return;

          const now = Date.now();

          const sameAsLast =
            lastScanRef.current.code === scannedCode &&
            now - lastScanRef.current.at < 3000;

          if (lockRef.current || sameAsLast || busy) return;

          lockRef.current = true;
          lastScanRef.current = { code: scannedCode, at: now };

          setCode(scannedCode);

          await handleCheckIn(scannedCode);

          setTimeout(() => {
            lockRef.current = false;
          }, 1500);
        },
        () => {}
      );
    } catch (err) {
      console.error("SCANNER ERROR:", err);

      setScanning(false);
      setResult({
        type: "error",
        title: "Error de cámara",
        message:
          "No se pudo acceder a la cámara. Revisá permisos, HTTPS o el dispositivo.",
      });
    }
  }

  async function startScanner() {
    if (scanning) return;

    setResult(null);
    setScanning(true);

    setTimeout(() => {
      initScanner();
    }, 100);
  }

  async function switchCamera() {
    if (!cameras.length) return;

    const nextIndex = (cameraIndex + 1) % cameras.length;

    await stopScanner();

    setCameraIndex(nextIndex);

    setTimeout(() => {
      setScanning(true);

      setTimeout(() => {
        initScanner();
      }, 100);
    }, 100);
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

  const selectedCameraLabel =
    cameras[cameraIndex]?.label ||
    (scanning ? "Cámara activa" : "Cámara sin activar");

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets
      .filter((ticket) => {
        const status = String(ticket.status || "").toUpperCase();

        if (tab === "VALID") return status === "VALID";
        if (tab === "USED") return status === "USED";

        return true;
      })
      .filter((ticket) => {
        if (!query) return true;

        const searchable = [
          ticket.code,
          getBuyerName(ticket),
          getBuyerEmail(ticket),
          getTicketTypeName(ticket),
          ticket.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
  }, [tickets, tab, search]);

  if (!eventId) {
    return (
      <div className="ticketify-checkin bg-[#f3faff] text-[#001f29]">
        <CheckInStyles />

        <main className="tf-container flex min-h-[60vh] items-center justify-center px-4 py-10">
          <section className="w-full max-w-xl rounded-xl border border-[#e4bdbc] bg-white p-8 text-center shadow-[0px_4px_20px_rgba(23,86,118,0.08)]">
            <span className="material-symbols-outlined mb-4 text-6xl text-[#b20024]">
              error
            </span>

            <h1 className="text-[32px] font-bold leading-10 text-[#001f29]">
              Falta seleccionar un evento
            </h1>

            <p className="mt-2 text-[16px] leading-6 text-[#5b403f]">
              Entrá al check-in desde el dashboard o desde la página de tus eventos.
            </p>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-6 rounded-lg bg-[#b20024] px-6 py-3 text-[14px] font-semibold tracking-[0.05em] text-white hover:bg-[#d62839]"
            >
              Volver al dashboard
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="ticketify-checkin bg-[#f3faff] text-[#001f29]">
      <CheckInStyles />

      <main className="tf-container flex-grow px-4 py-8">
        <section className="flex flex-col justify-between gap-6 py-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-[32px] font-bold leading-10 tracking-tight text-[#b20024]">
              Check-in de tickets
            </h1>

            <p className="mt-1 text-[16px] leading-6 text-[#5b403f]">
              Escaneá, validá y gestioná los tickets del evento de forma rápida y segura.
            </p>
          </div>

          <article className="flex items-center gap-4 rounded-xl border border-[#e4bdbc]/60 bg-[#d8f2ff] p-4 shadow-sm">
            <div className="rounded-lg bg-[#b20024] p-3 text-white">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                confirmation_number
              </span>
            </div>

            <div>
              <h2 className="mb-1 text-[24px] font-bold leading-8 text-[#001f29]">
                {event?.title || "Evento"}
              </h2>

              <div className="flex flex-wrap gap-4 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    calendar_today
                  </span>
                  {formatShortDate(event?.startAt)}
                </span>

                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    location_on
                  </span>
                  {event?.venue || "Lugar a confirmar"}
                </span>
              </div>
            </div>
          </article>
        </section>

        {loadErr ? (
          <section className="mb-6 rounded-xl border border-[#ffdad6] bg-[#ffdad6] p-4 text-[#93000a]">
            {loadErr}
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-6 py-8 md:grid-cols-3">
          <KpiCard
            label="Total de tickets"
            value={stats.total}
            color="#215d7d"
            progress={100}
          />

          <KpiCard
            label="Válidos"
            value={stats.valid}
            color="#215d7d"
            progress={percent(stats.valid, stats.total)}
          />

          <KpiCard
            label="Usados"
            value={stats.used}
            color="#b20024"
            progress={percent(stats.used, stats.total)}
          />
        </section>

        <section className="mb-20 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="flex flex-col items-center rounded-xl border border-[#e4bdbc] bg-white p-6 shadow-[0px_4px_20px_rgba(23,86,118,0.08)] md:p-8">
            <div className="mb-6 flex w-full items-center justify-between">
              <div>
                <h2 className="text-[24px] font-bold leading-8 text-[#001f29]">
                  Escanear QR
                </h2>

                <p className="mt-1 text-xs text-[#5b403f]">
                  {selectedCameraLabel}
                </p>
              </div>

              <span className="material-symbols-outlined text-[#b20024]">
                qr_code_scanner
              </span>
            </div>

            <div className="relative aspect-square w-full max-w-[400px] overflow-hidden rounded-xl bg-[#001f29]">
              {result ? (
                <div
                  className={[
                    "absolute left-4 right-4 top-4 z-30 rounded-xl border px-4 py-3 text-center text-sm font-bold shadow-xl",
                    result.type === "success"
                      ? "border-green-200 bg-green-100 text-green-800"
                      : "border-[#ffdad6] bg-[#ffdad6] text-[#93000a]",
                  ].join(" ")}
                >
                  {result.type === "success"
                    ? "Ticket validado correctamente"
                    : "No se pudo validar el ticket"}
                </div>
              ) : null}

              {!scanning ? (
                <>
                  <img
                    alt="Camera preview"
                    className="h-full w-full object-cover opacity-60 grayscale transition-all duration-700"
                    src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80"
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <span className="material-symbols-outlined text-4xl">
                          photo_camera
                        </span>
                      </div>

                      <p className="mt-4 max-w-xs text-sm text-white/80">
                        Activá la cámara para escanear el código QR del asistente.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div id="ticket-checkin-reader" className="h-full min-h-[320px] w-full" />

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-2/3 w-2/3 overflow-hidden rounded-2xl border-2 border-white/50">
                      <div className="scanner-line absolute left-0 h-1 w-full bg-[#d62839] shadow-[0_0_15px_rgba(214,40,57,1)]" />

                      <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-[#d62839]" />
                      <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-[#d62839]" />
                      <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-[#d62839]" />
                      <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-[#d62839]" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <p className="mt-6 text-center text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
              Apuntá la cámara al código QR del asistente para una validación instantánea.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {!scanning ? (
                <button
                  type="button"
                  onClick={startScanner}
                  className="rounded-lg bg-[#b20024] px-5 py-3 text-[14px] font-semibold tracking-[0.05em] text-white hover:bg-[#d62839]"
                >
                  Activar cámara
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScanner}
                  className="rounded-lg bg-[#ba1a1a] px-5 py-3 text-[14px] font-semibold tracking-[0.05em] text-white hover:bg-[#93000a]"
                >
                  Detener cámara
                </button>
              )}

              {scanning && cameras.length > 1 ? (
                <button
                  type="button"
                  onClick={switchCamera}
                  className="rounded-lg border border-[#215d7d] px-5 py-3 text-[14px] font-semibold tracking-[0.05em] text-[#215d7d] hover:bg-[#e5f6ff]"
                >
                  Cambiar cámara
                </button>
              ) : null}
            </div>
          </article>

          <article className="rounded-xl border border-[#e4bdbc] bg-white p-6 shadow-[0px_4px_20px_rgba(23,86,118,0.08)] md:p-8">
            <div className="mb-6 flex w-full items-center justify-between">
              <h2 className="text-[24px] font-bold leading-8 text-[#001f29]">
                Validación manual
              </h2>

              <span className="material-symbols-outlined text-[#215d7d]">
                keyboard
              </span>
            </div>

            <div className="flex h-full flex-col gap-6">
              <div className="flex-grow">
                <label
                  className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#001f29]"
                  htmlFor="ticket-code"
                >
                  Código del ticket
                </label>

                <input
                  id="ticket-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#b20024] focus:ring-2 focus:ring-[#b20024]/20"
                  placeholder="Ej: RF24-9988-XY"
                  type="text"
                />

                <p className="mt-2 text-[12px] italic text-[#5b403f]">
                  Tip: Hacé clic en una fila de la lista inferior para cargar el código automáticamente.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={!code.trim() || busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b20024] py-4 text-[24px] font-bold leading-8 text-white transition-all hover:bg-[#d62839] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Validando..." : "Validar ticket"}
                  <span className="material-symbols-outlined">check_circle</span>
                </button>

                <div
                  className={[
                    "flex min-h-[120px] items-center justify-center rounded-xl border-2 border-dashed p-4 text-center",
                    result?.type === "success"
                      ? "border-green-200 bg-green-100 text-green-800"
                      : result?.type === "error"
                        ? "border-[#ffdad6] bg-[#ffdad6] text-[#93000a]"
                        : "border-[#e4bdbc] bg-[#e5f6ff] text-[#5b403f]",
                  ].join(" ")}
                >
                  {result ? (
                    <div>
                      <p className="font-bold">{result.title}</p>
                      <p className="mt-1 text-sm">{result.message}</p>
                      {result.code ? (
                        <p className="mt-2 font-mono text-xs opacity-80">
                          {result.code}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p>Esperando código para validar...</p>
                  )}
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#e4bdbc] bg-white shadow-[0px_4px_20px_rgba(23,86,118,0.08)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#e4bdbc] p-6 md:flex-row md:items-center">
            <div className="relative max-w-md flex-grow">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5b403f]">
                search
              </span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-full rounded-full border border-[#e4bdbc] bg-[#f3faff] pl-10 pr-4 text-[16px] text-[#001f29] outline-none focus:border-[#b20024] focus:ring-2 focus:ring-[#b20024]/20"
                placeholder="Buscar por nombre, código o email"
                type="text"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#e5f6ff] text-[14px] font-semibold uppercase leading-5 tracking-wider text-[#5b403f]">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e4bdbc]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#5b403f]">
                      Cargando tickets...
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#5b403f]">
                      No se encontraron tickets.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const canCheck = ticket.status === "VALID";

                    return (
                      <tr
                        key={ticket._id || ticket.id || ticket.code}
                        onClick={() => {
                          setCode(ticket.code || "");
                          document.getElementById("ticket-code")?.focus();
                        }}
                        className="cursor-pointer transition-colors hover:bg-[#e5f6ff]"
                      >
                        <td className="px-6 py-4 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#001f29]">
                          {ticket.code}
                        </td>

                        <td className="px-6 py-4 text-[24px] font-bold leading-8 text-[#001f29]">
                          {getBuyerName(ticket)}
                        </td>

                        <td className="px-6 py-4 text-[#5b403f]">
                          {getBuyerEmail(ticket)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-[#c7e7ff] px-3 py-1 text-[12px] font-bold uppercase text-[#001e2e]">
                            {getTicketTypeName(ticket)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={[
                              "flex items-center gap-1 text-[14px]",
                              ticket.status === "VALID"
                                ? "text-[#001f29]"
                                : "text-[#5b403f]",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "h-2 w-2 rounded-full",
                                ticket.status === "VALID"
                                  ? "bg-green-500"
                                  : "bg-[#b20024]",
                              ].join(" ")}
                            />
                            {ticketStatusLabel(ticket.status)}
                          </span>

                          {ticket.checkedInAt ? (
                            <span className="mt-1 block text-xs text-[#906f6e]">
                              {formatTime(ticket.checkedInAt)}
                            </span>
                          ) : null}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {canCheck ? (
                            <button
                              type="button"
                              onClick={(eventClick) => {
                                eventClick.stopPropagation();
                                handleCheckIn(ticket.code);
                              }}
                              disabled={busy}
                              className="rounded-lg bg-[#d62839] px-4 py-1.5 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                              Check-in
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="rounded-lg bg-[#e4bdbc] px-4 py-1.5 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]/50"
                            >
                              Ingresado
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function CheckInStyles() {
  return (
    <style>{`
      .scanner-line {
        animation: scan 2s infinite ease-in-out;
      }

      @keyframes scan {
        0%, 100% {
          top: 0;
        }
        50% {
          top: 100%;
        }
      }

      #ticket-checkin-reader video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }

      #ticket-checkin-reader {
        overflow: hidden;
      }
    `}</style>
  );
}

function KpiCard({ label, value, color, progress }) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-[#e4bdbc] bg-white p-6 shadow-[0px_4px_20px_rgba(23,86,118,0.08)]">
      <span className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
        {label}
      </span>

      <span
        className="text-[48px] font-extrabold leading-[56px]"
        style={{ color }}
      >
        {Number(value || 0).toLocaleString("es-AR")}
      </span>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#d8f2ff]">
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </article>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] transition-colors",
        active
          ? "bg-[#b20024] text-white"
          : "border border-[#e4bdbc] bg-[#f3faff] text-[#5b403f] hover:bg-[#e5f6ff]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}