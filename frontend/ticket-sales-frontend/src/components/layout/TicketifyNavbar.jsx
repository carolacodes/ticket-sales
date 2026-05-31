import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.js";

function navClass({ isActive }) {
  return [
    "text-[14px] font-semibold leading-5 tracking-[0.05em] transition-colors",
    isActive
      ? "border-b-2 border-[#b20024] pb-1 text-[#b20024]"
      : "text-[#5b403f] hover:text-[#b20024]",
  ].join(" ");
}

export function TicketifyNavbar() {
  const location = useLocation();
  const { isAuth, loading, user, logout } = useAuth();

  const isOrganizer = user?.role === "ORGANIZER";
  const isBuyer = user?.role === "BUYER";

  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  const accountPath = isAuth ? "/my-profile" : "/register";
  const ticketsPath = isAuth ? "/my-tickets" : "/register";
  const purchasesPath = isAuth ? "/my-purchases" : "/register";
  const favoritesPath = isAuth ? "/events" : "/register";

  const sellPath = isOrganizer ? "/dashboard" : "/register?role=ORGANIZER";

  if (loading) {
    return (
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-[#e4bdbc] bg-[#f3faff]" />
    );
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b border-[#e4bdbc] bg-[#f3faff]/95 shadow-sm backdrop-blur">
      <div className="tf-container flex w-full items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link
            to="/start"
            className="text-[24px] font-extrabold leading-8 text-[#b20024]"
          >
            Ticketify
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {isOrganizer ? (
              <>
                <NavLink to="/dashboard" className={navClass}>
                  Dashboard
                </NavLink>

                <NavLink to="/my-events" className={navClass}>
                  Mis eventos
                </NavLink>

                <NavLink to="/check-in" className={navClass}>
                  Check-in
                </NavLink>

                <NavLink to="/events" className={navClass}>
                  Marketplace
                </NavLink>

                <NavLink to="/my-profile" className={navClass}>
                  Perfil
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/events" className={navClass}>
                  Categorías
                </NavLink>

                <NavLink to="/events" className={navClass}>
                  Explorar
                </NavLink>

                <NavLink to={sellPath} className={navClass}>
                  Vender
                </NavLink>

                <NavLink to={favoritesPath} className={navClass}>
                  Favoritos
                </NavLink>

                <NavLink to={ticketsPath} className={navClass}>
                  Mis entradas
                </NavLink>

                {isBuyer ? (
                  <NavLink to={purchasesPath} className={navClass}>
                    Mis compras
                  </NavLink>
                ) : null}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/events"
            className="material-symbols-outlined text-[#5b403f] transition-colors hover:text-[#b20024]"
            aria-label="Buscar eventos"
          >
            search
          </Link>

          {isAuth ? (
            <>
              <Link
                to={accountPath}
                className="material-symbols-outlined text-[#5b403f] transition-colors hover:text-[#b20024]"
                aria-label="Mi perfil"
              >
                account_circle
              </Link>

              <button
                type="button"
                onClick={logout}
                className="hidden rounded-full bg-[#d62839] px-6 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024] active:scale-95 md:block"
              >
                Salir
              </button>
            </>
          ) : isLoginPage ? (
            <Link
              to="/register"
              className="rounded-full bg-[#d62839] px-6 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024] active:scale-95"
            >
              Crear cuenta
            </Link>
          ) : isRegisterPage ? (
            <Link
              to="/login"
              className="rounded-full bg-[#d62839] px-6 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024] active:scale-95"
            >
              Iniciar sesión
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-[#d62839] px-6 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024] active:scale-95"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}