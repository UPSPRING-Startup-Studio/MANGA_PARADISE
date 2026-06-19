# Feature : friends (Nakamas)

Système d'amis du domaine **communauté** (voir [`docs/features/community.md`](../../../docs/features/community.md)).

## Implémenté (étape 2)

- **/mes-amis** : mes amis, demandes reçues (accepter/refuser), demandes envoyées (annuler), et **ajout par recherche** de nom d'utilisateur.
- **Bouton d'ami** sur le profil public `/u/[username]` (Ajouter / Demande envoyée / Accepter / Nakama ✓).
- `api/friendships.ts` (liste, relation, envoi/accept/suppression, recherche), `server.ts`, `actions.ts`. Lien « Nakamas » dans la nav.

## Notes

- Table `friendships` (requester/addressee + statut pending/accepted). RLS « parties » (seuls les deux concernés voient/modifient). Refus/annulation/retrait = suppression de la ligne.
- À venir : notifier le destinataire (notifications), filtre « nakamas » du feed, contexte de rencontre (`meeting_event_id`).
