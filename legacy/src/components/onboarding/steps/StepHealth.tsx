import { motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Heart, Shield, FileText, Upload, ExternalLink, Loader2 } from "lucide-react";
import type { MembershipFormData } from "../MembershipWizard";

interface StepHealthProps {
  isMinor: boolean;
  uploadingFile: boolean;
}

export const StepHealth = ({ isMinor, uploadingFile }: StepHealthProps) => {
  const { control, register, watch } = useFormContext<MembershipFormData>();
  const parentalFile = watch("parentalAuthorizationFile");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Health Section (Minors Only) */}
      {isMinor && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-4 pb-6 border-b border-white/10"
        >
          <div className="flex items-center gap-2 text-[#4ECDC4]">
            <Heart className="w-5 h-5" />
            <h3 className="font-display text-lg">Informations de Santé</h3>
          </div>
          <p className="text-sm text-white/60 flex items-start gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Ces données sont confidentielles et servent uniquement à ta sécurité en événement.
          </p>

          <FormField
            control={control}
            name="healthAllergies"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">
                  Allergies (alimentaires, médicaments, etc.)
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Aucune allergie connue / Allergie aux arachides..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4] resize-none"
                    rows={2}
                  />
                </FormControl>
                <FormMessage className="text-[#FF6B6B]" />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="healthConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">
                  Pathologies (asthme, diabète, etc.)
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Aucune pathologie connue / Asthme léger..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ECDC4] resize-none"
                    rows={2}
                  />
                </FormControl>
                <FormMessage className="text-[#FF6B6B]" />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="healthTreatments"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">
                  Traitements en cours
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Aucun traitement / Ventoline en cas de crise..."
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

      {/* Legal Consents */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#FF6B6B]">
          <FileText className="w-5 h-5" />
          <h3 className="font-display text-lg">Documents & Consentements</h3>
        </div>

        {/* Image Rights */}
        <FormField
          control={control}
          name="imageRightsConsent"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1 border-white/30 data-[state=checked]:bg-[#4ECDC4] data-[state=checked]:border-[#4ECDC4]"
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="text-white/80 font-normal cursor-pointer">
                  Droit à l'image
                </FormLabel>
                <p className="text-sm text-white/50">
                  J'autorise Manga Paradise à utiliser mon image sur ses réseaux sociaux et supports de communication.
                </p>
              </div>
            </FormItem>
          )}
        />

        {/* Rules Acceptance */}
        <FormField
          control={control}
          name="rulesAccepted"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1 border-white/30 data-[state=checked]:bg-[#4ECDC4] data-[state=checked]:border-[#4ECDC4]"
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="text-white/80 font-normal cursor-pointer">
                  Règlement de l'association <span className="text-[#FF6B6B]">*</span>
                </FormLabel>
                <p className="text-sm text-white/50">
                  J'ai lu et j'accepte les{" "}
                  <a 
                    href="/documents/cga.pdf" 
                    target="_blank" 
                    className="text-[#4ECDC4] hover:underline inline-flex items-center gap-1"
                  >
                    Conditions Générales d'Adhésion
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {" "}et le{" "}
                  <a 
                    href="/documents/reglement-interieur.pdf" 
                    target="_blank" 
                    className="text-[#4ECDC4] hover:underline inline-flex items-center gap-1"
                  >
                    Règlement Intérieur
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  .
                </p>
                <FormMessage className="text-[#FF6B6B]" />
              </div>
            </FormItem>
          )}
        />

        {/* Parental Authorization Upload (Minors Only) */}
        {isMinor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <FormLabel className="text-white/80 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Autorisation parentale signée <span className="text-[#FF6B6B]">*</span>
            </FormLabel>
            <p className="text-sm text-white/50 mb-2">
              Télécharge le formulaire, fais-le signer par ton responsable légal, puis upload-le ici.
            </p>
            
            <div className="flex gap-3">
              <a
                href="/documents/autorisation-parentale.pdf"
                target="_blank"
                className="px-4 py-2 bg-[#4ECDC4]/10 border border-[#4ECDC4]/30 rounded-lg text-[#4ECDC4] text-sm hover:bg-[#4ECDC4]/20 transition-colors inline-flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Télécharger le formulaire
              </a>
            </div>

            <div className="mt-3">
              <label className="block">
                <div className={`
                  relative p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all
                  ${parentalFile?.[0] 
                    ? 'border-[#4ECDC4] bg-[#4ECDC4]/10' 
                    : 'border-white/20 hover:border-white/40 bg-white/5'
                  }
                `}>
                  {uploadingFile ? (
                    <div className="flex items-center justify-center gap-2 text-white/60">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Upload en cours...</span>
                    </div>
                  ) : parentalFile?.[0] ? (
                    <div className="text-[#4ECDC4]">
                      <FileText className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">{parentalFile[0].name}</p>
                      <p className="text-sm text-white/50 mt-1">Clique pour changer de fichier</p>
                    </div>
                  ) : (
                    <div className="text-white/60">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p>Clique pour uploader l'autorisation signée</p>
                      <p className="text-xs text-white/40 mt-1">PDF, JPG ou PNG (max 10 Mo)</p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    {...register("parentalAuthorizationFile")}
                  />
                </div>
              </label>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
