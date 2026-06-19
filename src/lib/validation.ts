import { z } from "zod";

/**
 * UUID « souple » : valide la forme 8-4-4-4-12 (hexadécimal) sans imposer les
 * bits de version/variante de la RFC 4122.
 *
 * `z.string().uuid()` est devenu strict en zod 4 et rejette tout UUID qui n'est
 * pas conforme RFC (ex. les identifiants de seed `2222...`), alors même que
 * `gen_random_uuid()` (Postgres) produit des UUID v4 valides en production.
 * Ces identifiants sont des références internes de confiance issues de la base :
 * une validation de forme suffit comme garde-fou.
 */
export const uuid = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Identifiant invalide",
  );
