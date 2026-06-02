-- ==============================================================
-- event_proposals — ajout des coordonnées organisateur
-- Version : 20260408 (ALTER TABLE incrémental)
-- Complète la migration 20260407_agenda_bookmarks_proposals.sql
-- ==============================================================

-- ── Colonnes contact organisateur ────────────────────────────
-- Ces colonnes sont UNIQUEMENT renseignées quand is_organizer = true.
-- Elles ne sont jamais exposées dans les endpoints publics :
--   • les policies Supabase existantes garantissent que seul
--     le membre propriétaire et les admins peuvent SELECT ces lignes.
--   • les endpoints publics (liste événements, agenda) ne touchent
--     jamais la table event_proposals.

alter table public.event_proposals
  add column if not exists organizer_contact_first_name text,
  add column if not exists organizer_contact_last_name  text,
  add column if not exists organizer_contact_email      text,
  add column if not exists organizer_contact_phone      text,
  add column if not exists organizer_contact_role       text;

-- ── Commentaires colonnes (documentation interne) ────────────
comment on column public.event_proposals.organizer_contact_first_name is
  'Prénom du contact organisateur — confidentiel, admin only.';
comment on column public.event_proposals.organizer_contact_last_name is
  'Nom du contact organisateur — confidentiel, admin only.';
comment on column public.event_proposals.organizer_contact_email is
  'Email de contact organisateur — confidentiel, admin only.';
comment on column public.event_proposals.organizer_contact_phone is
  'Téléphone de contact organisateur — confidentiel, admin only.';
comment on column public.event_proposals.organizer_contact_role is
  'Rôle dans l''organisation (ex : chargé de com, président) — confidentiel, admin only.';

-- ── Vérification : les RLS existantes couvrent déjà ces colonnes ─
-- Les policies SELECT sur event_proposals sont :
--   1. Le propriétaire (submitted_by = auth.uid()) peut voir SES lignes
--      → il voit ses propres coordonnées, ce qui est correct.
--   2. Les admins (role = 'admin' ou role_function = 'admin') voient tout.
-- Aucune policy SELECT publique n'existe sur cette table.
-- Aucune action supplémentaire requise.
