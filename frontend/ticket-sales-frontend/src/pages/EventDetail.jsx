import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEventById, getEventTicketTypes } from "../api/events.api.js";
import { useAuth } from "../hooks/useAuth.js";

export function EventDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { isAuth } = useAuth();

    const [event, setEvent] = useState(null);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [qty, setQty] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
        try {
            const [eRes, ttRes] = await Promise.all([
            getEventById(id),
            getEventTicketTypes(id),
            ]);

            setEvent(eRes.data?.event ?? eRes.data);
            setTicketTypes(ttRes.data?.ticketTypes ?? []);
        } finally {
            setLoading(false);
        }
        }
        load();
    }, [id]);

    const total = useMemo(() => {
        return ticketTypes.reduce((acc, tt) => {
        const n = Number(qty[tt.id] || 0);
        return acc + n * tt.price;
        }, 0);
    }, [qty, ticketTypes]);

    function setCount(ticketTypeId, value) {
        const v = Math.max(0, Math.min(10, Number(value || 0)));
        setQty((prev) => ({ ...prev, [ticketTypeId]: v }));
    }

    function goCheckout() {
        if (!isAuth) return nav("/login");

        const items = ticketTypes
        .map((tt) => ({
            ticketTypeId: tt.id,
            qty: Number(qty[tt.id] || 0),
            unitPrice: tt.price,
        }))
        .filter((it) => it.qty > 0);

        if (!items.length) return alert("Elegí al menos 1 ticket 😊");

        nav(`/checkout/${id}`, { state: { event, items } });
    }

    if (loading) return <div className="p-6 text-white">Cargando…</div>;
    if (!event) return <div className="p-6 text-white">Evento no encontrado</div>;

    return (
        <div className="min-h-screen bg-neon p-6 text-white">
        <div className="max-w-3xl mx-auto glass glow rounded-2xl p-6">
            <h1 className="text-2xl font-semibold">{event.title}</h1>
            <p className="text-white/70 mt-2">{event.description}</p>

            <div className="mt-6">
            <h2 className="text-lg font-semibold">Tickets</h2>

            <div className="mt-3 grid gap-3">
                {ticketTypes.map((tt) => (
                <div key={tt.id} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4">
                    <div>
                    <div className="font-semibold">{tt.name}</div>
                    <div className="text-white/60 text-sm">
                        ${tt.price} • disponibles: {tt.available}
                    </div>
                    </div>

                    <input
                    type="number"
                    min="0"
                    max="10"
                    value={qty[tt.id] ?? 0}
                    onChange={(e) => setCount(tt.id, e.target.value)}
                    className="w-20 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-white"
                    />
                </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
                <div className="text-white/70">Total</div>
                <div className="text-xl font-semibold">${total}</div>
            </div>

            <button
                onClick={goCheckout}
                className="mt-4 w-full h-12 rounded-xl bg-violet-600/80 hover:bg-violet-600"
            >
                Continuar a checkout ✨
            </button>
            </div>
        </div>
        </div>
    );
}
