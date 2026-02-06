import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export function PrivateRoute({ children }) {
    const { loading, isAuth } = useAuth();

    if (loading) return <div className="p-6 text-white">Cargando…</div>;
    if (!isAuth) return <Navigate to="/login" replace />;

    return children;
}