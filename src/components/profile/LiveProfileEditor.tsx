import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Edit, X, Check, Camera, Plus, Settings, Save, 
  Instagram, Globe, MessageCircle, Loader2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  isEditing: boolean;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  renderView: (value: string) => React.ReactNode;
}

export const EditableField = ({ 
  value, 
  onSave, 
  isEditing, 
  placeholder,
  multiline = false,
  className,
  renderView 
}: EditableFieldProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isFieldEditing, setIsFieldEditing] = useState(false);

  const handleSave = async () => {
    if (localValue === value) {
      setIsFieldEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(localValue);
      setIsFieldEditing(false);
      toast.success("Modifié !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsFieldEditing(false);
  };

  if (!isEditing) {
    return <>{renderView(value)}</>;
  }

  if (isFieldEditing) {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        {multiline ? (
          <Textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-h-[100px] bg-background"
            autoFocus
          />
        ) : (
          <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-background"
            autoFocus
          />
        )}
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={handleSave}
          disabled={isSaving}
          className="shrink-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={handleCancel}
          className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group relative cursor-pointer rounded-lg transition-colors hover:bg-muted/50 -m-2 p-2",
        className
      )}
      onClick={() => setIsFieldEditing(true)}
    >
      {renderView(value)}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};

interface EditableImageProps {
  imageUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  isEditing: boolean;
  type: 'avatar' | 'cover';
  className?: string;
}

export const EditableImage = ({ 
  imageUrl, 
  onUpload, 
  isEditing, 
  type,
  className 
}: EditableImageProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 2 Mo");
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      toast.success("Image mise à jour !");
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const inputId = `image-upload-${type}`;

  if (type === 'cover') {
    return (
      <div className={cn("relative", className)}>
        {isEditing && (
          <>
            <label
              htmlFor={inputId}
              className={cn(
                "absolute top-4 right-4 z-20 cursor-pointer",
                "flex items-center gap-2 px-3 py-2 rounded-full",
                "bg-background/80 backdrop-blur border shadow-lg",
                "hover:bg-background transition-colors"
              )}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Modifier la bannière</span>
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isEditing && (
        <>
          <label
            htmlFor={inputId}
            className={cn(
              "absolute inset-0 z-10 cursor-pointer",
              "flex items-center justify-center",
              "bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity"
            )}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </>
      )}
    </div>
  );
};

interface EditModeToggleProps {
  isEditing: boolean;
  onToggle: () => void;
  hasChanges?: boolean;
}

export const EditModeToggle = ({ isEditing, onToggle, hasChanges }: EditModeToggleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        onClick={onToggle}
        size="lg"
        variant={isEditing ? "default" : "outline"}
        className={cn(
          "rounded-full shadow-xl gap-2",
          isEditing 
            ? "bg-gradient-hero text-white border-0" 
            : "bg-background/80 backdrop-blur"
        )}
      >
        {isEditing ? (
          <>
            <Check className="w-5 h-5" />
            Terminer
          </>
        ) : (
          <>
            <Edit className="w-5 h-5" />
            Mode Édition
          </>
        )}
      </Button>
    </motion.div>
  );
};

interface SocialLinksEditorProps {
  socialLinks: Record<string, string>;
  onSave: (links: Record<string, string>) => Promise<void>;
  isEditing: boolean;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, prefix: 'https://instagram.com/' },
  { key: 'tiktok', label: 'TikTok', icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  ), prefix: 'https://tiktok.com/@' },
  { key: 'discord', label: 'Discord', icon: MessageCircle, prefix: '' },
  { key: 'twitter', label: 'Twitter/X', icon: () => <span className="font-bold">𝕏</span>, prefix: 'https://twitter.com/' },
  { key: 'website', label: 'Site web', icon: Globe, prefix: '' },
];

export const SocialLinksEditor = ({ socialLinks, onSave, isEditing }: SocialLinksEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localLinks, setLocalLinks] = useState<Record<string, string>>(socialLinks);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out empty values
      const filteredLinks = Object.fromEntries(
        Object.entries(localLinks).filter(([_, value]) => value.trim() !== '')
      );
      await onSave(filteredLinks);
      setIsModalOpen(false);
      toast.success("Réseaux sociaux mis à jour !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="text-sakura hover:text-sakura/80"
      >
        <Plus className="w-4 h-4 mr-1" />
        Modifier réseaux
      </Button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-display">Mes réseaux sociaux</h3>
              
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.key} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-muted-foreground">{platform.label}</label>
                      <Input
                        value={localLinks[platform.key] || ''}
                        onChange={(e) => setLocalLinks({ ...localLinks, [platform.key]: e.target.value })}
                        placeholder={platform.key === 'website' ? 'https://...' : `@pseudo`}
                        className="mt-1"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enregistrer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface SectionShortcutProps {
  label: string;
  targetTab: 'cosplayer' | 'creative' | 'otaku';
  isEditing: boolean;
}

export const SectionShortcut = ({ label, targetTab, isEditing }: SectionShortcutProps) => {
  if (!isEditing) return null;

  const tabMap = {
    cosplayer: 'cosplayer',
    creative: 'creative',
    otaku: 'public-profile',
  };

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className="gap-2"
    >
      <a href={`/espace-membre/parametres?tab=${tabMap[targetTab]}`}>
        <Settings className="w-4 h-4" />
        {label}
      </a>
    </Button>
  );
};
