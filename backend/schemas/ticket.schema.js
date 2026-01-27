import { z } from "zod";

export const checkInSchema = z.object({
    code: z.string().min(6),
});
