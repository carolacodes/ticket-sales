import { api } from "./axios.js";

export function getMeRequest() {
    return api.get("/users/me");
}

export function updateMeRequest(data) {
    return api.patch("/users/me", data);
}

export function updateRoleRequest(role) {
    return api.patch("/users/me/role", { role });
}

export function deleteMeRequest() {
    return api.delete("/users/me");
}

export function uploadMyAvatarRequest(file) {
  const form = new FormData();
  form.append("file", file);

  return api.post(`/users/me/avatar`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}