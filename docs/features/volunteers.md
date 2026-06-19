# Feature — volunteers

**Statut implémentation : ⬜ à faire (étape 3).** Second module complexe (schéma de mission dynamique). **Pas un stub** : entièrement implémenté dans le legacy (contrairement à ce que supposait le plan initial).

## Périmètre

Bénévolat : **missions** (priorité/statut/pôle), **créneaux/shifts** pour le planning, **candidatures** avec workflow de statut, **affectations** (bénévole ↔ mission/shift), **templates** de missions réutilisables, et un **configurateur de schéma de mission** dynamique (sections + champs personnalisés, conditions, visibilité par rôle) — analogue au form builder d'adhésion. Un dashboard agrège l'activité.

## Écrans legacy → cible

| Legacy                                    | Rôle                                                 | Route cible                            |
| ----------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| `AssociationVolunteers.tsx`               | Vue bénévoles de l'asso (dispo/expérience)           | `/association/benevoles`               |
| `VolunteerDashboard.tsx`                  | Tableau de bord (agrégats)                           | `/association/benevolat`               |
| `VolunteerMissions.tsx` (995 l.)          | CRUD missions (schéma dynamique)                     | `/association/benevolat/missions`      |
| `VolunteerPlanning.tsx`                   | Planning : missions/shifts par jour                  | `/association/benevolat/planning`      |
| `VolunteerApplications.tsx` (1145 l.)     | Candidatures + workflow                              | `/association/benevolat/candidatures`  |
| `VolunteerAssignments.tsx`                | Affectations bénévole↔mission/shift                  | `/association/benevolat/affectations`  |
| `MissionTemplates.tsx`                    | Templates réutilisables                              | `/association/benevolat/templates`     |
| `MissionSchemaConfigurator.tsx` (1508 l.) | Configurateur de schéma (sections/champs dynamiques) | `/association/benevolat/configuration` |

## Tables Supabase

`volunteer_missions`, `volunteer_shifts`, `volunteer_applications`, `volunteer_assignments`, `volunteer_documents`, `volunteer_messages`, `volunteer_activity_log`, `mission_templates`, `mission_schema_sections`, `mission_schema_fields`, + `association_memberships`, `profiles`. Module connexe gamifié : `quests`/`quest_submissions` (via `useVolunteerQuests`).

## Hooks legacy clés

`useVolunteerModule` (cœur : applications/missions/shifts/assignments CRUD + dashboard + labels de statuts), `useMissionSchema` (sections/fields CRUD, templates, helpers purs `resolveSchema`/`evaluateConditions`/`getDefaultValues`/`applyTemplate`), `useVolunteerQuests` (gamification — **distinct** du module missions).

## Doublons / consolidation

- **Deux moteurs de schéma dynamique** quasi parallèles : `useMissionSchema` et `useMembershipFormBuilder`/`useMembershipForm` → **mutualiser un moteur de formulaire/schéma générique unique**.
- Deux notions de « bénévole » : membres avec attributs bénévolat (`association_memberships`) vs `volunteer_applications` → articuler clairement.
- `useVolunteerQuests` (gamification) vs module missions → ne pas confondre.

## Stubs / placeholders

Aucun stub. **Correction du plan initial** : `MissionSchemaConfigurator` (1508 l.) est pleinement implémenté, pas un placeholder.

## Points d'attention

- **Planning complexe** : chevauchements de créneaux, capacité, vue calendrier robuste.
- **Schéma de mission dynamique** = module complexe → factoriser avec [membership-forms](membership-forms.md).
- Fichiers très volumineux (1508 / 1145 / 995 l.) → découpage important.
- Transitions de statut (candidature → affectation) et effets de bord → pousser en base (ADR 0002).
