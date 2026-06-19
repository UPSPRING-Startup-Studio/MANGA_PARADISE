import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  X, 
  Search,
  Loader2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { 
  useSearchCharacters, 
  useSearchUniverses,
  RefCharacterWithUniverse,
  RefUniverse
} from "@/hooks/useReferenceData";
import { PartySlot } from "@/hooks/useEventParties";

interface CharacterSlotSearchProps {
  slots: PartySlot[];
  onSlotsChange: (slots: PartySlot[]) => void;
  mode: 'shooting' | 'concours';
}

interface SlotWithMeta extends PartySlot {
  character_id?: string;
  universe_name?: string;
  image_url?: string;
}

export default function CharacterSlotSearch({ slots, onSlotsChange, mode }: CharacterSlotSearchProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  
  const { data: characterResults = [], isLoading: charactersLoading } = useSearchCharacters(debouncedQuery);
  const { data: universeResults = [], isLoading: universesLoading } = useSearchUniverses(debouncedQuery);
  
  const isLoading = charactersLoading || universesLoading;
  const hasResults = characterResults.length > 0 || universeResults.length > 0;

  const handleSelectCharacter = (char: RefCharacterWithUniverse) => {
    const newSlot: SlotWithMeta = {
      index: slots.length,
      label: char.name,
      character_name: char.name,
      character_id: char.id,
      universe_name: char.universe?.name,
      image_url: char.official_image_url || undefined,
    };
    
    onSlotsChange([...slots, newSlot]);
    setQuery("");
    setShowDropdown(false);
  };

  const handleAddCustom = () => {
    if (!query.trim()) return;
    
    const newSlot: PartySlot = {
      index: slots.length,
      label: query.trim(),
      character_name: query.trim(),
    };
    
    onSlotsChange([...slots, newSlot]);
    setQuery("");
    setShowDropdown(false);
  };

  const handleRemoveSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i }));
    onSlotsChange(newSlots);
  };

  return (
    <div className="space-y-3">
      <Label>
        {mode === 'shooting' ? 'Personnages recherchés' : 'Rôles / Personnages'} (optionnel)
      </Label>
      
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={mode === 'shooting' ? "Rechercher un personnage..." : "Ex: Lead, Naruto, Support..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="pl-9 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setQuery("");
                setShowDropdown(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Dropdown Results */}
        <AnimatePresence>
          {showDropdown && query.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
            >
              <ScrollArea className="max-h-64">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : hasResults ? (
                  <div className="p-2 space-y-1">
                    {/* Character results */}
                    {characterResults.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground px-2 py-1">Personnages</p>
                        {characterResults.map((char) => (
                          <button
                            key={char.id}
                            onClick={() => handleSelectCharacter(char)}
                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                          >
                            {char.official_image_url && (
                              <img 
                                src={char.official_image_url} 
                                alt={char.name}
                                className="w-8 h-8 rounded-md object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{char.name}</p>
                              {char.universe && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {char.universe.name}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                    
                    {/* Add custom option */}
                    <button
                      onClick={handleAddCustom}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-left border-t border-border mt-2 pt-3"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Ajouter "{query}"</p>
                        <p className="text-xs text-muted-foreground">Personnage personnalisé</p>
                      </div>
                      <Plus className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Aucun résultat</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustom}
                      className="gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter "{query}"
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Selected Slots */}
      {slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot, index) => {
            const slotMeta = slot as SlotWithMeta;
            return (
              <Badge 
                key={index} 
                variant="secondary"
                className="gap-2 py-1.5 px-3 pr-2"
              >
                {slotMeta.image_url && (
                  <img 
                    src={slotMeta.image_url} 
                    alt={slot.label}
                    className="w-5 h-5 rounded object-cover -ml-1"
                  />
                )}
                <span>{slot.label}</span>
                {slotMeta.universe_name && (
                  <span className="text-muted-foreground text-xs">
                    ({slotMeta.universe_name})
                  </span>
                )}
                <button
                  onClick={() => handleRemoveSlot(index)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Recherche dans notre base de personnages ou ajoute-en un nouveau
      </p>
    </div>
  );
}
