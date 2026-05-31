import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const categories = [
  {
    name: "Conciertos",
    query: "concerts",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB7ZNT36WU84CAOxlsvKrZ9uPfXUYiIvs4lKV-Rqug_vUUhl-eX74RLiamWO46wnC5ADcan97ZEe6dfXGrGh33pawnvmpOQ6C4er1-NvX7FYYP4X6xhr_TSc3S1--tFFAvQv8RU6nwTERL-89Jbg7A-Gx0PyqSvhjf3IDXwPMkUQ7lQzLzQQi29aMDgSGrnNHsrFQeNCUM0XXvaH0u6vayteMlCdZ20PPvSrQIc6OA-oeDlmzC8gxC2O53la9SlCgfQIVRYpOAYQjP3",
  },
  {
    name: "Deportes",
    query: "sports",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAF3_HAQZkdmV3yFBJYT6o81VmmKW1a0nljbx8LmVsgKc9-wl6hj8sgd4UsKgNUIX0Ydtk8_jM9oUGoVouH-Ipn5eiz52INx_a061S0JHUWy32YhFyJGBgb1mv8kKsUowv-PnBXacudPsdM8HTcRuF_LLW6AMigc_3nZGOu85pSAiuk9cvoFj2rU9pygwrZX-L3LbubnxQaAKB4q5IPhE5QKmnnTXTWHjnzTar47aUf6M5CJkHq_mx5SMTs400sJvloL7o3PgzLfr-y",
  },
  {
    name: "Teatro",
    query: "theater",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAlp4YB2UZipAf1EXikVI4-X-fDCklRxLDi46UVhwAoi9v-NDJiGxJHtqRpd3H7ZINMKJsEX2cE6ku8fUMLvAcwgaH9nbnRwRO8_1y0u-akbLhRiUEyjX3JF9hOwQpTkiRAiM4ihWZ2KlYOd6UPtEgYz8vZl6pap2vDZ3M3hdOEqCiG8xjhl21y3JxA4FGx5c7VU2Sn-3-zqKRBj0MZviNetcBONRN5_R1pk93btI94M8S1j-iBsTGg79OtJJowBxR8-j3BnG5_DhEp",
  },
  {
    name: "Festivales",
    query: "festivals",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDh8oRkCIWuxSG12eDXsHx0DQKzbRQcnxdBtC9XLnra48gZs8XyMwyRzO0HZ_sWhIrS_UXtQgzUR_O5k6BAmrco2nwrtxtnYS2Mw2r81yKjmSiSK7Hd9in-fAieCh5wiVg_sNMxrYjTQQ7yX6DDrG-YJawMIW1cn5Lal5RchqmsbWs12AQzM21YeyPpQbdqJTN9fOYoQe1ShQ9k55L1fx7afsTvbfaK-z03m5owjuDE5MpiFkVbb6DiUaIdmXUaiU5Gv5utyAEeheB9",
  },
  {
    name: "Comedia",
    query: "comedy",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC8Bz25tPRhsv_aS1f0LCC7yDuCNE41XmyTRn8ImX6VzR8SKXAZh2Hrsn845gAOOp7P6qnS6ME0FeoovXK35EUsLJRVyLqZFC7v-dcr0KvFXdfNdpC0b1PyGqFbkBczISRcwfvviMmAuGksO-4UixpNmwUB_snUhqgd6y9tjCPJ835S49At84jggeo5jnzoEFqyln7-kLr7OTaKGw5tTWOtbdZxkDiYPsQof0f7DJ-UzmPrm0RFvlBeoVhFMDXHRQmMLaiJJQ2kI4_N",
  },
  {
    name: "Conferencias",
    query: "conferences",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0X5QOf8q0CaSrUtwRvzXGV9ekmm7MlTKz8TSLFb5nxZO-x6CF3ReMc-tOuWE6z4VNvizs4ttooW36OmNEt7KoMU308KYfe3t_2jOfIE04JFbXB4M4meqUv8DQcOZi1Dn6kgYszJ0Z1o7QRJei_VUNhNgnayAc0M5rr8PDmyxrzhgDsuyo4Uu6BzhNJoljcE94IzQqX3fA07sZ9FSh_wZIlMipBl6F63RQa8Y09uHS9FJHzD2Wnqj5B0zFCRU3XPXE09wzzQZgV1qQ",
  },
];

