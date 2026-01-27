import { z } from "zod";

export const createTicketTypeSchema = z.object({
    name: z.string().min(1).max(80),
    price: z.number().min(0),
    currency: z.string().min(3).max(3).default("USD"), // o "ARS"
    capacity: z.number().int().min(1),
    saleStartAt: z.coerce.date().optional(),
    saleEndAt: z.coerce.date().optional(),
});

export const updateTicketTypeSchema = z.object({
    name: z.string().min(1).max(80).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().min(3).max(3).optional(),
    capacity: z.number().int().min(1).optional(),
    saleStartAt: z.coerce.date().optional(),
    saleEndAt: z.coerce.date().optional(),
});
