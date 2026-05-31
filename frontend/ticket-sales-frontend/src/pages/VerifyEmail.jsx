// src/pages/VerifyEmail.jsx

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { verifyEmailRequest, resendVerificationRequest } from "@/api/auth.api";

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const initialMode = useMemo(() => (token ? "loading" : "guide"), [token]);

  const [status, setStatus] = useState(initialMode);
  const [message, setMessage] = useState(
    token
      ? "Verificando tu email..."
      : "Abrí el email de verificación que te enviamos y hacé click en el enlace para activar tu cuenta."
  );

  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!token) {
        setStatus("guide");
        setMessage(
          "Abrí el email de verificación que te enviamos y hacé click en el enlace para activar tu cuenta."
        );
        return;
      }

      try {
        setStatus("loading");
        setMessage("Estamos verificando tu email...");

        await verifyEmailRequest(token);

        if (!alive) return;

        setStatus("success");
        setMessage("Tu email fue verificado correctamente.");
      } catch (error) {
        if (!alive) return;

        setStatus("error");
        setMessage(
          error?.response?.data?.message ||
            "El enlace de verificación es inválido o expiró."
        );
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [token]);

  async function resend() {
    try {
      setResending(true);

      await resendVerificationRequest(email.trim().toLowerCase());

      setMessage(
        "Si existe una cuenta asociada a ese email, enviamos un nuevo enlace de verificación."
      );
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          "No se pudo reenviar el email de verificación."
      );
    } finally {
      setResending(false);
    }
  }

  const title =
    status === "loading"
      ? "Verificando email"
      : status === "success"
        ? "Email verificado"
        : status === "error"
          ? "No pudimos verificar tu email"
          : "Verificá tu email";

  const subtitle =
    status === "success"
      ? "Tu cuenta ya está lista para usar Ticketify."
      : status === "error"
        ? "Podés solicitar un nuevo enlace de verificación."
        : status === "loading"
          ? "Esto puede tardar unos segundos."
          : "Necesitamos confirmar tu correo para proteger tu cuenta.";

  const icon =
    status === "success"
      ? "check_circle"
      : status === "error"
        ? "warning"
        : status === "loading"
          ? "sync"
          : "mark_email_unread";

  const iconClass =
    status === "success"
      ? "text-green-700"
      : status === "error"
        ? "text-[#93000a]"
        : "text-[#b20024]";

  const boxClass =
    status === "success"
      ? "border-green-200 bg-green-100 text-green-800"
      : status === "error"
        ? "border-[#ffdad6] bg-[#ffdad6] text-[#93000a]"
        : "border-[#baeaff] bg-[#e5f6ff] text-[#5b403f]";

  const showResendBox = status === "guide" || status === "error";

  return (
    <div className="ticketify-verify-email bg-[#f3faff] text-[#001f29]">
      <VerifyEmailStyles />

      <main className="tf-container flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-16">
        <section className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#baeaff] bg-white shadow-[0px_4px_20px_rgba(23,86,118,0.08)]">
          <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#d8f2ff] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-[#ffdad8] blur-3xl" />

          <div className="relative p-8 md:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div
                className={[
                  "mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#e5f6ff]",
                  iconClass,
                ].join(" ")}
              >
                <span
                  className={[
                    "material-symbols-outlined text-4xl",
                    status === "loading" ? "animate-spin" : "",
                  ].join(" ")}
                >
                  {icon}
                </span>
              </div>

              <p className="mb-2 text-[14px] font-semibold uppercase leading-5 tracking-[0.12em] text-[#b20024]">
                Verificación de cuenta
              </p>

              <h1 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29]">
                {title}
              </h1>

              <p className="mt-3 max-w-md text-[16px] leading-6 text-[#5b403f]">
                {subtitle}
              </p>
            </div>

            <div
              className={[
                "mb-6 rounded-xl border p-4 text-sm font-semibold leading-6",
                boxClass,
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-xl">
                  {status === "success"
                    ? "check_circle"
                    : status === "error"
                      ? "warning"
                      : "info"}
                </span>

                <p>{message || "Por favor esperá..."}</p>
              </div>
            </div>

            {status === "guide" ? (
              <div className="mb-6 rounded-xl border border-[#baeaff] bg-[#f3faff] p-5">
                <p className="mb-3 text-[14px] font-bold uppercase leading-5 tracking-[0.08em] text-[#001f29]">
                  Cómo verificar tu cuenta
                </p>

                <ul className="space-y-3 text-[15px] leading-6 text-[#5b403f]">
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[#215d7d]">
                      inbox
                    </span>
                    Revisá tu bandeja de entrada y la carpeta de spam.
                  </li>

                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[#215d7d]">
                      mail
                    </span>
                    Abrí el email de verificación enviado por Ticketify.
                  </li>

                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[#215d7d]">
                      link
                    </span>
                    Hacé click en el enlace para activar tu cuenta.
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      "https://mail.google.com/",
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#e4bdbc] bg-white px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all hover:bg-[#e5f6ff] active:scale-[0.98]"
                >
                  Abrir Gmail
                  <span className="material-symbols-outlined text-lg">
                    open_in_new
                  </span>
                </button>
              </div>
            ) : null}

            {showResendBox ? (
              <div className="space-y-4 rounded-xl border border-[#baeaff] bg-[#e5f6ff] p-5">
                <div>
                  <p className="text-[14px] font-bold uppercase leading-5 tracking-[0.08em] text-[#001f29]">
                    Reenviar verificación
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#5b403f]">
                    Escribí tu email y te enviaremos un nuevo enlace.
                  </p>
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#215d7d]">
                    alternate_email
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-white pl-12 pr-4 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d] focus:ring-2 focus:ring-[#215d7d]/20"
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                <button
                  type="button"
                  onClick={resend}
                  disabled={!email.trim() || resending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#b20024] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#d62839] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resending ? "Enviando..." : "Reenviar email"}
                  <span className="material-symbols-outlined text-lg">
                    send
                  </span>
                </button>

                <p className="text-xs leading-5 text-[#5b403f]">
                  Tip: esperá entre 30 y 60 segundos antes de volver a revisar tu bandeja.
                </p>
              </div>
            ) : null}

            {status === "success" ? (
              <div className="grid gap-3">
                <Link
                  to="/login"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#b20024] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#d62839] active:scale-[0.98]"
                >
                  Ir al login
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/start"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#e4bdbc] bg-white px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all hover:bg-[#e5f6ff] active:scale-[0.98]"
                >
                  Volver al inicio
                </Link>
              </div>
            ) : null}

            {status !== "success" ? (
              <div className="mt-5 grid gap-3">
                <Link
                  to="/login"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#e4bdbc] bg-white px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all hover:bg-[#e5f6ff] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-lg">
                    arrow_back
                  </span>
                  Volver al login
                </Link>

                <Link
                  to="/start"
                  className="text-center text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#b20024] hover:underline"
                >
                  Volver al inicio
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

function VerifyEmailStyles() {
  return (
    <style>{`
      .ticketify-verify-email {
        min-height: 100%;
      }
    `}</style>
  );
}