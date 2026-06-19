import { useState } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BuilderDefinition } from "@/hooks/useMembershipFormBuilder";

interface FormMetadataEditorProps {
  definition: BuilderDefinition;
  onUpdate: (updates: Partial<Pick<BuilderDefinition, "description" | "estimatedDuration" | "links">>) => void;
  formName?: string;
  formSeason?: string;
}

const FormMetadataEditor = ({
  definition,
  onUpdate,
  formName,
  formSeason,
}: FormMetadataEditorProps) => {
  const links = definition.links || [];

  const updateLink = (index: number, updates: Partial<{ label: string; url: string }>) => {
    const updated = [...links];
    updated[index] = { ...updated[index], ...updates };
    onUpdate({ links: updated });
  };

  const addLink = () => {
    onUpdate({ links: [...links, { label: "Nouveau lien", url: "" }] });
  };

  const removeLink = (index: number) => {
    onUpdate({ links: links.filter((_, i) => i !== index) });
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-display text-foreground">
        Metadonnees du formulaire
      </h2>

      {/* Read-only fields from the record */}
      {(formName || formSeason) && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-2 text-sm">
            {formName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom</span>
                <span className="text-foreground font-medium">{formName}</span>
              </div>
            )}
            {formSeason && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saison</span>
                <span className="text-foreground">{formSeason}</span>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/60">
              Le nom et la saison se modifient depuis le detail du formulaire.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label>Description du preambule</Label>
        <Textarea
          value={definition.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Texte d'accueil affiche au debut du formulaire..."
          rows={4}
        />
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label>Duree estimee</Label>
        <Input
          value={definition.estimatedDuration || ""}
          onChange={(e) => onUpdate({ estimatedDuration: e.target.value })}
          placeholder="ex: 5 a 10 minutes"
        />
      </div>

      {/* Links */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Liens utiles
        </Label>
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={link.label}
              onChange={(e) => updateLink(i, { label: e.target.value })}
              placeholder="Label"
              className="flex-1"
            />
            <Input
              value={link.url}
              onChange={(e) => updateLink(i, { url: e.target.value })}
              placeholder="URL"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => removeLink(i)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-2" onClick={addLink}>
          <Plus className="w-4 h-4" />
          Ajouter un lien
        </Button>
      </div>
    </div>
  );
};

export default FormMetadataEditor;
