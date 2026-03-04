import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("accessToken");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // Guardar token (ajustá si usás otro storage)
    localStorage.setItem("accessToken", token);

    const payload = decodeJwtPayload(token);
    const role = (payload?.role || "").toUpperCase();

    if (role === "ORGANIZER") {
      navigate("/dashboard", { replace: true });
    } else {
      // BUYER o cualquier otro -> flujo buyer
      navigate("/events", { replace: true });
    }
  }, [navigate, params]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="glass glow rounded-2xl p-8">
        <h2 className="text-2xl font-semibold">Logging you in...</h2>
        <p className="mt-2 text-muted-foreground">Processing Google OAuth ✅</p>
      </div>
    </div>
  );
}