import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trophy, Upload, Calendar, Award, Sparkles, Lock, X, ImagePlus, Trash2 } from "lucide-react";

const AWARD_OPTIONS = [
  { value: "1ere_place", label: "1ère Place", emoji: " gold" },
  { value: "2eme_place", label: "2ème Place", emoji: " silver" },
  { value: "3eme_place", label: "3ème Place", emoji: " bronze" },
  { value: "prix_public", label: "Prix du Public", emoji: " hearts" },
  { value: "prix_couture", label: "Prix Couture", emoji: " needle" },
  { value: "prix_accessoires", label: "Prix Accessoires", emoji: " gem" },
  { value: "prix_maquillage", label: "Prix Maquillage", emoji: " palette" },
  { value: "prix_performance", label: "Prix Performance", emoji: " stage" },
  { value: "prix_jury", label: "Prix Spécial du Jury", emoji: " star" },
  { value: "mention", label: "Mention Honorable", emoji: " ribbon" },
  { value: "autre", label: "Autre", emoji: " sparkle" },
];

interface ProofFile {
  file: File;
  preview: string;
  id: string;
}

interface AchievementAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    contestName: string;
    awardTitle: string;
    eventDate: string;
    proofFiles: File[];
  }) => Promise<void>;
}

const AchievementAddModal = ({ isOpen, onClose, onAdd }: AchievementAddModalProps) => {
  const [contestName, setContestName] = useState("");
  const [awardTitle, setAwardTitle] = useState("");
  const [customAward, setCustomAward] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [proofFiles, setProofFiles] = useState<ProofFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: ProofFile[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Fichier "${file.name}" trop volumineux (max 10 Mo)`);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        newFiles.push({
          file,
          preview: reader.result as string,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
        
        // Update state after all files are processed
        if (newFiles.length === files.length) {
          setProofFiles((prev) => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setProofFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    const finalAward = awardTitle === "autre" ? customAward : awardTitle;
    
    if (!contestName.trim()) {
      toast.error("Nom du concours requis");
      return;
    }
    if (!finalAward.trim()) {
      toast.error("Prix remporté requis");
      return;
    }
    if (!eventDate) {
      toast.error("Date de l'événement requise");
      return;
    }
    if (proofFiles.length === 0) {
      toast.error("Au moins une preuve (photo/scan) obligatoire");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        contestName: contestName.trim(),
        awardTitle: finalAward.trim(),
        eventDate,
        proofFiles: proofFiles.map((pf) => pf.file),
      });
      handleReset();
    } catch (error) {
      console.error("Error submitting achievement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setContestName("");
    setAwardTitle("");
    setCustomAward("");
    setEventDate("");
    setProofFiles([]);
    onClose();
  };

  const getAwardLabel = (value: string) => {
    const option = AWARD_OPTIONS.find((o) => o.value === value);
    return option?.label || value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-sakura flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Déclarer un Prix Concours
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Contest Name */}
          <div>
            <Label className="text-sm text-muted-foreground">Nom de l'événement / Concours</Label>
            <Input
              value={contestName}
              onChange={(e) => setContestName(e.target.value)}
              placeholder="Ex: Japan Expo 2024 - Concours Cosplay"
              className="mt-1.5 bg-muted border-border focus:border-sakura"
            />
          </div>

          {/* Award Title */}
          <div>
            <Label className="text-sm text-muted-foreground">Prix remporté</Label>
            <Select value={awardTitle} onValueChange={setAwardTitle}>
              <SelectTrigger className="mt-1.5 bg-muted border-border">
                <SelectValue placeholder="Sélectionner un prix" />
              </SelectTrigger>
              <SelectContent>
                {AWARD_OPTIONS.map((award) => (
                  <SelectItem key={award.value} value={award.value}>
                    <span className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-accent" />
                      {award.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <AnimatePresence>
              {awardTitle === "autre" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <Input
                    value={customAward}
                    onChange={(e) => setCustomAward(e.target.value)}
                    placeholder="Préciser le prix..."
                    className="bg-muted border-border focus:border-sakura"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Event Date */}
          <div>
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date de l'événement
            </Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="mt-1.5 bg-muted border-border focus:border-sakura"
            />
          </div>

          {/* Multi-File Upload */}
          <div>
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-turquoise" />
              Preuves (photos / scans du diplôme)
            </Label>
            <p className="text-xs text-muted-foreground/70 mt-1 mb-2">
              Ajoute plusieurs preuves si nécessaire. Pour validation admin uniquement.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* File Previews Grid */}
            {proofFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                <AnimatePresence>
                  {proofFiles.map((pf) => (
                    <motion.div
                      key={pf.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      {pf.file.type.startsWith("image/") ? (
                        <img
                          src={pf.preview}
                          alt="Aperçu"
                          className="w-full h-24 object-cover rounded-lg border border-border"
                        />
                      ) : (
                        <div className="w-full h-24 bg-muted rounded-lg border border-border flex items-center justify-center">
                          <span className="text-xs text-muted-foreground text-center px-2 truncate">
                            {pf.file.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(pf.id)}
                        className="absolute -top-1 -right-1 p-1 bg-destructive/90 rounded-full text-white hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            
            {/* Add More Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-sakura/50 hover:bg-sakura/5 transition-colors"
            >
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {proofFiles.length > 0 ? "Ajouter d'autres fichiers" : "Cliquer pour uploader"}
              </span>
              <span className="text-xs text-muted-foreground/60">
                Images ou PDF (max 10 Mo par fichier)
              </span>
            </button>
            
            {proofFiles.length > 0 && (
              <p className="text-xs text-turquoise mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {proofFiles.length} fichier{proofFiles.length > 1 ? "s" : ""} sélectionné{proofFiles.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-accent to-sakura hover:opacity-90 text-white font-display"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                SOUMETTRE POUR VALIDATION
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Le prix sera visible sur ton profil après validation par un administrateur.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementAddModal;
