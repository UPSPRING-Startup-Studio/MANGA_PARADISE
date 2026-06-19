import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Sparkles, Shield, Scroll, Heart, Crown, Upload, Check } from "lucide-react";
import { StepIdentity } from "./steps/StepIdentity";
import { StepContact } from "./steps/StepContact";
import { StepDestiny } from "./steps/StepDestiny";
import { StepHealth } from "./steps/StepHealth";
import { StepPack } from "./steps/StepPack";
import { SUBSCRIPTION_PACKS, type OtakuClassKey } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Calculate age from birth date
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Form schema with conditional validation
const membershipSchema = z.object({
  // Step 1: Identity
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").max(50),
  username: z.string().min(3, "Le pseudo doit contenir au moins 3 caractères").max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Le pseudo ne peut contenir que lettres, chiffres, - et _"),
  birthDate: z.date({
    required_error: "La date de naissance est requise",
  }),
  
  // Step 2: Contact
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  city: z.string().optional(),
  
  // Guardian info (for minors)
  guardianFirstName: z.string().optional(),
  guardianLastName: z.string().optional(),
  guardianRelationship: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().optional(),
  guardianAddress: z.string().optional(),
  
  // Step 3: Class (from quiz)
  otakuClass: z.string().optional(),
  
  // Step 4: Health & Legal
  healthAllergies: z.string().optional(),
  healthConditions: z.string().optional(),
  healthTreatments: z.string().optional(),
  imageRightsConsent: z.boolean(),
  rulesAccepted: z.boolean().refine(val => val === true, "Tu dois accepter le règlement"),
  parentalAuthorizationFile: z.any().optional(),
  
  // Step 5: Pack & Payment
  selectedPack: z.enum(["bronze", "silver", "gold"]),
  paymentMethod: z.enum(["card", "cash"]),
  sponsorUsername: z.string().optional(),
  sponsorId: z.string().optional(),
});

export type MembershipFormData = z.infer<typeof membershipSchema>;

type AgeStatus = "blocked" | "minor" | "adult" | null;

const STEPS = [
  { id: 1, title: "L'Identité du Héros", icon: Shield, subtitle: "Qui es-tu, aventurier ?" },
  { id: 2, title: "Le Parchemin de Contact", icon: Scroll, subtitle: "Comment te joindre ?" },
  { id: 3, title: "Le Choix du Destin", icon: Sparkles, subtitle: "Quelle est ta classe ?" },
  { id: 4, title: "Le Serment", icon: Heart, subtitle: "Santé & engagements" },
  { id: 5, title: "L'Offrande", icon: Crown, subtitle: "Choisis ton pack" },
];

