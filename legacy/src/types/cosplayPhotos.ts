import type { Database } from "@/integrations/supabase/types";

// ─── Alias de base ────────────────────────────────────────────────────────────

export type CosplayPhoto = Database["public"]["Tables"]["cosplay_photos"]["Row"];
export type CosplayPhotoInsert = Database["public"]["Tables"]["cosplay_photos"]["Insert"];
export type CosplayPhotoUpdate = Database["public"]["Tables"]["cosplay_photos"]["Update"];

export type CosplayPhotoTag = Database["public"]["Tables"]["cosplay_photo_tags"]["Row"];
export type CosplayPhotoTagInsert = Database["public"]["Tables"]["cosplay_photo_tags"]["Insert"];
export type CosplayPhotoTagUpdate = Database["public"]["Tables"]["cosplay_photo_tags"]["Update"];

// ─── Valeurs admises pour photo_type ─────────────────────────────────────────

export type PhotoType = "toi" | "original" | "wip" | "shooting" | "detail";

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  toi: "Toi",
  original: "Personnage original",
  wip: "Work in progress",
  shooting: "Shooting",
  detail: "Détail",
};

// ─── Valeurs admises pour le statut d'un tag ──────────────────────────────────

export type TagStatus = "pending" | "accepted" | "declined";

// ─── Types joinés ─────────────────────────────────────────────────────────────

/** Profil minimal du taggé tel que joint depuis la table profiles */
interface TaggedProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

/** Données du cosplay lié (jointé via linked_cosplay_id → cosplay_plans) */
interface LinkedCosplay {
  id: string;
  character_name: string;
  universe: string;
}

/**
 * Un tag de photo avec le profil du taggé jointé.
 * Utilisé pour afficher les pins sur une photo avec nom/avatar résolu.
 */
export interface PhotoTagWithProfile extends CosplayPhotoTag {
  tagged_profile: TaggedProfile | null;
  /** Cosplay choisi par le taggé lors de l'acceptation (null si non renseigné) */
  cosplay_plan?: LinkedCosplay | null;
}

/**
 * Une photo cosplay avec ses tags et le nom de l'événement lié jointé.
 * Utilisé pour l'affichage complet dans la galerie d'un projet.
 */
export interface CosplayPhotoWithTags extends CosplayPhoto {
  tags: PhotoTagWithProfile[];
  /** Nom de l'événement Supabase jointé (null si photo sans event_id) */
  event_name: string | null;
}
