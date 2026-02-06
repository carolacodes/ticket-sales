import { useEffect, useState } from "react";
import { getMyTickets } from "../api/tickets.api.js";

export function MyTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
        try {
            const r = await getMyTickets();

            // Ajuste flexible según tu backend:
            const list = r.data?.tickets ?? r.data ?? [];
            setTickets(list);
        } finally {
            setLoading(false);
        }
        }
        load();
    }, []);

    if (loading) return <div className="p-6 text-white">Cargando tickets…</div>;

    return (
        <div className="min-h-screen bg-neon p-6 text-white">
        <div className="max-w-3xl mx-auto glass glow rounded-2xl p-6">
            <h1 className="text-2xl font-semibold">Mis tickets 🎟️</h1>
            <p className="text-white/70 mt-2">
            Acá ves los tickets emitidos por tus compras confirmadas.
            </p>

            <div className="mt-6 grid gap-3">
            {tickets.length === 0 ? (
                <div className="text-white/70">Todavía no tenés tickets.</div>
            ) : (
                tickets.map((t) => (
                <div
                    key={t._id || t.id}
                    className="rounded-xl bg-white/5 border border-white/10 p-4"
                >
                    <div className="flex items-center justify-between">
                    <div className="font-semibold break-all">{t.code}</div>
                    <div className="text-sm text-white/70">{t.status}</div>
                    </div>

                    <div className="mt-2 text-white/70 text-sm">
                    Event: <span className="text-white/90">{t.eventId}</span>
                    </div>

                    <div className="mt-1 text-white/70 text-sm">
                    TicketType: <span className="text-white/90">{t.ticketTypeId}</span>
                    </div>

                    {t.checkedInAt && (
                    <div className="mt-1 text-white/70 text-sm">
                        Checked in: <span className="text-white/90">{new Date(t.checkedInAt).toLocaleString()}</span>
                    </div>
                    )}
                </div>
                ))
            )}
            </div>
        </div>
        </div>
    );
}
