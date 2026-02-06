import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { updateRoleRequest } from "../api/user.api.js";
import { setAccessToken } from "../libs/token.js";

export function Start() {
    const { user, isAuth, setUser } = useAuth();
    const navigate = useNavigate();

    async function handleBuy() {
        navigate("/events");
    }

    async function handleSell() {
        if (!isAuth) return navigate("/login");

        // si ya es organizer -> dashboard
        if (user?.role === "ORGANIZER") return navigate("/dashboard");

        // si es buyer -> convertir
        const r = await updateRoleRequest("ORGANIZER");

        // ✅ si tu backend devuelve accessToken + user (como te recomendé)
        if (r.data?.accessToken) setAccessToken(r.data.accessToken);

        if (r.data?.user) setUser(r.data.user);

        navigate("/dashboard");
    }

    return (
        <div className="min-h-screen bg-neon flex items-center justify-center p-6">
        <div className="glass glow w-full max-w-xl rounded-2xl p-8">
            <h1 className="text-2xl font-semibold text-white">Ticket Sales</h1>
            <p className="text-white/70 mt-2">
            Elegí cómo querés usar la plataforma 👇
            </p>

            <div className="mt-6 grid gap-3">
            <button
                onClick={handleBuy}
                className="h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10"
            >
                Quiero comprar entradas 🎟️
            </button>

            <button
                onClick={handleSell}
                className="h-12 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white"
            >
                Quiero vender entradas ✨
            </button>
            </div>
        </div>
        </div>
    );
}
