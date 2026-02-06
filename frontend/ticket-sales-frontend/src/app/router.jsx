import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout.jsx";

import Landing from "../pages/landing.jsx";
import Login from "../pages/login.jsx";
import OAuthCallback from "../auth/oauth-callback.jsx";

import Dashboard from "../pages/dashboard.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

export const router = createBrowserRouter([
    {
        element: <AppLayout />,
        children: [
        { path: "/", element: <Landing /> },
        { path: "/login", element: <Login /> },
        { path: "/oauth/callback", element: <OAuthCallback /> },

        // Rutas protegidas
        {
            element: <ProtectedRoute roles={["ORGANIZER"]} />,
            children: [{ path: "/dashboard", element: <Dashboard /> }],
        },
        ],
    },
]);
