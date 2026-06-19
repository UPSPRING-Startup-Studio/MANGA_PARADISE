/**
 * Step 6: Modules Pop Culture conditionnels
 * 
 * Blocs activables : cosplay contest, tournoi gaming, invités/artistes,
 * exposants, bénévoles, gamification, communauté, dress code.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, Plus, Trash2, Music, Users, Shield, Gamepad2, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import {
  INPUT_STYLES,
  SELECT_STYLES,
  POP_CULTURE_MODULES,
  type EventWizardFormData,
  type PopCultureModule,
  type GuestEntry,
} from "../eventFormTypes";

interface StepPopCultureProps {
  formData: EventWizardFormData;
  onChange: (updates: Partial<EventWizardFormData>) => void;
}

const StepPopCulture = ({ formData, onChange }: StepPopCultureProps) => {
  const [expandedModule, setExpandedModule] = useState<PopCultureModule | null>(null);

  const toggleModule = (moduleId: PopCultureModule) => {
    const current = formData.enabled_modules;
    const isEnabled = current.includes(moduleId);
    const updated = isEnabled
      ? current.filter((m) => m !== moduleId)
      : [...current, moduleId];

    // Update the enabled_modules list and the specific module's enabled flag
    const moduleUpdates: Partial<EventWizardFormData> = { enabled_modules: updated };

    switch (moduleId) {
      case "cosplay-contest":
        moduleUpdates.cosplay_contest = { ...formData.cosplay_contest, enabled: !isEnabled };
        break;
      case "gaming-tournament":
        moduleUpdates.gaming_tournament = { ...formData.gaming_tournament, enabled: !isEnabled };
        break;
      case "guests":
        moduleUpdates.guests = { ...formData.guests, enabled: !isEnabled };
        break;
      case "exhibitors":
        moduleUpdates.exhibitors = { ...formData.exhibitors, enabled: !isEnabled };
        break;
      case "volunteers":
        moduleUpdates.volunteers = { ...formData.volunteers, enabled: !isEnabled };
        break;
      case "gamification":
        moduleUpdates.gamification = { ...formData.gamification, enabled: !isEnabled };
        break;
      case "community":
        moduleUpdates.community = { ...formData.community, enabled: !isEnabled };
        break;
      case "dress-code":
        moduleUpdates.dress_code = { ...formData.dress_code, enabled: !isEnabled };
        break;
    }

    onChange(moduleUpdates);

    // Auto-expand when enabling
    if (!isEnabled) {
      setExpandedModule(moduleId);
    } else if (expandedModule === moduleId) {
      setExpandedModule(null);
    }
  };

  const isModuleEnabled = (moduleId: PopCultureModule) =>
    formData.enabled_modules.includes(moduleId);

  // ─── Guest helpers ────────────────────────────────────────
  const addGuest = () => {
    const newGuest: GuestEntry = {
      id: nanoid(8),
      name: "",
      type: "autre",
      time_slots: "",
      is_public: true,
      logistics_notes: "",
    };
    onChange({
      guests: {
        ...formData.guests,
        guests: [...formData.guests.guests, newGuest],
      },
    });
  };

  const removeGuest = (id: string) => {
    onChange({
      guests: {
        ...formData.guests,
        guests: formData.guests.guests.filter((g) => g.id !== id),
      },
    });
  };

  const updateGuest = (id: string, field: keyof GuestEntry, value: any) => {
    onChange({
      guests: {
        ...formData.guests,
        guests: formData.guests.guests.map((g) =>
          g.id === id ? { ...g, [field]: value } : g
        ),
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="text-center mb-2">
        <p className="text-xs text-muted-foreground">
          Active les modules pertinents pour ton événement. Chaque module ajoute des options de configuration spécifiques.
        </p>
      </div>

      {/* Module Cards */}
      {POP_CULTURE_MODULES.map((module) => {
        const enabled = isModuleEnabled(module.id);
        const isExpanded = expandedModule === module.id && enabled;

        return (
          <Card
            key={module.id}
            className={cn(
              "overflow-hidden transition-all duration-200",
              enabled
                ? "border-sakura/30 bg-sakura/[0.02]"
                : "border-border"
            )}
          >
            {/* Module Header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => enabled && setExpandedModule(isExpanded ? null : module.id)}
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">{module.icon}</div>
                <div>
                  <p className="font-medium text-sm">{module.label}</p>
                  <p className="text-[10px] text-muted-foreground">{module.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggleModule(module.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                {enabled && (
                  isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )
                )}
              </div>
            </div>

            {/* Module Content (expanded) */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-4">
                    {/* ─── Cosplay Contest Config ─── */}
                    {module.id === "cosplay-contest" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Type de concours</Label>
                            <Select
                              value={formData.cosplay_contest.contest_type}
                              onValueChange={(v) =>
                                onChange({
                                  cosplay_contest: { ...formData.cosplay_contest, contest_type: v as any },
                                })
                              }
                            >
                              <SelectTrigger className={SELECT_STYLES}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-white">
                                <SelectItem value="individuel">Individuel uniquement</SelectItem>
                                <SelectItem value="groupe">Groupe uniquement</SelectItem>
                                <SelectItem value="mixte">Mixte (individuel + groupe)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Durée max bande-son (sec)</Label>
                            <Input
                              type="number"
                              min={30}
                              max={600}
                              value={formData.cosplay_contest.max_soundtrack_duration_sec}
                              onChange={(e) =>
                                onChange({
                                  cosplay_contest: {
                                    ...formData.cosplay_contest,
                                    max_soundtrack_duration_sec: parseInt(e.target.value) || 120,
                                  },
                                })
                              }
                              className={INPUT_STYLES}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <SwitchRow
                            label="Backstage / Loges"
                            description="Espace de préparation disponible"
                            checked={formData.cosplay_contest.has_backstage}
                            onChange={(v) =>
                              onChange({ cosplay_contest: { ...formData.cosplay_contest, has_backstage: v } })
                            }
                          />
                          <SwitchRow
                            label="Bande-son autorisée"
                            description="Les participants peuvent envoyer leur musique"
                            checked={formData.cosplay_contest.allow_soundtrack}
                            onChange={(v) =>
                              onChange({ cosplay_contest: { ...formData.cosplay_contest, allow_soundtrack: v } })
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <SwitchRow
                            label="Photos WIP"
                            description="Demander des photos de fabrication"
                            checked={formData.cosplay_contest.allow_wip_photos}
                            onChange={(v) =>
                              onChange({ cosplay_contest: { ...formData.cosplay_contest, allow_wip_photos: v } })
                            }
                          />
                          <SwitchRow
                            label="Photos de référence"
                            description="Demander la référence du personnage"
                            checked={formData.cosplay_contest.allow_reference_photos}
                            onChange={(v) =>
                              onChange({
                                cosplay_contest: { ...formData.cosplay_contest, allow_reference_photos: v },
                              })
                            }
                          />
                        </div>
                      </>
                    )}

                    {/* ─── Gaming Tournament Config ─── */}
                    {module.id === "gaming-tournament" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Jeu</Label>
                            <Input
                              value={formData.gaming_tournament.game_title}
                              onChange={(e) =>
                                onChange({
                                  gaming_tournament: { ...formData.gaming_tournament, game_title: e.target.value },
                                })
                              }
                              placeholder="Ex: Street Fighter 6"
                              className={INPUT_STYLES}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Plateforme</Label>
                            <Input
                              value={formData.gaming_tournament.platform}
                              onChange={(e) =>
                                onChange({
                                  gaming_tournament: { ...formData.gaming_tournament, platform: e.target.value },
                                })
                              }
                              placeholder="Ex: PS5, PC, Switch"
                              className={INPUT_STYLES}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Format d'équipe</Label>
                            <Select
                              value={formData.gaming_tournament.team_format}
                              onValueChange={(v) =>
                                onChange({
                                  gaming_tournament: { ...formData.gaming_tournament, team_format: v as any },
                                })
                              }
                            >
                              <SelectTrigger className={SELECT_STYLES}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-white">
                                <SelectItem value="solo">Solo</SelectItem>
                                <SelectItem value="duo">Duo</SelectItem>
                                <SelectItem value="equipe">Équipe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max joueurs</Label>
                            <Input
                              type="number"
                              min={2}
                              value={formData.gaming_tournament.max_players}
                              onChange={(e) =>
                                onChange({
                                  gaming_tournament: {
                                    ...formData.gaming_tournament,
                                    max_players: parseInt(e.target.value) || 32,
                                  },
                                })
                              }
                              className={INPUT_STYLES}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Type de bracket</Label>
                            <Select
                              value={formData.gaming_tournament.bracket_type}
                              onValueChange={(v) =>
                                onChange({
                                  gaming_tournament: { ...formData.gaming_tournament, bracket_type: v as any },
                                })
                              }
                            >
                              <SelectTrigger className={SELECT_STYLES}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-white">
                                <SelectItem value="single-elimination">Simple élimination</SelectItem>
                                <SelectItem value="double-elimination">Double élimination</SelectItem>
                                <SelectItem value="round-robin">Round Robin</SelectItem>
                                <SelectItem value="swiss">Système suisse</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Lien vers le règlement</Label>
                          <Input
                            type="url"
                            value={formData.gaming_tournament.rules_url}
                            onChange={(e) =>
                              onChange({
                                gaming_tournament: { ...formData.gaming_tournament, rules_url: e.target.value },
                              })
                            }
                            placeholder="https://..."
                            className={INPUT_STYLES}
                          />
                        </div>

                        <SwitchRow
                          label="Check-in obligatoire"
                          description="Les joueurs doivent se signaler avant le début du tournoi"
                          checked={formData.gaming_tournament.check_in_required}
                          onChange={(v) =>
                            onChange({
                              gaming_tournament: { ...formData.gaming_tournament, check_in_required: v },
                            })
                          }
                        />
                      </>
                    )}

                    {/* ─── Guests Config ─── */}
                    {module.id === "guests" && (
                      <>
                        {formData.guests.guests.map((guest, idx) => (
                          <Card key={guest.id} className="p-3 bg-muted/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                Invité #{idx + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => removeGuest(guest.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Nom</Label>
                                <Input
                                  value={guest.name}
                                  onChange={(e) => updateGuest(guest.id, "name", e.target.value)}
                                  placeholder="Nom de l'invité"
                                  className={INPUT_STYLES}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Type</Label>
                                <Select
                                  value={guest.type}
                                  onValueChange={(v) => updateGuest(guest.id, "type", v)}
                                >
                                  <SelectTrigger className={SELECT_STYLES}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-white">
                                    <SelectItem value="mangaka">Mangaka</SelectItem>
                                    <SelectItem value="voice-actor">Voice Actor / Seiyuu</SelectItem>
                                    <SelectItem value="cosplayer">Cosplayer</SelectItem>
                                    <SelectItem value="artiste">Artiste / Illustrateur</SelectItem>
                                    <SelectItem value="youtuber">YouTuber / Streamer</SelectItem>
                                    <SelectItem value="autre">Autre</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Créneaux</Label>
                              <Input
                                value={guest.time_slots}
                                onChange={(e) => updateGuest(guest.id, "time_slots", e.target.value)}
                                placeholder="Ex: 14h-16h Dédicaces, 17h Conférence"
                                className={INPUT_STYLES}
                              />
                            </div>
                          </Card>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={addGuest}
                          className="w-full border-dashed gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter un invité
                        </Button>
                      </>
                    )}

                    {/* ─── Exhibitors Config ─── */}
                    {module.id === "exhibitors" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Nombre max de stands</Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.exhibitors.max_stands || ""}
                              onChange={(e) =>
                                onChange({
                                  exhibitors: {
                                    ...formData.exhibitors,
                                    max_stands: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              placeholder="0 = illimité"
                              className={INPUT_STYLES}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Date limite de candidature</Label>
                            <Input
                              type="date"
                              value={formData.exhibitors.application_deadline}
                              onChange={(e) =>
                                onChange({
                                  exhibitors: { ...formData.exhibitors, application_deadline: e.target.value },
                                })
                              }
                              className={INPUT_STYLES}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* ─── Volunteers Config ─── */}
                    {module.id === "volunteers" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Nombre de bénévoles recherchés</Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.volunteers.max_volunteers || ""}
                              onChange={(e) =>
                                onChange({
                                  volunteers: {
                                    ...formData.volunteers,
                                    max_volunteers: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className={INPUT_STYLES}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Heure du briefing</Label>
                            <Input
                              type="time"
                              value={formData.volunteers.briefing_time}
                              onChange={(e) =>
                                onChange({
                                  volunteers: { ...formData.volunteers, briefing_time: e.target.value },
                                })
                              }
                              className={INPUT_STYLES}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* ─── Gamification Config ─── */}
                    {module.id === "gamification" && (
                      <>
                        <SwitchRow
                          label="Quête de présence (QR Code)"
                          description="Récompense XP/OTK au scan du QR code"
                          checked={formData.gamification.enable_presence_quest}
                          onChange={(v) =>
                            onChange({ gamification: { ...formData.gamification, enable_presence_quest: v } })
                          }
                        />
                        <SwitchRow
                          label="Stamps Rally"
                          description="Parcours de tampons à collecter sur le salon"
                          checked={formData.gamification.enable_stamps_rally}
                          onChange={(v) =>
                            onChange({ gamification: { ...formData.gamification, enable_stamps_rally: v } })
                          }
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Récompense XP</Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.gamification.xp_reward}
                              onChange={(e) =>
                                onChange({
                                  gamification: {
                                    ...formData.gamification,
                                    xp_reward: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className={INPUT_STYLES}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Récompense OTK</Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.gamification.otk_reward}
                              onChange={(e) =>
                                onChange({
                                  gamification: {
                                    ...formData.gamification,
                                    otk_reward: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className={INPUT_STYLES}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* ─── Community Config ─── */}
                    {module.id === "community" && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Serveur Discord lié</Label>
                          <Input
                            type="url"
                            value={formData.community.discord_url}
                            onChange={(e) =>
                              onChange({ community: { ...formData.community, discord_url: e.target.value } })
                            }
                            placeholder="https://discord.gg/..."
                            className={INPUT_STYLES}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Association organisatrice</Label>
                          <Input
                            value={formData.community.organizing_association}
                            onChange={(e) =>
                              onChange({
                                community: {
                                  ...formData.community,
                                  organizing_association: e.target.value,
                                },
                              })
                            }
                            placeholder="Nom de l'association"
                            className={INPUT_STYLES}
                          />
                        </div>
                      </>
                    )}

                    {/* ─── Dress Code Config ─── */}
                    {module.id === "dress-code" && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Code vestimentaire</Label>
                          <Input
                            value={formData.dress_code.dress_code_description}
                            onChange={(e) =>
                              onChange({
                                dress_code: { ...formData.dress_code, dress_code_description: e.target.value },
                              })
                            }
                            placeholder="Ex: Cosplay encouragé, tenue de soirée, etc."
                            className={INPUT_STYLES}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Règlement spécifique</Label>
                          <Textarea
                            value={formData.dress_code.rules_text}
                            onChange={(e) =>
                              onChange({
                                dress_code: { ...formData.dress_code, rules_text: e.target.value },
                              })
                            }
                            placeholder="Règles spécifiques pour l'événement..."
                            rows={3}
                            className={`resize-none ${INPUT_STYLES}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Lien vers le règlement complet</Label>
                          <Input
                            type="url"
                            value={formData.dress_code.rules_url}
                            onChange={(e) =>
                              onChange({
                                dress_code: { ...formData.dress_code, rules_url: e.target.value },
                              })
                            }
                            placeholder="https://..."
                            className={INPUT_STYLES}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </motion.div>
  );
};

// ─── Reusable Switch Row ──────────────────────────────────────────

interface SwitchRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const SwitchRow = ({ label, description, checked, onChange }: SwitchRowProps) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
    <div>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default StepPopCulture;
