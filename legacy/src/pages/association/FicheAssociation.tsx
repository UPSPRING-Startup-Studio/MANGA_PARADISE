import { useParams, Link } from "react-router-dom";
import { Loader2, Building2, ArrowLeft, UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  useAssociationBySlug,
  useAssociationMembers,
  useMyAssociationMembership,
  LEADER_ROLES,
  type AssociationRole,
} from "@/hooks/useAssociation";
import {
  useAssociationFicheConfig,
  isSectionVisible,
} from "@/hooks/useAssociationFiche";
import { useAssociationDocuments } from "@/hooks/useAssociationDocuments";

// Fiche section components
import FicheHeader from "@/components/association/fiche/FicheHeader";
import FichePresidentMessage from "@/components/association/fiche/FichePresidentMessage";
import FicheADNCards from "@/components/association/fiche/FicheADNCards";
import FicheTeamSection from "@/components/association/fiche/FicheTeamSection";
import FicheDocumentsSection from "@/components/association/fiche/FicheDocumentsSection";
import FicheCharterSection from "@/components/association/fiche/FicheCharterSection";
import FicheQuickActions from "@/components/association/fiche/FicheQuickActions";

const BUREAU_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "tresorier",
  "secretaire",
];

const FicheAssociation = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  // Fetch association
  const {
    data: association,
    isLoading: assocLoading,
    error: assocError,
  } = useAssociationBySlug(slug);

  // Fetch fiche config
  const { data: ficheConfig, isLoading: ficheLoading } =
    useAssociationFicheConfig(association?.id);

  // Fetch membership of current user
  const { data: membership } = useMyAssociationMembership(association?.id);

  // Fetch members (for team section)
  const { data: members } = useAssociationMembers(association?.id);

  // Fetch documents (for documents section)
  const { data: documents } = useAssociationDocuments(association?.id, {
    status: "approved",
  });

  // ── Derived state ──
  const isMember = !!membership;
  const isLeader = membership
    ? LEADER_ROLES.includes(membership.role)
    : false;
  const isBureau = membership
    ? BUREAU_ROLES.includes(membership.role)
    : false;
  const canConfigure = isBureau;

  const isLoading = assocLoading || ficheLoading;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-sakura mx-auto" />
            <p className="text-muted-foreground">
              Chargement de la fiche association...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Association not found ──
  if (!association || assocError) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display text-foreground">
              Association introuvable
            </h1>
            <p className="text-muted-foreground">
              L'association "{slug}" n'existe pas ou n'est plus active.
            </p>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Default config if not yet created ──
  const config = ficheConfig || {
    id: "",
    association_id: association.id,
    president_message: null,
    president_name: null,
    president_title: null,
    president_photo: null,
    mission: null,
    vision: null,
    values: null,
    charter_rules: [],
    sections_visibility: {
      president_message: "visible" as const,
      mission: "visible" as const,
      vision: "visible" as const,
      values: "visible" as const,
      team_bureau: "visible" as const,
      team_staff: "visible" as const,
      documents: "internal" as const,
      charter: "visible" as const,
      quick_actions: "internal" as const,
      faq: "hidden" as const,
    },
    team_visible_roles: [
      "president",
      "vice_president",
      "tresorier",
      "secretaire",
      "responsable",
    ],
    featured_document_ids: [],
    updated_by: null,
    created_at: "",
    updated_at: "",
  };

  const vis = config.sections_visibility;

  // Helper
  const show = (key: keyof typeof vis) => isSectionVisible(key, vis, isMember);

  const showTeamBureau = show("team_bureau");
  const showTeamStaff = show("team_staff");
  const hasAnyADN =
    (show("mission") && config.mission) ||
    (show("vision") && config.vision) ||
    (show("values") && config.values);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24 space-y-12">
        {/* Header with banner, logo, name, config button, join CTA */}
        <FicheHeader
          association={association}
          canConfigure={canConfigure}
          memberCount={association.member_count}
          isMember={isMember}
          slug={slug}
        />

        {/* President Message */}
        {show("president_message") && config.president_message && (
          <FichePresidentMessage config={config} />
        )}

        {/* Mission / Vision / Values */}
        {hasAnyADN && <FicheADNCards config={config} isMember={isMember} />}

        {/* Charter */}
        {show("charter") && config.charter_rules.length > 0 && (
          <FicheCharterSection
            rules={config.charter_rules}
            associationName={association.name}
          />
        )}

        {/* Team */}
        {(showTeamBureau || showTeamStaff) && members && members.length > 0 && (
          <FicheTeamSection
            members={members}
            visibleRoles={config.team_visible_roles}
            showBureau={showTeamBureau}
            showStaff={showTeamStaff}
          />
        )}

        {/* Documents */}
        {show("documents") && documents && (
          <FicheDocumentsSection
            documents={documents}
            featuredDocumentIds={config.featured_document_ids}
          />
        )}

        {/* Quick Actions */}
        {show("quick_actions") && (
          <FicheQuickActions hasBackOfficeAccess={isLeader} />
        )}

        {/* Join CTA for non-members */}
        {!isMember && (
          <Card className="bg-gradient-to-br from-sakura/10 via-background to-accent/5 border-sakura/30 overflow-hidden">
            <CardContent className="p-6 md:p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-sakura/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-sakura" />
              </div>
              <h2 className="text-xl font-display text-foreground">
                Rejoins {association.name} !
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                Deviens membre pour acceder a l'integralite de la fiche,
                participer aux evenements, rejoindre la communaute et
                profiter de tous les avantages de l'association.
              </p>
              <Link to={`/asso/${slug}/adhesion`}>
                <Button size="lg" className="gap-2 bg-sakura hover:bg-sakura/90 mt-2">
                  <UserPlus className="w-5 h-5" />
                  Remplir mon bulletin d'adhesion
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FicheAssociation;
