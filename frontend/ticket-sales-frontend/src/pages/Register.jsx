import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { registerRequest, googleOAuthUrl } from "@/api/auth.api";
import { useAuth } from "@/hooks/useAuth.js";

function roleFromQuery(q) {
  const role = String(q || "").toUpperCase();
  return role === "ORGANIZER" ? "ORGANIZER" : "BUYER";
}

function GoogleIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuth, loading: authLoading } = useAuth();

  const roleQuery = searchParams.get("role");
  const initialRole = useMemo(() => roleFromQuery(roleQuery), [roleQuery]);

  const [role, setRole] = useState(initialRole);

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    userName.trim().length >= 2 &&
    email.trim().length >= 6 &&
    password.length >= 6 &&
    confirm.length >= 6 &&
    password === confirm &&
    !loading;

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  useEffect(() => {
    if (!authLoading && isAuth) {
      navigate("/start", { replace: true });
    }
  }, [authLoading, isAuth, navigate]);

  function updateRole(nextRole) {
    setRole(nextRole);

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("role", nextRole);
        return next;
      },
      { replace: true }
    );
  }

  function onGoogleRegister() {
    const url = new URL(googleOAuthUrl());
    url.searchParams.set("role", role);
    window.location.href = url.toString();
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");

    if (!canSubmit) {
      setError(
        "Revisá los campos. Las contraseñas deben coincidir y tener mínimo 6 caracteres."
      );
      return;
    }

    try {
      setLoading(true);

      await registerRequest({
        username: userName.trim(),
        email: email.trim(),
        password,
        role,
      });

      navigate("/login", {
        state: {
          justRegistered: true,
          email,
        },
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo crear la cuenta.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ticketify-register bg-[#f3faff] text-[#001f29]">
      <style>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bg-blob {
          position: absolute;
          width: 600px;
          height: 600px;
          filter: blur(80px);
          opacity: 0.15;
          z-index: 0;
          border-radius: 50%;
          pointer-events: none;
        }

        .blob-1 {
          background-color: #b20024;
          top: -200px;
          left: -200px;
          animation: float 20s ease-in-out infinite;
        }

        .blob-2 {
          background-color: #215d7d;
          bottom: -200px;
          right: -200px;
          animation: float 25s ease-in-out infinite reverse;
        }

        .animate-fade-up {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up,
          .bg-blob {
            animation: none !important;
            transform: none !important;
            transition: none !important;
          }
        }

        .register-card-shadow {
          box-shadow: 0px 4px 20px rgba(23, 86, 118, 0.08);
        }
      `}</style>

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-20">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />

        <div className="animate-fade-up register-card-shadow relative z-10 w-full max-w-2xl rounded-xl border border-[#d8f2ff] bg-white p-4 md:p-6">
          <div className="mb-10 pt-2 text-center">
            <h1 className="mb-2 text-[32px] font-bold leading-10 text-[#001f29]">
              Crear cuenta
            </h1>

            <p className="text-[16px] leading-6 text-[#5b403f]">
              Registrate para comprar entradas o vender tus eventos.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <RoleCard
                active={role === "BUYER"}
                icon="shopping_cart"
                title="Comprador"
                items={[
                  "Comprar entradas",
                  "Guardar favoritos",
                  "Ver mis tickets",
                ]}
                onClick={() => updateRole("BUYER")}
              />

              <RoleCard
                active={role === "ORGANIZER"}
                icon="storefront"
                title="Vendedor"
                items={[
                  "Publicar eventos",
                  "Vender tickets",
                  "Gestionar ventas",
                ]}
                onClick={() => updateRole("ORGANIZER")}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField
                label="Nombre completo"
                placeholder="Ej. Juan Pérez"
                value={userName}
                onChange={setUserName}
                autoComplete="name"
              />

              <InputField
                label="Correo electrónico"
                placeholder="juan@ejemplo.com"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
            </div>

            <InputField
              label="Teléfono"
              placeholder="+54 11 1234-5678"
              type="tel"
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField
                label="Contraseña"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />

              <InputField
                label="Confirmar contraseña"
                placeholder="••••••••"
                type="password"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-[#ffdad6] bg-[#ffdad6] px-4 py-3 text-sm font-semibold text-[#93000a]">
                {error}
              </div>
            ) : null}

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className="h-12 w-full rounded-lg bg-[#d62839] text-[14px] font-semibold leading-5 tracking-[0.05em] text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b20024] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[#e4bdbc]" />

                <span className="mx-4 flex-shrink text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
                  o continuar con
                </span>

                <div className="flex-grow border-t border-[#e4bdbc]" />
              </div>

              <button
                type="button"
                onClick={onGoogleRegister}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#e4bdbc] bg-[#e5f6ff] text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#001f29] transition-all duration-300 hover:border-[#d62839]/30 hover:bg-[#c9eeff] active:scale-[0.98] disabled:opacity-60"
              >
                <GoogleIcon className="h-5 w-5" />
                Registrarse con Google
              </button>
            </div>

            <div className="pt-4 text-center">
              <p className="text-[16px] leading-6 text-[#5b403f]">
                ¿Ya tenés cuenta?
                <Link
                  to="/login"
                  className="ml-1 font-bold text-[#b20024] transition-all hover:underline"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function RoleCard({ active, icon, title, items, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-full rounded-xl border p-4 text-left transition-all duration-300 hover:scale-[1.02]",
        active
          ? "border-[#d62839] bg-[#fff2f1] shadow-md"
          : "border-[#e4bdbc] bg-[#e5f6ff] hover:bg-[#c9eeff]",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="material-symbols-outlined text-[#b20024]">
          {icon}
        </span>

        <span
          className={[
            "material-symbols-outlined text-[#b20024] transition-opacity duration-300",
            active ? "opacity-100" : "opacity-0",
          ].join(" ")}
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          check_circle
        </span>
      </div>

      <p className="mb-2 text-[24px] font-bold leading-8 text-[#001f29]">
        {title}
      </p>

      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]"
          >
            <span className="material-symbols-outlined text-[16px]">
              check
            </span>
            {item}
          </li>
        ))}
      </ul>
    </button>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  autoComplete,
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="px-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
        {label}
      </label>

      <input
        className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-[#001f29] outline-none transition-all placeholder:text-[#906f6e] focus:border-[#d62839] focus:ring-2 focus:ring-[#d62839]/20"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
      />
    </div>
  );
}