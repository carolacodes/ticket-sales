import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(6).max(128),
    role: z.enum(["BUYER", "ORGANIZER"]).optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(128),
});


export const resendVerificationSchema = z.object({
    email: z.string().email(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(10),
    password: z.string().min(6),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(6, "Current password must be at least 6 characters"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters"),
});

export const setPasswordSchema = z.object({
  newPassword: z.string().min(6),
});