const recentEvents = [
  {
    title: "Electronic Peak Festival",
    location: "Luna Park, Buenos Aires",
    date: "15 OCT",
    price: "$45",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCc2huD7eMSqHx9duADl5kCua3UlbMR19lZabjtVWIXG9LFVBuYT5bE5CWKy7SAa2_F0AiIXfEU6aGQf6_1VKgVrO-Yv8WjrCNsc5yVHEUSFgwBRicCTLmwjeRXa-s3h-q4oqTl5PbgrYavtGnDOYql5C1x7UCn4Rp6fJamegMrKFtPbYPsarytTq-WmtkStpyKsgksfl8tRTuNKIME50Jx-1882orsFFwcTgdX_KhkJTeqvPRz4QVAxQu87P_O9gk5uiTQjAO9Lcbw",
  },
  {
    title: "Comedy Night Special",
    location: "Teatro Opera, CABA",
    date: "22 OCT",
    price: "$28",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA2OMTEilICLdwWMf6KrcMZ3_1eT1IVjZMrgTKqjw7NZip7hf3CBy2KXi6RJT0MA0TfBdmsznBWYnSbjsrQLegLovej8ou946rH995RwSbyLhlNom52nD-0LTSwCv4XtB2VmGY0Vfp0OAN00HihmHUFHybkmacVd3bN1kixRVXni0ZjNA3lucZN2rsPdEB_wOSw0naQumLF8AH2_6phMchCiHwDBT2yRL32EgetfhjQkX6WeiWHOxGWCyBCktQbKC7vI9sZDick_Kmw",
  },
  {
    title: "Sinfónica Nacional",
    location: "Centro Cultural Kirchner",
    date: "28 OCT",
    price: "$35",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDx4zzIwrT_AGyyCH7iwL-YUq1P93G9xG7MgmYJFiMts6mwgDba-dgpEndWarjPULRJVqauXAzn23xSeu_mdLjsp8UNKinlmk20mkbplkG5hWeapYIv9Y9wrmWkRgUIwLSj_4gNvqrlXT8rB5TApgjb2UAq4Fab3z-h5r6UxCKqOKPdHCgXW-a6CICetFGziySJeHGUBbuCck3fUyHxxELOKC-_Dx4wMr-_2ssikAUFcb8Vv0EFKKVHs7VWlD_aOaA88nzM65l0YXBU",
  },
  {
    title: "Final Torneo Apertura",
    location: "Estadio Monumental",
    date: "05 NOV",
    price: "$60",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3XwFJ6KewFqxJmxoWsQL-P7vW-1NC0C0xhuIGcau1r4kNzXq1cU06IivyQIiPLNs4Ld2q8agZi1l0ORGbnMI13w3VieloVqT_RKRsStzAk9KdwGRirstDAtAPEi6tMpFPTk_A2mDjkvTS1GBIRmeQXpxYGqErsX39dYU8DbiW_YLcSvrbW5KgpNso1bVei7pIQ6w1RZSMeDK1w_K-lTK-TUUKGtbvM_-2xQcrzjaUPEy-4x6HWkyzA5sM0b4H8y4SCW8sPIwKPpLx",
  },
];

