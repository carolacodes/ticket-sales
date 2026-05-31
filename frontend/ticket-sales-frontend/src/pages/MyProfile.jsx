import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMercadoPago } from "@/hooks/useMercadoPago";
import { useAuth } from "@/hooks/useAuth";

import {
  getMeRequest,
  updateMeRequest,
  updateRoleRequest,
  deleteMeRequest,
  uploadMyAvatarRequest,
} from "@/api/user.api";

import {
  resendVerificationRequest,
  changePasswordRequest,
  setPasswordRequest,
  forgotPasswordRequest,
} from "@/api/auth.api";

function initials(str = "") {
  const value = String(str || "").trim();

  if (!value) return "U";

  const parts = value.split(" ").filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || parts[0]?.[1] || "";

  return `${first}${second}`.toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeRole(role = "") {
  return String(role || "").toUpperCase();
}

const LS_AVATAR_KEY = (userId) => `ticketify_avatarUrl:${userId}`;

export function MyProfile() {
  const navigate = useNavigate();

  const { user: ctxUser, setUser: setCtxUser, logout } = useAuth();
  const { connected, loading: mpLoading, connect } = useMercadoPago();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [me, setMe] = useState(null);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [selectedRole, setSelectedRole] = useState("BUYER");
  const [switchingRole, setSwitchingRole] = useState(false);

  const [persistedAvatarUrl, setPersistedAvatarUrl] = useState("");
  const [avatarV, setAvatarV] = useState(0);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarErr, setAvatarErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErr, setPasswordErr] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [forgotSending, setForgotSending] = useState(false);
  const [forgotErr, setForgotErr] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWord, setDeleteWord] = useState("");

  const displayUser = useMemo(() => {
    const base = me || ctxUser || null;

    if (!base) return null;

    return {
      ...base,
      avatarUrl: base.avatarUrl || persistedAvatarUrl || "",
      hasPassword: Boolean(base.hasPassword),
    };
  }, [me, ctxUser, persistedAvatarUrl]);

  const avatarSrc = displayUser?.avatarUrl
    ? `${displayUser.avatarUrl}${displayUser.avatarUrl.includes("?") ? "&" : "?"}v=${avatarV}`
    : "";

  const passwordsMatch = newPassword === confirmNewPassword;

  const canChangePassword =
    currentPassword.trim() &&
    newPassword.trim() &&
    confirmNewPassword.trim() &&
    passwordsMatch;

  const canSetPassword =
    newPassword.trim() && confirmNewPassword.trim() && passwordsMatch;

  const canDelete = deleteWord.trim().toUpperCase() === "DELETE";

  const securityLevel = useMemo(() => {
    let score = 35;

    if (displayUser?.emailVerified) score += 25;
    if (displayUser?.hasPassword) score += 20;
    if (displayUser?.avatarUrl) score += 10;
    if (connected) score += 10;

    return Math.min(100, score);
  }, [displayUser, connected]);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);

        const response = await getMeRequest();
        const user = response.data?.user ?? response.data ?? null;

        if (!alive) return;

        const userId = user?._id || user?.id;

        let cachedAvatar = "";

        if (userId) {
          try {
            cachedAvatar = localStorage.getItem(LS_AVATAR_KEY(userId)) || "";
          } catch (error) {
            console.log("LS_READ_AVATAR_ERR", error);
          }
        }

        const patchedUser =
          user && !user.avatarUrl && cachedAvatar
            ? { ...user, avatarUrl: cachedAvatar }
            : user;

        setMe(patchedUser);
        setCtxUser?.(patchedUser);

        setUsername(user?.username || "");
        setFullName(user?.fullName || user?.name || user?.username || "");
        setEmail(user?.email || "");
        setSelectedRole(normalizeRole(user?.role) || "BUYER");

        if (userId && user?.avatarUrl) {
          try {
            localStorage.setItem(LS_AVATAR_KEY(userId), user.avatarUrl);
          } catch (error) {
            console.log("LS_WRITE_AVATAR_ERR", error);
          }

          setPersistedAvatarUrl(user.avatarUrl);
        } else if (cachedAvatar) {
          setPersistedAvatarUrl(cachedAvatar);
        }
      } catch (error) {
        console.log("GET_ME_ERR", error?.response?.data || error?.message);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [setCtxUser]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function clearPasswordMessages() {
    setPasswordErr("");
    setPasswordSuccess("");
  }

  function clearForgotMessages() {
    setForgotErr("");
    setForgotSuccess("");
  }

  function resetPasswordForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  async function saveProfile() {
    try {
      setSavingProfile(true);

      const response = await updateMeRequest({
        username,
        fullName,
        email,
      });

      const updatedUser = response.data?.user ?? response.data ?? null;

      const mergedUser = updatedUser
        ? {
            ...updatedUser,
            avatarUrl: updatedUser.avatarUrl || persistedAvatarUrl,
          }
        : displayUser;

      setMe(mergedUser);
      setCtxUser?.(mergedUser);
    } catch (error) {
      console.log("SAVE_PROFILE_ERR", error?.response?.data || error?.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveRole() {
    try {
      setSwitchingRole(true);

      const response = await updateRoleRequest(selectedRole);
      const updatedUser = response.data?.user ?? null;

      const accessToken = response.data?.accessToken;

      if (accessToken) {
        const { setAccessToken } = await import("@/libs/token.js");
        setAccessToken(accessToken);
      }

      const mergedUser = updatedUser
        ? {
            ...updatedUser,
            avatarUrl: updatedUser.avatarUrl || persistedAvatarUrl,
          }
        : displayUser;

      setMe(mergedUser);
      setCtxUser?.(mergedUser);
    } catch (error) {
      console.log("SWITCH_ROLE_ERR", error?.response?.data || error?.message);
    } finally {
      setSwitchingRole(false);
    }
  }

  async function resendVerification() {
    try {
      await resendVerificationRequest(displayUser?.email);
      window.open("/verify-email", "_blank", "noopener,noreferrer");
    } catch (error) {
      console.log(
        "RESEND_VERIFICATION_ERR",
        error?.response?.data || error?.message
      );
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!passwordsMatch) {
      setPasswordErr("Las contraseñas nuevas no coinciden.");
      setPasswordSuccess("");
      return;
    }

    try {
      setPasswordSaving(true);
      clearPasswordMessages();
      clearForgotMessages();

      if (displayUser?.hasPassword) {
        await changePasswordRequest({
          currentPassword,
          newPassword,
        });

        setPasswordSuccess("Contraseña actualizada correctamente.");
      } else {
        await setPasswordRequest({
          newPassword,
        });

        const nextUser = displayUser
          ? {
              ...displayUser,
              hasPassword: true,
            }
          : displayUser;

        if (nextUser) {
          setMe(nextUser);
          setCtxUser?.(nextUser);
        }

        setPasswordSuccess("Contraseña creada correctamente.");
      }

      resetPasswordForm();
    } catch (error) {
      setPasswordErr(
        error?.response?.data?.message || "No se pudo actualizar la contraseña."
      );
      setPasswordSuccess("");
      console.log("PASSWORD_ERR", error?.response?.data || error?.message);
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleForgotPassword() {
    try {
      setForgotSending(true);
      clearForgotMessages();
      clearPasswordMessages();

      await forgotPasswordRequest(displayUser?.email);

      setForgotSuccess("Te enviamos un link de recuperación a tu email.");
    } catch (error) {
      setForgotErr(
        error?.response?.data?.message ||
          "No se pudo enviar el email de recuperación."
      );
      console.log("FORGOT_PASSWORD_ERR", error?.response?.data || error?.message);
    } finally {
      setForgotSending(false);
    }
  }

  function onPickAvatar(file) {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setAvatarErr("Seleccioná una imagen válida.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setAvatarErr("La imagen es demasiado pesada. Máximo 4MB.");
      return;
    }

    setAvatarErr("");
    setAvatarFile(file);

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(URL.createObjectURL(file));
  }

  function clearAvatarPick() {
    setAvatarFile(null);
    setAvatarErr("");

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview("");
  }

  async function uploadAvatar() {
    if (!avatarFile) {
      setAvatarErr("Elegí una imagen primero.");
      return;
    }

    try {
      setAvatarUploading(true);
      setAvatarErr("");

      const response = await uploadMyAvatarRequest(avatarFile);

      const updatedUser = response.data?.user ?? null;
      const avatarUrlFromApi = response.data?.avatarUrl;

      const nextUser = updatedUser
        ? updatedUser
        : displayUser
          ? {
              ...displayUser,
              avatarUrl: avatarUrlFromApi || displayUser.avatarUrl,
            }
          : null;

      if (nextUser?.avatarUrl) {
        const userId = nextUser?._id || nextUser?.id;

        if (userId) {
          try {
            localStorage.setItem(LS_AVATAR_KEY(userId), nextUser.avatarUrl);
          } catch (error) {
            console.log("LS_WRITE_AVATAR_ERR", error);
          }
        }

        setPersistedAvatarUrl(nextUser.avatarUrl);
        setAvatarV((value) => value + 1);
      }

      if (nextUser) {
        setMe(nextUser);
        setCtxUser?.(nextUser);
      }

      setAvatarOpen(false);
      clearAvatarPick();
    } catch (error) {
      setAvatarErr(error?.response?.data?.message || "No se pudo subir la foto.");
      console.log("UPLOAD_AVATAR_ERR", error?.response?.data || error?.message);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function confirmDelete() {
    if (!canDelete) return;

    try {
      const userId = displayUser?._id || displayUser?.id;

      if (userId) {
        try {
          localStorage.removeItem(LS_AVATAR_KEY(userId));
        } catch (error) {
          console.log("LS_REMOVE_AVATAR_ERR", error);
        }
      }

      await deleteMeRequest();
      await logout?.();

      navigate("/start");
    } catch (error) {
      console.log("DELETE_ME_ERR", error?.response?.data || error?.message);
    } finally {
      setDeleteOpen(false);
      setDeleteWord("");
    }
  }

  if (loading) {
    return (
      <div className="ticketify-profile bg-[#f3faff] text-[#001f29]">
        <ProfileStyles />

        <main className="tf-container py-10">
          <div className="profile-shadow rounded-xl border border-[#d8f2ff] bg-white p-6">
            <div className="h-8 w-56 animate-pulse rounded bg-[#d8f2ff]" />

            <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
              <div className="h-80 animate-pulse rounded-xl bg-[#d8f2ff]" />
              <div className="h-80 animate-pulse rounded-xl bg-[#d8f2ff]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ticketify-profile bg-[#f3faff] text-[#001f29]">
      <ProfileStyles />

      <main className="tf-container py-8 md:py-10">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
          <aside className="space-y-6 md:col-span-4 lg:col-span-4 xl:col-span-4">
            <section className="profile-shadow fade-in-up rounded-lg border border-[#e4bdbc] bg-white p-6">
              <div className="flex flex-col items-center text-center">
                <div className="group relative mb-4">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-[#d8f2ff] bg-[#e5f6ff] shadow-lg">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                        onError={() => setAvatarV((value) => value + 1)}
                      />
                    ) : (
                      <span className="text-3xl font-extrabold text-[#215d7d]">
                        {initials(
                          displayUser?.username || displayUser?.email || ""
                        )}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAvatarErr("");
                      setAvatarOpen(true);
                    }}
                    className="absolute bottom-0 right-0 rounded-full bg-[#b20024] p-2 text-white shadow-md transition-transform hover:scale-105"
                    aria-label="Editar foto"
                  >
                    <span className="material-symbols-outlined text-sm">
                      edit
                    </span>
                  </button>
                </div>

                <h1 className="text-[24px] font-bold leading-8 text-[#001f29]">
                  {displayUser?.fullName ||
                    displayUser?.name ||
                    displayUser?.username ||
                    "Usuario"}
                </h1>

                <p className="mb-6 text-[16px] leading-6 text-[#5b403f]">
                  {normalizeRole(displayUser?.role) === "ORGANIZER"
                    ? "Vendedor"
                    : "Comprador"}
                </p>

                {!displayUser?.emailVerified ? (
                  <div className="animate-pulse-subtle mb-6 w-full rounded-lg border border-[#ba1a1a]/20 bg-[#ffdad6] p-4">
                    <p className="mb-3 text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#93000a]">
                      Verificá tu email para proteger tu cuenta
                    </p>

                    <button
                      type="button"
                      onClick={resendVerification}
                      className="w-full rounded-md bg-[#d62839] py-2 text-[14px] font-bold leading-5 tracking-[0.05em] text-white transition-all hover:shadow-lg active:scale-95"
                    >
                      Verificar email
                    </button>
                  </div>
                ) : (
                  <div className="mb-6 w-full rounded-lg border border-green-200 bg-green-100 p-4">
                    <p className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-green-700">
                      Email verificado
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAvatarErr("");
                    setAvatarOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-[#215d7d] py-2 text-[14px] font-bold leading-5 tracking-[0.05em] text-[#215d7d] transition-colors hover:bg-[#e5f6ff]"
                >
                  <span className="material-symbols-outlined text-base">
                    photo_camera
                  </span>
                  Cambiar foto
                </button>
              </div>
            </section>

            <section className="rounded-lg bg-[#3e7697] p-6 text-white">
              <div className="mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined">verified_user</span>
                <h3 className="text-[20px] font-bold leading-6">
                  Nivel de Seguridad
                </h3>
              </div>

              <div className="mb-2 h-2 w-full rounded-full bg-[#d8f2ff]/30">
                <div
                  className="h-full rounded-full bg-[#eef6ff]"
                  style={{ width: `${securityLevel}%` }}
                />
              </div>

              <p className="text-[14px] font-semibold leading-5 tracking-[0.05em] opacity-90">
                Tu perfil está completo al {securityLevel}%. ¡Casi listo!
              </p>
            </section>
          </aside>

          <div className="fade-in-up space-y-8 md:col-span-8 lg:col-span-8 xl:col-span-8">
            <SectionCard icon="person" title="Información personal">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <InputField
                    label="Nombre de usuario"
                    value={username}
                    onChange={setUsername}
                    placeholder="tu_usuario"
                  />

                  <InputField
                    label="Nombre completo"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Tu nombre"
                  />

                  <div className="md:col-span-2">
                    <InputField
                      label="Correo electrónico"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div className="border-t border-[#e4bdbc] pt-4">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="rounded-lg bg-[#b20024] px-6 py-3 text-[14px] font-bold leading-5 tracking-[0.05em] text-white transition-all hover:shadow-xl active:scale-95 disabled:opacity-60"
                  >
                    {savingProfile ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon="lock" title="Seguridad">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="grid max-w-md grid-cols-1 gap-4">
                  {displayUser?.hasPassword ? (
                    <input
                      className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-[#001f29] outline-none focus:border-[#215d7d] focus:ring-1 focus:ring-[#215d7d]"
                      placeholder="Contraseña actual"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => {
                        setCurrentPassword(event.target.value);
                        clearPasswordMessages();
                      }}
                      autoComplete="current-password"
                    />
                  ) : null}

                  <input
                    className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-[#001f29] outline-none focus:border-[#215d7d] focus:ring-1 focus:ring-[#215d7d]"
                    placeholder="Nueva contraseña"
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      clearPasswordMessages();
                    }}
                    autoComplete="new-password"
                  />

                  <input
                    className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-[#001f29] outline-none focus:border-[#215d7d] focus:ring-1 focus:ring-[#215d7d]"
                    placeholder="Confirmar nueva contraseña"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(event) => {
                      setConfirmNewPassword(event.target.value);
                      clearPasswordMessages();
                    }}
                    autoComplete="new-password"
                  />
                </div>

                {confirmNewPassword && !passwordsMatch ? (
                  <AlertBox type="warning">
                    Las contraseñas nuevas no coinciden.
                  </AlertBox>
                ) : null}

                {passwordErr ? (
                  <AlertBox type="error">{passwordErr}</AlertBox>
                ) : null}

                {passwordSuccess ? (
                  <AlertBox type="success">{passwordSuccess}</AlertBox>
                ) : null}

                {forgotErr ? <AlertBox type="error">{forgotErr}</AlertBox> : null}

                {forgotSuccess ? (
                  <AlertBox type="success">{forgotSuccess}</AlertBox>
                ) : null}

                <div className="flex flex-col items-start gap-4 pt-4 md:flex-row md:items-center">
                  <button
                    type="submit"
                    disabled={
                      passwordSaving ||
                      (displayUser?.hasPassword
                        ? !canChangePassword
                        : !canSetPassword)
                    }
                    className="rounded-lg bg-[#215d7d] px-6 py-3 text-[14px] font-bold leading-5 tracking-[0.05em] text-white transition-all hover:opacity-90 disabled:opacity-60"
                  >
                    {passwordSaving
                      ? "Actualizando..."
                      : displayUser?.hasPassword
                        ? "Actualizar contraseña"
                        : "Crear contraseña"}
                  </button>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotSending}
                    className="text-[14px] font-bold leading-5 tracking-[0.05em] text-[#b20024] transition-colors hover:underline disabled:opacity-60"
                  >
                    {forgotSending
                      ? "Enviando..."
                      : "¿Olvidaste tu contraseña?"}
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard icon="badge" title="Rol de cuenta">
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <RoleOption
                  active={selectedRole === "BUYER"}
                  icon="shopping_cart"
                  title="Comprador"
                  text="Acceso ilimitado a compra de eventos, preventas exclusivas y historial de pedidos."
                  onClick={() => setSelectedRole("BUYER")}
                />

                <RoleOption
                  active={selectedRole === "ORGANIZER"}
                  icon="sell"
                  title="Vendedor"
                  text="Publicá tus entradas, gestioná ventas y recibí pagos de forma segura en tu billetera."
                  onClick={() => setSelectedRole("ORGANIZER")}
                />
              </div>

              <button
                type="button"
                onClick={saveRole}
                disabled={switchingRole}
                className="rounded-lg bg-[#001f29] px-6 py-3 text-[14px] font-bold leading-5 tracking-[0.05em] text-[#f3faff] transition-all hover:bg-[#5b403f] disabled:opacity-60"
              >
                {switchingRole ? "Guardando..." : "Guardar rol"}
              </button>
            </SectionCard>

            <SectionCard icon="payments" title="Mercado Pago" titleColor="#009EE3">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="flex-1">
                  {mpLoading ? (
                    <span className="mb-4 inline-flex rounded bg-[#e5f6ff] px-2 py-1 text-[14px] font-bold leading-5 tracking-[0.05em] text-[#215d7d]">
                      Verificando conexión...
                    </span>
                  ) : connected ? (
                    <span className="mb-4 inline-flex rounded bg-green-100 px-2 py-1 text-[14px] font-bold leading-5 tracking-[0.05em] text-green-700">
                      Conectado
                    </span>
                  ) : (
                    <span className="mb-4 inline-flex rounded bg-[#ba1a1a]/10 px-2 py-1 text-[14px] font-bold leading-5 tracking-[0.05em] text-[#ba1a1a]">
                      No conectado
                    </span>
                  )}

                  <p className="mb-6 text-[16px] leading-6 text-[#5b403f]">
                    Conecta tu cuenta de Mercado Pago para procesar pagos de forma segura si decides vender tus entradas.
                  </p>

                  {!connected ? (
                    <button
                      type="button"
                      onClick={connect}
                      disabled={mpLoading}
                      className="flex items-center gap-2 rounded-lg bg-[#009EE3] px-6 py-3 text-[14px] font-bold leading-5 tracking-[0.05em] text-white transition-all hover:opacity-90 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined">link</span>
                      Conectar Mercado Pago
                    </button>
                  ) : null}
                </div>

                <div className="hidden w-48 opacity-20 lg:block">
                  <span className="material-symbols-outlined text-[160px]">
                    account_balance_wallet
                  </span>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon="history" title="Actividad de la cuenta">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-[#e4bdbc] py-3">
                  <span className="font-bold text-[#5b403f]">
                    Miembro desde
                  </span>

                  <span className="text-[#001f29]">
                    {formatDate(displayUser?.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between py-3">
                  <span className="font-bold text-[#5b403f]">
                    Último inicio de sesión
                  </span>

                  <span className="text-[#001f29]">
                    {formatDateTime(displayUser?.lastLoginAt)}
                  </span>
                </div>
              </div>
            </SectionCard>

            <section className="rounded-lg border-2 border-[#ba1a1a]/50 bg-[#ffdad6]/20 p-6">
              <div className="mb-4 flex items-center gap-2 text-[#ba1a1a]">
                <span className="material-symbols-outlined">warning</span>
                <h2 className="text-[24px] font-bold leading-8">
                  Zona peligrosa
                </h2>
              </div>

              <p className="mb-6 text-[16px] leading-6 text-[#5b403f]">
                Una vez que elimines tu cuenta, no hay vuelta atrás. Se perderán todos tus tickets activos, historial de compras y beneficios acumulados.
              </p>

              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="hover-shake rounded-lg bg-[#ba1a1a] px-6 py-3 text-[14px] font-bold leading-5 tracking-[0.05em] text-white shadow-md transition-all"
              >
                Eliminar cuenta permanentemente
              </button>
            </section>
          </div>
        </div>
      </main>

      {avatarOpen ? (
        <AvatarModal
          avatarPreview={avatarPreview}
          avatarErr={avatarErr}
          avatarUploading={avatarUploading}
          onPickAvatar={onPickAvatar}
          onUpload={uploadAvatar}
          onClose={() => {
            setAvatarOpen(false);
            clearAvatarPick();
          }}
          onClear={clearAvatarPick}
        />
      ) : null}

      {deleteOpen ? (
        <DeleteModal
          value={deleteWord}
          setValue={setDeleteWord}
          canDelete={canDelete}
          onConfirm={confirmDelete}
          onClose={() => {
            setDeleteOpen(false);
            setDeleteWord("");
          }}
        />
      ) : null}
    </div>
  );
}

function ProfileStyles() {
  return (
    <style>{`
      .profile-shadow {
        box-shadow: 0px 4px 20px rgba(23, 86, 118, 0.08);
      }

      @keyframes pulse-subtle {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.03);
          opacity: 0.9;
        }
      }

      .animate-pulse-subtle {
        animation: pulse-subtle 2s infinite ease-in-out;
      }

      @keyframes soft-shake {
        0%, 100% {
          transform: translateX(0);
        }
        25% {
          transform: translateX(-2px);
        }
        75% {
          transform: translateX(2px);
        }
      }

      .hover-shake:hover {
        animation: soft-shake 0.3s ease-in-out infinite;
      }

      @keyframes fadeInUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
      }

      @media (prefers-reduced-motion: reduce) {
        .fade-in-up,
        .animate-pulse-subtle,
        .hover-shake:hover {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function SectionCard({ icon, title, titleColor = "#215d7d", children }) {
  return (
    <section className="profile-shadow rounded-lg border border-[#e4bdbc] bg-white p-6">
      <div
        className="mb-6 flex items-center gap-2"
        style={{ color: titleColor }}
      >
        <span className="material-symbols-outlined">{icon}</span>
        <h2 className="text-[24px] font-bold leading-8">{title}</h2>
      </div>

      {children}
    </section>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
        {label}
      </label>

      <input
        className="h-12 w-full rounded-lg border border-[#e4bdbc] bg-[#f3faff] px-4 text-[#001f29] outline-none focus:border-[#215d7d] focus:ring-1 focus:ring-[#215d7d]"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function RoleOption({ active, icon, title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative rounded-lg border-2 p-6 text-left transition-colors",
        active
          ? "border-[#b20024] bg-[#d62839]/5"
          : "border-[#e4bdbc] hover:border-[#215d7d]",
      ].join(" ")}
    >
      <div className="mb-2 flex items-start justify-between">
        <span
          className={[
            "material-symbols-outlined text-3xl",
            active ? "text-[#b20024]" : "text-[#215d7d]",
          ].join(" ")}
        >
          {icon}
        </span>

        {active ? (
          <span className="rounded-full bg-[#b20024] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            Activo
          </span>
        ) : null}
      </div>

      <h3 className="mb-2 text-[20px] font-bold leading-6 text-[#001f29]">
        {title}
      </h3>

      <p className="text-[14px] font-semibold leading-5 tracking-[0.05em] text-[#5b403f]">
        {text}
      </p>
    </button>
  );
}

function AlertBox({ type = "error", children }) {
  const classes = {
    error: "border-[#ffdad6] bg-[#ffdad6] text-[#93000a]",
    success: "border-green-200 bg-green-100 text-green-700",
    warning: "border-yellow-200 bg-yellow-100 text-yellow-700",
  };

  return (
    <div
      className={[
        "rounded-lg border px-4 py-3 text-sm font-semibold",
        classes[type],
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function AvatarModal({
  avatarPreview,
  avatarErr,
  avatarUploading,
  onPickAvatar,
  onUpload,
  onClose,
  onClear,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[#d8f2ff] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[14px] font-bold uppercase tracking-widest text-[#215d7d]">
              Foto de perfil
            </p>

            <h2 className="mt-1 text-[24px] font-bold leading-8 text-[#001f29]">
              Cambiar foto
            </h2>

            <p className="mt-1 text-sm text-[#5b403f]">
              PNG, JPG o WebP. Máximo 4MB.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4bdbc] text-[#5b403f] hover:bg-[#e5f6ff]"
          >
            ✕
          </button>
        </div>

        <div className="my-5 h-px bg-[#e4bdbc]" />

        {avatarPreview ? (
          <div className="mx-auto h-40 w-40 overflow-hidden rounded-full border border-[#e4bdbc] bg-[#e5f6ff]">
            <img
              src={avatarPreview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-[#e4bdbc] bg-[#f3faff] p-5 text-sm text-[#5b403f]">
            Elegí una imagen para previsualizarla acá.
          </div>
        )}

        <input
          id="avatar-file"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onPickAvatar(event.target.files?.[0] || null)}
        />

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => document.getElementById("avatar-file")?.click()}
            disabled={avatarUploading}
            className="rounded-lg border border-[#215d7d] px-4 py-2 text-sm font-bold text-[#215d7d] hover:bg-[#e5f6ff] disabled:opacity-60"
          >
            Elegir archivo
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={avatarUploading || !avatarPreview}
            className="rounded-lg border border-[#e4bdbc] px-4 py-2 text-sm font-bold text-[#5b403f] hover:bg-[#e5f6ff] disabled:opacity-60"
          >
            Limpiar
          </button>
        </div>

        {avatarErr ? <AlertBox type="error">{avatarErr}</AlertBox> : null}

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={onUpload}
            disabled={avatarUploading || !avatarPreview}
            className="h-12 rounded-lg bg-[#d62839] font-bold text-white hover:bg-[#b20024] disabled:opacity-60"
          >
            {avatarUploading ? "Subiendo..." : "Subir foto"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={avatarUploading}
            className="h-12 rounded-lg border border-[#e4bdbc] font-bold text-[#5b403f] hover:bg-[#e5f6ff]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ value, setValue, canDelete, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[#ba1a1a]/40 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] font-bold uppercase tracking-widest text-[#ba1a1a]">
              Acción permanente
            </p>

            <h2 className="mt-1 text-[24px] font-bold leading-8 text-[#ba1a1a]">
              Eliminar cuenta
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4bdbc] text-[#5b403f] hover:bg-[#e5f6ff]"
          >
            ✕
          </button>
        </div>

        <p className="mt-5 text-sm leading-6 text-[#5b403f]">
          Esta acción eliminará tu cuenta y puede afectar tus tickets, historial
          de compras y datos asociados. Para confirmar, escribí{" "}
          <strong>DELETE</strong>.
        </p>

        <input
          className="mt-5 h-12 w-full rounded-lg border border-[#ba1a1a]/40 bg-[#f3faff] px-4 text-[#001f29] outline-none focus:border-[#ba1a1a]"
          placeholder="Escribí DELETE para confirmar"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canDelete}
            className="h-12 rounded-lg bg-[#ba1a1a] font-bold text-white hover:bg-[#93000a] disabled:opacity-60"
          >
            Confirmar eliminación
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg border border-[#e4bdbc] font-bold text-[#5b403f] hover:bg-[#e5f6ff]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}