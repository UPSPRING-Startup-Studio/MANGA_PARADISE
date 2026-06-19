import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Phone, Mail, User, Send, Loader2, AlertTriangle, Building2 } from "lucide-react";
import { toast } from "sonner";

const bureauMembers = [
  {
    role: "Président",
    name: "Jean-Philippe Martin",
    email: "president@mangaparadise.fr",
    phone: "+33 6 XX XX XX XX",
  },
  {
    role: "Trésorier",
    name: "Marie Dubois",
    email: "tresorier@mangaparadise.fr",
    phone: "+33 6 XX XX XX XX",
  },
];

const PartnerContact = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Message envoyé ! Nous vous répondrons dans les plus brefs délais.");
    setSubject("");
    setMessage("");
    setIsUrgent(false);
    setSending(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 font-sans">
          Contact Direction
        </h1>
        <p className="text-slate-300">
          Ligne directe avec le Bureau de l'association
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Cards */}
        <div className="space-y-4">
          {bureauMembers.map((member, i) => (
            <motion.div
              key={member.role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <User className="w-7 h-7 text-slate-900" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-cyan-400 font-medium text-sm mb-1">{member.role}</p>
                    <h3 className="text-lg font-semibold text-white mb-3 font-sans">{member.name}</h3>
                    
                    <div className="space-y-2">
                      <a 
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </a>
                      <a 
                        href={`tel:${member.phone}`}
                        className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        {member.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Association Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 font-sans">Association Manga Paradise</h3>
                  <div className="space-y-1 text-slate-300 text-sm">
                    <p>Association Loi 1901</p>
                    <p>RNA : W123456789</p>
                    <p>SIRET : 123 456 789 00012</p>
                    <p className="pt-2">123 Rue des Otakus</p>
                    <p>75001 Paris, France</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white font-sans">Message au Bureau</h2>
              <Badge 
                variant="outline" 
                className={`cursor-pointer transition-all ${
                  isUrgent 
                    ? "bg-red-500/20 border-red-500 text-red-400" 
                    : "border-slate-600 text-mp-ink-muted hover:border-red-500/50"
                }`}
                onClick={() => setIsUrgent(!isUrgent)}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-slate-300">Objet</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sujet de votre message"
                  className="bg-mp-paper/50 border-mp-border text-white placeholder:text-mp-ink-muted focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-300">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre demande..."
                  rows={6}
                  className="bg-mp-paper/50 border-mp-border text-white placeholder:text-mp-ink-muted focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 resize-none"
                  required
                />
              </div>

              {isUrgent && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">
                    ⚠️ Ce message sera traité en priorité. Réponse sous 24h garantie.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Envoyer le message
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PartnerContact;
