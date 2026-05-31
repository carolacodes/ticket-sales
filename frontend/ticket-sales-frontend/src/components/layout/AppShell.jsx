import { TicketifyNavbar } from "@/components/layout/TicketifyNavbar.jsx";
import { TicketifyFooter } from "@/components/layout/TicketifyFooter.jsx";

export function AppShell({ children }) {
  return (
    <div className="ticketify-app flex min-h-screen flex-col bg-[#f3faff] text-[#001f29]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800;900&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        .ticketify-app {
          font-family: "Hanken Grotesk", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .material-symbols-outlined {
          font-family: "Material Symbols Outlined";
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: "liga";
          -webkit-font-smoothing: antialiased;
          font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
          vertical-align: middle;
        }

        .tf-container {
          width: min(100% - 32px, 1280px);
          margin-inline: auto;
        }

        @media (min-width: 768px) {
          .tf-container {
            width: min(100% - 48px, 1280px);
          }
        }

        .ticket-bg-pattern {
          background-color: #ffffff;
          background-image:
            radial-gradient(#d8f2ff 0.5px, transparent 0.5px),
            radial-gradient(#d8f2ff 0.5px, #ffffff 0.5px);
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;
        }
      `}</style>

      <TicketifyNavbar />

      <main className="flex-1">{children}</main>

      <TicketifyFooter />
    </div>
  );
}