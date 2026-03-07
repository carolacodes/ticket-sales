import { Routes, Route, Navigate } from "react-router-dom";

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
// ✅ NUEVO: OAuth callback page
import OAuthCallback from "@/auth/oauth-callback.jsx";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/start" replace />} />

      <Route path="/start" element={<Start />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ✅ NUEVO: OAuth callback */}
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* Buyer flow */}
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/checkout/:id" element={<Checkout />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route
        path="/my-tickets"
        element={
          <BuyerRoute>
            <MyTickets />
          </BuyerRoute>
        }
      />
      <Route
        path="/my-profile"
        element={
          <PrivateRoute>
            <MyProfile />
          </PrivateRoute>
        }
      />

      {/* Organizer */}
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
      <Route path="*" element={<div className="p-6 text-white">404</div>} />
    </Routes>
  );
}