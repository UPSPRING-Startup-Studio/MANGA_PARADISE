# PROJECT_CONTEXT.md — Manga Paradise App

> Fichier de contexte destiné à être fourni à une IA pour générer du code cohérent avec le projet.

---

## Stack technique

| Outil | Version |
|---|---|
| React | 18.3.1 |
| TypeScript | ~5.x |
| Vite | 5.4.19 |
| Tailwind CSS | 3.4.17 |
| Supabase (client) | 2.76.8 |
| React Router DOM | 6.30.1 |
| TanStack Query | 5.83.0 |
| shadcn/ui | via `components.json` |
| Radix UI | primitives accessibles |
| React Hook Form + Zod | formulaires + validation |
| Framer Motion | animations |
| @dnd-kit | drag & drop |
| Recharts | graphiques |
| Leaflet / react-leaflet | cartes |
| Sonner | toasts |

---

## Conventions de code

- Tous les composants sont en **TypeScript `.tsx`**, les hooks en **`.ts`**
- Les composants UI de base viennent de `src/components/ui/` (shadcn/ui)
- Les hooks de data fetching sont dans `src/hooks/` et utilisent `@tanstack/react-query` + le client Supabase (`src/integrations/supabase/client.ts`)
- Les types Supabase auto-générés sont dans `src/integrations/supabase/types.ts`
- Les pages sont dans `src/pages/` et enregistrées dans `src/App.tsx`
- Le design system custom est dans `src/components/ui/frontend-design.ts`
- Les constantes globales sont dans `src/lib/constants.ts`, les utilitaires dans `src/lib/utils.ts`
- Le contexte d'authentification est dans `src/contexts/AuthContext.tsx`
- Les routes protégées utilisent `src/components/auth/RequireAuth.tsx`
- Les routes admin utilisent `src/components/RoleBasedRoute.tsx`

---

## Arborescence complète du projet

