-- Seed de démonstration — événements publiés (pour visualiser l'agenda).
-- À exécuter dans le SQL Editor Supabase (rôle service, contourne la RLS). Idempotent.
-- ⚠️ NE PAS lancer `supabase db reset` sur le projet lié : ça VIDE toute la base.

insert into public.events
  (id, title, description, type_evenement, category, status,
   date, date_debut, date_fin, city, venue_name, coordonnees_gps, image_url)
values
  ('11111111-1111-1111-1111-111111111111',
   'Japan Expo 2026',
   'La plus grande convention dédiée à la culture japonaise et aux mangas.',
   'convention', 'convention', 'published',
   now() + interval '30 days', now() + interval '30 days', now() + interval '33 days',
   'Villepinte', 'Parc des Expositions', '{"lat":48.97,"lng":2.52}', null),
  ('22222222-2222-2222-2222-222222222222',
   'Tournoi Super Smash',
   'Tournoi communautaire ouvert à tous les niveaux.',
   'tournoi', 'gaming', 'published',
   now() + interval '7 days', now() + interval '7 days', null,
   'Lyon', 'La Halle Tony Garnier', '{"lat":45.73,"lng":4.85}', null),
  ('33333333-3333-3333-3333-333333333333',
   'Meetup Cosplay du dimanche',
   'Rencontre détendue entre cosplayeurs au parc.',
   'meetup', 'cosplay', 'published',
   now() - interval '1 hour', now() - interval '1 hour', now() + interval '3 hours',
   'Paris', 'Parc de la Villette', '{"lat":48.89,"lng":2.39}', null),
  ('44444444-4444-4444-4444-444444444444',
   'Expo Rétro Anime',
   'Rétrospective des classiques de l''animation japonaise.',
   'exposition', 'culture', 'published',
   now() - interval '20 days', now() - interval '20 days', now() - interval '18 days',
   'Bordeaux', 'Cap Sciences', '{"lat":44.86,"lng":-0.55}', null)
on conflict (id) do nothing;

insert into public.event_schedule (event_id, time, title, location, day_date)
values
  ('11111111-1111-1111-1111-111111111111', '10:00', 'Ouverture des portes', 'Hall 5', to_char(now() + interval '30 days', 'YYYY-MM-DD')),
  ('11111111-1111-1111-1111-111111111111', '14:00', 'Concours cosplay', 'Grande scène', to_char(now() + interval '30 days', 'YYYY-MM-DD')),
  ('11111111-1111-1111-1111-111111111111', '11:00', 'Dédicaces mangaka', 'Espace auteurs', to_char(now() + interval '31 days', 'YYYY-MM-DD'))
on conflict do nothing;
