import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LinkshellProvider } from "@/components/linkshell/LinkshellProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Index from "./pages/Index";
import Evenements from "./pages/Evenements";
import EventDetail from "./pages/EventDetail";
import CosFeed from "./pages/CosFeed";
import CommunityFeed from "./pages/CommunityFeed";
import BazarAkihabara from "./pages/BazarAkihabara";
import SearchPage from "./pages/Search";
import Communaute from "./pages/Communaute";
import CommunityRadar from "./pages/CommunityRadar";
import Annuaire from "./pages/Annuaire";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/auth/RoleSelection";
import Onboarding from "./pages/Onboarding";
import EspaceMembre from "./pages/EspaceMembre";
import MemberAgenda from "./pages/MemberAgenda";
import MesAmis from "./pages/MesAmis";
import Settings from "./pages/Settings";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import LeHub from "./pages/LeHub";
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";
import PublicProfileRoadmap from "./pages/PublicProfileRoadmap";
import NousRejoindre from "./pages/NousRejoindre";
import PartnerLayout from "./components/partner/PartnerLayout";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerModalites from "./pages/partner/PartnerModalites";
import PartnerEvents from "./pages/partner/PartnerEvents";
import PartnerActions from "./pages/partner/PartnerActions";
import PartnerDossier from "./pages/partner/PartnerDossier";
import PartnerSettings from "./pages/partner/PartnerSettings";
import PartnerFAQ from "./pages/partner/PartnerFAQ";
import PartnerContact from "./pages/partner/PartnerContact";
import AdminLayout from "./components/admin/AdminLayout";
import AdminIndex from "./pages/admin/AdminIndex";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEvents from "./pages/admin/AdminEvents";
import ScanPage from "./pages/admin/ScanPage";
import AdminShop from "./pages/admin/AdminShop";
import AdminQuests from "./pages/admin/AdminQuests";
import AdminBank from "./pages/admin/AdminBank";
import AdminDatabase from "./pages/admin/AdminDatabase";
import AdminAchievements from "./pages/admin/AdminAchievements";
import AdminGuilds from "./pages/admin/AdminGuilds";
import AdminAssociations from "./pages/admin/AdminAssociations";
import AdminAssociationLayout from "./pages/admin/AdminAssociationLayout";
import AdminExhibitors from "./pages/admin/AdminExhibitors";
import ContestManager from "./pages/admin/ContestManager";
import ContestLiveView from "./pages/admin/ContestLiveView";
import Guilds from "./pages/Guilds";
import GuildDetail from "./pages/GuildDetail";
import GuildAdmin from "./pages/GuildAdmin";
import Labs from "./pages/Labs";
import LabsIdeaDetail from "./pages/LabsIdeaDetail";
import EventMemoryCapsule from "./pages/EventMemoryCapsule";
import VieAssociative from "./pages/VieAssociative";
import AssociationLayout from "./components/association/AssociationLayout";
import AssociationDashboard from "./pages/association/AssociationDashboard";
import AssociationMembers from "./pages/association/AssociationMembers";
import AssociationInvitations from "./pages/association/AssociationInvitations";
import AssociationEventsPage from "./pages/association/AssociationEventsPage";
import AssociationContactsPage from "./pages/association/AssociationContactsPage";
import AssociationDocumentsPage from "./pages/association/AssociationDocumentsPage";
import AssociationSettings from "./pages/association/AssociationSettings";
import AssociationSubmissions from "./pages/association/AssociationSubmissions";
import SubmissionDetail from "./pages/association/SubmissionDetail";
import AssociationMembershipForms from "./pages/association/AssociationMembershipForms";
import MembershipFormDetail from "./pages/association/MembershipFormDetail";
import FormBuilderPage from "./pages/association/FormBuilderPage";
import AssociationSlugRedirect from "./pages/association/AssociationSlugRedirect";
import FicheAssociation from "./pages/association/FicheAssociation";
import MembershipFormPage from "./pages/association/MembershipFormPage";
import AssociationVolunteers from "./pages/association/AssociationVolunteers";
import AssociationTeam from "./pages/association/AssociationTeam";
import VolunteerDashboard from "./pages/association/VolunteerDashboard";
import VolunteerApplications from "./pages/association/VolunteerApplications";
import VolunteerMissions from "./pages/association/VolunteerMissions";
import VolunteerAssignments from "./pages/association/VolunteerAssignments";
import VolunteerPlanning from "./pages/association/VolunteerPlanning";
import MissionTemplatesPage from "./pages/association/MissionTemplates";
import MissionSchemaConfigurator from "./pages/association/MissionSchemaConfigurator";
import ProPartnerLayout from "./components/pro-partner/ProPartnerLayout";
import ProDashboard from "./pages/pro/ProDashboard";
import ProEvents from "./pages/pro/ProEvents";
import ProStructure from "./pages/pro/ProStructure";
import ProSettings from "./pages/pro/ProSettings";
import ProDemandes from "./pages/pro/ProDemandes";
import DevenirPartenaire from "./pages/pro/DevenirPartenaire";
import AdminProPartners from "./pages/admin/AdminProPartners";
import AdminEventProposals from "./pages/admin/AdminEventProposals";
import AgendaFavoritesPage from "./pages/AgendaFavoritesPage";
import Quests from "./pages/Quests";
import Achievements from "./pages/Achievements";
import ProRegister from "./pages/auth/ProRegister";
import Activate from "./pages/auth/Activate";
import CosplayWardrobe from "./pages/CosplayWardrobe";
import CosplayShowcase from "./pages/CosplayShowcase";
import CosplayProjectDashboard from "./pages/CosplayProjectDashboard";
import CosplayHub from "./pages/CosplayHub";
import Agenda from "./pages/Agenda";
import MesPhotosCosplay from "./pages/MesPhotosCosplay";
// TEMPORAIRE – DEV PREVIEW (à supprimer en prod)
import AssociationPreview from "./pages/dev/AssociationPreview";
import { UnsavedChangesProvider } from "./contexts/UnsavedChangesContext";
import LandingPage from "./pages/LandingPage";
import AgendaPage from "./pages/AgendaPage";