```
MANGA-PARADISE-SAUVETAGE/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── postcss.config.js
├── eslint.config.js
├── components.json                  ← config shadcn/ui
├── package.json
├── .env / .env.local                ← variables Supabase
│
├── api/
│   ├── beta-check.js
│   └── beta-login.js
│
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── placeholder.svg
│
├── src/
│   ├── main.tsx
│   ├── App.tsx                      ← routes React Router
│   ├── App.css
│   ├── index.css
│   ├── vite-env.d.ts
│   │
│   ├── assets/
│   │   ├── boutique-preview.jpg
│   │   ├── events-space.jpg
│   │   └── hero-banner.jpg
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   ├── canvasUtils.ts
│   │   └── cosplayAvatars.ts
│   │
│   ├── types/
│   │   ├── cosplayFolder.ts
│   │   └── exhibitor.ts
│   │
│   ├── integrations/
│   │   ├── lovable/
│   │   │   └── index.ts
│   │   └── supabase/
│   │       ├── client.ts            ← createClient Supabase
│   │       └── types.ts             ← types DB auto-générés
│   │
│   ├── hooks/                       ← 1 hook = 1 feature
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useAIRecommendations.ts
│   │   ├── useActivityParticipation.ts
│   │   ├── useApprovedContestants.ts
│   │   ├── useAutoProgress.ts
│   │   ├── useContestRegistration.ts
│   │   ├── useCosCard.ts
│   │   ├── useCosCardStats.ts
│   │   ├── useCosplanStats.ts
│   │   ├── useCosplanTasks.ts
│   │   ├── useCosplans.ts
│   │   ├── useCosplayAchievements.ts
│   │   ├── useCosplayFolders.ts
│   │   ├── useCosplayLineups.ts
│   │   ├── useCosplayRegistrations.ts
│   │   ├── useCosplayVestiaire.ts
│   │   ├── useCosplayWearCount.ts
│   │   ├── useCosplayerAgenda.ts
│   │   ├── useCosplayerProfile.ts
│   │   ├── useDayCosplays.ts
│   │   ├── useDebounce.ts
│   │   ├── useDeleteContestRegistration.ts
│   │   ├── useEventExhibitors.ts
│   │   ├── useEventLineups.ts
│   │   ├── useEventMemories.ts
│   │   ├── useEventParticipants.ts
│   │   ├── useEventParties.ts
│   │   ├── useEventQuests.ts
│   │   ├── useEventSchedule.ts
│   │   ├── useEvents.ts
│   │   ├── useFriendshipExtras.ts
│   │   ├── useFriendships.ts
│   │   ├── useGeocoding.ts
│   │   ├── useGuildDetails.ts
│   │   ├── useGuildEvents.ts
│   │   ├── useGuildInvitations.ts
│   │   ├── useGuildPosts.ts
│   │   ├── useGuilds.ts
│   │   ├── useIsPartner.ts
│   │   ├── useLabsIdeas.ts
│   │   ├── useLeagueStats.ts
│   │   ├── useLineUpMaker.ts
│   │   ├── useLinkshell.ts
│   │   ├── useMangas.ts
│   │   ├── useMeetups.ts
│   │   ├── useNotifications.ts
│   │   ├── useNotifyNakamas.ts
│   │   ├── useOfficialAnimes.ts
│   │   ├── useOfficialMangas.ts
│   │   ├── useOtakuCollections.ts
│   │   ├── usePartyInvitations.ts
│   │   ├── usePosts.ts
│   │   ├── usePreferences.ts
│   │   ├── useProfile.ts
│   │   ├── usePublicUserRoadmap.ts
│   │   ├── useQuickLineup.ts
│   │   ├── useReferenceData.ts
│   │   ├── useScheduleFavorites.ts
│   │   ├── useShopItems.ts
│   │   ├── useShowcasePhotos.ts
│   │   ├── useSquads.ts
│   │   ├── useUnifiedAgenda.ts
│   │   ├── useUpdateProfile.ts
│   │   ├── useUserContestRegistrations.ts
│   │   ├── useUserFavorites.ts
│   │   ├── useUserRoles.ts
│   │   ├── useVolunteerQuests.ts
│   │   └── useWardrobeItems.ts
│   │
│   ├── pages/
│   │   ├── Index.tsx                ← page d'accueil publique
│   │   ├── Auth.tsx
│   │   ├── Onboarding.tsx
│   │   ├── EspaceMembre.tsx         ← dashboard membre
│   │   ├── Agenda.tsx
│   │   ├── MemberAgenda.tsx
│   │   ├── Achievements.tsx
│   │   ├── Annuaire.tsx
│   │   ├── BazarAkihabara.tsx       ← boutique
│   │   ├── Blog.tsx
│   │   ├── Communaute.tsx
│   │   ├── CommunityFeed.tsx
│   │   ├── CommunityRadar.tsx
│   │   ├── Contact.tsx
│   │   ├── CosFeed.tsx
│   │   ├── CosplayProjectDashboard.tsx
│   │   ├── CosplayShowcase.tsx
│   │   ├── CosplayWardrobe.tsx
│   │   ├── Evenements.tsx
│   │   ├── EventDetail.tsx
│   │   ├── EventMemoryCapsule.tsx
│   │   ├── GuildAdmin.tsx
│   │   ├── GuildDetail.tsx
│   │   ├── Guilds.tsx
│   │   ├── Labs.tsx
│   │   ├── LabsIdeaDetail.tsx
│   │   ├── LeHub.tsx
│   │   ├── LeParadis.tsx
│   │   ├── MesAmis.tsx
│   │   ├── NotFound.tsx
│   │   ├── NousRejoindre.tsx
│   │   ├── PublicProfile.tsx
│   │   ├── PublicProfileRoadmap.tsx
│   │   ├── Quests.tsx
│   │   ├── Search.tsx
│   │   ├── Settings.tsx
│   │   ├── SettingsCosplayer.tsx
│   │   ├── SettingsCreative.tsx
│   │   ├── SettingsGamer.tsx
│   │   ├── SettingsOtaku.tsx
│   │   ├── SettingsPublicProfile.tsx
│   │   ├── SettingsSocials.tsx
│   │   ├── VieAssociative.tsx
│   │   ├── admin/
│   │   │   ├── AdminIndex.tsx
│   │   │   ├── AdminAchievements.tsx
│   │   │   ├── AdminBank.tsx
│   │   │   ├── AdminDatabase.tsx
│   │   │   ├── AdminEvents.tsx
│   │   │   ├── AdminExhibitors.tsx
│   │   │   ├── AdminGuilds.tsx
│   │   │   ├── AdminQuests.tsx
│   │   │   ├── AdminShop.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   ├── ContestLiveView.tsx
│   │   │   ├── ContestManager.tsx
│   │   │   └── ScanPage.tsx
│   │   ├── auth/
│   │   │   ├── ProRegister.tsx
│   │   │   └── RoleSelection.tsx
│   │   └── partner/
│   │       ├── PartnerActions.tsx
│   │       ├── PartnerContact.tsx
│   │       ├── PartnerDashboard.tsx
│   │       ├── PartnerDossier.tsx
│   │       ├── PartnerEvents.tsx
│   │       ├── PartnerFAQ.tsx
│   │       ├── PartnerModalites.tsx
│   │       └── PartnerSettings.tsx
│   │
│   └── components/
│       ├── BetaGate.jsx
│       ├── Navigation.tsx
│       ├── NavLink.tsx
│       ├── Footer.tsx
│       ├── RoleBasedRoute.tsx
│       │
│       ├── ui/                      ← shadcn/ui + custom
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   ├── dialog.tsx
│       │   ├── sheet.tsx
│       │   ├── drawer.tsx
│       │   ├── tabs.tsx
│       │   ├── badge.tsx
│       │   ├── avatar.tsx
│       │   ├── input.tsx
│       │   ├── textarea.tsx
│       │   ├── select.tsx
│       │   ├── checkbox.tsx
│       │   ├── switch.tsx
│       │   ├── slider.tsx
│       │   ├── progress.tsx
│       │   ├── toast.tsx / toaster.tsx / sonner.tsx
│       │   ├── table.tsx
│       │   ├── calendar.tsx
│       │   ├── popover.tsx
│       │   ├── tooltip.tsx
│       │   ├── accordion.tsx
│       │   ├── alert.tsx / alert-dialog.tsx
│       │   ├── command.tsx
│       │   ├── dropdown-menu.tsx
│       │   ├── form.tsx
│       │   ├── label.tsx
│       │   ├── scroll-area.tsx
│       │   ├── separator.tsx
│       │   ├── skeleton.tsx
│       │   ├── sidebar.tsx
│       │   ├── carousel.tsx
│       │   ├── chart.tsx
│       │   ├── pagination.tsx
│       │   ├── breadcrumb.tsx
│       │   ├── collapsible.tsx
│       │   ├── resizable.tsx
│       │   ├── toggle.tsx / toggle-group.tsx
│       │   ├── hover-card.tsx
│       │   ├── context-menu.tsx
│       │   ├── menubar.tsx
│       │   ├── navigation-menu.tsx
│       │   ├── radio-group.tsx
│       │   ├── aspect-ratio.tsx
│       │   ├── input-otp.tsx
│       │   ├── AnimatedCounter.tsx
│       │   ├── ConfettiEffect.tsx
│       │   ├── GlassmorphicCard.tsx
│       │   ├── GlitchText.tsx
│       │   ├── ImageCropperModal.tsx
│       │   ├── NeonButton.tsx
│       │   ├── ParticleBackground.tsx
│       │   ├── frontend-design.ts   ← tokens de design custom
│       │   └── use-toast.ts
│       │
│       ├── achievements/
│       │   ├── BadgeCard.tsx
│       │   └── LeagueCard.tsx
│       │
│       ├── admin/
│       │   ├── AdminLayout.tsx
│       │   ├── AdminSidebar.tsx
│       │   ├── AdminExhibitors.tsx
│       │   ├── CandidateCard.tsx
│       │   ├── CandidateDetailSheet.tsx
│       │   ├── ContestConfigModal.tsx
│       │   ├── EventFormAdvanced.tsx
│       │   ├── EventProgramForm.tsx
│       │   ├── EventScheduleForm.tsx
│       │   ├── ExhibitorsTab.tsx
│       │   └── PassageOrderTab.tsx
│       │
│       ├── annuaire/
│       │   ├── MemberAgendaTab.tsx
│       │   ├── MemberBadge.tsx
│       │   ├── MemberCard.tsx
│       │   ├── MemberDetailPanel.tsx
│       │   ├── MemberLibraryGrid.tsx
│       │   ├── MemberVSCarousel.tsx
│       │   └── NakamasList.tsx
│       │
│       ├── auth/
│       │   └── RequireAuth.tsx
│       │
│       ├── boutique/
│       │   ├── CategoryFilters.tsx
│       │   ├── FeaturedCarousel.tsx
│       │   ├── LocalPartnersSection.tsx
│       │   ├── ProductCard.tsx
│       │   └── WalletBar.tsx
│       │
│       ├── community/
│       │   ├── CommunityMap.tsx
│       │   ├── CommunitySidebar.tsx
│       │   ├── CreatePostModal.tsx
│       │   ├── LeafletMap.tsx
│       │   └── PostCard.tsx
│       │
│       ├── coscard/
│       │   ├── CosCardModal.tsx
│       │   └── ScanResultSheet.tsx
│       │
│       ├── cosplay/
│       │   ├── CosplanCard.tsx
│       │   ├── CosplanImageUpload.tsx
│       │   ├── CosplanModal.tsx
│       │   ├── CosplanTaskList.tsx
│       │   ├── CosplayFolderTree.tsx
│       │   ├── CosplayGridWithDnd.tsx
│       │   ├── CreateSquadWizard.tsx
│       │   ├── EventPartyFinderOverview.tsx
│       │   ├── KanbanTaskCard.tsx
│       │   ├── LineUpCanvas.tsx
│       │   ├── LineUpCard.tsx
│       │   ├── LineUpGrid.tsx
│       │   ├── LineUpMakerModal.tsx
│       │   ├── LineUpPreview.tsx
│       │   ├── PartyFinderHub.tsx
│       │   ├── PartyFinderModal.tsx
│       │   ├── ProjectInfosTab.tsx
│       │   ├── ProjectTasksTab.tsx
│       │   ├── TransferToVestiaireModal.tsx
│       │   ├── VisualLineUpModal.tsx
│       │   ├── WardrobeQuickEditSheet.tsx
│       │   └── WardrobeToolbar.tsx
│       │
│       ├── events/
│       │   ├── ActivityCard.tsx
│       │   ├── ArtistAlleySection.tsx
│       │   ├── CharacterSlotSearch.tsx
│       │   ├── ContestActivityModule.tsx
│       │   ├── ContestCountdown.tsx
│       │   ├── ContestDetailModal.tsx
│       │   ├── ContestRegistrationButton.tsx
│       │   ├── CosplayLineup.tsx
│       │   ├── CosplayMeetupsSection.tsx
│       │   ├── CosplayRegistrationModal.tsx
│       │   ├── CreateMeetupModal.tsx
│       │   ├── EventCard.tsx
│       │   ├── EventCountdown.tsx
│       │   ├── EventLocationMap.tsx
│       │   ├── EventQuestsBoard.tsx
│       │   ├── EventRegistrationModal.tsx
│       │   ├── EventScheduleTimeline.tsx
│       │   ├── EventTicketQRCode.tsx
│       │   ├── ExhibitorRequestModal.tsx
│       │   ├── FriendsParticipatingBanner.tsx
│       │   ├── InviteNakamaModal.tsx
│       │   ├── MeetupDetailModal.tsx
│       │   ├── MyPlanningFAB.tsx
│       │   ├── ParticipantGrid.tsx
│       │   ├── ParticipantStack.tsx
│       │   ├── PartyCard.tsx
│       │   ├── PartyDetailModal.tsx
│       │   ├── PartyLobby.tsx
│       │   ├── PartyLockedState.tsx
│       │   ├── PartyWizard.tsx
│       │   ├── PendingInvitationsSection.tsx
│       │   ├── PhotoHuntButton.tsx
│       │   ├── RSVPModal.tsx
│       │   └── ScannerModal.tsx
│       │
│       ├── feed/
│       │   ├── SmartPostCard.tsx
│       │   └── SmartPostCreator.tsx
│       │
│       ├── friends/
│       │   └── FriendButton.tsx
│       │
│       ├── guilds/
│       │   ├── CreateGuildEventModal.tsx
│       │   ├── CreateGuildModal.tsx
│       │   ├── GuildAgenda.tsx
│       │   ├── GuildCard.tsx
│       │   ├── GuildInvitationsSection.tsx
│       │   ├── GuildMembersModal.tsx
│       │   ├── GuildSettingsModal.tsx
│       │   └── GuildStaffCard.tsx
│       │
│       ├── home/
│       │   ├── CTASection.tsx
│       │   ├── EventSection.tsx
│       │   ├── FeaturesSection.tsx
│       │   ├── GamificationSection.tsx
│       │   ├── HeroSection.tsx
│       │   ├── IdentitySection.tsx
│       │   ├── PricingSection.tsx
│       │   ├── ProOffersSection.tsx
│       │   └── TimelineSection.tsx
│       │
│       ├── labs/
│       │   ├── LabsIdeaCard.tsx
│       │   ├── LabsStatusTimeline.tsx
│       │   └── LabsSubmitModal.tsx
│       │
│       ├── linkshell/               ← système de chat
│       │   ├── ChatRoomView.tsx
│       │   ├── LinkshellDrawer.tsx
│       │   ├── LinkshellFAB.tsx
│       │   ├── LinkshellProvider.tsx
│       │   └── RoomList.tsx
│       │
│       ├── member/
│       │   └── AIRecommendationsSection.tsx
│       │
│       ├── memories/
│       │   ├── EncountersSection.tsx
│       │   ├── JournalSection.tsx
│       │   ├── MemoriesTimeline.tsx
│       │   └── PhotoGallerySection.tsx
│       │
│       ├── navigation/
│       │   ├── Breadcrumbs.tsx
│       │   ├── MobileNav.tsx
│       │   ├── NavDropdown.tsx
│       │   ├── SmartBackButton.tsx
│       │   └── UserMenuPanel.tsx
│       │
│       ├── notifications/
│       │   └── DenDenMushi.tsx
│       │
│       ├── onboarding/
│       │   ├── DestinyQuiz.tsx
│       │   ├── MembershipWizard.tsx
│       │   └── steps/
│       │       ├── StepContact.tsx
│       │       ├── StepDestiny.tsx
│       │       ├── StepHealth.tsx
│       │       ├── StepIdentity.tsx
│       │       └── StepPack.tsx
│       │
│       ├── otaku/
│       │   └── CharacterDuelSection.tsx
│       │
│       ├── partner/
│       │   ├── PartnerLayout.tsx
│       │   └── PartnerModalities.tsx
│       │
│       ├── partners/
│       │   ├── PartnerCard.tsx
│       │   ├── PartnerModal.tsx
│       │   ├── PartnersDirectory.tsx
│       │   └── partnersData.ts
│       │
│       ├── profile/
│       │   ├── AchievementsTrophyShelf.tsx
│       │   ├── CosplayContestList.tsx
│       │   ├── CosplayerAgenda.tsx
│       │   ├── LiveProfileEditor.tsx
│       │   ├── PublicRoadmapTimeline.tsx
│       │   ├── RegistrationDetailsModal.tsx
│       │   ├── editors/
│       │   │   ├── EditCosplayModal.tsx
│       │   │   ├── EditCreativeModal.tsx
│       │   │   ├── EditOtakuModal.tsx
│       │   │   └── index.ts
│       │   ├── modals/
│       │   │   ├── CosplayModal.tsx
│       │   │   ├── CreativeModal.tsx
│       │   │   ├── GamerModal.tsx
│       │   │   ├── OtakuModal.tsx
│       │   │   ├── SocialsModal.tsx
│       │   │   └── index.ts
│       │   └── sections/
│       │       ├── CharacterDuelDisplay.tsx
│       │       ├── CosplayerCard.tsx
│       │       ├── CreativeCard.tsx
│       │       ├── GamerIdentityCard.tsx
│       │       ├── GamesGrid.tsx
│       │       ├── GenreRadar.tsx
│       │       ├── MangaPantheon.tsx
│       │       ├── OtakuDNA.tsx
│       │       ├── VestiaireGallery.tsx
│       │       └── index.ts
│       │
│       ├── quests/
│       │   ├── QuestCard.tsx
│       │   ├── QuestFilters.tsx
│       │   ├── QuestJournalCard.tsx
│       │   └── StaffQuestPanel.tsx
│       │
│       ├── search/
│       │   ├── CosplayResultCard.tsx
│       │   ├── LocationResultCard.tsx
│       │   └── ProfileResultCard.tsx
│       │
│       └── settings/
│           ├── AchievementAddModal.tsx
│           ├── AchievementCard.tsx
│           ├── AnimeCard.tsx
│           ├── AvatarUpload.tsx
│           ├── CosplayAddModal.tsx
│           ├── CosplayVSCard.tsx
│           ├── MangaCard.tsx
│           └── MediaAddModal.tsx
│
├── supabase/
│   └── migrations/                  ← historique SQL complet
│       ├── 20250212_creators_quarter_setup.sql
│       ├── 20250212_event_schedule_setup.sql
│       ├── 20260213_add_event_checkin.sql
│       ├── 20260214_*.sql
│       ├── 20260215_*.sql
│       ├── 20260216_*.sql
│       ├── 20260224_*.sql
│       ├── 20260225_*.sql
│       └── 20260226_*.sql
│
├── MonAppMobile/                    ← React Native (bare)
│   ├── App.tsx
│   ├── package.json
│   ├── android/
│   └── ...
│
└── MonAppExpo/                      ← Expo / React Native
    ├── App.tsx
    ├── package.json
    └── assets/
```

