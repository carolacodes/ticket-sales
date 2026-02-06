import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export function OrganizerRoute({ children }) {
    const { loading, isAuth, user } = useAuth();

    if (loading) return null;
    if (!isAuth) return <Navigate to="/login" replace />;
    if (user?.role !== "ORGANIZER") return <Navigate to="/start" replace />;

    return children;
}