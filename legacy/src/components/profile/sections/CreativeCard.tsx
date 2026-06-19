import { motion } from "framer-motion";
import { Briefcase, Wrench, Palette, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreativeCardProps {
  commissionStatus?: string | null;
  collaborationTypes?: string[] | null;
  domains?: string[] | null;
  softwareSkills?: string[] | null;
  hardwareEquipment?: string | null;
  collaborationInterests?: string[] | null;
  experienceLevel?: string | null;
  toolPreference?: string | null;
  workflowVibe?: string | null;
  projectHabit?: string | null;
  nightmare?: string | null;
}

const statusInfo: Record<string, { label: string; emoji: string; className: string }> = {
  open: { 
    label: "OUVERT AUX COMMANDES", 
    emoji: "🟢", 
    className: "bg-green-500/20 text-green-500 border-green-500/30" 
  },
  waitlist: { 
    label: "LISTE D'ATTENTE", 
    emoji: "🟠", 
    className: "bg-amber-500/20 text-amber-500 border-amber-500/30" 
  },
  closed: { 
    label: "FERMÉ", 
    emoji: "🔴", 
    className: "bg-red-500/20 text-red-500 border-red-500/30" 
  },
};

const collabTypeLabels: Record<string, string> = {
  paid: "💰 Rémunéré",
  tfp: "🤝 TFP / Gratuit",
  trade: "🔄 Échange",
};

const CreativeCard = ({
  commissionStatus,
  collaborationTypes,
  domains,
  softwareSkills,
  hardwareEquipment,
  collaborationInterests,
  experienceLevel,
  toolPreference,
  workflowVibe,
  projectHabit,
  nightmare,
}: CreativeCardProps) => {
  // Defensive: ensure arrays are safe
  const safeCollabTypes = Array.isArray(collaborationTypes) ? collaborationTypes : [];
  const safeDomains = Array.isArray(domains) ? domains : [];
  const safeSoftwareSkills = Array.isArray(softwareSkills) ? softwareSkills : [];
  const safeCollabInterests = Array.isArray(collaborationInterests) ? collaborationInterests : [];
  
  const status = commissionStatus ? statusInfo[commissionStatus] : null;
  
  const creativeDNA = [
    { label: "Mon arme préférée", value: toolPreference, emoji: "⚔️" },
    { label: "Mon workflow", value: workflowVibe, emoji: "🌊" },
    { label: "Mon habitude de projet", value: projectHabit, emoji: "📋" },
    { label: "Ma douleur créative", value: nightmare, emoji: "😵" },
  ].filter(q => q.value);

  return (
    <div className="space-y-6">
      {/* Commission Status Banner */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 rounded-xl border-2"
          style={{ 
            borderColor: commissionStatus === 'open' ? 'rgb(34 197 94 / 0.5)' : 
                         commissionStatus === 'waitlist' ? 'rgb(245 158 11 / 0.5)' : 
                         'rgb(239 68 68 / 0.5)',
            backgroundColor: commissionStatus === 'open' ? 'rgb(34 197 94 / 0.1)' : 
                             commissionStatus === 'waitlist' ? 'rgb(245 158 11 / 0.1)' : 
                             'rgb(239 68 68 / 0.1)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{status.emoji}</span>
            <div>
              <p className="font-display text-lg">{status.label}</p>
              {safeCollabTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {safeCollabTypes.map((type) => (
                    <span key={type} className="text-xs text-muted-foreground">
                      {collabTypeLabels[type] || type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Briefcase className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      )}

      {/* Domains */}
      {safeDomains.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-sakura/10 to-accent/10 rounded-xl p-6 border border-sakura/30"
        >
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-sakura" />
            Domaines de création
          </h3>
          <div className="flex flex-wrap gap-2">
            {safeDomains.map((domain) => (
              <Badge 
                key={domain} 
                variant="secondary" 
                className="bg-sakura/20 text-foreground px-3 py-1"
              >
                {domain}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tools Section */}
      {(safeSoftwareSkills.length > 0 || hardwareEquipment) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-6 border"
        >
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-turquoise" />
            Boîte à outils
          </h3>
          
          {/* Software */}
          {safeSoftwareSkills.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Logiciels</p>
              <div className="flex flex-wrap gap-2">
                {safeSoftwareSkills.map((software) => (
                  <Badge 
                    key={software} 
                    variant="outline" 
                    className="border-turquoise/50 bg-turquoise/10 text-foreground font-mono text-xs"
                  >
                    {software}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Hardware */}
          {hardwareEquipment && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Matériel</p>
              <p className="text-sm text-foreground">{hardwareEquipment}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Collaboration Interests */}
      {safeCollabInterests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-6 border"
        >
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-sakura" />
            Intérêts de collaboration
          </h3>
          <div className="flex flex-wrap gap-2">
            {safeCollabInterests.map((interest) => (
              <Badge key={interest} variant="outline">
                {interest}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Experience Level */}
      {experienceLevel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl p-6 border"
        >
          <h3 className="font-display text-lg text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Niveau d'expérience
          </h3>
          <p className="text-muted-foreground capitalize">{experienceLevel}</p>
        </motion.div>
      )}

      {/* Creative DNA */}
      {creativeDNA.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl p-6 border"
        >
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            🧬 ADN CRÉATIF
          </h3>
          <div className="space-y-3">
            {creativeDNA.map((q) => (
              <div
                key={q.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-lg">{q.emoji}</span>
                <div>
                  <p className="text-xs text-muted-foreground">{q.label}</p>
                  <p className="text-sm font-body text-foreground">{q.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CreativeCard;
