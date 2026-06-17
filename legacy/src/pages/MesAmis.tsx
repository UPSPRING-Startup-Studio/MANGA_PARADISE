import { useState } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  HeartHandshake, 
  Users, 
  Clock, 
  Check, 
  X, 
  User,
  ArrowLeft,
  Mail,
  Send
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useFriends, 
  usePendingFriendRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest
} from "@/hooks/useFriendships";
import { useSentFriendRequests, useCancelFriendRequest } from "@/hooks/useFriendshipExtras";
import { cn } from "@/lib/utils";
import { OTAKU_CLASSES, type OtakuClassId } from "@/lib/constants";

const getClassLabel = (classId: string | null): string | null => {
  if (!classId) return null;
  const classInfo = OTAKU_CLASSES[classId as OtakuClassId];
  return classInfo ? `${classInfo.emoji} ${classInfo.label}` : null;
};

const MesAmis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("nakamas");

  const { data: friends = [], isLoading: friendsLoading } = useFriends(user?.id);
  const { data: pendingRequests = [], isLoading: requestsLoading } = usePendingFriendRequests(user?.id);
  const { data: sentRequests = [], isLoading: sentLoading } = useSentFriendRequests(user?.id);

  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();
  const cancelMutation = useCancelFriendRequest();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-24 text-center">
          <HeartHandshake className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-3xl mb-4">Connecte-toi pour voir tes amis</h1>
          <Button asChild>
            <Link to="/auth">Se connecter</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Extract friend profiles from friendships
  const friendProfiles = friends.map(f => {
    const isSender = f.requester_id === user.id;
    return isSender ? f.addressee : f.requester;
  }).filter(Boolean);

  const pendingCount = pendingRequests.length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate("/espace-membre")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-sakura to-turquoise flex items-center justify-center">
              <HeartHandshake className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl">Mes Nakamas</h1>
              <p className="text-muted-foreground">
                {friendProfiles.length} ami{friendProfiles.length !== 1 ? "s" : ""} dans ton équipage
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-card">
            <TabsTrigger value="nakamas" className="gap-2">
              <Users className="w-4 h-4" />
              Mes Nakamas
            </TabsTrigger>
            <TabsTrigger value="demandes" className="gap-2 relative">
              <Mail className="w-4 h-4" />
              Demandes
              {pendingCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Mes Nakamas */}
          <TabsContent value="nakamas" className="space-y-4">
            {friendsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-14 h-14 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : friendProfiles.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-xl mb-2">Aucun ami pour le moment</h3>
                <p className="text-muted-foreground mb-4">
                  Parcours l'annuaire pour trouver des nakamas !
                </p>
                <Button asChild>
                  <Link to="/communaute/annuaire">Explorer l'annuaire</Link>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friendProfiles.map((friend) => friend && (
                  <Link key={friend.id} to={`/u/${friend.username}`}>
                    <Card className={cn(
                      "p-4 transition-all hover:border-sakura/50 hover:shadow-lg hover:shadow-sakura/10",
                      "group cursor-pointer"
                    )}>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14 border-2 border-sakura/30">
                          <AvatarImage src={friend.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-lg truncate group-hover:text-sakura transition-colors">
                            {friend.display_name || friend.username || "Membre"}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Demandes */}
          <TabsContent value="demandes" className="space-y-6">
            {/* Demandes reçues */}
            <div>
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-turquoise" />
                Demandes reçues
              </h2>
              
              {requestsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Card key={i} className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <Skeleton className="h-5 w-32 flex-1" />
                        <Skeleton className="h-9 w-20" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : pendingRequests.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  Aucune demande en attente
                </Card>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border-2 border-turquoise/30">
                          <AvatarImage src={request.requester?.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {request.requester?.display_name || request.requester?.username}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Veut rejoindre ton équipage
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => acceptMutation.mutate({ 
                              friendshipId: request.id, 
                              userId: user.id 
                            })}
                            disabled={acceptMutation.isPending}
                            className="bg-turquoise hover:bg-turquoise/90 text-tokyo-night gap-1"
                          >
                            <Check className="w-4 h-4" />
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate({ 
                              friendshipId: request.id, 
                              userId: user.id 
                            })}
                            disabled={rejectMutation.isPending}
                            className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Demandes envoyées */}
            <div>
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-sakura" />
                Demandes envoyées
              </h2>
              
              {sentLoading ? (
                <div className="space-y-3">
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <Skeleton className="h-5 w-32 flex-1" />
                    </div>
                  </Card>
                </div>
              ) : sentRequests.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <Send className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  Aucune demande envoyée
                </Card>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border-2 border-sakura/30">
                          <AvatarImage src={request.addressee?.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {request.addressee?.display_name || request.addressee?.username}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            En attente de réponse
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelMutation.mutate({ 
                            friendshipId: request.id, 
                            userId: user.id 
                          })}
                          disabled={cancelMutation.isPending}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Annuler
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default MesAmis;
