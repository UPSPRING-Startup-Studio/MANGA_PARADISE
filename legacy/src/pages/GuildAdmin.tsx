import { useParams, useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Settings,
  Users,
  CalendarDays,
  Newspaper,
  Save,
  Loader2,
  Crown,
  Shield,
  UserMinus,
  UserPlus,
  Search,
  X,
  Mail,
  Palette,
  CheckCircle,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGuildDetails,
  useGuildMembers,
  useUserGuildMembership,
  useUpdateGuild,
  useKickMember,
  usePromoteMember,
} from "@/hooks/useGuildDetails";
import { useGuildEvents, useDeleteGuildEvent } from "@/hooks/useGuildEvents";
import { useGuildPosts, useDeleteGuildPost } from "@/hooks/useGuildPosts";
import {
  useGuildPendingInvitations,
  useSendGuildInvitation,
  useCancelInvitation,
  useSearchUsersForInvite,
} from "@/hooks/useGuildInvitations";
import { CreateGuildEventModal } from "@/components/guilds/CreateGuildEventModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect } from "react";

export default function GuildAdmin() {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: guild, isLoading: guildLoading } = useGuildDetails(guildId);
  const { data: members = [] } = useGuildMembers(guildId);
  const { data: membership } = useUserGuildMembership(guildId);

  const isGuildMaster = membership?.role === "master";
  const isOfficer = membership?.role === "officer";
  const isAdmin = isGuildMaster || isOfficer;

  // Redirect if not admin
  useEffect(() => {
    if (!guildLoading && (!membership || !isAdmin)) {
      navigate(`/guilds/${guildId}`);
    }
  }, [guildLoading, membership, isAdmin, guildId, navigate]);

  // General settings state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [goal, setGoal] = useState("");
  const [accessType, setAccessType] = useState<string>("public");
  const [primaryColor, setPrimaryColor] = useState("#FF69B4");
  const [secondaryColor, setSecondaryColor] = useState("#8B5CF6");

  // Invitation state
  const [inviteSearch, setInviteSearch] = useState("");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Sync state with guild data
  useEffect(() => {
    if (guild) {
      setName(guild.name);
      setDescription(guild.description || "");
      setCity(guild.city || "");
      setGoal(guild.goal || "");
      setAccessType(guild.access_type);
      setPrimaryColor(guild.primary_color || "#FF69B4");
      setSecondaryColor(guild.secondary_color || "#8B5CF6");
    }
  }, [guild]);

  // Hooks
  const updateGuild = useUpdateGuild();
  const kickMember = useKickMember();
  const promoteMember = usePromoteMember();
  const { data: events = [] } = useGuildEvents(guildId);
  const deleteEvent = useDeleteGuildEvent();
  const { data: posts = [] } = useGuildPosts(guildId);
  const deletePost = useDeleteGuildPost();
  const { data: pendingInvitations = [] } = useGuildPendingInvitations(guildId);
  const { data: searchResults = [] } = useSearchUsersForInvite(guildId || "", inviteSearch);
  const sendInvitation = useSendGuildInvitation();
  const cancelInvitation = useCancelInvitation();

  if (guildLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  if (!guild || !isAdmin) {
    return null;
  }

  const handleSaveSettings = () => {
    if (!guildId) return;
    updateGuild.mutate({
      guildId,
      data: {
        name,
        description: description || undefined,
        city: city || undefined,
        access_type: accessType as "public" | "private",
        goal: goal || undefined,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      } as any,
    });
  };

  const handleKick = (memberId: string, memberName: string) => {
    if (!guildId) return;
    if (confirm(`Êtes-vous sûr de vouloir exclure ${memberName} ?`)) {
      kickMember.mutate({ guildId, memberId });
    }
  };

  const handlePromote = (memberId: string, currentRole: string) => {
    const newRole = currentRole === "officer" ? "member" : "officer";
    promoteMember.mutate({ memberId, newRole });
  };

  const handleInviteUser = (userId: string) => {
    if (!guildId) return;
    sendInvitation.mutate({ guildId, userId });
    setInviteSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/guilds/${guildId}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la guilde
                </Button>
                <div className="h-6 w-px bg-border" />
                <div>
                  <h1 className="text-2xl font-bold">{guild.name}</h1>
                  <p className="text-sm text-muted-foreground">Panneau d'administration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-500 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {guild.access_type === "public" ? "Public" : "Privé"}
                </Badge>
                <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                  <Users className="w-3 h-3 mr-1" />
                  {members.length} membre{members.length > 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-card/50 border border-border/50 p-1 flex-wrap h-auto">
              <TabsTrigger value="general" className="data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
                <Settings className="w-4 h-4 mr-2" />
                Général
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
                <Users className="w-4 h-4 mr-2" />
                Membres & Invitations
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
                <CalendarDays className="w-4 h-4 mr-2" />
                Événements
              </TabsTrigger>
              <TabsTrigger value="posts" className="data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
                <Newspaper className="w-4 h-4 mr-2" />
                Articles
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general">
              <Card className="p-6 bg-card/50 border-border/50">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-sakura" />
                  Paramètres généraux & Personnalisation
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom de la guilde</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: Paris, Lyon..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="access">Type d'accès</Label>
                      <Select value={accessType} onValueChange={setAccessType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public (ouvert à tous)</SelectItem>
                          <SelectItem value="private">Privé (sur invitation)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Color Pickers */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="primary-color" className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Couleur primaire
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="primary-color"
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="flex-1"
                            placeholder="#FF69B4"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="secondary-color" className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Couleur secondaire
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="flex-1"
                            placeholder="#8B5CF6"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="goal">Objectif du groupe</Label>
                      <Textarea
                        id="goal"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        rows={3}
                        placeholder="Décrivez les objectifs et la mission de votre guilde..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={updateGuild.isPending || !name.trim()}
                    className="bg-sakura hover:bg-sakura/90"
                  >
                    {updateGuild.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Sauvegarder les modifications
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card className="p-6 bg-card/50 border-border/50">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sakura" />
                  Gestion des Membres & Invitations
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Member List */}
                  <div>
                    <h3 className="font-medium mb-3">Membres actuels ({members.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={member.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-sakura/20 text-sakura text-sm">
                                {member.profile?.display_name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {member.profile?.display_name || member.profile?.username || "Anonyme"}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {member.role === "master" && <Crown className="w-3 h-3 text-amber-400" />}
                                {member.role === "officer" && <Shield className="w-3 h-3 text-blue-400" />}
                                <span>
                                  {member.role === "master" ? "Maître" : member.role === "officer" ? "Officier" : "Membre"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {member.role !== "master" && isGuildMaster && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePromote(member.id, member.role)}
                                className="h-8 px-2"
                                title={member.role === "officer" ? "Rétrograder" : "Promouvoir"}
                              >
                                {member.role === "officer" ? (
                                  <Shield className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <UserPlus className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleKick(member.id, member.profile?.display_name || "ce membre")}
                                className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                title="Exclure"
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invitation Module */}
                  <div className="space-y-4">
                    {/* Invite Search */}
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Inviter un membre
                      </h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par pseudo..."
                          value={inviteSearch}
                          onChange={(e) => setInviteSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="mt-2 border border-border/50 rounded-lg overflow-hidden">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 hover:bg-muted/50 border-b border-border/30 last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback className="bg-sakura/20 text-sakura text-xs">
                                    {user.display_name?.[0] || user.username?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {user.display_name || user.username}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleInviteUser(user.id)}
                                disabled={sendInvitation.isPending}
                                className="h-7 text-xs"
                              >
                                Inviter
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending Invitations */}
                    <div>
                      <h3 className="font-medium mb-3">Invitations en attente ({pendingInvitations.length})</h3>
                      {pendingInvitations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune invitation en attente</p>
                      ) : (
                        <div className="space-y-2">
                          {pendingInvitations.map((invitation) => (
                            <div
                              key={invitation.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={invitation.invitee?.avatar_url || undefined} />
                                  <AvatarFallback className="bg-sakura/20 text-sakura text-xs">
                                    {invitation.invitee?.display_name?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {invitation.invitee?.display_name || invitation.invitee?.username}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelInvitation.mutate({ invitationId: invitation.id, guildId: guildId || "" })}
                                className="h-7 text-xs text-red-500 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events">
              <Card className="p-6 bg-card/50 border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-sakura" />
                    Événements de la guilde
                  </h2>
                  <Button onClick={() => setIsEventModalOpen(true)}>
                    Créer un événement
                  </Button>
                </div>

                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Aucun événement prévu</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30"
                      >
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.start_time), "EEEE dd MMMM yyyy à HH:mm", { locale: fr })}
                          </p>
                          {event.location_address && (
                            <p className="text-xs text-muted-foreground mt-1">{event.location_address}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteEvent.mutate({ eventId: event.id, guildId: guildId || "" })}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts">
              <Card className="p-6 bg-card/50 border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-sakura" />
                    Articles & Annonces
                  </h2>
                  <Button>Rédiger un article</Button>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Aucun article publié</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30"
                      >
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(post.created_at), "dd MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePost.mutate({ postId: post.id, guildId: guildId || "" })}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Event Modal */}
      {guildId && (
        <CreateGuildEventModal
          guildId={guildId}
          open={isEventModalOpen}
          onOpenChange={setIsEventModalOpen}
        />
      )}
    </div>
  );
}
