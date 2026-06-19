import { z } from "zod";

/** Schemas zod partages client/serveur pour l'authentification. */

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, "Au moins 2 caracteres")
    .max(50, "50 caracteres maximum"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Au moins 8 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
