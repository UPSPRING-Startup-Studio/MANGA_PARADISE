import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Users } from "lucide-react";
import { useState } from "react";

// Mock data for top contributors
const topContributors = [
  { 
    id: "1", 
    name: "Luffy_D", 
    avatar: null, 
    xp: 2450, 
    maxXp: 3000, 
    level: 12,
    badge: "🏆" 
  },
  { 
    id: "2", 
    name: "SakuraChan", 
    avatar: null, 
    xp: 1890, 
    maxXp: 2500, 
    level: 10,
    badge: "🥈" 
  },
  { 
    id: "3", 
    name: "NarutoFan99", 
    avatar: null, 
    xp: 1250, 
    maxXp: 2000, 
    level: 8,
    badge: "🥉" 
  },
];

// Mock data for new members
const newMembers = [
  { id: "1", name: "Zoro", avatar: null },
  { id: "2", name: "Nami", avatar: null },
  { id: "3", name: "Sanji", avatar: null },
  { id: "4", name: "Robin", avatar: null },
  { id: "5", name: "Chopper", avatar: null },
];

const CommunitySidebar = () => {
  const [pollAnswer, setPollAnswer] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (pollAnswer) {
      setHasVoted(true);
    }
  };

  return (
    <aside className="space-y-6">
      {/* Top Contributors */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-accent" />
            <h3 className="font-display text-lg">Top Contributeurs</h3>
            <Badge variant="outline" className="ml-auto text-xs border-accent/50 text-accent">
              Cette semaine
            </Badge>
          </div>

          <div className="space-y-4">
            {topContributors.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-3"
              >
                <span className="text-lg w-6 text-center">{user.badge}</span>
                <Avatar className="w-10 h-10 border-2 border-sakura/30">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-sakura/20 text-sakura font-display text-sm">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{user.name}</span>
                    <Badge variant="secondary" className="text-xs bg-muted/50">
                      Lv.{user.level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(user.xp / user.maxXp) * 100} 
                      className="h-1.5 flex-1 bg-muted"
                    />
                    <span className="text-xs text-muted-foreground">
                      {user.xp} XP
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Quick Poll */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-sakura" />
            <h3 className="font-display text-lg">Sondage Express</h3>
          </div>

          <p className="text-sm font-medium mb-3">
            ⚔️ Qui gagne dans un combat ?
          </p>

          {!hasVoted ? (
            <>
              <RadioGroup 
                value={pollAnswer} 
                onValueChange={setPollAnswer}
                className="space-y-2 mb-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="naruto" 
                    id="naruto"
                    className="border-sakura data-[state=checked]:bg-sakura"
                  />
                  <Label htmlFor="naruto" className="cursor-pointer text-sm">
                    Naruto Uzumaki
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="luffy" 
                    id="luffy"
                    className="border-sakura data-[state=checked]:bg-sakura"
                  />
                  <Label htmlFor="luffy" className="cursor-pointer text-sm">
                    Monkey D. Luffy
                  </Label>
                </div>
              </RadioGroup>
              <Button 
                size="sm" 
                className="w-full bg-sakura hover:bg-sakura/90"
                disabled={!pollAnswer}
                onClick={handleVote}
              >
                Voter
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Naruto Uzumaki</span>
                  <span className="text-muted-foreground">48%</span>
                </div>
                <Progress value={48} className="h-2 bg-muted" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Monkey D. Luffy</span>
                  <span className="text-muted-foreground">52%</span>
                </div>
                <Progress value={52} className="h-2 bg-muted" />
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                127 votes • Merci d'avoir participé !
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* New Members */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-turquoise" />
            <h3 className="font-display text-lg">Bienvenue !</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            Derniers inscrits de la semaine
          </p>

          <div className="flex -space-x-2">
            {newMembers.map((member) => (
              <Avatar 
                key={member.id} 
                className="w-8 h-8 border-2 border-[#362F4B] hover:z-10 hover:scale-110 transition-transform cursor-pointer"
              >
                <AvatarImage src={member.avatar || undefined} />
                <AvatarFallback className="bg-turquoise/20 text-turquoise text-xs">
                  {member.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-[#362F4B] bg-muted flex items-center justify-center text-xs text-muted-foreground">
              +12
            </div>
          </div>
        </Card>
      </motion.div>
    </aside>
  );
};

export default CommunitySidebar;
