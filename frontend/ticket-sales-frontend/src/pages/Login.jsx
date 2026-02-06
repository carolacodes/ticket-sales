import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function onSubmit(e) {
        e.preventDefault();
        await login({ email, password });
        nav("/start");
    }

    function loginWithGoogle() {
        // backend inicia OAuth
        window.location.href = "http://localhost:3001/api/auth/google";
    }

    return (
        <div className="min-h-screen bg-neon flex items-center justify-center p-6">
        <div className="glass glow w-full max-w-md rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white">Iniciar sesión</h2>

            <form onSubmit={onSubmit} className="mt-6 grid gap-3">
            <input
                className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button className="h-12 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white">
                Entrar
            </button>
            </form>

            <div className="mt-4">
            <button
                onClick={loginWithGoogle}
                className="h-12 w-full rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10"
            >
                Continuar con Google 🔐
            </button>
            </div>
        </div>
        </div>
    );
}
