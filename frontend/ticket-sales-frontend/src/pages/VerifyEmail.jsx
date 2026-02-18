import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { verifyEmailRequest, resendVerificationRequest } from "@/api/auth.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerifyEmail() {
    const [params] = useSearchParams();
    const token = params.get("token");

    // modes:
    // - "guide": no token, only instructions + resend
    // - "loading": verifying token
    // - "success": verified ok
    // - "error": token invalid/expired OR other error
    const initialMode = useMemo(() => (token ? "loading" : "guide"), [token]);

    const [status, setStatus] = useState(initialMode);
    const [message, setMessage] = useState(
        token
        ? "Please wait..."
        : "Open the verification email we sent you and click the link to verify your account."
    );

    const [email, setEmail] = useState("");
    const [resending, setResending] = useState(false);

    // ✅ Verify only when token exists
    useEffect(() => {
        let alive = true;

        async function run() {
        if (!token) {
            setStatus("guide");
            setMessage(
            "Open the verification email we sent you and click the link to verify your account."
            );
            return;
        }

        try {
            setStatus("loading");
            setMessage("Verifying your email…");
            await verifyEmailRequest(token);
            if (!alive) return;

            setStatus("success");
            setMessage("Your email has been verified ✅");
        } catch (e) {
            if (!alive) return;

            setStatus("error");
            setMessage(e?.response?.data?.message || "Invalid or expired token.");
        }
        }

        run();
        return () => {
        alive = false;
        };
    }, [token]);

    async function resend() {
        try {
        setResending(true);
        await resendVerificationRequest(email);
        setMessage("If the account exists, we sent a new verification email ✅");
        } catch (e) {
        setMessage(e?.response?.data?.message || "Could not resend email.");
        } finally {
        setResending(false);
        }
    }

    const title =
        status === "loading"
        ? "Verifying..."
        : status === "success"
        ? "Success"
        : status === "error"
        ? "Oops"
        : "Verify your email";

    const showResendBox = status === "guide" || status === "error";

    return (
        <div className="min-h-screen bg-neon flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-md">
            <Card className="border-white/10 bg-white/5">
            <CardContent className="p-8">
                <div className="text-xs uppercase tracking-widest text-violet-300">
                Email Verification
                </div>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                {title}
                </h1>

                <p className="mt-3 text-sm text-white/70">
                {message || "Please wait..."}
                </p>

                {/* ✅ GUIDE (no token) */}
                {status === "guide" ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-widest text-white/45">
                    How it works
                    </div>
                    <ul className="mt-3 list-disc pl-5 text-sm text-white/70 space-y-1">
                    <li>Check your inbox (and spam).</li>
                    <li>Open the email titled “Verificá tu email”.</li>
                    <li>Click the verification link inside.</li>
                    </ul>

                    <div className="mt-4 grid gap-3">
                    <Button
                        variant="outline"
                        className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                        onClick={() => window.open("https://mail.google.com/", "_blank", "noopener,noreferrer")}
                    >
                        Open Gmail ↗
                    </Button>

                    <Button
                        variant="outline"
                        asChild
                        className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    >
                        <Link to="/login">Back to Login</Link>
                    </Button>
                    </div>
                </div>
                ) : null}

                {/* ✅ RESEND (guide or error) */}
                {showResendBox ? (
                <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-widest text-white/45">
                        Resend verification
                    </div>

                    <Input
                        className="mt-3 h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />

                    <Button
                        className="mt-3 h-11 w-full rounded-2xl bg-violet-600 hover:bg-violet-500"
                        onClick={resend}
                        disabled={!email || resending}
                    >
                        {resending ? "Sending..." : "Resend Email"}
                    </Button>

                    <div className="mt-3 text-xs text-white/45">
                        Tip: wait 30–60 seconds and check spam.
                    </div>
                    </div>

                    <Button
                    variant="outline"
                    asChild
                    className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    >
                    <Link to="/start">Back to Home</Link>
                    </Button>
                </div>
                ) : null}

                {/* ✅ SUCCESS */}
                {status === "success" ? (
                <div className="mt-6 grid gap-3">
                    <Button
                    asChild
                    className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-500"
                    >
                    <Link to="/login">Go to Login</Link>
                    </Button>

                    <Button
                    variant="outline"
                    asChild
                    className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    >
                    <Link to="/start">Back to Home</Link>
                    </Button>
                </div>
                ) : null}
            </CardContent>
            </Card>
        </div>
        </div>
    );
}
