import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Tag, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const sponsorOptions = [
  { id: "stand", label: "Stand exposant", price: 300 },
  { id: "logo", label: "Logo sur affiche", price: 100 },
  { id: "animation", label: "Animation sur scène", price: 200 },
  { id: "goodies", label: "Distribution goodies", price: 50 },
];

const PartnerEvents = () => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ["partner-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSendRequest = async () => {
    if (selectedOptions.length === 0) {
      toast.error("Sélectionnez au moins une option");
      return;
    }

    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Demande envoyée ! Nous vous recontacterons sous 48h.");
    setSelectedOptions([]);
    setMessage("");
    setSelectedEvent(null);
    setSending(false);
  };

  const calculateTotal = () => {
    return selectedOptions.reduce((total, optionId) => {
      const option = sponsorOptions.find(o => o.id === optionId);
      return total + (option?.price || 0);
    }, 0);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 font-sans">
          Événements & Opportunités
        </h1>
        <p className="text-slate-300">
          Découvrez les événements ouverts au sponsoring et réservez votre emplacement
        </p>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/40 backdrop-blur-md rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : events?.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-mp-ink-muted mb-4" />
          <h3 className="text-xl text-white mb-2 font-sans">Aucun événement à venir</h3>
          <p className="text-mp-ink-muted">Les prochains événements seront affichés ici</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {events?.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-200">
                {/* Event Image */}
                <div className="h-40 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 relative">
                  {event.image_url && (
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge className="bg-emerald-500/90 text-white border-0">
                      <Tag className="w-3 h-3 mr-1" />
                      Sponsoring Dispo
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-3 font-sans">{event.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      {format(new Date(event.date), "EEEE d MMMM yyyy", { locale: fr })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        {event.location}
                      </div>
                    )}
                    {event.max_attendees && (
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Users className="w-4 h-4 text-cyan-400" />
                        {event.max_attendees} participants max
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold"
                        onClick={() => setSelectedEvent(event)}
                      >
                        Sponsoriser cet événement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-white/10 sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-white font-sans">
                          Demande de sponsoring
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-6 pt-4">
                        <div>
                          <p className="text-mp-ink-muted text-sm mb-1">Événement sélectionné</p>
                          <p className="text-white font-medium">{selectedEvent?.title}</p>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                          <Label className="text-slate-300">Options de visibilité</Label>
                          {sponsorOptions.map((option) => (
                            <div
                              key={option.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedOptions.includes(option.id)
                                  ? "bg-cyan-500/20 border-cyan-500/50"
                                  : "bg-mp-paper/50 border-mp-border hover:border-slate-600"
                              }`}
                              onClick={() => handleOptionToggle(option.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  checked={selectedOptions.includes(option.id)}
                                  onCheckedChange={() => handleOptionToggle(option.id)}
                                  className="border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                />
                                <span className="text-white">{option.label}</span>
                              </div>
                              <span className="text-cyan-400 font-medium">{option.price} €</span>
                            </div>
                          ))}
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                          <Label className="text-slate-300">Message (optionnel)</Label>
                          <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Précisez vos besoins spécifiques..."
                            className="bg-mp-paper/50 border-mp-border text-white placeholder:text-mp-ink-muted focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                          />
                        </div>

                        {/* Total */}
                        <div className="p-4 bg-mp-paper/50 rounded-lg flex items-center justify-between border border-white/5">
                          <span className="text-mp-ink-muted">Estimation</span>
                          <span className="text-2xl font-bold text-white">{calculateTotal()} €</span>
                        </div>

                        {/* Submit */}
                        <Button
                          onClick={handleSendRequest}
                          disabled={sending || selectedOptions.length === 0}
                          className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Envoyer la demande
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerEvents;