---

## Patterns à respecter pour générer du code

### Nouveau hook de data fetching
```ts
// src/hooks/useMyFeature.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMyFeature(userId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-feature", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("my_table")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: async (payload: { field: string }) => {
      const { error } = await supabase.from("my_table").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-feature", userId] });
      toast({ title: "Succès", description: "Action effectuée." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    },
  });

  return { data, isLoading, mutation };
}
```

### Nouveau composant page
```tsx
// src/pages/MyPage.tsx
import { useAuth } from "@/contexts/AuthContext";
import { useMyFeature } from "@/hooks/useMyFeature";

export default function MyPage() {
  const { user } = useAuth();
  const { data, isLoading } = useMyFeature(user?.id ?? "");

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* contenu */}
    </div>
  );
}
```

### Enregistrer une nouvelle route dans App.tsx
Ajouter dans `src/App.tsx` :
```tsx
import MyPage from "./pages/MyPage";
// ...
<Route path="/my-path" element={<RequireAuth><MyPage /></RequireAuth>} />
```

### Nouveau composant UI
- Utiliser les primitives de `src/components/ui/` (button, card, dialog, sheet…)
- Utiliser `cn()` de `src/lib/utils.ts` pour les classes conditionnelles
- Pas de styles inline, uniquement Tailwind

