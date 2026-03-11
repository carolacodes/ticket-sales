import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { googleOAuthUrl } from "@/api/auth.api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Eye, EyeOff, Mail } from "lucide-react";

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={props.className}>
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
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !submitting;
  }, [email, password, submitting]);

  function onGoogleLogin() {
    window.location.href = googleOAuthUrl();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      setSubmitting(true);
      await login({ email: email.trim(), password });
      nav("/start");
    } catch (e2) {
      const status = e2?.response?.status;
      const msg =
        e2?.response?.data?.message ||
        (status === 401
          ? "Email o contraseña incorrectos."
          : "No se pudo iniciar sesión.");
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neon flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-8">
          {/* Header 
          <div className="flex items-center justify-center gap-2 text-white/90">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600/25 ring-1 ring-violet-500/30">
              <div className="h-2.5 w-2.5 rounded bg-violet-300" />
            </div>
            <span className="font-semibold tracking-wide">TICKETIFY</span>
          </div>
          */}
          <h1 className="mt-3 text-center text-4xl font-extrabold tracking-wide text-white">
            LOGIN
          </h1>

          {/* Error */}
          {err ? (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          {/* Google */}
          <Button
            type="button"
            onClick={onGoogleLogin}
            variant="outline"
            className="mt-8 h-12 w-full rounded-2xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
            disabled={submitting}
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          {/* OR */}
          <div className="relative my-6 py-1">
            <Separator className="bg-white/10" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/50">
              OR
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="grid gap-5">
            {/* Email */}
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-widest text-white/50">
                Email address
              </Label>

              <div className="relative">
                <Input
                  className="h-12 rounded-xl border-white/10 bg-white/5 pr-10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/40"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-widest text-white/50">
                Password
              </Label>

              <div className="relative">
                <Input
                  className="h-12 rounded-xl border-white/10 bg-white/5 pr-10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/40"
                  placeholder="••••••••"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-violet-300 hover:text-violet-200"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 rounded-2xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60"
            >
              {submitting ? "Ingresando..." : "LOGIN"}
            </Button>

            {/* Register link */}
            <div className="text-center text-sm text-white/60">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-white hover:text-violet-200">
                Register
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}