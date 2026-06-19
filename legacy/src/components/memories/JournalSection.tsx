import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { BookOpen, Plus, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAddMemory, useDeleteMemory, EventMemory } from "@/hooks/useEventMemories";
import { toast } from "sonner";

interface JournalSectionProps {
  memories: EventMemory[];
  eventId: string;
  userId: string;
  isLoading: boolean;
}

const JournalSection = ({ memories, eventId, userId, isLoading }: JournalSectionProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  
  const addMemory = useAddMemory();
  const deleteMemory = useDeleteMemory();

  const handleSubmit = async () => {
    if (!newContent.trim()) return;
    
    try {
      await addMemory.mutateAsync({ eventId, userId, content: newContent.trim() });
      toast.success("Moment marquant ajouté !");
      setNewContent("");
      setIsAdding(false);
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      await deleteMemory.mutateAsync({ memoryId, eventId, userId });
      toast.success("Note supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  // Pastel colors for post-it style
  const postItColors = [
    "from-amber-400/20 to-amber-500/10 border-amber-500/30",
    "from-orange-400/20 to-orange-500/10 border-orange-500/30",
    "from-yellow-400/20 to-yellow-500/10 border-yellow-500/30",
    "from-rose-400/20 to-rose-500/10 border-rose-500/30",
  ];

  return (
    <Card className="bg-gradient-to-br from-yellow-900/20 to-amber-900/10 border-yellow-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg text-white">Moments Marquants</h3>
            <p className="text-yellow-400/60 text-sm">{memories.length} anecdote{memories.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Add new note */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="p-4 bg-gradient-to-br from-yellow-400/30 to-amber-500/20 border-yellow-500/40">
                  <Textarea
                    placeholder="Écris ton meilleur souvenir de cet événement..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none mb-3"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAdding(false);
                        setNewContent("");
                      }}
                      className="text-white/60 hover:text-white"
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!newContent.trim() || addMemory.isPending}
                      className="bg-yellow-500 text-black hover:bg-yellow-400"
                    >
                      {addMemory.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {memories.length === 0 && !isAdding && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-yellow-500/30 mb-3" />
              <p className="text-white/50 text-sm">Aucun moment enregistré</p>
              <p className="text-white/30 text-xs mt-1">Note tes anecdotes préférées !</p>
            </div>
          )}

          {/* Notes grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {memories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: index % 2 === 0 ? 1 : -1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <Card 
                    className={`p-4 bg-gradient-to-br ${postItColors[index % postItColors.length]} transform hover:rotate-0 transition-transform duration-300`}
                    style={{ transform: `rotate(${index % 2 === 0 ? 1 : -1}deg)` }}
                  >
                    {/* Pin decoration */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-md" />
                    
                    <p className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                      {memory.content}
                    </p>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                      <span>
                        {format(parseISO(memory.created_at), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(memory.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500 z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Card>
  );
};

export default JournalSection;