export const MembershipWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [ageStatus, setAgeStatus] = useState<AgeStatus>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const methods = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    mode: "onChange",
    defaultValues: {
      lastName: "",
      firstName: "",
      username: "",
      email: user?.email || "",
      phone: "",
      city: "",
      guardianFirstName: "",
      guardianLastName: "",
      guardianRelationship: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianAddress: "",
      otakuClass: "",
      healthAllergies: "",
      healthConditions: "",
      healthTreatments: "",
      imageRightsConsent: false,
      rulesAccepted: false,
      selectedPack: "bronze",
      paymentMethod: "card",
      sponsorUsername: "",
      sponsorId: undefined,
    },
  });

  const { watch, trigger, setValue, getValues } = methods;
  const birthDate = watch("birthDate");

  // Update age status when birth date changes
  useEffect(() => {
    if (birthDate) {
      const age = calculateAge(birthDate);
      if (age < 16) {
        setAgeStatus("blocked");
      } else if (age < 18) {
        setAgeStatus("minor");
      } else {
        setAgeStatus("adult");
      }
    } else {
      setAgeStatus(null);
    }
  }, [birthDate]);

  const progress = (currentStep / STEPS.length) * 100;

  const canProceed = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        const step1Valid = await trigger(["lastName", "firstName", "username", "birthDate"]);
        return step1Valid && ageStatus !== "blocked";
      case 2:
        if (ageStatus === "minor") {
          return await trigger(["email", "guardianFirstName", "guardianLastName", "guardianRelationship", "guardianPhone", "guardianEmail", "guardianAddress"]);
        }
        return await trigger(["email"]);
      case 3:
        return !!getValues("otakuClass");
      case 4:
        const step4Fields: (keyof MembershipFormData)[] = ["imageRightsConsent", "rulesAccepted"];
        const step4Valid = await trigger(step4Fields);
        if (ageStatus === "minor") {
          const fileInput = getValues("parentalAuthorizationFile");
          return step4Valid && fileInput && fileInput.length > 0;
        }
        return step4Valid;
      case 5:
        return await trigger(["selectedPack", "paymentMethod"]);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const canGo = await canProceed();
    if (canGo && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClassSelect = (classKey: OtakuClassKey) => {
    setValue("otakuClass", classKey);
  };

  const uploadParentalAuthorization = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/autorisation-parentale.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('secure-docs')
        .upload(fileName, file, { upsert: true });
        
      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erreur lors de l'upload du fichier");
        return null;
      }
      
      return fileName;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Tu dois être connecté pour t'inscrire");
      return;
    }

    const isValid = await canProceed();
    if (!isValid) return;

    setIsSubmitting(true);
    const data = getValues();

    try {
      // Upload parental authorization if minor
      let parentalAuthUrl = null;
      if (ageStatus === "minor" && data.parentalAuthorizationFile?.[0]) {
        parentalAuthUrl = await uploadParentalAuthorization(data.parentalAuthorizationFile[0]);
        if (!parentalAuthUrl) {
          setIsSubmitting(false);
          return;
        }
      }

      // Determine membership status based on payment method
      const membershipStatus = data.paymentMethod === "card" ? "pending" : "pending_payment";

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          username: data.username,
          birth_date: data.birthDate.toISOString().split('T')[0],
          phone: data.phone || null,
          city: data.city || null,
          guardian_first_name: data.guardianFirstName || null,
          guardian_last_name: data.guardianLastName || null,
          guardian_relationship: data.guardianRelationship || null,
          guardian_phone: data.guardianPhone || null,
          guardian_email: data.guardianEmail || null,
          guardian_address: data.guardianAddress || null,
          otaku_class: data.otakuClass,
          health_allergies: data.healthAllergies || null,
          health_conditions: data.healthConditions || null,
          health_treatments: data.healthTreatments || null,
          image_rights_consent: data.imageRightsConsent,
          rules_accepted: data.rulesAccepted,
          rules_accepted_at: data.rulesAccepted ? new Date().toISOString() : null,
          parental_authorization_url: parentalAuthUrl,
          selected_pack: data.selectedPack,
          payment_method: data.paymentMethod,
          sponsor_id: data.sponsorId || null,
          membership_status: membershipStatus,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) {
        console.error("Profile update error:", error);
        toast.error("Erreur lors de la sauvegarde du profil");
        setIsSubmitting(false);
        return;
      }

      // Get pack info for OTK bonus
      const pack = SUBSCRIPTION_PACKS[data.selectedPack];
      
      if (data.paymentMethod === "card") {
        // Redirect to Stripe payment
        toast.success(`Redirection vers le paiement...`);
        // TODO: Implement Stripe checkout
        // For now, simulate success and activate membership
        const { error: activationError } = await supabase.rpc('activate_membership', {
          _user_id: user.id,
          _pack_id: data.selectedPack,
          _otk_amount: pack.otkBonus,
        });
        
        if (activationError) {
          console.error("Activation error:", activationError);
          toast.error("Erreur lors de l'activation");
        } else {
          toast.success(`Bienvenue dans l'aventure, ${data.username} ! 🎉`);
          toast.info(`+${pack.otkBonus.toLocaleString()} OTK Coins crédités !`);
          if (data.sponsorId) {
            toast.info(`+200 OTK Coins bonus parrainage !`);
          }
        }
        navigate("/espace-membre");
      } else {
        // Cash payment - account pending
        toast.success(`Inscription enregistrée, ${data.username} !`);
        toast.info(`Ton compte est en attente de validation du paiement espèces.`);
        navigate("/espace-membre");
      }
      
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepIcon = STEPS[currentStep - 1].icon;

  return (
    <div className="min-h-screen bg-[#292438] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF6B6B]/10 via-[#292438] to-[#292438]"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#4ECDC4]/40 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 10 
            }}
            animate={{ 
              y: -10,
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-[#FF6B6B]" />
            <span className="text-sm font-medium text-[#FF6B6B]">Devenir Membre</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl mb-2">
            Rejoins <span className="text-[#4ECDC4]">Manga Paradise</span>
          </h1>
          <p className="text-white/60">L'aventure commence ici...</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center transition-all ${
                    isActive ? 'text-[#FF6B6B]' : isCompleted ? 'text-[#4ECDC4]' : 'text-white/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive ? 'border-[#FF6B6B] bg-[#FF6B6B]/20' : 
                    isCompleted ? 'border-[#4ECDC4] bg-[#4ECDC4]/20' : 'border-white/20'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs mt-1 hidden md:block">{step.title}</span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2 bg-white/10" />
        </div>

        {/* Current Step Info */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 text-[#4ECDC4] mb-2">
            <CurrentStepIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Étape {currentStep}/{STEPS.length}</span>
          </div>
          <h2 className="font-display text-2xl mb-1">{STEPS[currentStep - 1].title}</h2>
          <p className="text-white/60 text-sm">{STEPS[currentStep - 1].subtitle}</p>
        </motion.div>

        {/* Form Content */}
        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()}>
            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 mb-6"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <StepIdentity key="identity" ageStatus={ageStatus} />
                )}
                {currentStep === 2 && (
                  <StepContact key="contact" isMinor={ageStatus === "minor"} />
                )}
                {currentStep === 3 && (
                  <StepDestiny 
                    key="destiny" 
                    onClassSelect={handleClassSelect}
                    selectedClass={watch("otakuClass") as OtakuClassKey | undefined}
                  />
                )}
                {currentStep === 4 && (
                  <StepHealth 
                    key="health" 
                    isMinor={ageStatus === "minor"}
                    uploadingFile={uploadingFile}
                  />
                )}
                {currentStep === 5 && (
                  <StepPack key="pack" />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={ageStatus === "blocked"}
                  className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] hover:from-[#FF5252] hover:to-[#FF6B6B] text-white"
                >
                  Continuer l'aventure
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#4ECDC4] to-[#45B7AA] hover:from-[#45B7AA] hover:to-[#3DA89C] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Validation...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Valider mon adhésion
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default MembershipWizard;
