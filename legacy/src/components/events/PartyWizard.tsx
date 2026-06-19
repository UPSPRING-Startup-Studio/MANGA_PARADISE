import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  Camera, 
  Trophy, 
  Lock,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Car,
  Utensils,
  Home,
  Music,
  Shirt,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateParty, PartyMode, PartySlot, CreatePartyData } from "@/hooks/useEventParties";
import { useAuth } from "@/contexts/AuthContext";
import CharacterSlotSearch from "./CharacterSlotSearch";

interface PartyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

const MODES = [
  {
    id: 'squad' as PartyMode,
    label: 'SQUAD',
    emoji: '🟢',
    icon: Users,
    color: 'turquoise',
    description: "L'aventure est plus belle à plusieurs.",
    subtitle: "Pour le social/fun",
  },
  {
    id: 'shooting' as PartyMode,
    label: 'SHOOTING',
    emoji: '🔵',
    icon: Camera,
    color: 'blue-500',
    description: "Rassemble l'équipe parfaite.",
    subtitle: "Pour le casting photo/vidéo",
  },
  {
    id: 'concours' as PartyMode,
    label: 'CONCOURS',
    emoji: '🔴',
    icon: Trophy,
    color: 'sakura',
    description: "Objectif Podium & Performance.",
    subtitle: "Pour la scène",
  },
];

const SQUAD_TAGS = [
  { id: 'covoit', label: 'Covoit', icon: Car },
  { id: 'food', label: 'Food Buddy', icon: Utensils },
  { id: 'logement', label: 'Logement', icon: Home },
  { id: 'playlist', label: 'Playlist', icon: Music },
  { id: 'cosplay', label: 'Cosplay Group', icon: Shirt },
  { id: 'afterparty', label: 'After Party', icon: Heart },
];

export default function PartyWizard({ open, onOpenChange, eventId }: PartyWizardProps) {
  const { user } = useAuth();
  const createParty = useCreateParty();
  
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<PartyMode | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [maxMembers, setMaxMembers] = useState<string>("");
  const [slots, setSlots] = useState<PartySlot[]>([]);

  const resetForm = () => {
    setStep(1);
    setMode(null);
    setName("");
    setDescription("");
    setIsPrivate(false);
    setSelectedTags([]);
    setMaxMembers("");
    setSlots([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const handleModeSelect = (selectedMode: PartyMode) => {
    setMode(selectedMode);
    setStep(2);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!user?.id || !mode || !name.trim()) return;

    const data: CreatePartyData & { creator_id: string } = {
      event_id: eventId,
      creator_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      mode,
      visibility: isPrivate ? 'private' : 'public',
      tags: selectedTags.length > 0 ? selectedTags : [],
      max_members: maxMembers ? parseInt(maxMembers) : null,
      slots: (mode === 'shooting' || mode === 'concours') && slots.length > 0 ? slots : [],
    };

    console.log("Submitting party data:", data);
    await createParty.mutateAsync(data);
    handleClose();
  };

  const canProceedStep2 = name.trim().length > 0;
  const canSubmit = mode && name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sakura" />
            Créer un groupe
            <Badge variant="outline" className="ml-2">
              Étape {step}/3
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose Mode */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground text-sm">
                Quel type de groupe veux-tu créer ?
              </p>
              
              <div className="grid gap-3">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  return (
                    <Card
                      key={m.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:scale-[1.02]",
                        "border-2 hover:border-primary/50",
                        mode === m.id && "border-primary bg-primary/5"
                      )}
                      onClick={() => handleModeSelect(m.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                          m.id === 'squad' && "bg-turquoise/20",
                          m.id === 'shooting' && "bg-blue-500/20",
                          m.id === 'concours' && "bg-sakura/20",
                        )}>
                          {m.emoji}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-lg">{m.label}</h3>
                          <p className="text-sm text-muted-foreground">{m.description}</p>
                          <p className="text-xs text-muted-foreground/70">{m.subtitle}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Details & Privacy */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn(
                  mode === 'squad' && "bg-turquoise/20 text-turquoise",
                  mode === 'shooting' && "bg-blue-500/20 text-blue-500",
                  mode === 'concours' && "bg-sakura/20 text-sakura",
                )}>
                  {MODES.find(m => m.id === mode)?.emoji} {MODES.find(m => m.id === mode)?.label}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="party-name">Nom du groupe *</Label>
                <Input
                  id="party-name"
                  placeholder="Ex: Les Mugiwaras IRL"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="party-desc">Description (optionnelle)</Label>
                <Textarea
                  id="party-desc"
                  placeholder="Décris ton groupe et ce que tu recherches..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-card border">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Groupe Privé</p>
                    <p className="text-xs text-muted-foreground">
                      Accessible uniquement sur invitation
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!canProceedStep2}
                  className="flex-1 gap-2"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Configuration */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Squad Mode: Tags */}
              {mode === 'squad' && (
                <div className="space-y-3">
                  <Label>Tags d'intérêt (optionnel)</Label>
                  <div className="flex flex-wrap gap-2">
                    {SQUAD_TAGS.map((tag) => {
                      const Icon = tag.icon;
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <Badge
                          key={tag.id}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all gap-1.5 py-1.5 px-3",
                            isSelected && "bg-turquoise text-tokyo-night"
                          )}
                          onClick={() => toggleTag(tag.id)}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tag.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shooting/Concours Mode: Smart Slot Search */}
              {(mode === 'shooting' || mode === 'concours') && (
                <CharacterSlotSearch 
                  slots={slots}
                  onSlotsChange={setSlots}
                  mode={mode}
                />
              )}

              {/* Max Members */}
              <div className="space-y-2">
                <Label htmlFor="max-members">
                  Jauge max (optionnel)
                </Label>
                <Input
                  id="max-members"
                  type="number"
                  min="2"
                  max="50"
                  placeholder="Laisser vide = illimité"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Limite le nombre de membres pouvant rejoindre
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!canSubmit || createParty.isPending}
                  className={cn(
                    "flex-1 gap-2",
                    mode === 'squad' && "bg-turquoise hover:bg-turquoise/90 text-tokyo-night",
                    mode === 'shooting' && "bg-blue-500 hover:bg-blue-600",
                    mode === 'concours' && "bg-sakura hover:bg-sakura/90",
                  )}
                >
                  {createParty.isPending ? "Création..." : "Créer le groupe"}
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
