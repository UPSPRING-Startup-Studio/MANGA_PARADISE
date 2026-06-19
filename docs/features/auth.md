# Feature — auth

**Statut implémentation : ✅ fait (étape 0/1).** Voir `src/features/auth/`.

## Périmètre

Inscription / connexion email + mot de passe, OAuth Google, confirmation d'email, déconnexion, et orientation initiale (choix de rôle, inscription pro). Dans le legacy, l'auth s'appuyait sur Supabase Auth via un `AuthContext` minimal, mais le **rôle métier** était lu depuis `profiles.role` / `role_function` (sauf `partner`, inséré dans `user_roles`) — incohérence corrigée : source unique `user_roles` + RLS + `lib/rbac.ts`.

## Écrans legacy → cible

| Legacy                            | Rôle                                                          | Route cible                             | Statut       |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------------- | ------------ |
| `Auth.tsx` (654 l.)               | Login + signup public + OAuth + flux signup partenaire inline | `/login`, `/register`                   | ✅ fait      |
| `auth/Activate.tsx` (389 l.)      | Définition mot de passe via lien d'invitation                 | `/auth/confirm` (+ futur `/activation`) | 🟡 partiel   |
| `auth/ProRegister.tsx` (204 l.)   | Inscription structure pro (SIRET, contact)                    | `(pro)/inscription`                     | ⬜ étape 3   |
| `auth/RoleSelection.tsx` (258 l.) | Choix de profil (visuel, simple aiguillage)                   | `(public)/choix-profil`                 | ⬜ optionnel |

## Tables Supabase

`auth.users` (Supabase), `profiles` + `user_roles` (créés à l'inscription par le trigger `handle_new_user`, migration 0001), `profiles_private` (PII).

## Logique clés (legacy)

`AuthContext` (wrapper session), `useUserRoles`/`useIsAdmin` (lisaient `profiles.role` — **à abandonner**), `useIsPartner` (lisait `user_roles`).

## Doublons / consolidation

- Double source de rôles (`profiles.role` vs `user_roles`) → **`user_roles` uniquement**. ✅ acté.
- `Auth.tsx` mélangeait signup public et insertion partenaire en clair → séparé (signup pro = étape 3).

## Points d'attention

- `signOut` legacy avalait les erreurs et forçait le clear local — reproduit proprement via `@supabase/ssr`.
- Bonus signup « +100 OTK » (toast) : vérifier si trigger DB ou cosmétique avant de le recréer.
- `ProRegister` utilisait `window.innerWidth` au montage (incompatible SSR) — à adapter.
- OAuth via wrapper Lovable → remplacé par `signInWithOAuth` natif. **Config Google requise côté dashboard Supabase.**

## Reste à faire

Inscription pro (étape 3), page de choix de profil (optionnel), flux reset mot de passe (non retenu pour le MVP).
