import { motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, AlertTriangle, User, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { MembershipFormData } from "../MembershipWizard";

interface StepIdentityProps {
  ageStatus: "blocked" | "minor" | "adult" | null;
}

export const StepIdentity = ({ ageStatus }: StepIdentityProps) => {
  const { control } = useFormContext<MembershipFormData>();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Name fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/80">Nom de famille</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Uzumaki"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4]"
                />
              </FormControl>
              <FormMessage className="text-[#FF6B6B]" />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/80">Prénom</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Naruto"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4]"
                />
              </FormControl>
              <FormMessage className="text-[#FF6B6B]" />
            </FormItem>
          )}
        />
      </div>

      {/* Pseudo */}
      <FormField
        control={control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/80 flex items-center gap-2">
              <User className="w-4 h-4" />
              Pseudo (ton nom d'aventurier)
            </FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="NarutoBestHokage"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4]"
              />
            </FormControl>
            <FormMessage className="text-[#FF6B6B]" />
          </FormItem>
        )}
      />

      {/* Birth Date */}
      <FormField
        control={control}
        name="birthDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="text-white/80 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Date de naissance
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal bg-white/5 border-white/20 hover:bg-white/10",
                      !field.value && "text-white/40"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "dd MMMM yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionne ta date de naissance</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#292438] border-white/20" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1920-01-01")
                  }
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                  className="bg-[#292438] text-white"
                />
              </PopoverContent>
            </Popover>
            <FormMessage className="text-[#FF6B6B]" />
          </FormItem>
        )}
      />

      {/* Age Status Messages */}
      {ageStatus === "blocked" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#FF6B6B]">Désolé jeune Padawan...</p>
            <p className="text-sm text-white/60">
              L'aventure commence à 16 ans. Reviens nous voir quand tu auras soufflé quelques bougies de plus ! 🎂
            </p>
          </div>
        </motion.div>
      )}

      {ageStatus === "minor" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#4ECDC4]/10 border border-[#4ECDC4]/30 rounded-xl flex items-start gap-3"
        >
          <Sparkles className="w-5 h-5 text-[#4ECDC4] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#4ECDC4]">Mode Apprenti activé !</p>
            <p className="text-sm text-white/60">
              Comme tu as entre 16 et 18 ans, nous aurons besoin des coordonnées de ton responsable légal et d'une autorisation parentale. 🛡️
            </p>
          </div>
        </motion.div>
      )}

      {ageStatus === "adult" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#4ECDC4]/10 border border-[#4ECDC4]/30 rounded-xl flex items-start gap-3"
        >
          <Sparkles className="w-5 h-5 text-[#4ECDC4] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#4ECDC4]">Parfait !</p>
            <p className="text-sm text-white/60">
              Tu es majeur, l'inscription sera rapide comme l'éclair ! ⚡
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
