import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export function ProtectedRoute({ children }) {
    const { loading, isAuth } = useAuth();

    if (loading) return null; // o spinner
    if (!isAuth) return <Navigate to="/login" replace />;
    return children;
}