const queryClient = new QueryClient();

/** Redirect helper: old cosplay routes → unified CosplayHub */
function RedirectToHub({ defaultTab }: { defaultTab: string }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || defaultTab;
  return <Navigate to={`/espace-membre/cosplay/${id}?tab=${tab}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UnsavedChangesProvider>
          <LinkshellProvider>
          <Routes>
            {/* PUBLIC ROUTES - Accessible sans authentification */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/nous-rejoindre" element={<NousRejoindre />} />
            <Route path="/auth/activate" element={<Activate />} />

            {/* PROTECTED ROUTES - Nécessitent une authentification */}
            <Route path="/app" element={<RequireAuth><RoleBasedRoute memberComponent={<Index />} partnerComponent={<ProRegister />} /></RequireAuth>} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/agenda/favoris" element={<RequireAuth><AgendaFavoritesPage /></RequireAuth>} />
            <Route path="/agenda/associations" element={<RequireAuth><Agenda /></RequireAuth>} />
            <Route path="/agenda/:eventId" element={<RequireAuth><EventDetail /></RequireAuth>} />
            <Route path="/blog" element={<RequireAuth><Blog /></RequireAuth>} />
            <Route path="/contact" element={<RequireAuth><Contact /></RequireAuth>} />
            <Route path="/le-hub" element={<RequireAuth><LeHub /></RequireAuth>} />
            <Route path="/le-hub/*" element={<RequireAuth><LeHub /></RequireAuth>} />
            {/* Association Back-Office Routes */}
            <Route path="/association" element={<RequireAuth><AssociationLayout /></RequireAuth>}>
              <Route path="dashboard" element={<AssociationDashboard />} />
              <Route path="membres" element={<AssociationMembers />} />
              <Route path="invitations" element={<AssociationInvitations />} />
              <Route path="evenements" element={<AssociationEventsPage />} />
              <Route path="contacts" element={<AssociationContactsPage />} />
              <Route path="documents" element={<AssociationDocumentsPage />} />
              <Route path="adhesions" element={<AssociationSubmissions />} />
              <Route path="adhesions/:submissionId" element={<SubmissionDetail />} />
              <Route path="benevoles" element={<AssociationVolunteers />} />
              <Route path="equipe" element={<AssociationTeam />} />
              <Route path="vol-dashboard" element={<VolunteerDashboard />} />
              <Route path="vol-candidatures" element={<VolunteerApplications />} />
              <Route path="vol-missions" element={<VolunteerMissions />} />
              <Route path="vol-affectations" element={<VolunteerAssignments />} />
              <Route path="vol-planning" element={<VolunteerPlanning />} />
              <Route path="vol-templates" element={<MissionTemplatesPage />} />
              <Route path="vol-schema" element={<MissionSchemaConfigurator />} />
              <Route path="formulaires" element={<AssociationMembershipForms />} />
              <Route path="formulaires/:formId" element={<MembershipFormDetail />} />
              <Route path="formulaires/:formId/edit" element={<FormBuilderPage />} />
              <Route path="parametres" element={<AssociationSettings />} />
              <Route index element={<AssociationDashboard />} />
            </Route>
            <Route path="/feed" element={<RequireAuth><CosFeed /></RequireAuth>} />
            <Route path="/communaute/annuaire" element={<RequireAuth><Annuaire /></RequireAuth>} />
            <Route path="/communaute/radar" element={<RequireAuth><CommunityRadar /></RequireAuth>} />
            <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
            <Route path="/communaute/bazar" element={<RequireAuth><BazarAkihabara /></RequireAuth>} />
            <Route path="/communaute/feed" element={<RequireAuth><CommunityFeed /></RequireAuth>} />
            <Route path="/communaute/guilds" element={<RequireAuth><Guilds /></RequireAuth>} />
            <Route path="/guilds" element={<RequireAuth><Guilds /></RequireAuth>} />
            <Route path="/guilds/:guildId" element={<RequireAuth><GuildDetail /></RequireAuth>} />
            <Route path="/guilds/:guildId/admin" element={<RequireAuth><GuildAdmin /></RequireAuth>} />
            <Route path="/labs" element={<RequireAuth><Labs /></RequireAuth>} />
            <Route path="/labs/:id" element={<RequireAuth><LabsIdeaDetail /></RequireAuth>} />
            <Route path="/communaute/*" element={<RequireAuth><Communaute /></RequireAuth>} />
            <Route path="/boutique" element={<RequireAuth><BazarAkihabara /></RequireAuth>} />
            <Route path="/gateway" element={<RequireAuth><RoleSelection /></RequireAuth>} />
            <Route path="/u/:username" element={<RequireAuth><PublicProfile /></RequireAuth>} />
            <Route path="/profile/:username" element={<RequireAuth><PublicProfileRoadmap /></RequireAuth>} />
            
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
            <Route path="/pro/portal" element={<RequireAuth><ProRegister /></RequireAuth>} />
            <Route path="/partner-portal" element={<RequireAuth><PartnerLayout><PartnerDashboard /></PartnerLayout></RequireAuth>} />
            <Route path="/partner-portal/modalites" element={<RequireAuth><PartnerLayout><PartnerModalites /></PartnerLayout></RequireAuth>} />
            <Route path="/partner-portal/events" element={<RequireAuth><PartnerLayout><PartnerEvents /></PartnerLayout></RequireAuth>} />
            <Route path="/partner-portal/actions" element={<RequireAuth><PartnerLayout><PartnerActions /></PartnerLayout></RequireAuth>} />
            <Route path="/partner-portal/dossier" element={<RequireAuth><PartnerLayout><PartnerDossier /></PartnerLayout></RequireAuth>} />
            <Route path="/partner-portal/settings" element={<RequireAuth><PartnerLayout><PartnerSettings /></PartnerLayout></RequireAuth>} />
            <Route path="/partner-portal/faq" element={<RequireAuth><PartnerLayout><PartnerFAQ /></PartnerLayout></RequireAuth>} />
            <Route path="/partner-portal/contact" element={<RequireAuth><PartnerLayout><PartnerContact /></PartnerLayout></RequireAuth>} />
            <Route path="/espace-membre" element={<RequireAuth><EspaceMembre /></RequireAuth>} />
            <Route path="/espace-membre/billets" element={<RequireAuth><MemberAgenda /></RequireAuth>} />
            <Route path="/espace-membre/amis" element={<RequireAuth><MesAmis /></RequireAuth>} />
            <Route path="/espace-membre/parametres" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/espace-membre/quetes" element={<RequireAuth><Quests /></RequireAuth>} />
            <Route path="/espace-membre/achievements" element={<RequireAuth><Achievements /></RequireAuth>} />
            <Route path="/espace-membre/mes-photos" element={<RequireAuth><MesPhotosCosplay /></RequireAuth>} />
            <Route path="/espace-membre/vestiaire" element={<RequireAuth><CosplayWardrobe /></RequireAuth>} />
            {/* Fiche cosplay unifiée (nouveau hub) */}
            <Route path="/espace-membre/cosplay/:id" element={<RequireAuth><CosplayHub /></RequireAuth>} />
            {/* Redirections de compatibilité — anciennes routes vers le hub */}
            <Route path="/espace-membre/vestiaire/:id" element={<RedirectToHub defaultTab="overview" />} />
            <Route path="/espace-membre/projets/:id" element={<RedirectToHub defaultTab="tasks" />} />
            {/* Pro Partner Back-Office Routes */}
            <Route path="/pro" element={<RequireAuth><ProPartnerLayout /></RequireAuth>}>
              <Route path="dashboard" element={<ProDashboard />} />
              <Route path="evenements" element={<ProEvents />} />
              <Route path="structure" element={<ProStructure />} />
              <Route path="demandes" element={<ProDemandes />} />
              <Route path="parametres" element={<ProSettings />} />
              <Route index element={<ProDashboard />} />
            </Route>
            <Route path="/devenir-partenaire" element={<RequireAuth><DevenirPartenaire /></RequireAuth>} />
            <Route path="/vie-associative" element={<RequireAuth><VieAssociative /></RequireAuth>} />
            <Route path="/asso/:slug" element={<RequireAuth><FicheAssociation /></RequireAuth>} />
            <Route path="/asso/:slug/adhesion" element={<MembershipFormPage />} />
            <Route path="/asso/:slug/admin/membres" element={<RequireAuth><AssociationSlugRedirect /></RequireAuth>} />
            <Route path="/asso/:slug/admin/evenements" element={<RequireAuth><AssociationSlugRedirect /></RequireAuth>} />
            <Route path="/evenements" element={<RequireAuth><Evenements /></RequireAuth>} />
            <Route path="/evenements/:eventId" element={<RequireAuth><EventDetail /></RequireAuth>} />
            <Route path="/espace-membre/souvenirs/:eventId" element={<RequireAuth><EventMemoryCapsule /></RequireAuth>} />
            
            {/* Admin Routes - Protected */}
            <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
              <Route index element={<AdminIndex />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="events/:id/contest-manager" element={<ContestManager />} />
              <Route path="contest-live/:id" element={<ContestLiveView />} />
              <Route path="scan/:eventId" element={<ScanPage />} />
              <Route path="exhibitors" element={<AdminExhibitors />} />
              <Route path="shop" element={<AdminShop />} />
              <Route path="quests" element={<AdminQuests />} />
              <Route path="bank" element={<AdminBank />} />
              <Route path="database" element={<AdminDatabase />} />
              <Route path="achievements" element={<AdminAchievements />} />
              <Route path="guilds" element={<AdminGuilds />} />
              <Route path="associations" element={<AdminAssociations />} />
              <Route path="partners" element={<AdminProPartners />} />
              <Route path="event-proposals" element={<AdminEventProposals />} />
            </Route>

            {/* Admin Association Back-Office — standalone layout (not nested in AdminLayout) */}
            <Route path="/admin/associations/:associationId" element={<RequireAuth><AdminAssociationLayout /></RequireAuth>}>
              <Route path="dashboard" element={<AssociationDashboard />} />
              <Route path="membres" element={<AssociationMembers />} />
              <Route path="invitations" element={<AssociationInvitations />} />
              <Route path="evenements" element={<AssociationEventsPage />} />
              <Route path="contacts" element={<AssociationContactsPage />} />
              <Route path="documents" element={<AssociationDocumentsPage />} />
              <Route path="adhesions" element={<AssociationSubmissions />} />
              <Route path="adhesions/:submissionId" element={<SubmissionDetail />} />
              <Route path="benevoles" element={<AssociationVolunteers />} />
              <Route path="equipe" element={<AssociationTeam />} />
              <Route path="vol-dashboard" element={<VolunteerDashboard />} />
              <Route path="vol-candidatures" element={<VolunteerApplications />} />
              <Route path="vol-missions" element={<VolunteerMissions />} />
              <Route path="vol-affectations" element={<VolunteerAssignments />} />
              <Route path="vol-planning" element={<VolunteerPlanning />} />
              <Route path="vol-templates" element={<MissionTemplatesPage />} />
              <Route path="vol-schema" element={<MissionSchemaConfigurator />} />
              <Route path="formulaires" element={<AssociationMembershipForms />} />
              <Route path="formulaires/:formId" element={<MembershipFormDetail />} />
              <Route path="formulaires/:formId/edit" element={<FormBuilderPage />} />
              <Route path="parametres" element={<AssociationSettings />} />
              <Route index element={<Navigate to="dashboard" />} />
            </Route>
            
            {/* TEMPORAIRE – DEV PREVIEW : accès rapide au module association */}
            <Route path="/dev/association-preview" element={<RequireAuth><AssociationPreview /></RequireAuth>} />

            <Route path="*" element={<RequireAuth><NotFound /></RequireAuth>} />
          </Routes>
          </LinkshellProvider>
          </UnsavedChangesProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
