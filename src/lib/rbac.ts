/**
 * RBAC — Modèle de rôles **unique** de Manga Paradise.
 *
 * Source de vérité côté application. Les rôles globaux vivent dans la table
 * Supabase `user_roles` (enum PG `app_role`) ; la RLS reste le rempart réel.
 * Ce module ne contient que des helpers **purs** (aucune dépendance React/Supabase),
 * réutilisables côté serveur, client et middleware.
 *
 * Voir docs/rbac.md.
 */

/** Rôles globaux — miroir exact de l'enum PG `app_role` (migration 0001). */
export const APP_ROLES = [
  "admin",
  "moderator",
  "member",
  "premium",
  "volunteer",
  "partner",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** Zones d'accès de l'application (1 zone ⇄ 1 groupe de routes). */
export const AREAS = [
  "public",
  "member",
  "association",
  "pro",
  "admin",
] as const;

export type Area = (typeof AREAS)[number];

/** Garde de type : la valeur est-elle un AppRole connu ? */
export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    (APP_ROLES as readonly string[]).includes(value)
  );
}

// ---------------------------------------------------------------------------
// Helpers purs — « cet ensemble de rôles donne-t-il tel droit ? »
// ---------------------------------------------------------------------------

export function hasRole(roles: readonly AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}

export function hasAnyRole(
  roles: readonly AppRole[],
  allowed: readonly AppRole[],
): boolean {
  return roles.some((r) => allowed.includes(r));
}

export function isAdmin(roles: readonly AppRole[]): boolean {
  return roles.includes("admin");
}

/** Staff = accès à la console d'administration. */
export function isStaff(roles: readonly AppRole[]): boolean {
  return hasAnyRole(roles, ["admin", "moderator"]);
}

export function isPartner(roles: readonly AppRole[]): boolean {
  return hasAnyRole(roles, ["admin", "partner"]);
}

// ---------------------------------------------------------------------------
// Accès par zone
// ---------------------------------------------------------------------------

/** Rôles requis pour entrer dans une zone. `null` ⇒ aucune exigence de rôle. */
const AREA_ROLE_REQUIREMENTS: Record<Area, readonly AppRole[] | null> = {
  public: null,
  member: null, // toute personne authentifiée
  association: null, // appartenance vérifiée par la RLS + garde de page
  pro: ["admin", "partner"],
  admin: ["admin", "moderator"],
};

/** La zone exige-t-elle au minimum une session authentifiée ? */
export function areaRequiresAuth(area: Area): boolean {
  return area !== "public";
}

/**
 * Un ensemble de rôles permet-il l'accès à une zone ?
 * (présuppose que l'authentification est déjà vérifiée par ailleurs)
 */
export function canAccessArea(area: Area, roles: readonly AppRole[]): boolean {
  const required = AREA_ROLE_REQUIREMENTS[area];
  if (required === null) return true;
  return hasAnyRole(roles, required);
}

export function rolesRequiredForArea(area: Area): readonly AppRole[] | null {
  return AREA_ROLE_REQUIREMENTS[area];
}

// ---------------------------------------------------------------------------
// Résolution chemin URL → zone (utilisé par le middleware et les gardes)
// ---------------------------------------------------------------------------

/**
 * Préfixes publics (accessibles sans session). Tout le reste exige une session.
 * Les sous-arbres `pro` / `admin` exigent en plus un rôle (voir gardes serveur).
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/auth", // callbacks OAuth, reset mot de passe
  "/legal",
  "/mentions-legales", // pages légales accessibles sans session
  "/confidentialite",
  "/cgu",
  "/a/", // fiches association publiques
  "/u/", // profils publics
] as const;

const ADMIN_PREFIXES = ["/admin"] as const;
const PRO_PREFIXES = ["/pro"] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (p) =>
      pathname === p ||
      pathname === p.replace(/\/$/, "") ||
      pathname.startsWith(p),
  );
}

/** La racine `/` (landing) est publique ; sinon on teste les préfixes publics. */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return matchesPrefix(pathname, PUBLIC_PREFIXES);
}

/** Déduit la zone d'accès depuis un chemin URL. */
export function areaForPath(pathname: string): Area {
  if (matchesPrefix(pathname, ADMIN_PREFIXES)) return "admin";
  if (matchesPrefix(pathname, PRO_PREFIXES)) return "pro";
  if (isPublicPath(pathname)) return "public";
  return "member";
}
