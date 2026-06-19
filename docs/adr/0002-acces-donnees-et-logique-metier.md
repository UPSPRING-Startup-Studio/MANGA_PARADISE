# ADR 0002 — Accès aux données & logique métier (où vivent les règles)

- **Statut** : accepté
- **Date** : 2026-06-19

## Contexte

L'architecture est full-stack Next.js : il n'y a pas d'API REST séparée. La
question s'est posée de savoir où placer la **logique métier** (ex. « créer un
cosplay » : champs obligatoires, statuts autorisés, qui a le droit, effets de
bord comme l'attribution d'XP), et si une API Node dédiée est nécessaire —
notamment en vue de **clients additionnels** (une appli Flutter native est
envisagée à terme).

Le réflexe habituel est une API (Node/Express…) qui centralise « logique des
données + logique métier » devant une base passive. Avec Supabase, la base
n'est pas passive : elle expose elle-même une API (PostgREST, Auth, Realtime,
Storage) et peut porter les règles.

## Décision

**La logique métier vit dans la base de données (Supabase/Postgres), pas dans
une couche API séparée.** Pas d'API Node dédiée pour le MVP. Les règles se
répartissent en quatre niveaux, du plus simple au plus puissant :

1. **Contraintes de schéma** — obligatoire/interdit garanti par la table :
   `NOT NULL`, `CHECK`, enums, clés étrangères, `UNIQUE`. Inviolable, quel que
   soit le client.
2. **RLS (Row Level Security)** — autorisation « qui peut lire/écrire quoi ».
   Rempart de sécurité unique (cf. [rbac.md](../rbac.md) et ADR 0001).
3. **Fonctions / RPC / triggers Postgres** — règles et enchaînements métier
   exécutés _dans_ la base. Une opération composite (« créer un cosplay + tâches
   par défaut + XP ») = **une** fonction `SECURITY DEFINER` appelée via
   `rpc('...')`. C'est l'équivalent d'une « route métier ».
4. **Supabase Edge Functions** (TypeScript/Deno) — pour la logique nécessitant
   du code applicatif : appels externes (emails, paiements), workflows
   complexes, opérations privilégiées (`service_role`). Appelables en HTTP par
   **n'importe quel client** (web, Flutter).

### Conséquences sur le code Next

- Les modules `features/*/api/` et les **Server Actions** restent **fins** :
  ils orchestrent l'UI et appellent les RPC/Edge Functions, ils ne contiennent
  pas la règle métier de référence.
- Une Server Action est une commodité **web-only** (couplée à React). Toute
  logique destinée à être partagée entre clients **ne doit pas** y vivre
  seulement → elle va dans la base (RPC) ou en Edge Function.
- Les opérations nécessitant le `service_role` passent par une Edge Function ou
  un route handler `app/api/*` (serveur), jamais le client.

### Clients

- **Web (Next)** : Server Components pour la lecture, Server Actions + RPC pour
  les mutations.
- **Flutter (futur)** : SDK `supabase_flutter`, même projet, clé `anon`, protégé
  par la RLS. Il consomme les **mêmes** tables, RPC et Edge Functions → mêmes
  règles, sans réécriture. Seules les Server Actions TS ne sont pas réutilisables
  (ce n'est pas un problème : elles ne portent pas la règle de référence).

## Quand réévaluer (introduire une API Node séparée)

Option ouverte, non fermée par cette décision. À reconsidérer si : logique métier
très lourde qu'on préfère écrire dans un framework dédié, orchestration de
nombreux systèmes externes, ou contrainte d'équipe. L'ajout resterait
incrémental (la base et ses règles ne sont pas à jeter).

## Exemple de référence — « créer un cosplay »

- Champs obligatoires / statut valide → contraintes + enum sur `cosplay_plans`.
- Seul le propriétaire édite → policy RLS.
- Création + tâches par défaut + XP → fonction `rpc('create_cosplay', …)`.
- Notification email à la publication → Edge Function.
