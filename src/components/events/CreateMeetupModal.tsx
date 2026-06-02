import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, MapPin, Clock, Users, Sparkles, Image as ImageIcon,
  Crown, Check, UserPlus, Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CreateMeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MeetupFormData) => Promise<void>;
  organizerName: string;
  organizerAvatar?: string;
}

export interface MeetupFormData {
  title: string;
  universe: string;
  time: string;
  location: string;
  maxParticipants: number;
  description: string;
  coverImage: File | null;
  coverPreviewUrl: string | null;
}

const defaultFormData: MeetupFormData = {
  title: "",
  universe: "",
  time: "",
  location: "",
  maxParticipants: 20,
  description: "",
  coverImage: null,
  coverPreviewUrl: null,
};

export default function CreateMeetupModal({
  isOpen,
  onClose,
  onSubmit,
  organizerName,
  organizerAvatar,
}: CreateMeetupModalProps) {
  const [formData, setFormData] = useState<MeetupFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleChange = (field: keyof MeetupFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        coverImage: file,
        coverPreviewUrl: previewUrl,
      }));
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageUpload(file);
    },
    [handleImageUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.universe || !formData.time || !formData.location) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData(defaultFormData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    onClose();
  };

  // Default preview image if none uploaded
  const previewImage =
    formData.coverPreviewUrl ||
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop";

  // Common input styles for readability
  const inputStyles = "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500";
  const textareaStyles = "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-card border-white/10">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-white/10 bg-gradient-to-r from-turquoise/10 to-sakura/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-turquoise/30 to-sakura/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-turquoise" />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl">
                Organiser un Rassemblement
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Rassemble ta communauté et gagne{" "}
                <span className="text-turquoise font-semibold">50 XP</span> d'Organisateur
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content - 2 Column Layout */}
        <div className="grid md:grid-cols-2 gap-0 max-h-[70vh] overflow-hidden">
          {/* Left Column - Form */}
          <div className="p-6 overflow-y-auto border-r border-white/10 space-y-5">
            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Image de couverture</Label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden",
                  isDragOver
                    ? "border-turquoise bg-turquoise/10"
                    : "border-white/20 hover:border-turquoise/50 hover:bg-turquoise/5",
                  formData.coverPreviewUrl ? "h-40" : "h-32"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {formData.coverPreviewUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={formData.coverPreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-white text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Changer l'image
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Drag & drop ou cliquer</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG jusqu'à 5MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Universe */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground font-medium">Titre du Meet-up</Label>
                <Input
                  id="title"
                  placeholder="Ex: Shooting One Piece au Parc"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="universe" className="text-foreground font-medium">Thème / Univers</Label>
                <Input
                  id="universe"
                  placeholder="Ex: Genshin Impact, Warhammer 40k, One Piece..."
                  value={formData.universe}
                  onChange={(e) => handleChange("universe", e.target.value)}
                  className={inputStyles}
                />
                <p className="text-xs text-muted-foreground">Écris librement le nom de l'univers</p>
              </div>
            </div>

            {/* Logistics - 2 column grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-1.5 text-foreground font-medium">
                  <Clock className="w-3.5 h-3.5 text-turquoise" />
                  Heure de début
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1.5 text-foreground font-medium">
                  <MapPin className="w-3.5 h-3.5 text-sakura" />
                  Lieu précis
                </Label>
                <Input
                  id="location"
                  placeholder="Hall B - Fontaine"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Max Participants Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-turquoise" />
                  Nombre de participants max
                </Label>
                <Badge variant="secondary" className="bg-turquoise/20 text-turquoise">
                  Max {formData.maxParticipants} personnes
                </Badge>
              </div>
              <Slider
                value={[formData.maxParticipants]}
                onValueChange={(val) => handleChange("maxParticipants", val[0])}
                min={5}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-turquoise [&_[role=slider]]:border-turquoise"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5</span>
                <span>50</span>
                <span>100+</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground font-medium">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Décris ton rassemblement... Ex: Venez avec vos accessoires, on va refaire la scène de Marineford !"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className={cn("min-h-[80px]", textareaStyles)}
              />
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div className="p-6 bg-gradient-to-br from-muted/30 to-muted/10 overflow-y-auto border-l-2 border-dashed border-muted/40">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-turquoise/30 text-turquoise bg-turquoise/10">
                  👁 Aperçu
                </Badge>
                <span className="text-xs text-muted-foreground">Mise à jour en temps réel</span>
              </div>

              {/* Live Preview Card - Same design as meetup cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="overflow-hidden border bg-card/80 border-turquoise/30 shadow-[0_0_20px_rgba(45,212,191,0.15)]">
                  {/* Image Header with Organizer Avatar */}
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Organizer Avatar */}
                    <div className="absolute top-3 left-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border-2 border-white/50 ring-2 ring-turquoise/50 shadow-lg">
                          <AvatarImage src={organizerAvatar} alt={organizerName} />
                          <AvatarFallback className="bg-turquoise/30 text-sm font-bold">
                            {organizerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-turquoise rounded-full p-0.5">
                          <Crown className="w-2.5 h-2.5 text-card" />
                        </div>
                      </div>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="font-display text-lg text-white drop-shadow-lg">
                        {formData.title || "Titre du Meet-up"}
                      </h4>
                      <p className="text-sm text-white/80">
                        {formData.universe || "Univers"}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4">
                    {/* Time & Location */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-turquoise">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {formData.time || "--:--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{formData.location || "Lieu"}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Participants</span>
                        <span className="font-medium text-turquoise">
                          1 / {formData.maxParticipants}
                        </span>
                      </div>
                      <Progress
                        value={(1 / formData.maxParticipants) * 100}
                        className="h-2 bg-muted/30"
                      />
                    </div>

                    {/* You as first participant */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <Avatar className="w-7 h-7 border-2 border-background">
                          <AvatarImage src={organizerAvatar} alt={organizerName} />
                          <AvatarFallback className="text-[10px] bg-turquoise/20">
                            {organizerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Toi (organisateur)
                      </span>
                    </div>

                    {/* Preview Join Button */}
                    <Button
                      disabled
                      className="w-full gap-2 font-medium bg-turquoise/20 text-turquoise border border-turquoise/30"
                    >
                      <Check className="w-4 h-4" />
                      Tu organises !
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* XP Bonus Info */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-turquoise/10 to-sakura/10 border border-turquoise/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-turquoise/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-turquoise" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Bonus Organisateur</p>
                    <p className="text-xs text-muted-foreground">
                      +50 XP quand au moins 5 personnes rejoignent
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 bg-muted/5">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !formData.title ||
              !formData.universe ||
              !formData.time ||
              !formData.location
            }
            className="px-8 bg-gradient-to-r from-sakura to-pink-400 hover:from-sakura/90 hover:to-pink-400/90 text-white shadow-lg shadow-sakura/25"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Valider et Publier le Meet-up
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
