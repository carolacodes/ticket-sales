// src/pages/payment/PaymentFailure.jsx

import { Link, useSearchParams } from "react-router-dom";

function shortOrderId(orderId) {
  if (!orderId) return "—";
  return `TK-${String(orderId).slice(-6).toUpperCase()}`;
}

export function PaymentFailure() {
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");
  const orderId = searchParams.get("external_reference");

  return (
    <div className="ticketify-payment-failure bg-[#f3faff] text-[#001f29]">
      <main className="tf-container flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-16">
        <section className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#ffdad6] bg-white shadow-[0px_4px_20px_rgba(23,86,118,0.08)]">
          <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#ffdad8] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-[#d8f2ff] blur-3xl" />

          <div className="relative p-8 text-center md:p-10">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-[#ffdad6] text-[#93000a]">
              <span className="material-symbols-outlined text-5xl">
                error
              </span>
            </div>

            <p className="mb-3 text-[14px] font-semibold uppercase leading-5 tracking-[0.12em] text-[#b20024]">
              Pago rechazado
            </p>

            <h1 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29] md:text-[40px] md:leading-[48px]">
              No pudimos completar tu pago
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-6 text-[#5b403f]">
              La operación no fue aprobada o se interrumpió antes de finalizar.
              Podés intentar comprar nuevamente desde la página del evento o revisar
              el estado de tu orden en tus compras.
            </p>

            <div className="mt-8 rounded-xl border border-[#e4bdbc] bg-[#f3faff] p-5 text-left">
              <div className="flex items-center justify-between gap-4 border-b border-[#e4bdbc] pb-4">
                <span className="text-[14px] font-semibold uppercase leading-5 tracking-[0.08em] text-[#5b403f]">
                  Estado del pago
                </span>

                <span className="rounded-full bg-[#ffdad6] px-3 py-1 text-[13px] font-bold uppercase tracking-[0.05em] text-[#93000a]">
                  {status || "failed"}
                </span>
              </div>

              {orderId ? (
                <div className="flex items-center justify-between gap-4 pt-4">
                  <span className="text-[14px] font-semibold uppercase leading-5 tracking-[0.08em] text-[#5b403f]">
                    Orden
                  </span>

                  <span className="break-all text-right text-[16px] font-bold leading-6 text-[#001f29]">
                    {shortOrderId(orderId)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Link
                to="/events"
                className="flex h-12 items-center justify-center rounded-lg bg-[#d62839] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024] active:scale-[0.98]"
              >
                Intentar de nuevo
              </Link>

              <Link
                to={orderId ? `/my-purchases/${orderId}` : "/my-purchases"}
                className="flex h-12 items-center justify-center rounded-lg border border-[#e4bdbc] bg-white px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all hover:bg-[#e5f6ff] active:scale-[0.98]"
              >
                Ver orden
              </Link>

              <Link
                to="/my-purchases"
                className="flex h-12 items-center justify-center rounded-lg border border-[#baeaff] bg-[#e5f6ff] px-6 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#215d7d] transition-all hover:bg-[#d8f2ff] active:scale-[0.98]"
              >
                Mis compras
              </Link>
            </div>

            <div className="mt-8 rounded-xl border border-[#baeaff] bg-[#e5f6ff] p-4 text-left">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#215d7d]">
                  info
                </span>

                <p className="text-[14px] leading-6 text-[#5b403f]">
                  Si el dinero fue debitado, esperá unos minutos y revisá el
                  estado de la orden en Mis compras. Mercado Pago puede tardar en
                  confirmar o rechazar algunas operaciones.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}