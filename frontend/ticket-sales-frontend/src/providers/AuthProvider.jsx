import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

import { api } from "../api/axios.js";
import { loginRequest, refreshRequest, logoutRequest } from "../api/auth.api.js";
import { getMeRequest } from "../api/user.api.js";

import { setAccessToken, clearAccessToken } from "../libs/token.js";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    /**
     * ✅ 1) Bootstrap (al cargar app o F5)
     * - intenta /auth/refresh (cookie refreshToken)
     * - si devuelve accessToken, lo guarda en memoria
     * - luego pide /users/me y setea user
     */
    async function bootstrap() {
        try {
            const r = await refreshRequest();
            const token = r.data?.accessToken;
            if (!token) throw new Error("No accessToken");

            setAccessToken(token);

            const me = await getMeRequest();
            const u = me.data?.user ?? me.data;

            setUser(u);
            setIsAuth(true);
        } catch (error) {
            clearAccessToken();
            setUser(null);
            setIsAuth(false);
            console.log("Auth bootstrap error:", error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * ✅ 2) Login
     */
    async function login({ email, password }) {
        const r = await loginRequest({ email, password });
        const token = r.data?.accessToken;

        setAccessToken(token);
        setUser(r.data?.user);
        setIsAuth(true);

        return r.data?.user;
    }

    /**
     * ✅ 3) Logout
     */
    async function logout() {
        try {
            await logoutRequest();
        } finally {
            clearAccessToken();
            setUser(null);
            setIsAuth(false);
        }
    }

    /**
     * ✅ 4) Response interceptor: refresh on-demand (401)
     * - si una request falla con 401:
     *   - intenta /auth/refresh
     *   - si ok => reintenta request original con token nuevo
     *   - si falla => logout
     */
    useEffect(() => {
        const resId = api.interceptors.response.use(
        (res) => res,
            async (error) => {
                const original = error.config;
                const status = error?.response?.status;

                // network error o sin status
                if (!status || !original) return Promise.reject(error);

                // solo manejamos 401
                if (status !== 401) return Promise.reject(error);

                // evita loops infinitos
                if (original._retry) return Promise.reject(error);
                original._retry = true;

                // ✅ no refrescar si el 401 vino de endpoints de auth
                const url = original.url || "";
                const isAuthEndpoint =
                url.includes("/auth/refresh") ||
                url.includes("/auth/login") ||
                url.includes("/auth/register") ||
                url.includes("/auth/logout");

                if (isAuthEndpoint) return Promise.reject(error);

                try {
                    const r = await refreshRequest();
                    const newToken = r.data?.accessToken;
                    if (!newToken) throw new Error("No accessToken on refresh");

                    setAccessToken(newToken);

                    // reintento request original (axios.js ya agregará Authorization)
                    return api(original);
                } catch (e) {
                    await logout();
                    return Promise.reject(e);
                }
            }
        );

        return () => {
            api.interceptors.response.eject(resId);
        };
    }, []);

    // ✅ bootstrap al inicio
    useEffect(() => {
        bootstrap();
    }, []);

    const value = useMemo(
        () => ({
        user,
        setUser,
        isAuth,
        loading,
        login,
        logout,
        bootstrap,
        }),
        [user, isAuth, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
