import { useState } from "react";
import { motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { SUBSCRIPTION_PACKS, type SubscriptionPackId } from "@/lib/constants";
import { Check, Crown, Sparkles, Gift, CreditCard, Wallet, Search, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import type { MembershipFormData } from "../MembershipWizard";

type SubscriptionPackKey = SubscriptionPackId;
type PaymentMethod = "card" | "cash";

interface SponsorInfo {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  isEligible: boolean;
  ineligibilityReason?: string;
}

const PACK_ICONS: Record<SubscriptionPackKey, React.ReactNode> = {
  bronze: <span className="text-4xl">🥉</span>,
  silver: <span className="text-4xl">🥈</span>,
  gold: <span className="text-4xl">🥇</span>,
};

const PACK_COLORS: Record<SubscriptionPackKey, { border: string; bg: string; accent: string }> = {
  bronze: {
    border: "border-amber-700/50 hover:border-amber-600",
    bg: "from-amber-900/30 to-amber-800/10",
    accent: "text-amber-500",
  },
  silver: {
    border: "border-gray-400/50 hover:border-gray-300",
    bg: "from-gray-500/30 to-gray-400/10",
    accent: "text-gray-300",
  },
  gold: {
    border: "border-yellow-500/50 hover:border-yellow-400",
    bg: "from-yellow-600/30 to-yellow-500/10",
    accent: "text-yellow-400",
  },
};

export const StepPack = () => {
  const { watch, setValue } = useFormContext<MembershipFormData>();
  const selectedPack = watch("selectedPack");
  const paymentMethod = watch("paymentMethod");
  const sponsorUsername = watch("sponsorUsername");

  const [sponsorSearch, setSponsorSearch] = useState("");
  const [sponsorInfo, setSponsorInfo] = useState<SponsorInfo | null>(null);
  const [searchingSponsors, setSearchingSponsors] = useState(false);
  const [sponsorError, setSponsorError] = useState<string | null>(null);

  const handleSelectPack = (packKey: SubscriptionPackKey) => {
    setValue("selectedPack", packKey);
  };

  const handleSelectPayment = (method: PaymentMethod) => {
    setValue("paymentMethod", method);
  };

  const handleSearchSponsor = async () => {
    if (!sponsorSearch.trim()) {
      setSponsorError("Entre un pseudo");
      return;
    }

    setSearchingSponsors(true);
    setSponsorError(null);
    setSponsorInfo(null);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, membership_status, created_at, referral_count, referral_year")
        .ilike("username", sponsorSearch.trim())
        .maybeSingle();

      if (error) {
        setSponsorError("Erreur lors de la recherche");
        return;
      }

      if (!data) {
        setSponsorError("Aucun membre trouvé avec ce pseudo");
        return;
      }

      // Check eligibility
      let isEligible = true;
      let ineligibilityReason = "";

      // Check active status
      if (data.membership_status !== "active") {
        isEligible = false;
        ineligibilityReason = "Ce membre n'a pas un compte actif";
      }

      // Check 6 months seniority
      if (isEligible && data.created_at) {
        const createdAt = new Date(data.created_at);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (createdAt > sixMonthsAgo) {
          isEligible = false;
          ineligibilityReason = "Ce membre doit avoir plus de 6 mois d'ancienneté";
        }
      }

      // Check referral quota (max 5 per year)
      if (isEligible) {
        const currentYear = new Date().getFullYear();
        const referralYear = data.referral_year || 0;
        const referralCount = referralYear === currentYear ? (data.referral_count || 0) : 0;
        
        if (referralCount >= 5) {
          isEligible = false;
          ineligibilityReason = "Ce membre a atteint son quota de parrainages pour cette année";
        }
      }

      setSponsorInfo({
        id: data.id,
        username: data.username || "",
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        isEligible,
        ineligibilityReason,
      });

      if (isEligible) {
        setValue("sponsorUsername", data.username || "");
        setValue("sponsorId", data.id);
      }
    } catch (err) {
      console.error("Sponsor search error:", err);
      setSponsorError("Une erreur est survenue");
    } finally {
      setSearchingSponsors(false);
    }
  };

  const handleClearSponsor = () => {
    setSponsorSearch("");
    setSponsorInfo(null);
    setSponsorError(null);
    setValue("sponsorUsername", "");
    setValue("sponsorId", undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Pack Selection */}
      <div>
        <div className="text-center mb-4">
          <h3 className="font-display text-lg text-[#4ECDC4] mb-1">1. Choisis ton Pack</h3>
          <p className="text-white/60 text-sm">
            La cotisation de base (20€) est incluse dans tous les packs.
          </p>
        </div>

        <div className="grid gap-4">
          {(Object.keys(SUBSCRIPTION_PACKS) as SubscriptionPackKey[]).map((packKey, index) => {
            const pack = SUBSCRIPTION_PACKS[packKey];
            const colors = PACK_COLORS[packKey];
            const isSelected = selectedPack === packKey;

            return (
              <motion.button
                key={packKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelectPack(packKey)}
                className={`
                  relative p-5 rounded-2xl border-2 text-left transition-all
                  bg-gradient-to-br ${colors.bg}
                  ${isSelected 
                    ? `${colors.border} ring-2 ring-offset-2 ring-offset-[#292438] ${packKey === 'gold' ? 'ring-yellow-400' : packKey === 'silver' ? 'ring-gray-300' : 'ring-amber-500'}` 
                    : `${colors.border}`
                  }
                `}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 bg-[#4ECDC4] rounded-full flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}

                {packKey === "gold" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Populaire
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{PACK_ICONS[packKey]}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-display text-xl ${colors.accent}`}>{pack.label}</h3>
                      <span className="text-2xl font-bold text-white">{pack.price}€</span>
                    </div>

                    <p className="text-sm text-white/60 mb-3">{pack.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-[#4ECDC4]" />
                        <span className="text-white">
                          <span className="font-bold text-[#4ECDC4]">+{pack.otkBonus.toLocaleString()}</span> OTK Coins
                        </span>
                      </div>
                      
                      {pack.goodies.map((goodie, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Gift className="w-4 h-4 text-[#FF6B6B]" />
                          <span className="text-white/80">{goodie}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sponsor Section */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="font-display text-lg text-[#4ECDC4] mb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          2. As-tu un Parrain ? (Facultatif)
        </h3>
        <p className="text-white/60 text-sm mb-4">
          Si un membre t'a parrainé, entre son pseudo pour vous faire gagner des OTK Coins à tous les deux !
        </p>

        {!sponsorInfo?.isEligible ? (
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Pseudo du parrain"
              value={sponsorSearch}
              onChange={(e) => setSponsorSearch(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            />
            <Button
              type="button"
              onClick={handleSearchSponsor}
              disabled={searchingSponsors}
              className="bg-[#4ECDC4]/20 hover:bg-[#4ECDC4]/30 text-[#4ECDC4] border border-[#4ECDC4]/30"
            >
              {searchingSponsors ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 bg-[#4ECDC4]/10 border border-[#4ECDC4]/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-[#4ECDC4]">
                {sponsorInfo.avatar_url && <AvatarImage src={sponsorInfo.avatar_url} />}
                <AvatarFallback className="bg-[#4ECDC4]/20 text-[#4ECDC4]">
                  {sponsorInfo.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4ECDC4]" />
                  Parrain trouvé !
                </p>
                <p className="text-sm text-[#4ECDC4]">
                  @{sponsorInfo.username}
                  {sponsorInfo.display_name && ` (${sponsorInfo.display_name})`}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSponsor}
              className="text-white/60 hover:text-white"
            >
              Changer
            </Button>
          </motion.div>
        )}

        {sponsorError && (
          <p className="text-[#FF6B6B] text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {sponsorError}
          </p>
        )}

        {sponsorInfo && !sponsorInfo.isEligible && (
          <p className="text-amber-400 text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {sponsorInfo.ineligibilityReason}
          </p>
        )}

        {sponsorInfo?.isEligible && (
          <div className="mt-3 p-2 bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-lg">
            <p className="text-sm text-[#FF6B6B] font-medium">
              🎁 Bonus parrainage : +200 OTK Coins pour toi, +500 OTK pour {sponsorInfo.username} !
            </p>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <h3 className="font-display text-lg text-[#4ECDC4] mb-4 text-center">
          3. Moyen de Paiement
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Payment */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectPayment("card")}
            className={`
              p-5 rounded-xl border-2 text-left transition-all
              ${paymentMethod === "card"
                ? "border-[#4ECDC4] bg-[#4ECDC4]/10 ring-2 ring-[#4ECDC4]/30"
                : "border-white/20 bg-white/5 hover:border-white/40"
              }
            `}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                paymentMethod === "card" ? "bg-[#4ECDC4]/20" : "bg-white/10"
              }`}>
                <CreditCard className={`w-6 h-6 ${paymentMethod === "card" ? "text-[#4ECDC4]" : "text-white/60"}`} />
              </div>
              <div>
                <h4 className="font-display text-lg text-white">💳 Carte Bancaire</h4>
                <p className="text-sm text-[#4ECDC4]">Immédiat</p>
              </div>
              {paymentMethod === "card" && (
                <Check className="w-5 h-5 text-[#4ECDC4] ml-auto" />
              )}
            </div>
            <p className="text-sm text-white/60">
              Paiement sécurisé via Stripe. Ton compte sera activé instantanément.
            </p>
          </motion.button>

          {/* Cash Payment */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectPayment("cash")}
            className={`
              p-5 rounded-xl border-2 text-left transition-all
              ${paymentMethod === "cash"
                ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30"
                : "border-white/20 bg-white/5 hover:border-white/40"
              }
            `}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                paymentMethod === "cash" ? "bg-amber-500/20" : "bg-white/10"
              }`}>
                <Wallet className={`w-6 h-6 ${paymentMethod === "cash" ? "text-amber-500" : "text-white/60"}`} />
              </div>
              <div>
                <h4 className="font-display text-lg text-white">💶 Espèces</h4>
                <p className="text-sm text-amber-400">Sur place</p>
              </div>
              {paymentMethod === "cash" && (
                <Check className="w-5 h-5 text-amber-500 ml-auto" />
              )}
            </div>
            <p className="text-sm text-white/60">
              Remise en main propre à un membre du Bureau. Ton compte restera en attente jusqu'à validation.
            </p>
          </motion.button>
        </div>

        {paymentMethod === "cash" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
          >
            <p className="text-amber-400 text-sm">
              ⚠️ <strong>Important :</strong> Ton compte sera créé mais restera "En Attente" jusqu'à la remise des fonds à un membre du Bureau. 
              Les OTK Coins ne seront crédités qu'après validation du paiement.
            </p>
          </motion.div>
        )}
      </div>

      {/* Summary */}
      {selectedPack && paymentMethod && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#4ECDC4]/10 border border-[#4ECDC4]/30 rounded-xl"
        >
          <h4 className="font-display text-[#4ECDC4] mb-3 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Récapitulatif
          </h4>
          <div className="text-sm text-white/80 space-y-2">
            <div className="flex justify-between">
              <span className="text-white/50">Pack sélectionné :</span>
              <span className="font-medium">{SUBSCRIPTION_PACKS[selectedPack].label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Moyen de paiement :</span>
              <span className="font-medium">{paymentMethod === "card" ? "Carte bancaire" : "Espèces"}</span>
            </div>
            {sponsorInfo?.isEligible && (
              <div className="flex justify-between">
                <span className="text-white/50">Parrain :</span>
                <span className="font-medium text-[#4ECDC4]">@{sponsorInfo.username}</span>
              </div>
            )}
            <hr className="border-white/10 my-2" />
            <div className="flex justify-between">
              <span className="text-white/50">Total à payer :</span>
              <span className="font-bold text-[#4ECDC4] text-lg">{SUBSCRIPTION_PACKS[selectedPack].price}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">OTK Coins Pack :</span>
              <span className="font-bold text-[#FF6B6B]">+{SUBSCRIPTION_PACKS[selectedPack].otkBonus.toLocaleString()}</span>
            </div>
            {sponsorInfo?.isEligible && (
              <div className="flex justify-between">
                <span className="text-white/50">Bonus Parrainage :</span>
                <span className="font-bold text-[#FF6B6B]">+200</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
