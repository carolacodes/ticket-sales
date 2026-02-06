import { Routes, Route, Navigate } from "react-router-dom";

import { Start } from "../pages/start.jsx";
import { Login } from "../pages/Login.jsx";
import { Dashboard } from "../pages/Dashboard.jsx";
import { Events } from "../pages/Events.jsx";
import { EventDetail } from "../pages/EventDetail.jsx";
import { Checkout } from "../pages/Checkout.jsx";
import { MyTickets } from "../pages/MyTickets.jsx";
import { PrivateRoute } from "./PrivateRoute.jsx";
import { OrganizerRoute } from "./OrganizerRoute.jsx";

export function AppRouter() {
    return (
        <Routes>
        <Route path="/" element={<Navigate to="/start" replace />} />

        <Route path="/start" element={<Start />} />
        <Route path="/login" element={<Login />} />

        {/* Buyer flow */}
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route
            path="/my-tickets"
            element={
                <PrivateRoute>
                    <MyTickets />
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

        {/* 404 */}
        <Route path="*" element={<div className="p-6 text-white">404</div>} />
        </Routes>
    );
}