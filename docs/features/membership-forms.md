# Feature — membership-forms

**Statut implémentation : ⬜ à faire (étape 3).** Module **le plus complexe** (form builder dynamique). Entièrement implémenté dans le legacy (pas de stub).

## Périmètre

Formulaires d'adhésion **dynamiques** : un form builder visuel produit une `FormDefinition` JSON stockée en base ; un moteur de rendu générique affiche le formulaire public (~15 types de champs : text, email, select, radio, checkbox-group, consent, signature…), avec validation, multi-étapes et conditions. Les soumissions suivent un workflow (en attente → demande d'infos → activé/refusé) avec historique, consentements RGPD et signatures stockés séparément. L'**activation** d'une soumission crée/met à jour un `association_memberships`.

## Écrans legacy → cible

| Legacy                           | Rôle                                                      | Route cible                             |
| -------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `AssociationMembershipForms.tsx` | Liste des définitions (publier/archiver/dupliquer/défaut) | `/association/formulaires`              |
| `FormBuilderPage.tsx`            | Builder visuel (étapes/champs/métadonnées)                | `/association/formulaires/[id]/builder` |
| `MembershipFormDetail.tsx`       | Détail d'une définition                                   | `/association/formulaires/[id]`         |
| `MembershipFormPage.tsx`         | Formulaire public d'adhésion (rendu dynamique)            | `/a/[slug]/adhesion`                    |
| `AssociationSubmissions.tsx`     | Liste des soumissions + filtres                           | `/association/adhesions`                |
| `SubmissionDetail.tsx`           | Détail : réponses, consentements, signatures, statut      | `/association/adhesions/[id]`           |

## Tables Supabase

`membership_form_definitions`, `membership_submissions`, `membership_submission_answers`, `membership_consents`, `membership_signatures`, `membership_submission_status_history`, `membership_submission_requests` (demandes d'infos), + `associations`, `association_memberships`, `profiles`. **Toutes accédées en `as any`** dans le legacy → typer.

## Hooks legacy clés

`useMembershipFormDefinitions` (liste/publier/archiver/défaut/dupliquer/lecture publique par slug), `useMembershipFormBuilder` (état builder + factory de champs + persistance), `useMembershipForm` (moteur de rendu/validation : valeurs, règles minAge/email/consent/signature, navigation par étapes, payload), `useMembershipWorkflow` (soumissions + détail + statut + demande d'infos + **activation → `association_memberships`**).

Composants notables : `builder/{FormBuilderShell, StepsSidebar, StepEditor, FieldEditorPanel, FormMetadataEditor}`, `FormFieldRenderer` (switch ~15 types), `ConsentBlock`, `SignatureField`, et un seed `definitions/mangaParadise2025.ts`.

## Doublons / consolidation

- Deux sources de définition : fichier statique `mangaParadise2025.ts` vs base → le builder écrit en base ; clarifier le rôle du fichier (seed).
- Lecture du form publié par slug ré-implémentée 2× (`usePublishedMembershipFormBySlug` vs `usePublishedMembershipForm`).
- **Mutualiser le moteur de schéma** avec le configurateur de mission bénévolat (`useMissionSchema`) — même besoin de formulaire dynamique conditionnel.

## Points d'attention

- **Module pivot** : schéma JSON versionné, moteur de rendu + validation générique → porter avec soin, valider en zod côté serveur.
- **RGPD** : `membership_consents` + `membership_signatures` (signature dessinée) → traçabilité, horodatage, rétention, preuve de consentement.
- Tout l'accès DB en `as any` → types générés + accès `features/membership-forms/api/`.
- L'**activation** a un effet de bord fort (création de membership) → pousser en base (RPC/Edge, ADR 0002) plutôt qu'en hook front.
