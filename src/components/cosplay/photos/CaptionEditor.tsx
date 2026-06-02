import { useState, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useUpdatePhotoMeta } from "@/hooks/useCosplayPhotos";
import { useDebounce } from "@/hooks/useDebounce";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaptionEditorProps {
  photo: CosplayPhotoWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

interface ProfileResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

// ─── Regex : détecte le @mention en cours à la position du curseur ─────────

/** Retourne la query @mention partielle si le curseur est juste après un "@word", sinon null. */
function getMentionQuery(text: string, cursorPos: number): string | null {
  const textBefore = text.slice(0, cursorPos);
  const match = textBefore.match(/@(\w*)$/);
  return match ? match[1] : null;
}

// ─── Chips de suggestions rapides ─────────────────────────────────────────

const QUICK_CHIPS = [
  "Shooting entre amis",
  "Souvenir de convention",
  "Photo de groupe",
  "Cosplay day",
];

// ─── Composant principal ──────────────────────────────────────────────────────

export function CaptionEditor({ photo, open, onOpenChange, onSaved }: CaptionEditorProps) {
  const [value, setValue] = useState(photo.caption ?? "");
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = value.length;

  // ── @mentions ──────────────────────────────────────────────────────────────

  const mentionQuery = getMentionQuery(value, cursorPos);
  const debouncedMention = useDebounce(mentionQuery ?? "", 250);

  const { data: mentionSuggestions = [] } = useQuery<ProfileResult[]>({
    queryKey: ["caption-mention", debouncedMention],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${debouncedMention}%,display_name.ilike.%${debouncedMention}%`)
        .limit(6);
      if (error) throw error;
      return (data as ProfileResult[]) ?? [];
    },
    enabled: !!mentionQuery && debouncedMention.length >= 1,
  });

  const showMentionDropdown = !!mentionQuery && mentionSuggestions.length > 0;

  const insertMention = (username: string) => {
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    // Remplace "@partial" par "@username "
    const replaced = textBefore.replace(/@(\w*)$/, `@${username} `);
    const newValue = replaced + textAfter;
    setValue(newValue);
    // Repositionne le curseur après l'insertion
    const newCursor = replaced.length;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
      setCursorPos(newCursor);
    });
  };

  // ── Mutation ───────────────────────────────────────────────────────────────

  const updateMeta = useUpdatePhotoMeta(photo.id);

  const handleSave = () => {
    updateMeta.mutate(
      { caption: value.trim() || null },
      { onSuccess: () => onSaved() }
    );
  };

  // ── Chips ─────────────────────────────────────────────────────────────────

  const eventName = photo.event_name ?? (photo as any).event_name_manual ?? null;
  const eventChip = eventName ? `Souvenir du ${eventName}` : null;

  const chips = eventChip
    ? [...QUICK_CHIPS, eventChip]
    : QUICK_CHIPS;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[40vh] rounded-t-2xl bg-[#1A1A2E] border-t border-white/10 p-0 flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <SheetHeader className="px-4 pb-2 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-white text-sm font-semibold">
            <MessageSquare className="w-4 h-4 text-sakura" />
            Ajouter une légende
          </SheetTitle>
          <SheetDescription className="sr-only">
            Ajoute une légende et des mentions à cette photo cosplay
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">

          {/* Textarea + dropdown @mention */}
          <div className="relative">
            {/* Dropdown @mention — au-dessus du textarea */}
            {showMentionDropdown && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#12122A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
                {mentionSuggestions.map((profile) => (
                  <button
                    key={profile.id}
                    onMouseDown={(e) => {
                      e.preventDefault(); // empêche le textarea de perdre le focus
                      insertMention(profile.username ?? profile.display_name ?? "");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                  >
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] bg-white/10 text-white">
                        {(profile.username ?? profile.display_name ?? "?")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white text-sm truncate">
                      @{profile.username ?? profile.display_name}
                    </span>
                    {profile.display_name && profile.username && (
                      <span className="text-white/40 text-xs truncate ml-auto">
                        {profile.display_name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setCursorPos(e.target.selectionStart ?? 0);
              }}
              onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
              onClick={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
              placeholder="Décris ce moment..."
              maxLength={200}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none min-h-[60px] focus-visible:ring-white/20"
            />
          </div>

          {/* Compteur */}
          <div className={cn(
            "text-right text-xs",
            charCount > 195 ? "text-red-400" : charCount > 180 ? "text-orange-400" : "text-white/40"
          )}>
            {charCount}/200
          </div>

          {/* Chips suggestions rapides */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {chips.map((chip) => (
              <Badge
                key={chip}
                variant="outline"
                className="cursor-pointer whitespace-nowrap border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors flex-shrink-0"
                onClick={() => setValue(chip)}
              >
                {chip}
              </Badge>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-gradient-to-r from-[#C70039] to-[#FF5733] hover:opacity-90 text-white font-semibold"
              onClick={handleSave}
              disabled={updateMeta.isPending}
            >
              {updateMeta.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button
              variant="ghost"
              className="text-white/50 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              Passer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CaptionEditor;
