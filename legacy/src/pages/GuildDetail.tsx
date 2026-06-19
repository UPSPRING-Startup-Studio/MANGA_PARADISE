import { useParams, useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  Crown, 
  Shield, 
  User,
  MessageSquare,
  CalendarDays,
  LogOut,
  Loader2,
  Lock,
  Globe,
  Info,
  Settings
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGuildDetails, 
  useGuildMembers, 
  useUserGuildMembership,
  useJoinGuild,
  useLeaveGuild
} from "@/hooks/useGuildDetails";
import { GuildStaffCard } from "@/components/guilds/GuildStaffCard";
import { GuildAgenda } from "@/components/guilds/GuildAgenda";
import { useMemo } from "react";

export default function GuildDetail() {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: guild, isLoading: guildLoading } = useGuildDetails(guildId);
  const { data: members = [] } = useGuildMembers(guildId);
  const { data: membership } = useUserGuildMembership(guildId);
  
  const joinGuild = useJoinGuild();
  const leaveGuild = useLeaveGuild();

  const isGuildMaster = membership?.role === "master";
  const isOfficer = membership?.role === "officer";
  const isMember = !!membership;
  const isAdmin = isGuildMaster || isOfficer;

  // Dynamic theming based on guild colors
  const guildStyles = useMemo(() => {
    const primaryColor = guild?.primary_color || "#FF69B4";
    const secondaryColor = guild?.secondary_color || "#8B5CF6";
    
    return {
      borderColor: primaryColor,
      buttonBg: primaryColor,
      buttonHover: `${primaryColor}dd`,
      badgeBg: `${primaryColor}20`,
      badgeColor: primaryColor,
      gradient: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`,
    };
  }, [guild?.primary_color, guild?.secondary_color]);

  if (guildLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Guilde introuvable</h1>
          <Button onClick={() => navigate("/guilds")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux guildes
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleJoin = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    joinGuild.mutate(guild.id);
  };

  const handleLeave = () => {
    leaveGuild.mutate(guild.id);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "master":
        return <Crown className="w-4 h-4 text-amber-400" />;
      case "officer":
        return <Shield className="w-4 h-4 text-blue-400" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "master":
        return "Maître de Guilde";
      case "officer":
        return "Officier";
      default:
        return "Membre";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main>
        {/* Hero Banner */}
        <div 
          className="relative h-56 md:h-72 overflow-hidden"
          style={{ 
            borderBottom: guild?.primary_color ? `3px solid ${guild.primary_color}` : undefined 
          }}
        >
          {guild.banner_url ? (
            <img
              src={guild.banner_url}
              alt={guild.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full"
              style={{ background: guildStyles.gradient }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          {/* Back button */}
          <div className="absolute top-4 left-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/guilds")}
              className="bg-background/50 backdrop-blur-sm hover:bg-background/70"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>

          {/* Guild Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  {guild.category && (
                    <Badge 
                      variant="outline" 
                      className="mb-2"
                      style={{ 
                        borderColor: guildStyles.borderColor,
                        color: guildStyles.badgeColor,
                        backgroundColor: guildStyles.badgeBg 
                      }}
                    >
                      {guild.category.icon} {guild.category.name}
                    </Badge>
                  )}
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {guild.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{guild.member_count} membre{(guild.member_count || 0) > 1 ? "s" : ""}</span>
                    </div>
                    {guild.city && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{guild.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      {guild.access_type === "private" ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Candidature</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          <span>Public</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/guilds/${guild.id}/admin`)}
                      className="border-amber-500/30 hover:bg-amber-500/10 text-amber-500"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Gérer la Guilde
                    </Button>
                  )}
                  {isMember ? (
                    <>
                      {!isGuildMaster && (
                        <Button 
                          variant="outline" 
                          onClick={handleLeave}
                          disabled={leaveGuild.isPending}
                          className="border-red-500/30 hover:bg-red-500/10 text-red-500"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Quitter
                        </Button>
                      )}
                      <Button disabled className="bg-green-500/20 text-green-500 border border-green-500/30">
                        ✓ Membre
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={handleJoin}
                      disabled={joinGuild.isPending}
                      style={{ 
                        backgroundColor: guildStyles.buttonBg,
                      }}
                      className="hover:opacity-90 text-white"
                    >
                      {joinGuild.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="w-4 h-4 mr-2" />
                      )}
                      Rejoindre la Guilde
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Column (Left) */}
            <div className="flex-1 min-w-0">
              {/* Tabs */}
              <Tabs defaultValue="about" className="space-y-6">
                <TabsList className="bg-card/50 border border-border/50 p-1 flex-wrap h-auto">
                  <TabsTrigger value="about" className="data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
                    <Info className="w-4 h-4 mr-2" />
                    À propos
                  </TabsTrigger>
                  <TabsTrigger value="wall" className="data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Mur
                  </TabsTrigger>
                  <TabsTrigger value="agenda" className="data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Agenda
                  </TabsTrigger>
                  <TabsTrigger value="members" className="data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
                    <Users className="w-4 h-4 mr-2" />
                    Membres
                  </TabsTrigger>
                </TabsList>

                {/* About Tab */}
                <TabsContent value="about" className="space-y-4">
                  <Card className="p-6 bg-card/50 border-border/50">
                    <h2 className="text-lg font-semibold mb-4">À propos de la guilde</h2>
                    {guild.description ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">{guild.description}</p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Cette guilde n'a pas encore de description.
                      </p>
                    )}
                  </Card>

                  {/* Goal Section */}
                  {guild.goal && (
                    <Card className="p-6 bg-card/50 border-border/50">
                      <h2 className="text-lg font-semibold mb-4">🎯 Objectif du groupe</h2>
                      <p className="text-muted-foreground whitespace-pre-wrap">{guild.goal}</p>
                    </Card>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-card/50 border-border/50 text-center">
                      <p className="text-2xl font-bold" style={{ color: guildStyles.badgeColor }}>
                        {guild.member_count}
                      </p>
                      <p className="text-xs text-muted-foreground">Membres</p>
                    </Card>
                    <Card className="p-4 bg-card/50 border-border/50 text-center">
                      <p className="text-2xl font-bold text-amber-400">
                        {members.filter(m => m.role === "master" || m.role === "officer").length}
                      </p>
                      <p className="text-xs text-muted-foreground">État-Major</p>
                    </Card>
                    <Card className="p-4 bg-card/50 border-border/50 text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {guild.access_type === "public" ? "Libre" : "Sur demande"}
                      </p>
                      <p className="text-xs text-muted-foreground">Accès</p>
                    </Card>
                    <Card className="p-4 bg-card/50 border-border/50 text-center">
                      <p className="text-2xl font-bold text-green-400">
                        {new Date(guild.created_at).getFullYear()}
                      </p>
                      <p className="text-xs text-muted-foreground">Création</p>
                    </Card>
                  </div>
                </TabsContent>

                {/* Wall Tab */}
                <TabsContent value="wall" className="space-y-4">
                  <Card className="p-8 bg-card/50 border-border/50 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Le mur de la guilde</h3>
                    <p className="text-muted-foreground">
                      Le fil d'actualité de la guilde sera bientôt disponible !
                    </p>
                  </Card>
                </TabsContent>

                {/* Agenda Tab */}
                <TabsContent value="agenda">
                  <GuildAgenda guildId={guild.id} isAdmin={isAdmin} />
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {members.map((member) => (
                      <Card 
                        key={member.id} 
                        className="p-4 bg-card/50 border-border/50 hover:border-sakura/40 transition-colors cursor-pointer"
                        onClick={() => member.profile?.username && navigate(`/u/${member.profile.username}`)}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="relative">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={member.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-sakura/20 text-sakura">
                                {member.profile?.display_name?.[0] || member.profile?.username?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            {member.role === "master" && (
                              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                                <Crown className="w-3 h-3 text-white" />
                              </div>
                            )}
                            {member.role === "officer" && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                                <Shield className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm truncate max-w-full">
                              {member.profile?.display_name || member.profile?.username || "Anonyme"}
                            </p>
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              {getRoleIcon(member.role)}
                              <span>{getRoleLabel(member.role)}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar (Right) - Desktop only */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <GuildStaffCard members={members} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
