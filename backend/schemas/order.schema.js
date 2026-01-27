import { z } from "zod";

export const createOrderSchema = z.object({
    eventId: z.string().min(1),
    items: z
        .array(
        z.object({
            ticketTypeId: z.string().min(1),
            qty: z.number().int().min(1).max(20),
        })
        )
        .min(1),
});

export const confirmOrderSchema = z.object({
  // por ahora vacío. Más adelante: paymentProvider, paymentRef, etc.
});
