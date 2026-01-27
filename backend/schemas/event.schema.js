import { z } from "zod";

export const createEventSchema = z.object({
    title: z.string().min(3).max(120),
    description: z.string().max(5000).optional(),
    venue: z.string().max(200).optional(),
    city: z.string().max(120).optional(),
    startAt: z.coerce.date(),           // permite string ISO -> Date
    endAt: z.coerce.date().optional(),
    bannerUrl: z.string().url().optional(),
    tags: z.array(z.string().min(1).max(30)).optional(),
});

export const updateEventSchema = z.object({
    title: z.string().min(3).max(120).optional(),
    description: z.string().max(5000).optional(),
    venue: z.string().max(200).optional(),
    city: z.string().max(120).optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    bannerUrl: z.string().url().optional(),
    tags: z.array(z.string().min(1).max(30)).optional(),
});

export const updateEventStatusSchema = z.object({
    status: z.enum(["DRAFT", "PUBLISHED", "ENDED"]),
});
