import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Shirt, Plus, X, Eye, Sparkles } from "lucide-react";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { useCosplayVestiaire } from "@/hooks/useCosplayVestiaire";
import { useEventLineups, useUpsertLineup } from "@/hooks/useCosplayLineups";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import LineUpPreview from "./LineUpPreview";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LineUpMakerModal = ({ isOpen, onClose }: Props) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: upcomingEvents = [] } = useUpcomingEvents();
  const { data: cosplays = [] } = useCosplayVestiaire(user?.id);
  const upsertLineup = useUpsertLineup();

  const [step, setStep] = useState<'select' | 'plan' | 'preview'>('select');
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [previewFormat, setPreviewFormat] = useState<'story' | 'post'>('story');

  const selectedEvent = upcomingEvents.find(e => e.id === selectedEventId);
  const { data: lineups = [] } = useEventLineups(user?.id, selectedEventId || undefined);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedEventId("");
      setSelectingSlot(null);
    }
  }, [isOpen]);

  // Get event days
  const getEventDays = () => {
    if (!selectedEvent) return [];

    const startDate = parseISO(selectedEvent.date);
    const endDate = selectedEvent.end_date ? parseISO(selectedEvent.end_date) : startDate;

    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const eventDays = getEventDays();

  // Get lineup for a specific day
  const getLineupForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return lineups.find(l => l.event_date === dateStr);
  };

  // Handle cosplay selection
  const handleSelectCosplay = async (cosplayId: string | null) => {
    if (!user || !selectingSlot || !selectedEventId) return;

    try {
      await upsertLineup.mutateAsync({
        userId: user.id,
        eventId: selectedEventId,
        eventDate: selectingSlot,
        cosplayId,
      });

      toast.success(cosplayId ? "Cosplay ajouté au planning !" : "Marqué comme civil");
      setSelectingSlot(null);
    } catch (error) {
      console.error("Error saving lineup:", error);
    }
  };

  const handleContinue = () => {
    if (!selectedEventId) {
      toast.error("Sélectionne un événement");
      return;
    }
    setStep('plan');
  };

  const handlePreview = (format: 'story' | 'post') => {
    if (lineups.length === 0) {
      toast.error("Ajoute au moins un cosplay à ton planning");
      return;
    }
    setPreviewFormat(format);
    setStep('preview');
  };

  return (
    <>
      <Dialog open={isOpen && step !== 'preview'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-sakura" />
              {step === 'select' ? "CRÉER MON LINE-UP" : selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 py-4"
              >
                <p className="text-muted-foreground font-body">
                  Planifie tes cosplays pour un événement et génère une image partageable !
                </p>

                <div>
                  <label className="font-body text-sm text-muted-foreground mb-2 block">
                    Sélectionne un événement
                  </label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="bg-muted">
                      <SelectValue placeholder="Choisis un événement..." />
                    </SelectTrigger>
                    <SelectContent>
                      {upcomingEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex items-center gap-2">
                            <span>{event.title}</span>
                            <span className="text-xs text-muted-foreground">
                              ({format(parseISO(event.date), 'dd MMM', { locale: fr })})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {upcomingEvents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun événement à venir. Inscris-toi à un événement d'abord !
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedEventId}
                    className="bg-sakura hover:bg-sakura/90"
                  >
                    Continuer
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'plan' && selectedEvent && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 py-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground font-body">
                    {format(parseISO(selectedEvent.date), 'dd MMMM', { locale: fr })}
                    {selectedEvent.end_date && ` - ${format(parseISO(selectedEvent.end_date), 'dd MMMM yyyy', { locale: fr })}`}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    {eventDays.length} jour{eventDays.length > 1 ? 's' : ''}
                  </span>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {eventDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const lineup = getLineupForDay(day);
                      const cosplay = lineup?.cosplay;

                      return (
                        <motion.div
                          key={dateStr}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-4 p-4 bg-muted rounded-xl"
                        >
                          {/* Day Info */}
                          <div className="flex-shrink-0 w-20 text-center">
                            <div className="font-display text-lg text-sakura">
                              {format(day, 'EEE', { locale: fr }).toUpperCase()}
                            </div>
                            <div className="text-2xl font-bold">
                              {format(day, 'd')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(day, 'MMM', { locale: fr })}
                            </div>
                          </div>

                          {/* Slot Content */}
                          <div className="flex-1">
                            {lineup && cosplay ? (
                              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                                <img
                                  src={cosplay.user_image_url}
                                  alt={cosplay.character_name}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                  <p className="font-display text-foreground">
                                    {cosplay.character_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {cosplay.universe}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectingSlot(dateStr)}
                                >
                                  Modifier
                                </Button>
                              </div>
                            ) : lineup && !lineup.cosplay_id ? (
                              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                  <Shirt className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-display text-foreground">Civil</p>
                                  <p className="text-sm text-muted-foreground">
                                    Pas de cosplay
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectingSlot(dateStr)}
                                >
                                  Modifier
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                className="w-full h-20 border-dashed border-2 hover:border-sakura hover:bg-sakura/5"
                                onClick={() => setSelectingSlot(dateStr)}
                              >
                                <Plus className="w-5 h-5 mr-2" />
                                Ajouter un cosplay
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="flex justify-between gap-3">
                  <Button variant="outline" onClick={() => setStep('select')}>
                    Retour
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePreview('post')}
                      disabled={lineups.length === 0}
                      variant="outline"
                      className="border-turquoise/50 hover:border-turquoise"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Post (4:5)
                    </Button>
                    <Button
                      onClick={() => handlePreview('story')}
                      disabled={lineups.length === 0}
                      className="bg-gradient-to-r from-sakura to-otk"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Story (9:16)
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Preview Mode - Full Screen */}
      {step === 'preview' && selectedEvent && (
        <LineUpPreview
          event={selectedEvent}
          lineups={lineups}
          eventDays={eventDays}
          profile={profile}
          format={previewFormat}
          onClose={() => setStep('plan')}
        />
      )}

      {/* Cosplay Selection Drawer */}
      <Drawer open={!!selectingSlot} onOpenChange={(open) => !open && setSelectingSlot(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-display">
              Sélectionne ton cosplay
            </DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="h-[400px] p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Civil Option */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectCosplay(null)}
                className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-sakura transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]"
              >
                <Shirt className="w-10 h-10 text-muted-foreground" />
                <span className="font-body text-sm text-muted-foreground">
                  Civil / Repos
                </span>
              </motion.button>

              {/* Cosplays */}
              {cosplays.map((cosplay) => (
                <motion.button
                  key={cosplay.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectCosplay(cosplay.id)}
                  className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-sakura transition-all group"
                >
                  <img
                    src={cosplay.user_image_url}
                    alt={cosplay.character_name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                    <div>
                      <p className="font-display text-white text-sm">
                        {cosplay.character_name}
                      </p>
                      <p className="text-xs text-white/70">
                        {cosplay.universe}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {cosplays.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Aucun cosplay dans ton vestiaire.
                  <br />
                  Ajoute-en d'abord dans l'onglet Cosplayer !
                </p>
              </div>
            )}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default LineUpMakerModal;
