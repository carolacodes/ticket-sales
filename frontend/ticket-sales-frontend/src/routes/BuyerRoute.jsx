import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

function RouteLoading() {
  return (
    <div className="bg-[#f3faff] text-[#001f29]">
      <main className="tf-container flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-16">
        <div className="rounded-2xl border border-[#baeaff] bg-white p-8 text-center shadow-[0px_4px_20px_rgba(23,86,118,0.08)]">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#e5f6ff] text-[#b20024]">
            <span className="material-symbols-outlined animate-spin text-3xl">
              sync
            </span>
          </div>

          <p className="text-[16px] font-semibold text-[#5b403f]">
            Cargando...
          </p>
        </div>
      </main>
    </div>
  );
}

function normalizeRole(role) {
  return String(role || "").toUpperCase();
}

export function BuyerRoute({ children }) {
  const location = useLocation();
  const { loading, isAuth, user } = useAuth();

  if (loading) return <RouteLoading />;

  if (!isAuth) {
    return (
      <Navigate
        to="/register"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (normalizeRole(user?.role) !== "BUYER") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}