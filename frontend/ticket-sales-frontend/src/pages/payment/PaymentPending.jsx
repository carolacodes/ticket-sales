import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PaymentPending() {
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get("payment_id");
  const orderId = searchParams.get("external_reference");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-10">
      <Card className="w-full border-white/10 bg-white/5">
        <CardContent className="p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-yellow-500/20 text-3xl">
            ⏳
          </div>

          <h1 className="mt-6 text-3xl font-extrabold">
            Payment pending
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65">
            Your payment is still pending. Once Mercado Pago confirms it, your
            tickets will be created automatically.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-sm text-white/70">
            <div className="flex justify-between gap-4">
              <span>Payment status</span>
              <span className="text-yellow-300">pending</span>
            </div>

            {paymentId ? (
              <div className="mt-2 flex justify-between gap-4">
                <span>Payment ID</span>
                <span className="text-white/90">{paymentId}</span>
              </div>
            ) : null}

            {orderId ? (
              <div className="mt-2 flex justify-between gap-4">
                <span>Order ID</span>
                <span className="text-white/90">{orderId}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-violet-600 hover:bg-violet-500">
              <Link to="/my-tickets">Check my tickets</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10"
            >
              <Link to="/events">Back to events</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}