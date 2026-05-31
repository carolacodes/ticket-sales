// src/pages/Landing.jsx

import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="ticketify-landing-placeholder bg-[#f3faff] text-[#001f29]">
      <main className="tf-container flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-16">
        <section className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#baeaff] bg-white p-8 text-center shadow-[0px_4px_20px_rgba(23,86,118,0.08)] md:p-12">
          <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#d8f2ff] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-[#ffdad8] blur-3xl" />

          <div className="relative">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#e5f6ff] text-[#b20024]">
              <span className="material-symbols-outlined text-4xl">
                confirmation_number
              </span>
            </div>

            <p className="mb-3 text-[14px] font-semibold uppercase leading-5 tracking-[0.12em] text-[#b20024]">
              Ticketify
            </p>

            <h1 className="text-[40px] font-extrabold leading-[48px] tracking-[-0.02em] text-[#001f29] md:text-[56px] md:leading-[64px]">
              Tu nueva home está en Start
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[18px] leading-7 text-[#5b403f]">
              Esta página era un placeholder antiguo. Ahora la experiencia
              principal de Ticketify vive en la página de inicio.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/start"
                className="flex h-12 items-center justify-center rounded-lg bg-[#d62839] px-8 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:bg-[#b20024] active:scale-[0.98]"
              >
                Ir al inicio
              </Link>

              <Link
                to="/events"
                className="flex h-12 items-center justify-center rounded-lg border border-[#e4bdbc] bg-white px-8 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f] transition-all hover:bg-[#e5f6ff] active:scale-[0.98]"
              >
                Explorar eventos
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}