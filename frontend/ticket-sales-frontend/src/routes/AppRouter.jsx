import { Routes, Route, Navigate, Link } from "react-router-dom";

import { Start } from "../pages/Start.jsx";
import { Login } from "../pages/Login.jsx";
import { Dashboard } from "../pages/Dashboard.jsx";
import { Events } from "../pages/Events.jsx";
import { EventDetail } from "../pages/EventDetail.jsx";
import { Checkout } from "../pages/Checkout.jsx";
import { MyTickets } from "../pages/MyTickets.jsx";
import { PrivateRoute } from "./PrivateRoute.jsx";
import { OrganizerRoute } from "./OrganizerRoute.jsx";
import { MyProfile } from "../pages/MyProfile.jsx";
import { VerifyEmail } from "../pages/VerifyEmail.jsx";
import { Register } from "../pages/Register.jsx";
import { BuyerRoute } from "./BuyerRoute.jsx";
import { MyEvents } from "@/pages/MyEvents.jsx";
import { TicketCheckIn } from "@/pages/TicketCheckIn";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { PaymentSuccess } from "@/pages/payment/PaymentSuccess.jsx";
import { PaymentPending } from "@/pages/payment/PaymentPending.jsx";
import { PaymentFailure } from "@/pages/payment/PaymentFailure.jsx";
import { MyPurchases } from "@/pages/MyPurchases.jsx";
import { PurchaseDetail } from "@/pages/PurchaseDetail.jsx";
import OAuthCallback from "@/auth/oauth-callback.jsx";

function NotFound() {
  return (
    <div className="bg-[#f3faff] text-[#001f29]">
      <main className="tf-container flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-16">
        <section className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#baeaff] bg-white p-8 text-center shadow-[0px_4px_20px_rgba(23,86,118,0.08)] md:p-10">
          <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#d8f2ff] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-[#ffdad8] blur-3xl" />

          <div className="relative">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-[#e5f6ff] text-[#b20024]">
              <span className="material-symbols-outlined text-5xl">
                error
              </span>
            </div>

            <p className="mb-3 text-[14px] font-semibold uppercase leading-5 tracking-[0.12em] text-[#b20024]">
              Error 404
            </p>

            <h1 className="text-[32px] font-extrabold leading-10 tracking-[-0.01em] text-[#001f29]">
              Página no encontrada
            </h1>

            <p className="mx-auto mt-4 max-w-md text-[16px] leading-6 text-[#5b403f]">
              La página que estás buscando no existe o fue movida.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/start"
                className="flex h-12 items-center justify-center rounded-lg bg-[#d62839] px-8 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024] active:scale-[0.98]"
              >
                Ir al inicio
              </Link>

              <Link
                to="/events"
                className="flex h-12 items-center justify-center rounded-lg border border-[#e4bdbc] bg-white px-8 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all hover:bg-[#e5f6ff] active:scale-[0.98]"
              >
                Explorar eventos
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/start" replace />} />

      {/* Public */}
      <Route path="/start" element={<Start />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* Public buyer discovery */}
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetail />} />

      {/* Auth / account recovery */}
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Buyer protected */}
      <Route
        path="/checkout/:id"
        element={
          <BuyerRoute>
            <Checkout />
          </BuyerRoute>
        }
      />

      <Route
        path="/my-tickets"
        element={
          <BuyerRoute>
            <MyTickets />
          </BuyerRoute>
        }
      />

      <Route
        path="/my-purchases"
        element={
          <BuyerRoute>
            <MyPurchases />
          </BuyerRoute>
        }
      />

      <Route
        path="/my-purchases/:id"
        element={
          <BuyerRoute>
            <PurchaseDetail />
          </BuyerRoute>
        }
      />

      <Route
        path="/payment/success"
        element={
          <BuyerRoute>
            <PaymentSuccess />
          </BuyerRoute>
        }
      />

      <Route
        path="/payment/pending"
        element={
          <BuyerRoute>
            <PaymentPending />
          </BuyerRoute>
        }
      />

      <Route
        path="/payment/failure"
        element={
          <BuyerRoute>
            <PaymentFailure />
          </BuyerRoute>
        }
      />

      {/* General authenticated */}
      <Route
        path="/my-profile"
        element={
          <PrivateRoute>
            <MyProfile />
          </PrivateRoute>
        }
      />

      {/* Organizer protected */}
      <Route
        path="/dashboard"
        element={
          <OrganizerRoute>
            <Dashboard />
          </OrganizerRoute>
        }
      />

      <Route
        path="/my-events"
        element={
          <OrganizerRoute>
            <MyEvents />
          </OrganizerRoute>
        }
      />

      <Route
        path="/check-in"
        element={
          <OrganizerRoute>
            <TicketCheckIn />
          </OrganizerRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}