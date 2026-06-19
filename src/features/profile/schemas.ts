import { z } from "zod";

/** Schemas zod du profil (onboarding + edition). */

export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "Au moins 3 caracteres")
    .max(30, "30 caracteres maximum")
    .regex(USERNAME_REGEX, "Lettres, chiffres et _ uniquement"),
  displayName: z
    .string()
    .min(2, "Au moins 2 caracteres")
    .max(50, "50 caracteres maximum"),
  firstName: z.string().max(50).optional().or(z.literal("")),
  lastName: z.string().max(50).optional().or(z.literal("")),
  birthDate: z
    .string()
    .min(1, "Date de naissance requise")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Date invalide"),
  city: z.string().max(80).optional().or(z.literal("")),
  rulesAccepted: z.literal(true, {
    message: "Tu dois accepter le reglement",
  }),
  imageRightsConsent: z.boolean(),
});

export const profileEditSchema = z.object({
  displayName: z.string().min(2, "Au moins 2 caracteres").max(50),
  bio: z
    .string()
    .max(500, "500 caracteres maximum")
    .optional()
    .or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  favoriteManga: z.string().max(120).optional().or(z.literal("")),
  favoriteCharacter: z.string().max(120).optional().or(z.literal("")),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileEditInput = z.infer<typeof profileEditSchema>;

/** Age revolu a partir d'une date ISO (detection mineur cote serveur). */
export function ageFromBirthDate(birthDate: string): number {
  const d = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
