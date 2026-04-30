import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getMyOrdersRequest } from "@/api/orders.api.js";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

export function MyPurchases() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await getMyOrdersRequest();

        if (!alive) return;

        setOrders(res?.data?.orders ?? []);
      } catch (e) {
        setErrorMsg(
          e?.response?.data?.message || "No se pudieron cargar tus compras."
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
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          My Purchases
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Historial de órdenes, pagos y compras realizadas.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-white/10 bg-white/5">
              <CardContent className="p-5">
                <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : errorMsg ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6 text-sm text-red-200">
            {errorMsg}
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6 text-sm text-white/70">
            Todavía no realizaste compras.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order._id} className="border-white/10 bg-white/5">
              <CardContent className="p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusClass(order.status)}>
                        {order.status}
                      </Badge>

                      {order.paymentProvider ? (
                        <Badge className="bg-violet-600/20 text-violet-100">
                          {order.paymentProvider}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-3 text-lg font-semibold">
                      Order #{order._id}
                    </div>

                    <div className="mt-1 text-sm text-white/60">
                      Created at {formatDate(order.createdAt)}
                    </div>

                    {order.paymentRef ? (
                      <div className="mt-1 text-xs text-white/45">
                        Payment Ref: {order.paymentRef}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-xs uppercase tracking-widest text-white/45">
                      Total
                    </div>
                    <div className="mt-1 text-2xl font-bold">
                      <Money value={order.total} currency={order.currency || "ARS"} />
                    </div>
                  </div>
                </div>

                <Separator className="my-5 bg-white/10" />

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    asChild
                    className="bg-violet-600 hover:bg-violet-500"
                  >
                    <Link to={`/my-purchases/${order._id}`}>
                      View purchase detail
                    </Link>
                  </Button>

                  {order.status === "PAID" ? (
                    <Button
                      asChild
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <Link to="/my-tickets">View tickets</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}