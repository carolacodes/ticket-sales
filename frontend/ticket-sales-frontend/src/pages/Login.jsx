import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth.js";
import { googleOAuthUrl } from "@/api/auth.api";

function GoogleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.677 32.66 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.045 6.053 29.263 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.045 6.053 29.263 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.163 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.247 35.091 26.715 36 24 36c-5.202 0-9.646-3.318-11.287-7.946l-6.52 5.02C9.503 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
      />
    </svg>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { login, isAuth, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !submitting;
  }, [email, password, submitting]);

  useEffect(() => {
    if (!loading && isAuth) {
      navigate("/start", { replace: true });
    }
  }, [loading, isAuth, navigate]);

  function onGoogleLogin() {
    window.location.href = googleOAuthUrl();
  }

  async function onSubmit(event) {
    event.preventDefault();
    setErr("");

    try {
      setSubmitting(true);

      await login({
        email: email.trim(),
        password,
      });

      navigate("/start");
    } catch (error) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.message ||
        (status === 401
          ? "Email o contraseña incorrectos."
          : "No se pudo iniciar sesión.");

      setErr(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ticketify-login overflow-x-hidden bg-[#f3faff] text-[#001f29]">
      <style>{`
        .bg-pattern {
          background-color: #f3faff;
          background-image: radial-gradient(#cce6f4 1.5px, transparent 1.5px);
          background-size: 32px 32px;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes floatReverse {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(20px) rotate(-3deg);
          }
        }

        @keyframes pulseSoft {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.45;
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .floating {
          animation: float 8s ease-in-out infinite;
        }

        .floating-reverse {
          animation: floatReverse 10s ease-in-out infinite;
        }

        .pulse-soft {
          animation: pulseSoft 12s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .fade-in-up,
          .floating,
          .floating-reverse,
          .pulse-soft {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        .input-group:focus-within label {
          color: #215d7d;
          transform: translateX(2px);
        }

        .login-card-shadow {
          box-shadow: 0px 4px 20px rgba(23, 86, 118, 0.08);
        }
      `}</style>

      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-20">
        <div className="bg-pattern pointer-events-none absolute inset-0 z-0">
          <div className="pulse-soft absolute left-[5%] top-[10%] h-64 w-64 rounded-full bg-[#d8f2ff] blur-3xl" />

          <div
            className="pulse-soft absolute bottom-[10%] right-[5%] h-96 w-96 rounded-full bg-[#c7e7ff] blur-3xl"
            style={{ animationDelay: "-3s" }}
          />

          <div className="floating absolute right-[15%] top-20 hidden opacity-10 lg:block">
            <span className="material-symbols-outlined text-[120px] text-[#215d7d]">
              confirmation_number
            </span>
          </div>

          <div
            className="floating-reverse absolute bottom-20 left-[10%] opacity-10"
            style={{ animationDelay: "-2s" }}
          >
            <span className="material-symbols-outlined text-[80px] text-[#b20024]">
              local_activity
            </span>
          </div>

          <div
            className="floating absolute left-[5%] top-1/2 opacity-5"
            style={{ animationDelay: "-4s" }}
          >
            <span className="material-symbols-outlined text-[160px] text-[#3e7697]">
              stadium
            </span>
          </div>
        </div>

        <div className="fade-in-up login-card-shadow z-10 w-full max-w-[480px] rounded-xl border border-[#d8f2ff] bg-white p-4 sm:p-6">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-[32px] font-bold leading-10 text-[#001f29]">
                Iniciar sesión
              </h1>

              <p className="text-[16px] leading-6 text-[#5b403f]">
                Accedé a tus entradas, favoritos y compras.
              </p>
            </div>

            {err ? (
              <div className="rounded-lg border border-[#ffdad6] bg-[#ffdad6] px-4 py-3 text-sm font-semibold text-[#93000a]">
                {err}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={submitting}
              className="group flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#e4bdbc] text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#001f29] transition-all duration-300 hover:bg-[#e5f6ff] active:scale-[0.98] disabled:opacity-60"
            >
              <GoogleIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <span>Continuar con Google</span>
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-grow bg-[#e4bdbc]" />

              <span className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#906f6e]">
                o con tu email
              </span>

              <div className="h-px flex-grow bg-[#e4bdbc]" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="input-group space-y-1">
                <label
                  htmlFor="email"
                  className="block px-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all duration-300"
                >
                  Email
                </label>

                <input
                  id="email"
                  className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-white px-4 text-[16px] leading-6 text-[#001f29] outline-none transition-all placeholder:text-[#5b403f]/60 focus:border-[#215d7d] focus:ring-2 focus:ring-[#215d7d]/20"
                  placeholder="ejemplo@correo.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="input-group relative space-y-1">
                <div className="flex items-center justify-between px-1">
                  <label
                    htmlFor="password"
                    className="block text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all duration-300"
                  >
                    Contraseña
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#215d7d] transition-colors hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-white px-4 pr-12 text-[16px] leading-6 text-[#001f29] outline-none transition-all placeholder:text-[#5b403f]/60 focus:border-[#215d7d] focus:ring-2 focus:ring-[#215d7d]/20"
                    placeholder="Tu contraseña"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[#5b403f] transition-colors hover:text-[#001f29]"
                    aria-label={
                      showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    <span className="material-symbols-outlined transition-transform duration-200 active:scale-90">
                      {showPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-4 h-12 w-full rounded-lg bg-[#d62839] text-[14px] font-semibold leading-5 tracking-[0.05em] text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="border-t border-[#e4bdbc] pt-6 text-center">
              <p className="text-[16px] leading-6 text-[#5b403f]">
                ¿No tenés cuenta?
                <Link
                  to="/register"
                  className="ml-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#b20024] transition-colors hover:underline"
                >
                  Crear cuenta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}