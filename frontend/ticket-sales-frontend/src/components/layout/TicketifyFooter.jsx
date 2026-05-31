import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.js";

function FooterColumn({ title, links }) {
  return (
    <div>
      <h5 className="mb-6 font-bold text-[#eef6ff]">{title}</h5>

      <ul className="space-y-4 text-[16px] leading-6 text-[#eef6ff]/70">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="transition-colors hover:text-[#ffb3b1]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TicketifyFooter() {
  const { isAuth, user } = useAuth();

  const isOrganizer = user?.role === "ORGANIZER";

  const buyerLinks = [
    { label: "Explorar eventos", to: "/events" },
    { label: "Mis entradas", to: isAuth ? "/my-tickets" : "/register" },
    { label: "Mis compras", to: isAuth ? "/my-purchases" : "/register" },
    { label: "Mi perfil", to: isAuth ? "/my-profile" : "/register" },
  ];

  const organizerLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Mis eventos", to: "/my-events" },
    { label: "Check-in", to: "/check-in" },
    { label: "Perfil", to: "/my-profile" },
  ];

  return (
    <footer className="mt-auto bg-[#003545] px-4 py-20 text-[#eef6ff]">
      <div className="tf-container grid grid-cols-1 gap-8 md:grid-cols-4">
        <div>
          <Link
            to="/start"
            className="mb-6 block text-[24px] font-extrabold leading-8 text-[#ffdad8]"
          >
            Ticketify
          </Link>

          <p className="mb-6 text-[16px] leading-6 text-[#eef6ff]/80">
            Tu plataforma de confianza para comprar, vender y gestionar
            entradas para eventos en vivo.
          </p>

          <div className="flex gap-4">
            <Link
              to="/events"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#034c6b] transition-colors hover:bg-[#b20024]"
              aria-label="Eventos"
            >
              <span className="material-symbols-outlined text-xl">public</span>
            </Link>

            <Link
              to="/start"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#034c6b] transition-colors hover:bg-[#b20024]"
              aria-label="Soporte"
            >
              <span className="material-symbols-outlined text-xl">chat</span>
            </Link>
          </div>
        </div>

        <FooterColumn
          title={isOrganizer ? "Organizador" : "Cuenta"}
          links={isOrganizer ? organizerLinks : buyerLinks}
        />

        <FooterColumn
          title="Eventos"
          links={[
            { label: "Conciertos", to: "/events" },
            { label: "Deportes", to: "/events" },
            { label: "Teatro", to: "/events" },
            { label: "Festivales", to: "/events" },
          ]}
        />

        <FooterColumn
          title="Empresa"
          links={[
            { label: "Inicio", to: "/start" },
            { label: "Vender tickets", to: "/register?role=ORGANIZER" },
            { label: "Términos", to: "/start" },
            { label: "Privacidad", to: "/start" },
          ]}
        />
      </div>

      <div className="tf-container mt-20 flex flex-col items-center justify-between gap-4 border-t border-[#034c6b] pt-8 text-[16px] leading-6 text-[#eef6ff]/60 md:flex-row">
        <p>© 2026 Ticketify. Todos los derechos reservados.</p>

        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">
            verified_user
          </span>
          Pago 100% seguro con encriptación SSL
        </div>
      </div>
    </footer>
  );
}