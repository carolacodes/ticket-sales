import { z } from "zod";

export const updateRoleSchema = z.object({
    role: z.enum(["BUYER", "ORGANIZER"]),
});

export const updateMeSchema = z.object({
    username: z.string().min(3).max(30).trim().optional(),
});

