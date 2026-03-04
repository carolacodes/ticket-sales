// MyProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import {
  getMeRequest,
  updateMeRequest,
  updateRoleRequest,
  deleteMeRequest,
  uploadMyAvatarRequest,
} from "@/api/user.api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { resendVerificationRequest } from "@/api/auth.api";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, CheckCircle2, Shield, Trash2 } from "lucide-react";

/* =========================
   Helpers
========================= */
function initials(str = "") {
  const s = (str || "").trim();
  if (!s) return "U";
  const parts = s.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return (a + b).toUpperCase();
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function roleBadge(role) {
  if (role === "ORGANIZER")
    return "border-violet-500/25 bg-violet-600/10 text-violet-200";
  return "border-white/10 bg-white/5 text-white/80";
}

function verifiedBadge(ok) {
  return ok
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
    : "border-amber-500/20 bg-amber-500/10 text-amber-200";
}

/**
 * Fix avatar:
 * - Persistimos avatarUrl en localStorage PERO POR USUARIO (key: ticketx_avatarUrl:<userId>)
 * - Al cargar /me:
 *   - si backend trae avatarUrl -> guardamos LS para ese userId
 *   - si backend NO trae avatarUrl -> usamos fallback LS del mismo userId
 */
const LS_AVATAR_KEY = (userId) => `ticketx_avatarUrl:${userId}`;

export function MyProfile() {
  const nav = useNavigate();
  const { user: ctxUser, setUser: setCtxUser, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);

  const [me, setMe] = useState(null);
  const [username, setUsername] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWord, setDeleteWord] = useState("");
  const canDelete = deleteWord.trim().toUpperCase() === "DELETE";

  // Avatar upload modal state
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarErr, setAvatarErr] = useState("");

  // Persisted avatar fallback (para refresh) — ya viene “scoped” por userId
  const [persistedAvatarUrl, setPersistedAvatarUrl] = useState("");

  // Cache buster (si el browser cachea la misma URL)
  const [avatarV, setAvatarV] = useState(0);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);

        const r = await getMeRequest();
        const u = r.data?.user ?? r.data ?? null;

        if (!alive) return;

        const userId = u?._id || u?.id;

        // 1) leer LS SOLO para este userId
        let cached = "";
        if (userId) {
          try {
            cached = localStorage.getItem(LS_AVATAR_KEY(userId)) || "";
          } catch (e) {
            console.log("LS_READ_AVATAR_ERR", e);
          }
        }

        // 2) si backend NO trae avatarUrl pero hay cache, lo usamos
        const patched =
          u && !u.avatarUrl && cached ? { ...u, avatarUrl: cached } : u;

        setMe(patched);
        setCtxUser?.(patched);
        setUsername(u?.username ?? "");

        // 3) persistir si backend trae avatarUrl (fuente de verdad)
        if (userId && u?.avatarUrl) {
          try {
            localStorage.setItem(LS_AVATAR_KEY(userId), u.avatarUrl);
          } catch (e) {
            console.log("LS_WRITE_AVATAR_ERR", e);
          }
          setPersistedAvatarUrl(u.avatarUrl);
        } else if (cached) {
          setPersistedAvatarUrl(cached);
        }
      } catch (err) {
        console.log("GET_ME_ERR", err?.response?.data || err?.message);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayUser = useMemo(() => {
    const base = me ?? ctxUser ?? null;
    if (!base) return null;

    const avatarUrl = base.avatarUrl || persistedAvatarUrl || "";
    return { ...base, avatarUrl };
  }, [me, ctxUser, persistedAvatarUrl]);

  // cleanup preview blob url
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  async function saveProfile() {
    try {
      setSaving(true);
      const r = await updateMeRequest({ username });
      const u = r.data?.user ?? r.data ?? null;

      setMe(u);
      setCtxUser?.(u);

      const userId = u?._id || u?.id;
      if (userId && u?.avatarUrl) {
        try {
          localStorage.setItem(LS_AVATAR_KEY(userId), u.avatarUrl);
        } catch (e) {
          console.log("LS_WRITE_AVATAR_ERR", e);
        }
        setPersistedAvatarUrl(u.avatarUrl);
      }
    } catch (err) {
      console.log("SAVE_PROFILE_ERR", err?.response?.data || err?.message);
    } finally {
      setSaving(false);
    }
  }

  async function switchRole(nextRole) {
    try {
      setSwitching(true);

      const r = await updateRoleRequest(nextRole);
      const u = r.data?.user ?? null;

      const accessToken = r.data?.accessToken;
      if (accessToken) {
        const { setAccessToken } = await import("@/libs/token.js");
        setAccessToken(accessToken);
      }

      // mantener avatar (por si el endpoint no lo devuelve)
      const merged = u
        ? { ...u, avatarUrl: u.avatarUrl || persistedAvatarUrl }
        : u;

      setMe(merged);
      setCtxUser?.(merged);

      const userId = merged?._id || merged?.id;
      if (userId && merged?.avatarUrl) {
        try {
          localStorage.setItem(LS_AVATAR_KEY(userId), merged.avatarUrl);
        } catch (e) {
          console.log("LS_WRITE_AVATAR_ERR", e);
        }
        setPersistedAvatarUrl(merged.avatarUrl);
      }
    } catch (err) {
      console.log("SWITCH_ROLE_ERR", err?.response?.data || err?.message);
    } finally {
      setSwitching(false);
    }
  }

  async function confirmDelete() {
    if (!canDelete) return;

    try {
      // borrar LS de este user ANTES de borrarlo (todavía tenemos displayUser)
      const userId = displayUser?._id || displayUser?.id;
      if (userId) {
        try {
          localStorage.removeItem(LS_AVATAR_KEY(userId));
        } catch (e) {
          console.log("LS_REMOVE_AVATAR_ERR", e);
        }
      }

      await deleteMeRequest();
      await logout?.();
      nav("/start");
    } catch (err) {
      console.log("DELETE_ME_ERR", err?.response?.data || err?.message);
    } finally {
      setDeleteOpen(false);
      setDeleteWord("");
    }
  }

  async function resendVerification() {
    try {
      await resendVerificationRequest(displayUser?.email);
      window.open("/verify-email", "_blank", "noopener,noreferrer");
    } catch (err) {
      console.log(
        "RESEND_VERIFICATION_ERR",
        err?.response?.data || err?.message
      );
    }
  }

  function onPickAvatar(file) {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setAvatarErr("Please select an image file (PNG/JPG/WebP).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setAvatarErr("Image is too large. Max 4MB.");
      return;
    }

    setAvatarErr("");
    setAvatarFile(file);

    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function clearAvatarPick() {
    setAvatarFile(null);
    setAvatarErr("");
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview("");
  }

  async function uploadAvatar() {
    if (!avatarFile) {
      setAvatarErr("Choose an image first.");
      return;
    }

    try {
      setAvatarUploading(true);
      setAvatarErr("");

      const r = await uploadMyAvatarRequest(avatarFile);

      // A) { user }
      // B) { avatarUrl }
      const u = r.data?.user ?? null;
      const avatarUrlFromApi = r.data?.avatarUrl;

      const nextUser = u
        ? u
        : displayUser
        ? { ...displayUser, avatarUrl: avatarUrlFromApi || displayUser.avatarUrl }
        : null;

      if (nextUser?.avatarUrl) {
        const userId = nextUser?._id || nextUser?.id;
        if (userId) {
          try {
            localStorage.setItem(LS_AVATAR_KEY(userId), nextUser.avatarUrl);
          } catch (e) {
            console.log("LS_WRITE_AVATAR_ERR", e);
          }
        }

        setPersistedAvatarUrl(nextUser.avatarUrl);

        // cache bust
        setAvatarV((x) => x + 1);
      }

      if (nextUser) {
        setMe(nextUser);
        setCtxUser?.(nextUser);
      }

      setAvatarOpen(false);
      clearAvatarPick();
    } catch (err) {
      setAvatarErr(err?.response?.data?.message || "Could not upload avatar.");
      console.log("UPLOAD_AVATAR_ERR", err?.response?.data || err?.message);
    } finally {
      setAvatarUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="h-8 w-56 animate-pulse rounded bg-white/10" />
            <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
              <div className="h-80 animate-pulse rounded-3xl bg-white/10" />
              <div className="h-80 animate-pulse rounded-3xl bg-white/10" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avatarSrc = displayUser?.avatarUrl
    ? `${displayUser.avatarUrl}${
        displayUser.avatarUrl.includes("?") ? "&" : "?"
      }v=${avatarV}`
    : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
            MY PROFILE
          </h1>
          <p className="mt-3 text-white/60">
            Manage your futuristic ticketing identity and permissions.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[320px_1fr]">
        {/* LEFT PANEL */}
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6">
            <div className="grid place-items-center">
              <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-violet-600/20 ring-1 ring-violet-500/30">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={() => setAvatarV((x) => x + 1)}
                  />
                ) : (
                  <div className="text-3xl font-extrabold text-violet-200">
                    {initials(displayUser?.username || displayUser?.email || "")}
                  </div>
                )}
              </div>

              <div className="mt-4 text-xl font-semibold">
                {displayUser?.username || "—"}
              </div>
              <div className="mt-1 text-sm text-white/60">
                {displayUser?.email || "—"}
              </div>

              <Button
                className="mt-5 w-full rounded-2xl bg-violet-600 hover:bg-violet-500"
                onClick={() => {
                  setAvatarErr("");
                  setAvatarOpen(true);
                }}
              >
                Upload Photo
              </Button>

              <div className="mt-4 grid w-full gap-2">
                <div
                  className={[
                    "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm",
                    verifiedBadge(!!displayUser?.emailVerified),
                  ].join(" ")}
                >
                  {displayUser?.emailVerified ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {displayUser?.emailVerified
                    ? "Email Verified"
                    : "Email Not Verified"}
                </div>

                <div
                  className={[
                    "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm",
                    roleBadge(displayUser?.role),
                  ].join(" ")}
                >
                  <Shield className="h-4 w-4" />
                  Role: {displayUser?.role || "—"}
                </div>

                {!displayUser?.emailVerified ? (
                  <Button
                    variant="outline"
                    className="mt-1 w-full rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={resendVerification}
                  >
                    Resend verification email
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Personal info */}
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-violet-600" />
                <h2 className="text-lg font-semibold">Personal Information</h2>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-white/70">Username</Label>
                  <Input
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-white/70">Email Address</Label>
                  <div className="relative">
                    <Input
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white/70"
                      value={displayUser?.email || ""}
                      disabled
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {displayUser?.emailVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  className="rounded-2xl bg-violet-600 hover:bg-violet-500"
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Role management */}
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-violet-600" />
                <h2 className="text-lg font-semibold">Role Management</h2>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold">
                  Switch to Organizer Mode
                </div>
                <div className="mt-2 text-sm text-white/60">
                  Upgrade your account to create events, manage sales, and track
                  ticket redemptions.
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-white/50">
                    Current:{" "}
                    <span className="text-white/80">{displayUser?.role}</span>
                  </div>

                  <div className="flex items-center rounded-2xl border border-white/10 bg-black/30 p-1">
                    <button
                      className={[
                        "px-4 py-2 text-sm rounded-xl transition",
                        displayUser?.role === "BUYER"
                          ? "bg-violet-600 text-white"
                          : "text-white/60 hover:text-white",
                      ].join(" ")}
                      onClick={() => switchRole("BUYER")}
                      disabled={switching}
                      type="button"
                    >
                      Buyer
                    </button>
                    <button
                      className={[
                        "px-4 py-2 text-sm rounded-xl transition",
                        displayUser?.role === "ORGANIZER"
                          ? "bg-violet-600 text-white"
                          : "text-white/60 hover:text-white",
                      ].join(" ")}
                      onClick={() => switchRole("ORGANIZER")}
                      disabled={switching}
                      type="button"
                    >
                      Organizer
                    </button>
                  </div>
                </div>

                {switching ? (
                  <div className="mt-3 text-xs text-white/50">
                    Updating role…
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-violet-600" />
                <h2 className="text-lg font-semibold">Account Activity</h2>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/45">
                    Created At
                  </div>
                  <div className="mt-2 text-sm text-white/85">
                    {formatDate(displayUser?.createdAt)}
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    Last login: {formatDateTime(displayUser?.lastLoginAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-500/15 bg-red-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-200">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Danger Zone</div>
                  <div className="text-sm text-red-200/60">
                    Once you delete your account, there is no going back. All
                    your active tickets and purchase history will be permanently
                    wiped.
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Button
                  variant="outline"
                  className="rounded-2xl border-red-500/30 bg-red-500/5 text-red-200 hover:bg-red-500/10"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Avatar modal */}
      <AvatarUploadDialog
        open={avatarOpen}
        onOpenChange={(v) => {
          setAvatarOpen(v);
          if (!v) clearAvatarPick();
        }}
        avatarPreview={avatarPreview}
        avatarErr={avatarErr}
        avatarUploading={avatarUploading}
        onPick={(file) => onPickAvatar(file)}
        onClear={clearAvatarPick}
        onUpload={uploadAvatar}
      />

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={(v) => {
          setDeleteOpen(v);
          if (!v) setDeleteWord("");
        }}
        value={deleteWord}
        setValue={setDeleteWord}
        canDelete={canDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function AvatarUploadDialog({
  open,
  onOpenChange,
  avatarPreview,
  avatarErr,
  avatarUploading,
  onPick,
  onClear,
  onUpload,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />

        <Dialog.Content
          aria-describedby="avatar-dialog-desc"
          className="
            fixed left-1/2 top-1/2 z-50
            w-[92vw] max-w-lg
            -translate-x-1/2 -translate-y-1/2
            rounded-3xl border border-white/10
            bg-[#0b0812]/95 p-6 shadow-2xl
            max-h-[85vh] overflow-y-auto
          "
        >
          <Dialog.Title className="sr-only">Upload photo</Dialog.Title>
          <Dialog.Description id="avatar-dialog-desc" className="sr-only">
            Choose a photo file and upload it to update your profile avatar.
          </Dialog.Description>

          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-violet-300">
                Upload photo
              </div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight">
                Profile avatar
              </div>
              <div className="mt-1 text-sm text-white/60">
                PNG/JPG/WebP • Max 4MB
              </div>
            </div>

            <Dialog.Close className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
              ✕
            </Dialog.Close>
          </div>

          <Separator className="my-5 bg-white/10" />

          <div className="grid gap-3">
            {avatarPreview ? (
              <div className="mx-auto h-40 w-40 overflow-hidden rounded-full border border-white/10 bg-black/30">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
                Choose an image to preview it here.
              </div>
            )}

            <input
              id="avatar-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] || null)}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => document.getElementById("avatar-file")?.click()}
                disabled={avatarUploading}
              >
                Choose file
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                onClick={onClear}
                disabled={avatarUploading || !avatarPreview}
              >
                Clear
              </Button>
            </div>

            {avatarErr ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {avatarErr}
              </div>
            ) : null}

            <div className="grid gap-3">
              <Button
                type="button"
                className="h-12 rounded-2xl bg-violet-600 hover:bg-violet-500"
                disabled={avatarUploading || !avatarPreview}
                onClick={onUpload}
              >
                {avatarUploading ? "UPLOADING..." : "UPLOAD"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => onOpenChange(false)}
                disabled={avatarUploading}
              >
                Cancel
              </Button>
            </div>

            <div className="text-center text-[11px] text-white/35">
              This will update your avatarUrl in MongoDB.
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeleteAccountDialog({
  open,
  onOpenChange,
  value,
  setValue,
  canDelete,
  onConfirm,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />

        <Dialog.Content
          aria-describedby="delete-dialog-desc"
          className="
            fixed left-1/2 top-1/2 z-50
            w-[92vw] max-w-lg
            -translate-x-1/2 -translate-y-1/2
            rounded-3xl border border-red-500/30
            bg-[#0b0812]/95 shadow-2xl
            max-h-[85vh] overflow-y-auto
          "
        >
          <Dialog.Title className="sr-only">Delete account</Dialog.Title>
          <Dialog.Description id="delete-dialog-desc" className="sr-only">
            Type DELETE to confirm the permanent deletion of your account.
          </Dialog.Description>

          <div className="sticky top-0 z-10 border-b border-red-500/20 bg-[#0b0812]/95 px-6 pt-6 pb-4 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/10 ring-1 ring-red-500/25">
                  <AlertTriangle className="h-5 w-5 text-red-300" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-red-200">
                    DELETE ACCOUNT
                  </div>
                  <div className="text-xs uppercase tracking-widest text-red-200/50">
                    Warning: this action is permanent.
                  </div>
                </div>
              </div>

              <Dialog.Close className="grid h-9 w-9 place-items-center rounded-xl border border-red-500/25 bg-red-500/5 text-red-200/70 hover:bg-red-500/10 hover:text-red-200">
                ✕
              </Dialog.Close>
            </div>
          </div>

          <div className="px-6 pb-6 pt-5">
            <p className="text-sm leading-6 text-white/65">
              Deleting your account will result in the immediate and irreversible
              loss of all purchased tickets, active memberships, and historical
              event data. You will no longer be able to access your digital
              wallet.
            </p>

            <div className="mt-6 text-[11px] uppercase tracking-widest text-white/40">
              To proceed, please type{" "}
              <span className="text-red-200">"DELETE"</span> below:
            </div>

            <Input
              className="mt-3 h-12 rounded-2xl border-red-500/25 bg-black/30 text-white placeholder:text-white/30"
              placeholder="Type DELETE to confirm"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                className="h-12 rounded-2xl bg-red-600 hover:bg-red-500"
                onClick={onConfirm}
                disabled={!canDelete}
              >
                CONFIRM DELETION
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => onOpenChange(false)}
              >
                CANCEL
              </Button>
            </div>

            <Separator className="my-6 bg-white/10" />

            <div className="text-center text-[10px] uppercase tracking-widest text-white/25">
              • Ticket-X secure identity management system •
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}