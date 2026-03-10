import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { resetPasswordRequest } from "@/api/auth.api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!token) {
      setErr("Missing reset token.");
      return;
    }

    if (!passwordsMatch) {
      setErr("Passwords do not match.");
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
          "Could not reset password. The link may be invalid or expired."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <Card className="border-white/10 bg-white/5 shadow-2xl">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/30">
                <KeyRound className="h-6 w-6 text-violet-300" />
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-violet-300">
                  Account Security
                </div>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
                  Reset Password
                </h1>
              </div>
            </div>

            {!token ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <div className="font-semibold">Invalid reset link</div>
                      <div className="mt-1 text-sm text-red-100/80">
                        This password reset link is missing the required token.
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <Link to="/forgot-password">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Request New Link
                  </Link>
                </Button>
              </div>
            ) : done ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <div className="font-semibold">
                        Password updated successfully
                      </div>
                      <div className="mt-1 text-sm text-emerald-100/80">
                        Your password has been reset. Redirecting to login...
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  className="h-12 rounded-2xl bg-violet-600 hover:bg-violet-500"
                >
                  <Link to="/login">Go to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm leading-6 text-white/60">
                  Create a new password for your account. Make sure it’s secure
                  and easy for you to remember.
                </p>

                <div className="grid gap-2">
                  <Label className="text-white/70">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pr-12 text-white placeholder:text-white/30"
                      placeholder="Create a new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showPass ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-white/70">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPass ? "text" : "password"}
                      autoComplete="new-password"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pr-12 text-white placeholder:text-white/30"
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showConfirmPass ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {confirmPassword && !passwordsMatch ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    Passwords do not match.
                  </div>
                ) : null}

                {err ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{err}</span>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 pt-1">
                  <Button
                    type="submit"
                    className="h-12 rounded-2xl bg-violet-600 hover:bg-violet-500"
                    disabled={submitting || !canSubmit}
                  >
                    {submitting ? "Updating..." : "Reset Password"}
                  </Button>

                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    <Link to="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}