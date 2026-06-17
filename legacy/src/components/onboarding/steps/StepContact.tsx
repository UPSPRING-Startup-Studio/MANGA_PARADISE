import { motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Users, Shield } from "lucide-react";
import type { MembershipFormData } from "../MembershipWizard";

interface StepContactProps {
  isMinor: boolean;
}

const GUARDIAN_RELATIONSHIPS = [
  { value: "pere", label: "Père" },
  { value: "mere", label: "Mère" },
  { value: "tuteur", label: "Tuteur légal" },
  { value: "autre", label: "Autre responsable" },
];

export const StepContact = ({ isMinor }: StepContactProps) => {
  const { control } = useFormContext<MembershipFormData>();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Basic Contact */}
      <div className="space-y-4">
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/80 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email"
                  placeholder="naruto@konoha.jp"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4]"
                />
              </FormControl>
              <FormMessage className="text-[#FF6B6B]" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone <span className="text-white/40 text-xs">(facultatif)</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="tel"
                    placeholder="06 12 34 56 78"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4]"
                  />
                </FormControl>
                <FormMessage className="text-[#FF6B6B]" />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ville <span className="text-white/40 text-xs">(facultatif)</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Paris, Lyon, Konoha..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4]"
                  />
                </FormControl>
                <FormMessage className="text-[#FF6B6B]" />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Guardian Info (Minors Only) */}
      {isMinor && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-4 pt-6 border-t border-white/10"
        >
          <div className="flex items-center gap-2 text-[#FF6B6B]">
            <Shield className="w-5 h-5" />
            <h3 className="font-display text-lg">Responsable Légal (Maître du Clan)</h3>
          </div>
          <p className="text-sm text-white/60">
            Comme tu es mineur, nous avons besoin des coordonnées de ton responsable légal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="guardianLastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Nom du responsable</FormLabel>
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
              name="guardianFirstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Prénom du responsable</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Minato"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4]"
                    />
                  </FormControl>
                  <FormMessage className="text-[#FF6B6B]" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="guardianRelationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Lien de parenté
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Sélectionne le lien" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#292438] border-white/20">
                    {GUARDIAN_RELATIONSHIPS.map((rel) => (
                      <SelectItem 
                        key={rel.value} 
                        value={rel.value}
                        className="text-white hover:bg-white/10"
                      >
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[#FF6B6B]" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="guardianPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Téléphone du responsable
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="tel"
                      placeholder="06 12 34 56 78"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4]"
                    />
                  </FormControl>
                  <FormMessage className="text-[#FF6B6B]" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="guardianEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email du responsable
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      placeholder="minato@konoha.jp"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4]"
                    />
                  </FormControl>
                  <FormMessage className="text-[#FF6B6B]" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="guardianAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse complète du responsable
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="123 rue du Village Caché, 75001 Paris"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4] resize-none"
                    rows={2}
                  />
                </FormControl>
                <FormMessage className="text-[#FF6B6B]" />
              </FormItem>
            )}
          />
        </motion.div>
      )}
    </motion.div>
  );
};
