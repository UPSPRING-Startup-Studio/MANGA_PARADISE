import { z } from "zod";

const currentYear = new Date().getFullYear();

export const planSchema = z.object({
  characterName: z.string().min(1, "Personnage requis").max(120),
  universe: z.string().min(1, "Univers requis").max(120),
  status: z.enum(["wishlist", "started", "paused", "finished"]),
  targetYear: z.coerce
    .number()
    .int()
    .min(currentYear - 1)
    .max(currentYear + 10),
  deadline: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional(),
  craftType: z
    .enum(["handmade", "bought", "mixed"])
    .optional()
    .or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
});

export const taskSchema = z.object({
  label: z.string().min(1, "Intitulé requis").max(200),
  category: z.enum(["craft", "achat", "dressing"]),
});

export type PlanInput = z.infer<typeof planSchema>;
export type TaskInput = z.infer<typeof taskSchema>;

export type PlanFormInput = z.input<typeof planSchema>;
