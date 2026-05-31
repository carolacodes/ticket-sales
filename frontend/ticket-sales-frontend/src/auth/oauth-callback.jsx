// src/auth/oauth-callback.jsx

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");

    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getRedirectPathByRole(role) {
  const normalizedRole = String(role || "").toUpperCase();

  if (normalizedRole === "ORGANIZER") {
    return "/dashboard";
  }

  return "/events";
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("accessToken");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.setItem("accessToken", token);

    const payload = decodeJwtPayload(token);
    const redirectPath = getRedirectPathByRole(payload?.role);

    navigate(redirectPath, { replace: true });
  }, [navigate, params]);

  return (
    <div className="ticketify-oauth-callback bg-[#f3faff] text-[#001f29]">
      <main className="tf-container flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-16">
        <section className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#baeaff] bg-white shadow-[0px_4px_20px_rgba(23,86,118,0.08)]">
          <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#d8f2ff] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-[#ffdad8] blur-3xl" />

          <div className="relative p-8 text-center md:p-10">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-[#e5f6ff] text-[#b20024]">
              <span className="material-symbols-outlined animate-spin text-5xl">
                sync
              </span>
            </div>

            <p className="mb-3 text-[14px] font-semibold uppercase leading-5 tracking-[0.12em] text-[#b20024]">
              Google OAuth
            </p>

            <h1 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29]">
              Iniciando sesión
            </h1>

            <p className="mx-auto mt-4 max-w-md text-[16px] leading-6 text-[#5b403f]">
              Estamos procesando tu acceso con Google. En unos segundos te
              redirigimos automáticamente.
            </p>

            <div className="mt-8 rounded-xl border border-[#baeaff] bg-[#e5f6ff] p-4 text-left">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#215d7d]">
                  lock
                </span>

                <p className="text-[14px] leading-6 text-[#5b403f]">
                  Si la redirección no ocurre, volvé al login e intentá iniciar
                  sesión nuevamente.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}