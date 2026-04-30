import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getOrderByIdRequest } from "@/api/orders.api.js";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { generatePurchasePdf } from "@/utils/purchasePdf.js";

function formatDate(iso) {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Money({ value, currency = "ARS" }) {
  return (
    <span>
      ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
      <span className="text-xs text-white/50">{currency}</span>
    </span>
  );
}

function statusClass(status) {
  if (status === "PAID") return "bg-emerald-500/20 text-emerald-100";
  if (status === "PENDING") return "bg-yellow-500/20 text-yellow-100";
  if (status === "EXPIRED") return "bg-red-500/20 text-red-100";
  if (status === "CANCELED") return "bg-red-500/20 text-red-100";
  return "bg-white/10 text-white";
}

function safeBanner(url) {
  return (
    url ||
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=80"
  );
}

export function PurchaseDetail() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await getOrderByIdRequest(id);

        if (!alive) return;

        setOrder(res?.data?.order ?? null);
      } catch (e) {
        setErrorMsg(
          e?.response?.data?.message || "No se pudo cargar el detalle de compra."
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [id]);

  function handlePrint() {
    generatePurchasePdf(order);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="h-6 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-28 w-full animate-pulse rounded bg-white/10" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6 text-sm text-red-200">
            {errorMsg || "Compra no encontrada."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const event = order.event;
  const tickets = order.tickets ?? [];
  const isPaid = order.status === "PAID";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Purchase Detail
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Detalle completo de tu compra, pago y tickets generados.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 print:hidden">
          <Button
            asChild
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Link to="/my-purchases">← Back</Link>
          </Button>

          <Button
            disabled={!isPaid}
            onClick={handlePrint}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
          >
            📄 Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden border-white/10 bg-white/5">
          <div className="relative h-52 w-full">
            <img
              src={safeBanner(event?.bannerUrl)}
              alt={event?.title || "Event"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

            <div className="absolute bottom-5 left-5 right-5">
              <Badge className={statusClass(order.status)}>
                {order.status}
              </Badge>

              <h2 className="mt-3 text-3xl font-bold">
                {event?.title || "Evento"}
              </h2>

              <div className="mt-2 text-sm text-white/70">
                📅 {formatDate(event?.startAt)} · 📍 {event?.venue || "—"},{" "}
                {event?.city || "—"}
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-widest text-white/45">
                  Order ID
                </div>
                <div className="mt-2 break-all text-sm text-white/85">
                  {order._id}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-widest text-white/45">
                  Payment Provider
                </div>
                <div className="mt-2 text-sm text-white/85">
                  {order.paymentProvider || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-widest text-white/45">
                  Payment Ref
                </div>
                <div className="mt-2 break-all text-sm text-white/85">
                  {order.paymentRef || "—"}
                </div>
              </div>
            </div>

            <Separator className="my-6 bg-white/10" />

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/45">
                  Created at
                </div>
                <div className="mt-1 text-sm text-white/85">
                  {formatDate(order.createdAt)}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-white/45">
                  Paid at
                </div>
                <div className="mt-1 text-sm text-white/85">
                  {formatDate(order.paidAt)}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-white/45">
                  Total
                </div>
                <div className="mt-1 text-2xl font-bold">
                  <Money value={order.total} currency={order.currency || "ARS"} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold">Purchased items</h3>

            <div className="mt-5 grid gap-3">
              {(order.items ?? []).map((item) => (
                <div
                  key={item.ticketTypeId}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="mt-1 text-sm text-white/55">
                      Qty: {item.qty} · Unit price:{" "}
                      <Money
                        value={item.unitPrice}
                        currency={item.currency || order.currency || "ARS"}
                      />
                    </div>
                  </div>

                  <div className="text-lg font-bold">
                    <Money
                      value={item.lineTotal}
                      currency={item.currency || order.currency || "ARS"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-semibold">Generated tickets</h3>
                <p className="mt-1 text-sm text-white/55">
                  Tickets creados automáticamente después de confirmar el pago.
                </p>
              </div>

              <Button
                asChild
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10 print:hidden"
              >
                <Link to="/my-tickets">View all tickets</Link>
              </Button>
            </div>

            <div className="mt-5 grid gap-3">
              {tickets.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                  Todavía no hay tickets generados para esta compra.
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="font-medium">
                        Ticket #{ticket.code}
                      </div>
                      <div className="mt-1 text-sm text-white/55">
                        Status: {ticket.status}
                      </div>
                    </div>

                    <Button
                      asChild
                      className="bg-violet-600 hover:bg-violet-500 print:hidden"
                    >
                      <Link to={`/my-tickets?ticketId=${ticket._id}`}>
                        View ticket
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}