// src/pages/ForgotPassword.jsx

import { useState } from "react";
import { Link } from "react-router-dom";

import { forgotPasswordRequest } from "@/api/auth.api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setErr("");

      await forgotPasswordRequest(email.trim().toLowerCase());

      setDone(true);
    } catch (error) {
      setErr(
        error?.response?.data?.message ||
          "No se pudo enviar el email de recuperación."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ticketify-forgot-password bg-[#f3faff] text-[#001f29]">
      <ForgotPasswordStyles />

      <main className="tf-container flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-16">
        <section className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#baeaff] bg-white shadow-[0px_4px_20px_rgba(23,86,118,0.08)]">
          <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#d8f2ff] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-[#ffdad8] blur-3xl" />

          <div className="relative p-8 md:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#e5f6ff] text-[#b20024]">
                <span className="material-symbols-outlined text-4xl">
                  mail
                </span>
              </div>

              <p className="mb-2 text-[14px] font-semibold uppercase leading-5 tracking-[0.12em] text-[#b20024]">
                Recuperación de cuenta
              </p>

              <h1 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29]">
                Restablecer contraseña
              </h1>

              <p className="mt-3 max-w-md text-[16px] leading-6 text-[#5b403f]">
                Ingresá tu correo electrónico y te enviaremos un link seguro
                para crear una nueva contraseña.
              </p>
            </div>

            {done ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-green-200 bg-green-100 p-4 text-green-800">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-green-700">
                      check_circle
                    </span>

                    <div>
                      <p className="font-bold">Email enviado</p>

                      <p className="mt-1 text-sm leading-6">
                        Si existe una cuenta asociada a {email}, vas a recibir
                        un enlace para restablecer tu contraseña.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#baeaff] bg-[#e5f6ff] p-4 text-sm leading-6 text-[#5b403f]">
                  Revisá tu bandeja de entrada y la carpeta de spam. El enlace
                  puede expirar por seguridad.
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDone(false);
                      setEmail("");
                      setErr("");
                    }}
                    className="h-12 rounded-lg bg-[#b20024] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#d62839] active:scale-[0.98]"
                  >
                    Enviar de nuevo
                  </button>

                  <Link
                    to="/login"
                    className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#e4bdbc] bg-white px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all hover:bg-[#e5f6ff] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-lg">
                      arrow_back
                    </span>
                    Volver al login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]"
                  >
                    Correo electrónico
                  </label>

                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#215d7d]">
                      alternate_email
                    </span>

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] pl-12 pr-4 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d] focus:ring-2 focus:ring-[#215d7d]/20"
                      placeholder="ejemplo@correo.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                {err ? (
                  <div className="rounded-xl border border-[#ffdad6] bg-[#ffdad6] px-4 py-3 text-sm font-semibold leading-6 text-[#93000a]">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined mt-0.5 text-base">
                        warning
                      </span>

                      <span>{err}</span>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#b20024] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white shadow-sm transition-all hover:bg-[#d62839] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Enviando..." : "Enviar link de recuperación"}
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </button>

                <Link
                  to="/login"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#e4bdbc] bg-white px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all hover:bg-[#e5f6ff] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-lg">
                    arrow_back
                  </span>
                  Volver al login
                </Link>

                <p className="pt-2 text-center text-[14px] leading-5 text-[#5b403f]">
                  ¿No tenés cuenta?{" "}
                  <Link
                    to="/register"
                    className="font-bold text-[#b20024] hover:underline"
                  >
                    Crear cuenta
                  </Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ForgotPasswordStyles() {
  return (
    <style>{`
      .ticketify-forgot-password {
        min-height: 100%;
      }
    `}</style>
  );
}