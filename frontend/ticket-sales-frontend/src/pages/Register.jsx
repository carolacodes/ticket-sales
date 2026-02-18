import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { registerRequest } from "@/api/auth.api";
import { Button } from "@/components/ui/button";

function roleFromQuery(q) {
    const r = (q || "").toUpperCase();
    return r === "ORGANIZER" ? "ORGANIZER" : "BUYER";
}

export function Register() {
    const nav = useNavigate();
    const [sp, setSp] = useSearchParams();

    // ✅ FIX: depende del string, no del objeto `sp`
    const roleQuery = sp.get("role");
    const initialRole = useMemo(() => roleFromQuery(roleQuery), [roleQuery]);

    const [role, setRole] = useState(initialRole);

    // ✅ FIX: si cambia el query param, actualizamos el state
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
            role, // ✅ acá va el rol (BUYER/ORGANIZER)
        });

        // ✅ no login automático porque necesita verificar email
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
                        // ✅ actualiza URL
                        setSp((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set("role", "BUYER");
                        return next;
                        }, { replace: true });
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
                        // ✅ actualiza URL
                        setSp((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set("role", "ORGANIZER");
                        return next;
                        }, { replace: true });
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

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
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

                <div className="my-2 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <div className="text-xs text-white/40">OR</div>
                <div className="h-px flex-1 bg-white/10" />
                </div>

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
