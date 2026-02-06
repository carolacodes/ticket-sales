import { useEffect, useState } from "react";
import { listPublishedEvents } from "../api/events.api.js";
import { useNavigate } from "react-router-dom";

export function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigate();

    useEffect(() => {
        async function load() {
        try {
            const r = await listPublishedEvents();
            // tu backend puede devolver { events } o array directo
            setEvents(r.data?.events ?? r.data ?? []);
        } finally {
            setLoading(false);
        }
        }
        load();
    }, []);

    if (loading) return <div className="p-6 text-white">Cargando…</div>;

    return (
        <div className="min-h-screen bg-neon p-6">
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold text-white">Eventos 🎟️</h1>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
            {events.map((e) => (
                <button
                key={e._id ?? e.id}
                onClick={() => nav(`/events/${e._id ?? e.id}`)}
                className="text-left glass glow rounded-2xl p-5 hover:bg-white/5 transition"
                >
                <div className="text-white font-semibold">{e.title}</div>
                <div className="text-white/70 mt-1 line-clamp-2">{e.description}</div>
                <div className="text-white/50 mt-3 text-sm">
                    {e.city} • {new Date(e.startAt).toLocaleString()}
                </div>
                </button>
            ))}
            </div>
        </div>
        </div>
    );
}
