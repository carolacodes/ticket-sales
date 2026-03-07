import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { registerRequest, googleOAuthUrl } from "@/api/auth.api";
import { Button } from "@/components/ui/button";

function roleFromQuery(q) {
  const r = (q || "").toUpperCase();
  return r === "ORGANIZER" ? "ORGANIZER" : "BUYER";
}

function GoogleIcon(props) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={props.className}
    >
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

export function Register() {
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const roleQuery = sp.get("role");
  const initialRole = useMemo(() => roleFromQuery(roleQuery), [roleQuery]);
  const [role, setRole] = useState(initialRole);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  const [userName, setuserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    userName.trim().length >= 2 &&
    email.trim().length >= 6 &&
    password.length >= 6 &&
    confirm.length >= 6 &&
    password === confirm;

  function onGoogleRegister() {
    // pasamos el role seleccionado para que el backend cree la cuenta con ese rol
    const url = new URL(googleOAuthUrl());
    url.searchParams.set("role", role);
    window.location.href = url.toString();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Revisá los campos (contraseñas iguales, mínimo 6 chars).");
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

      nav("/login", { state: { justRegistered: true, email } });
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "No se pudo crear la cuenta.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neon text-white">
      <div className="p-6">
        <Link to="/start" className="inline-flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-600/20 ring-1 ring-violet-500/30">
            <div className="h-2.5 w-2.5 rounded bg-violet-400" />
          </div>
          <span className="font-semibold tracking-wide">EventSaaS</span>
        </Link>
      </div>

      <div className="flex items-center justify-center px-6 pb-16">
        <div className="glass glow w-full max-w-xl rounded-3xl border border-white/10 p-8 md:p-10">
          <h1 className="text-center text-4xl font-extrabold tracking-tight md:text-5xl">
            CREATE ACCOUNT
          </h1>
          <p className="mt-3 text-center text-sm text-white/60">
            Get started with the future of ticketing.
          </p>

          {/* role toggle */}
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center rounded-2xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => {
                  setRole("BUYER");
                  setSp(
                    (prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("role", "BUYER");
                      return next;
                    },
                    { replace: true }
                  );
                }}
                className={[
                  "px-4 py-2 text-sm rounded-xl transition",
                  role === "BUYER"
                    ? "bg-violet-600 text-white"
                    : "text-white/60 hover:text-white",
                ].join(" ")}
              >
                Buyer
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("ORGANIZER");
                  setSp(
                    (prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("role", "ORGANIZER");
                      return next;
                    },
                    { replace: true }
                  );
                }}
                className={[
                  "px-4 py-2 text-sm rounded-xl transition",
                  role === "ORGANIZER"
                    ? "bg-violet-600 text-white"
                    : "text-white/60 hover:text-white",
                ].join(" ")}
              >
                Organizer
              </button>
            </div>
          </div>

          {/* Google button */}
          <Button
            type="button"
            onClick={onGoogleRegister}
            className="mt-6 h-12 w-full rounded-2xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
            variant="outline"
            disabled={loading}
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-xs text-white/40">OR</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-widest text-white/60">
                Username
              </label>
              <input
                className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30"
                placeholder="John Doe"
                value={userName}
                onChange={(e) => setuserName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-widest text-white/60">
                Email Address
              </label>
              <input
                className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-widest text-white/60">
                  Password
                </label>
                <input
                  className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-widest text-white/60">
                  Confirm
                </label>
                <input
                  className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <Button
              className="mt-2 h-12 rounded-2xl bg-violet-600 hover:bg-violet-500"
              disabled={!canSubmit || loading}
            >
              {loading ? "CREATING..." : "CREATE ACCOUNT"}
            </Button>

            <div className="mt-2 text-center text-sm text-white/60">
              Already have an account?{" "}
              <Link className="text-violet-300 hover:text-violet-200" to="/login">
                Log In
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center text-[11px] text-white/35">
            {role === "ORGANIZER"
              ? "You’ll be able to create events after verifying your email."
              : "Verify your email to unlock purchases and your ticket wallet."}
          </div>
        </div>
      </div>
    </div>
  );
}