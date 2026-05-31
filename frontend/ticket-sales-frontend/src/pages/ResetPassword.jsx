// src/pages/ResetPassword.jsx

import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { resetPasswordRequest } from "@/api/auth.api";

export function ResetPassword() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const passwordsMatch = password === confirmPassword;

  const canSubmit =
    token.trim() &&
    password.trim() &&
    confirmPassword.trim() &&
    passwordsMatch;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setErr("Falta el token de recuperación.");
      return;
    }

    if (!passwordsMatch) {
      setErr("Las contraseñas no coinciden.");
      return;
    }

    try {
      setSubmitting(true);
      setErr("");

      await resetPasswordRequest({
        token,
        password,
      });

      setDone(true);

      setTimeout(() => {
        nav("/login");
      }, 1800);
    } catch (error) {
      setErr(
        error?.response?.data?.message ||
          "No se pudo restablecer la contraseña. El enlace puede ser inválido o haber expirado."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ticketify-reset-password bg-[#f3faff] text-[#001f29]">
      <ResetPasswordStyles />

      <main className="tf-container flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-16">
        <section className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#baeaff] bg-white shadow-[0px_4px_20px_rgba(23,86,118,0.08)]">
          <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#d8f2ff] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-[#ffdad8] blur-3xl" />

          <div className="relative p-8 md:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#e5f6ff] text-[#b20024]">
                <span className="material-symbols-outlined text-4xl">
                  key
                </span>
              </div>

              <p className="mb-2 text-[14px] font-semibold uppercase leading-5 tracking-[0.12em] text-[#b20024]">
                Seguridad de cuenta
              </p>

              <h1 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29]">
                Crear nueva contraseña
              </h1>

              <p className="mt-3 max-w-md text-[16px] leading-6 text-[#5b403f]">
                Elegí una contraseña segura para volver a acceder a tu cuenta de
                Ticketify.
              </p>
            </div>

            {!token ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-[#ffdad6] bg-[#ffdad6] p-4 text-[#93000a]">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5">
                      warning
                    </span>

                    <div>
                      <p className="font-bold">Enlace inválido</p>

                      <p className="mt-1 text-sm leading-6">
                        Este enlace de recuperación no tiene el token necesario.
                        Solicitá un nuevo link para restablecer tu contraseña.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/forgot-password"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#b20024] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#d62839] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-lg">
                    arrow_back
                  </span>
                  Solicitar nuevo enlace
                </Link>

                <Link
                  to="/login"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#e4bdbc] bg-white px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all hover:bg-[#e5f6ff] active:scale-[0.98]"
                >
                  Volver al login
                </Link>
              </div>
            ) : done ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-green-200 bg-green-100 p-4 text-green-800">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-green-700">
                      check_circle
                    </span>

                    <div>
                      <p className="font-bold">
                        Contraseña actualizada correctamente
                      </p>

                      <p className="mt-1 text-sm leading-6">
                        Tu contraseña fue restablecida. Te estamos redirigiendo
                        al login...
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-[#b20024] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#d62839] active:scale-[0.98]"
                >
                  Ir al login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]"
                  >
                    Nueva contraseña
                  </label>

                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#215d7d]">
                      lock
                    </span>

                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] pl-12 pr-12 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d] focus:ring-2 focus:ring-[#215d7d]/20"
                      placeholder="Ingresá tu nueva contraseña"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPass((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5b403f] transition-colors hover:text-[#b20024]"
                      aria-label={
                        showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                      }
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPass ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]"
                  >
                    Confirmar contraseña
                  </label>

                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#215d7d]">
                      lock_reset
                    </span>

                    <input
                      id="confirmPassword"
                      type={showConfirmPass ? "text" : "password"}
                      autoComplete="new-password"
                      className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] pl-12 pr-12 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#215d7d] focus:ring-2 focus:ring-[#215d7d]/20"
                      placeholder="Repetí tu nueva contraseña"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPass((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5b403f] transition-colors hover:text-[#b20024]"
                      aria-label={
                        showConfirmPass
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showConfirmPass ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {confirmPassword && !passwordsMatch ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-100 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
                    Las contraseñas no coinciden.
                  </div>
                ) : null}

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
                  disabled={submitting || !canSubmit}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#b20024] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white shadow-sm transition-all hover:bg-[#d62839] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Actualizando..." : "Restablecer contraseña"}
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
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ResetPasswordStyles() {
  return (
    <style>{`
      .ticketify-reset-password {
        min-height: 100%;
      }
    `}</style>
  );
}