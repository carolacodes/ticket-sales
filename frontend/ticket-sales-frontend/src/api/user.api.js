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