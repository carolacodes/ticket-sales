import { useState } from "react";
import { Link } from "react-router-dom";

import { forgotPasswordRequest } from "@/api/auth.api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CheckCircle2, AlertTriangle, Mail, ArrowLeft } from "lucide-react";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setErr("");

      await forgotPasswordRequest(email.trim().toLowerCase());

      setDone(true);
    } catch (error) {
      setErr(
        error?.response?.data?.message || "Could not send reset email."
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
                <Mail className="h-6 w-6 text-violet-300" />
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-violet-300">
                  Account Recovery
                </div>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
                  Forgot Password
                </h1>
              </div>
            </div>

            <p className="mb-6 text-sm leading-6 text-white/60">
              Enter your email address and we’ll send you a secure link to reset
              your password.
            </p>

            {done ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <div className="font-semibold">Reset email sent</div>
                      <div className="mt-1 text-sm text-emerald-100/80">
                        If an account exists for <b>{email}</b>, a password
                        reset link has been sent.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                  Check your inbox and spam folder. The link expires in 60
                  minutes.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="h-12 rounded-2xl bg-violet-600 hover:bg-violet-500"
                    onClick={() => {
                      setDone(false);
                      setEmail("");
                    }}
                  >
                    Send Again
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    <Link to="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-2">
                  <Label className="text-white/70">Email Address</Label>
                  <Input
                    type="email"
                    autoComplete="email"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

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
                    disabled={submitting || !email.trim()}
                  >
                    {submitting ? "Sending..." : "Send Reset Link"}
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