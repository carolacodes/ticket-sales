import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { createOrder, confirmOrder } from "../api/orders.api.js";

export function Checkout() {
    const { id: eventId } = useParams();
    const { state } = useLocation();
    const nav = useNavigate();

    const [loading, setLoading] = useState(false);

    // Esto viene del EventDetail -> nav("/checkout/:id", { state: { event, items } })
    const event = state?.event;
    const items = state?.items || [];

    const total = useMemo(() => {
        return items.reduce((acc, it) => acc + it.qty * it.unitPrice, 0);
    }, [items]);

    async function handleConfirmPurchase() {
        setLoading(true);
        try {
        // 1) crear orden
        const r1 = await createOrder({ eventId, items });
        const orderId = r1.data?.order?._id || r1.data?.order?.id;
        if (!orderId) throw new Error("Order id missing in response");

        // 2) confirmar (PAID + tickets + email)
        await confirmOrder(orderId);

        // 3) ir a tickets
        nav("/my-tickets");
        } catch (e) {
        // si querés, acá podés mostrar toast de shadcn
        alert(e?.response?.data?.message || e.message || "Error");
        } finally {
        setLoading(false);
        }
    }

    // Si entran directo (sin state), no tenemos items
    if (!event || items.length === 0) {
        return (
        <div className="min-h-screen bg-neon flex items-center justify-center p-6 text-white">
            <div className="glass glow w-full max-w-xl rounded-2xl p-6">
            <h1 className="text-xl font-semibold">Checkout</h1>
            <p className="text-white/70 mt-2">
                No hay datos del carrito (entrás directo a la ruta). Volvé al evento y elegí tickets 🙂
            </p>
            <button
                onClick={() => nav("/events")}
                className="mt-5 h-12 px-5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15"
            >
                Volver a eventos
            </button>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-neon flex items-center justify-center p-6 text-white">
        <div className="glass glow w-full max-w-xl rounded-2xl p-6">
            <h1 className="text-2xl font-semibold">Checkout ✅</h1>
            <p className="text-white/70 mt-1">{event.title}</p>

            <div className="mt-6 grid gap-2">
            {items.map((it) => (
                <div
                key={it.ticketTypeId}
                className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3"
                >
                <div className="text-white/70 text-sm break-all">
                    {it.ticketTypeId}
                </div>
                <div className="font-semibold">
                    {it.qty} × ${it.unitPrice}
                </div>
                </div>
            ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
            <div className="text-white/70">Total</div>
            <div className="text-xl font-semibold">${total}</div>
            </div>

            <button
            disabled={loading}
            onClick={handleConfirmPurchase}
            className="mt-5 w-full h-12 rounded-xl bg-violet-600/80 hover:bg-violet-600 disabled:opacity-60"
            >
            {loading ? "Confirmando..." : "Confirmar compra (fake) 🎟️"}
            </button>
        </div>
        </div>
    );
}
