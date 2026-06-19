-- ============================================================
-- 0015 — Storage : buckets & policies (storage.objects)
-- ------------------------------------------------------------
-- Sources :
--   - legacy/supabase/migrations/20260226_create_showcase_photos.sql
--     (bucket showcase-photos + pattern de policies storage.objects).
--   - conventions Supabase Storage (folder = auth.uid()).
-- Dépendances : 0001 (is_admin).
-- ------------------------------------------------------------
-- Convention de chemin : le 1er segment du chemin = id du propriétaire,
--   d'où le contrôle `(storage.foldername(name))[1] = auth.uid()::text`
--   pour insert/update/delete. La lecture est publique pour les buckets
--   « publics » (avatars, covers, showcase-photos) ; privée sinon
--   (cosplay-photos, association-documents : propriétaire + admin).
--   L'admin plateforme (is_admin(), 0001) a un accès complet partout.
-- ============================================================


-- ============================================================
-- Buckets
-- ------------------------------------------------------------
-- public = true  -> lecture anonyme via URL publique.
-- public = false -> accès gouverné uniquement par les policies RLS.
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),                       -- photos de profil (public)
  ('covers', 'covers', true),                         -- bannières de profil (public)
  ('cosplay-photos', 'cosplay-photos', false),        -- photos de cosplay (privé)
  ('showcase-photos', 'showcase-photos', true),       -- book public cosplay (lecture publique)
  ('association-documents', 'association-documents', false) -- documents d'asso (privé)
on conflict (id) do nothing;


-- ============================================================
-- RLS storage.objects
-- ------------------------------------------------------------
-- RLS est déjà activée par Supabase sur storage.objects ; on ajoute
-- uniquement les policies. (Pas de ALTER TABLE ... ENABLE ici : table système.)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Lecture publique : avatars / covers / showcase-photos
-- (buckets publics : lisibles par anon et authenticated).
-- ────────────────────────────────────────────────────────────
create policy "storage_public_read_avatars"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');

create policy "storage_public_read_covers"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'covers');

create policy "storage_public_read_showcase"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'showcase-photos');

-- ────────────────────────────────────────────────────────────
-- Lecture privée : cosplay-photos / association-documents
-- (propriétaire du dossier OU admin plateforme).
-- ────────────────────────────────────────────────────────────
create policy "storage_private_read_owner_cosplay"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'cosplay-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "storage_private_read_owner_assoc_docs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'association-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ────────────────────────────────────────────────────────────
-- Écriture (insert/update/delete) : propriétaire du dossier OU admin.
-- Le 1er segment du chemin doit être l'uid de l'appelant.
-- Une policy par bucket pour rester explicite/auditable.
-- ────────────────────────────────────────────────────────────

-- avatars
create policy "storage_write_owner_avatars"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  )
  with check (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- covers
create policy "storage_write_owner_covers"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'covers'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  )
  with check (
    bucket_id = 'covers'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- cosplay-photos
create policy "storage_write_owner_cosplay"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'cosplay-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  )
  with check (
    bucket_id = 'cosplay-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- showcase-photos
create policy "storage_write_owner_showcase"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'showcase-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  )
  with check (
    bucket_id = 'showcase-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- association-documents
create policy "storage_write_owner_assoc_docs"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'association-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  )
  with check (
    bucket_id = 'association-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