export function Start() {
  const navigate = useNavigate();
  const { user, isAuth } = useAuth();

  const [search, setSearch] = useState("");

  const isOrganizer =
    user?.role === "organizer" ||
    user?.role === "ORGANIZER" ||
    user?.roles?.includes?.("organizer") ||
    user?.roles?.includes?.("ORGANIZER");

  const sellPath = isAuth
    ? isOrganizer
      ? "/dashboard"
      : "/my-profile"
    : "/register?role=ORGANIZER";

  function handleSearchSubmit(event) {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      navigate("/events");
      return;
    }

    navigate(`/events?search=${encodeURIComponent(value)}`);
  }

  function goToCategory(category) {
    navigate(`/events?category=${encodeURIComponent(category)}`);
  }

  return (
    <div className="ticketify-page bg-[#f3faff] text-[#001f29] selection:bg-[#d62839] selection:text-white">
      <style>{`
        .tf-hero-overlay {
          background: linear-gradient(rgba(0, 31, 41, 0.4), rgba(0, 31, 41, 0.6));
        }

        .tf-card-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .tf-card-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 34px rgba(23, 86, 118, 0.12);
        }
      `}</style>

      {/* Hero */}
      <section className="relative flex h-[640px] items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNt1Hu2yPobU5fZEpGQMWPL8NtQWlKhRvJ5Sa45XeCTMGAOPHNBTBnyY6bCkefst5Fchgfe1-xcM1UVVy5CxVBQTlRRI3GsHBLpEqmAdn-3jfYDGdHDo49DH9WlGSQbQewxrubUHiR6Zf-ZmZKG43y58GaIjKR6sr7V0zLT8zQzjOkKWHFhz5GSH4dmj_IOx6CAqY27tBaGjXKrjfiWOHCroIILd3CMEhk7CoA3iQVZQEQvQ4_SFoLejonPpezNwgGvl2C4huY2lfS"
            alt="Festival de música al atardecer"
          />
          <div className="tf-hero-overlay absolute inset-0" />
        </div>

        <div className="tf-container relative z-10 text-white">
          <div className="max-w-2xl">
            <h1 className="mb-6 text-[32px] font-extrabold leading-[40px] tracking-[-0.01em] md:text-[48px] md:leading-[56px] md:tracking-[-0.02em]">
              EXPERIENCE THE FUTURE
            </h1>

            <p className="mb-10 max-w-lg text-[18px] font-normal leading-7 opacity-90">
              Seamless ticketing and effortless discovery. Find your next
              unforgettable experience or sell tickets to your own event with
              ease.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/events"
                className="rounded-lg bg-[#d62839] px-8 py-4 text-[24px] font-bold leading-8 text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
              >
                Explorar eventos
              </Link>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("categories")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="rounded-lg border-2 border-white/40 px-8 py-4 text-[24px] font-bold leading-8 text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-95"
              >
                Ver categorías
              </button>

              <Link
                to={sellPath}
                className="ml-2 text-[14px] font-semibold leading-5 tracking-[0.05em] underline-offset-4 hover:underline"
              >
                Vender entradas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="tf-container relative z-20 -mt-16">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col items-center gap-4 rounded-xl border border-[#c9eeff] bg-white p-6 shadow-xl md:flex-row md:p-8"
        >
          <div className="relative w-full flex-grow">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#3e7697]">
              search
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-transparent bg-[#e5f6ff] py-4 pl-12 pr-4 text-[#001f29] outline-none placeholder:text-[#5b403f] focus:border-[#215d7d]"
              placeholder="Buscar artistas, eventos, categorías o ciudades"
              type="text"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#215d7d] px-10 py-4 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:brightness-110 active:scale-95 md:w-auto"
          >
            Buscar
          </button>
        </form>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {["Música", "Deportes", "Teatro", "Stand-up", "Festivales"].map(
            (chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => goToCategory(chip)}
                className="rounded-full bg-[#baeaff] px-6 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#215d7d] transition-all hover:bg-[#215d7d] hover:text-white"
              >
                {chip}
              </button>
            )
          )}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="tf-container py-20">
        <h2 className="mb-10 text-[32px] font-bold leading-10 text-[#001f29]">
          Explora por categorías
        </h2>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => goToCategory(category.query)}
              className="tf-card-lift group cursor-pointer text-left"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-[#e5f6ff]">
                <img
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src={category.image}
                  alt={category.name}
                />
                <div className="absolute inset-0 bg-[#001f29]/20 transition-colors group-hover:bg-[#001f29]/10" />
              </div>

              <p className="text-center text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#001f29]">
                {category.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Recent events */}
      <section className="bg-[#e5f6ff] py-20">
        <div className="tf-container">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-[32px] font-bold leading-10 text-[#001f29]">
                Eventos recientes
              </h2>

              <p className="text-[16px] leading-6 text-[#5b403f]">
                Descubre lo último en entretenimiento
              </p>
            </div>

            <Link
              to="/events"
              className="flex items-center gap-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#b20024] hover:underline"
            >
              Ver todo
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {recentEvents.map((event) => (
              <article
                key={event.title}
                className="tf-card-lift group flex h-full flex-col overflow-hidden rounded-xl border border-[#c9eeff] bg-white shadow-sm"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={event.image}
                    alt={event.title}
                  />
                  <span className="absolute left-4 top-4 rounded-lg bg-white px-3 py-1 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#001f29] shadow-sm">
                    {event.date}
                  </span>
                </div>

                <div className="flex flex-grow flex-col p-5">
                  <h3 className="mb-1 text-[24px] font-bold leading-8 text-[#001f29]">
                    {event.title}
                  </h3>

                  <p className="mb-4 text-sm text-[#5b403f]">
                    {event.location}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-4">
                    <p className="text-[20px] font-bold leading-6 text-[#b20024]">
                      Desde {event.price}
                    </p>

                    <Link
                      to="/events"
                      className="rounded-lg bg-[#d62839] px-4 py-2 text-[14px] font-semibold leading-5 tracking-[0.05em] text-white transition-all hover:brightness-110 active:scale-95"
                    >
                      Ver evento
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="tf-container py-20 text-center">
        <h2 className="mb-16 text-[32px] font-bold leading-10 text-[#001f29]">
          ¿Por qué elegir Ticketify?
        </h2>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <Feature
            icon="verified_user"
            title="Compra segura"
            text="Garantizamos la autenticidad de cada entrada con nuestro sistema de verificación de última tecnología."
          />

          <Feature
            icon="qr_code_2"
            title="Entradas instantáneas"
            text="Recibe tus entradas digitales directamente en tu perfil y correo segundos después de tu compra."
          />

          <Feature
            icon="explore"
            title="Descubrimiento rápido"
            text="Navega fácilmente por miles de eventos con nuestros filtros inteligentes y recomendaciones personalizadas."
          />
        </div>
      </section>

      {/* Seller CTA */}
      <section className="tf-container py-20">
        <div className="relative overflow-hidden rounded-2xl bg-[#001f29] p-12 text-center md:p-20">
          <div className="absolute inset-0 opacity-20">
            <img
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAp8E09tm_mTC8hqWuiXg5cNM6sm7udQSafBIprL1ULjKPuAqlGKWoa54ULYCbWB0u_axz4w7GXWiUPPV2mkXfCA3LAvq__2WnerQXLFsVCeKsTPBsgncHGyawQpMHTroCfo8rVaPKqQKo9ZP_P9D1YCpESJu6_dYpnE_owlxiEyciGUGeQk9dDXsGOHMmMbB2XOa4xSmDr9EIZwddD9n5jTG3U7Lzn1B7DILHNWCfCrhqdcl2_EVBz2yRuReZZlXHJ4XDTVB276EKz"
              alt="Backstage de evento"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-6 text-[32px] font-bold leading-10 text-white">
              ¿Eres organizador de eventos?
            </h2>

            <p className="mb-10 text-[18px] leading-7 text-[#baeaff]">
              Vende tus entradas con la plataforma más confiable del mercado.
              Accede a herramientas de análisis y gestión en tiempo real.
            </p>

            <Link
              to={sellPath}
              className="inline-flex rounded-lg bg-[#d62839] px-10 py-4 text-[24px] font-bold leading-8 text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
            >
              Empezar a vender
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#d8f2ff] text-[#b20024]">
        <span
          className="material-symbols-outlined text-4xl"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          {icon}
        </span>
      </div>

      <h3 className="mb-3 text-[24px] font-bold leading-8 text-[#001f29]">
        {title}
      </h3>

      <p className="max-w-xs text-[16px] leading-6 text-[#5b403f]">
        {text}
      </p>
    </div>
  );
}