import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Settings,
  Save,
  Eye,
  EyeOff,
  FileText,
  Users,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import { ASSOCIATION_ROLE_LABELS, LEADER_ROLES } from "@/hooks/useAssociation";
import {
  useAssociationFicheConfig,
  useUpdateFicheConfig,
  SECTION_LABELS,
  VISIBILITY_LABELS,
  DEFAULT_SECTIONS_VISIBILITY,
  type SectionVisibility,
  type SectionsVisibility,
  type CharterRule,
  type AssociationFicheConfig,
} from "@/hooks/useAssociationFiche";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const BUREAU_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "tresorier",
  "secretaire",
];

const ALL_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "tresorier",
  "secretaire",
  "responsable",
  "benevole",
  "membre",
];

const AssociationSettings = () => {
  const { association, role } = useOutletContext<AssociationContext>();
  const gov = useAssociationGovernance();
  const isBureau = role ? BUREAU_ROLES.includes(role) : false;

  const { data: ficheConfig, isLoading } = useAssociationFicheConfig(
    association?.id
  );
  const updateFiche = useUpdateFicheConfig();

  // ── Local state for the form ──
  const [presidentMessage, setPresidentMessage] = useState("");
  const [presidentName, setPresidentName] = useState("");
  const [presidentTitle, setPresidentTitle] = useState("President·e");
  const [presidentPhoto, setPresidentPhoto] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [values, setValues] = useState("");
  const [charterRules, setCharterRules] = useState<CharterRule[]>([]);
  const [sectionsVisibility, setSectionsVisibility] =
    useState<SectionsVisibility>(DEFAULT_SECTIONS_VISIBILITY);
  const [teamVisibleRoles, setTeamVisibleRoles] = useState<string[]>([
    "president",
    "vice_president",
    "tresorier",
    "secretaire",
    "responsable",
  ]);

  // ── Hydrate from DB ──
  useEffect(() => {
    if (ficheConfig) {
      setPresidentMessage(ficheConfig.president_message || "");
      setPresidentName(ficheConfig.president_name || "");
      setPresidentTitle(ficheConfig.president_title || "President·e");
      setPresidentPhoto(ficheConfig.president_photo || "");
      setMission(ficheConfig.mission || "");
      setVision(ficheConfig.vision || "");
      setValues(ficheConfig.values || "");
      setCharterRules(ficheConfig.charter_rules || []);
      setSectionsVisibility({
        ...DEFAULT_SECTIONS_VISIBILITY,
        ...ficheConfig.sections_visibility,
      });
      setTeamVisibleRoles(ficheConfig.team_visible_roles || []);
    }
  }, [ficheConfig]);

  // ── Handlers ──
  const handleSave = () => {
    if (!gov.canSaveSettings) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    if (!association) return;

    updateFiche.mutate({
      associationId: association.id,
      data: {
        president_message: presidentMessage || null,
        president_name: presidentName || null,
        president_title: presidentTitle || null,
        president_photo: presidentPhoto || null,
        mission: mission || null,
        vision: vision || null,
        values: values || null,
        charter_rules: charterRules,
        sections_visibility: sectionsVisibility,
        team_visible_roles: teamVisibleRoles,
      },
    });
  };

  const updateVisibility = (
    key: keyof SectionsVisibility,
    value: SectionVisibility
  ) => {
    setSectionsVisibility((prev) => ({ ...prev, [key]: value }));
  };

  const toggleRole = (role: string) => {
    setTeamVisibleRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const addCharterRule = () => {
    setCharterRules((prev) => [
      ...prev,
      { emoji: "", title: "", description: "" },
    ]);
  };

  const updateCharterRule = (
    index: number,
    field: keyof CharterRule,
    value: string
  ) => {
    setCharterRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeCharterRule = (index: number) => {
    setCharterRules((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Guards ──
  if (!association) return null;

  if (!isBureau) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display text-foreground">Parametres</h1>
          <p className="text-muted-foreground mt-1">
            Configuration de {association.name}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Settings className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">
            Acces restreint
          </h2>
          <p className="text-muted-foreground max-w-md">
            Seuls les membres du bureau peuvent configurer la fiche association.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Governance banner */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div className={`rounded-lg border p-3 mb-4 ${gov.isBlocked ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <p className={`text-sm ${gov.isBlocked ? "text-red-300" : "text-amber-300"}`}>
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Parametres & Fiche Association
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure la fiche publique de {association.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {association.slug && (
            <Link to={`/asso/${association.slug}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Voir la fiche
              </Button>
            </Link>
          )}
          <Button
            onClick={handleSave}
            disabled={updateFiche.isPending || !gov.canSaveSettings}
            className="gap-2 bg-sakura hover:bg-sakura/90"
          >
            {updateFiche.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="bg-card/50 border border-border/50">
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="visibility">Visibilite</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="charter">Charte</TabsTrigger>
        </TabsList>

        {/* ═══════════════ TAB: CONTENT ═══════════════ */}
        <TabsContent value="content" className="space-y-6">
          {/* President Message */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Mot du/de la President·e</CardTitle>
              <CardDescription>
                Message d'accueil affiche en haut de la fiche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={presidentName}
                    onChange={(e) => setPresidentName(e.target.value)}
                    placeholder="Prenom Nom"
                    disabled={gov.isBlocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titre / Fonction</Label>
                  <Input
                    value={presidentTitle}
                    onChange={(e) => setPresidentTitle(e.target.value)}
                    placeholder="President·e"
                    disabled={gov.isBlocked}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL de la photo</Label>
                <Input
                  value={presidentPhoto}
                  onChange={(e) => setPresidentPhoto(e.target.value)}
                  placeholder="https://..."
                  disabled={gov.isBlocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={presidentMessage}
                  onChange={(e) => setPresidentMessage(e.target.value)}
                  placeholder="Cher membre, c'est avec joie que..."
                  rows={5}
                  disabled={gov.isBlocked}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mission / Vision / Values */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">ADN de l'association</CardTitle>
              <CardDescription>
                Mission, vision et valeurs affichees sur la fiche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notre Mission</Label>
                <Textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="Decouvrir et partager la richesse de la culture japonaise..."
                  rows={3}
                  disabled={gov.isBlocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Notre Vision</Label>
                <Textarea
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder="Creer un pont entre le Japon et le reste du monde..."
                  rows={3}
                  disabled={gov.isBlocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Nos Valeurs</Label>
                <Textarea
                  value={values}
                  onChange={(e) => setValues(e.target.value)}
                  placeholder="Passion, Curiosite, Inclusion..."
                  rows={3}
                  disabled={gov.isBlocked}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ TAB: VISIBILITY ═══════════════ */}
        <TabsContent value="visibility" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-sakura" />
                Visibilite des sections
              </CardTitle>
              <CardDescription>
                Choisis quelles sections apparaissent sur la fiche et pour qui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(
                  Object.keys(SECTION_LABELS) as (keyof SectionsVisibility)[]
                ).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {sectionsVisibility[key] === "hidden" ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-sakura" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {SECTION_LABELS[key]}
                      </span>
                    </div>
                    <Select
                      value={sectionsVisibility[key]}
                      onValueChange={(v) =>
                        updateVisibility(key, v as SectionVisibility)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visible">
                          Visible par tous
                        </SelectItem>
                        <SelectItem value="internal">
                          Membres uniquement
                        </SelectItem>
                        <SelectItem value="hidden">Masque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ TAB: TEAM ═══════════════ */}
        <TabsContent value="team" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-sakura" />
                Trombinoscope
              </CardTitle>
              <CardDescription>
                Choisis quels roles apparaissent dans le trombinoscope de la
                fiche
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ALL_ROLES.map((r) => (
                  <div
                    key={r}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {ASSOCIATION_ROLE_LABELS[r]}
                      </span>
                    </div>
                    <Switch
                      checked={teamVisibleRoles.includes(r)}
                      onCheckedChange={() => toggleRole(r)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ TAB: CHARTER ═══════════════ */}
        <TabsContent value="charter" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-sakura" />
                Charte des Membres
              </CardTitle>
              <CardDescription>
                Les engagements et regles de ta communaute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {charterRules.map((rule, index) => (
                <Card
                  key={index}
                  className="bg-background/50 border-border/30"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Regle {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeCharterRule(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-[60px_1fr] gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Emoji</Label>
                        <Input
                          value={rule.emoji}
                          onChange={(e) =>
                            updateCharterRule(index, "emoji", e.target.value)
                          }
                          placeholder="🤝"
                          className="text-center text-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Titre</Label>
                        <Input
                          value={rule.title}
                          onChange={(e) =>
                            updateCharterRule(index, "title", e.target.value)
                          }
                          placeholder="On se respecte toujours"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={rule.description}
                        onChange={(e) =>
                          updateCharterRule(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Pas d'insultes, pas de moqueries..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={addCharterRule}
              >
                <Plus className="w-4 h-4" />
                Ajouter une regle
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save bar (sticky bottom on mobile) */}
      <div className="sticky bottom-4 flex justify-end sm:hidden">
        <Button
          onClick={handleSave}
          disabled={updateFiche.isPending || !gov.canSaveSettings}
          className="gap-2 bg-sakura hover:bg-sakura/90 shadow-lg"
          size="lg"
        >
          {updateFiche.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default AssociationSettings;
