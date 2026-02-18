import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { googleOAuthUrl } from "../api/auth.api.js";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Eye, EyeOff, Mail } from "lucide-react";

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

    function loginWithGoogle() {
        window.location.href = googleOAuthUrl();
    }

    return (
        <div className="min-h-screen bg-neon flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 text-white/90">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600/25 ring-1 ring-violet-500/30">
                <div className="h-2.5 w-2.5 rounded bg-violet-300" />
                </div>
                <span className="font-semibold tracking-wide">EventSaaS</span>
            </div>

            <h1 className="mt-6 text-center text-4xl font-extrabold tracking-wide text-white">
                LOGIN
            </h1>

            {/* Error */}
            {err ? (
                <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {err}
                </div>
            ) : null}

            {/* Form */}
            <form onSubmit={onSubmit} className="mt-8 grid gap-5">
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
                    <button
                    type="button"
                    className="text-sm text-violet-300 hover:text-violet-200"
                    onClick={() => alert("Luego lo conectamos 😉")}
                    >
                    Forgot Password?
                    </button>
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

                {/* OR */}
                <div className="relative py-1">
                <Separator className="bg-white/10" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/50">
                    OR
                </div>
                </div>

                {/* Google */}
                <Button
                type="button"
                variant="outline"
                onClick={loginWithGoogle}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                Continue with Google
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
