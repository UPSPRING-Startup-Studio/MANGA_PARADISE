# Feature : auth

Authentification (email + OAuth Google), confirmation, déconnexion, orientation initiale.

> 📋 **Spécification détaillée** (audit du legacy + plan de portage : écrans, routes, tables, hooks, doublons, stubs, points d'attention) : [`docs/features/auth.md`](../../../docs/features/auth.md).

## Structure

Ce dossier porte le code de la feature : `components/`, `hooks/`, `api/` (seul accès Supabase), `schemas.ts`, `server.ts`, `actions.ts` selon les besoins. Voir [`docs/architecture.md`](../../../docs/architecture.md).