---

## Domaines fonctionnels

| Domaine | Pages concernées | Hooks principaux |
|---|---|---|
| Authentification | Auth, Onboarding | AuthContext, useProfile |
| Profil membre | EspaceMembre, Settings*, PublicProfile | useProfile, useUpdateProfile, useUserRoles |
| Cosplay | CosplayWardrobe, CosplayProjectDashboard, CosplayShowcase | useCosplans, useCosplayVestiaire, useCosplayFolders |
| Événements | Evenements, EventDetail | useEvents, useEventParticipants, useEventSchedule |
| Guildes | Guilds, GuildDetail, GuildAdmin | useGuilds, useGuildDetails |
| Communauté | CommunityFeed, CommunityRadar, Communaute | usePosts, useGeocoding |
| Amis / Nakamas | MesAmis, Annuaire | useFriendships, useFriendshipExtras |
| Quêtes | Quests | useEventQuests, useVolunteerQuests |
| Boutique | BazarAkihabara | useShopItems |
| Admin | admin/* | useUserRoles, useEventExhibitors |
| Partenaires | partner/* | useIsPartner |
| Agenda | Agenda, MemberAgenda | useUnifiedAgenda, useCosplayerAgenda |
| Chat | (global via LinkshellProvider) | useLinkshell |
| Notifications | (global via DenDenMushi) | useNotifications |

---

## Variables d'environnement requises

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Notes importantes pour la génération de code

1. **Imports** : utiliser les alias `@/` (configuré dans `tsconfig.app.json` et `vite.config.ts`)
2. **Types Supabase** : référencer `src/integrations/supabase/types.ts` pour les types de tables
3. **Toast** : toujours utiliser `useToast` depuis `@/hooks/use-toast` (pas directement sonner)
4. **Auth** : récupérer l'utilisateur via `useAuth()` depuis `@/contexts/AuthContext`
5. **Routing** : les routes protégées utilisent `<RequireAuth>`, les routes admin `<RoleBasedRoute>`
6. **Nommage** : PascalCase pour les composants, camelCase pour les hooks (préfixe `use`)
7. **Localisation** : l'interface est en **français** (labels, toasts, placeholders)
8. **Univers** : thème manga/anime/cosplay — vocabulaire spécifique (Nakamas = amis, Vestiaire = garde-robe cosplay, etc.)
