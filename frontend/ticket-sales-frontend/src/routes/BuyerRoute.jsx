import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function BuyerRoute({ children }) {
    const { loading, isAuth, user } = useAuth();

    if (loading) return null;
    if (!isAuth) return <Navigate to="/login" replace />;
    if (user?.role !== "BUYER") return <Navigate to="/dashboard" replace />;

    return children;
}
