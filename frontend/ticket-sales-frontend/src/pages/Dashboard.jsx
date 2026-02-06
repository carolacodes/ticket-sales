import { useAuth } from "../hooks/useAuth.js";

export function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-neon p-8 text-white">
        <div className="glass glow rounded-2xl p-6">
            <h1 className="text-2xl font-semibold">Dashboard Organizer ✨</h1>
            <p className="text-white/70 mt-2">
            Bienvenido/a, {user?.username} ({user?.role})
            </p>
        </div>
        </div>
    );
}
