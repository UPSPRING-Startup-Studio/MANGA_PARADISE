/**
 * Step 4: Billetterie & Tarifs
 * 
 * Gratuit/payant, tarif principal, tarif membre, pass multi-jours,
 * politique de remboursement, moyens de paiement, message de confirmation.
 */

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Euro, Ticket, Home, ExternalLink, CreditCard, Banknote, Smartphone, Gift, MessageSquare, RefreshCcw, CalendarDays,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INPUT_STYLES,
  type EventWizardFormData,
  type TicketingMode,
} from "../eventFormTypes";

// Redefine locally since this is the same type
type LocalTicketingMode = "internal" | "external";

interface StepTicketingProps {
  formData: EventWizardFormData;
  onChange: (updates: Partial<EventWizardFormData>) => void;
}

const PAYMENT_METHODS = [
  { id: "cb", label: "Carte bancaire", icon: CreditCard },
  { id: "especes", label: "Espèces", icon: Banknote },
  { id: "paypal", label: "PayPal", icon: Smartphone },
  { id: "lydia", label: "Lydia / Sumup", icon: Smartphone },
  { id: "virement", label: "Virement", icon: Banknote },
  { id: "gratuit", label: "Gratuit / Libre", icon: Gift },
];

const StepTicketing = ({ formData, onChange }: StepTicketingProps) => {
  const togglePaymentMethod = (method: string) => {
    const current = formData.payment_methods;
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    onChange({ payment_methods: updated });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Ticketing Mode */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Ticket className="w-4 h-4 text-sakura" />
          Type de billetterie
        </Label>
        <RadioGroup
          value={formData.ticketing_mode}
          onValueChange={(value: string) =>
            onChange({
              ticketing_mode: value as LocalTicketingMode,
              external_link: value === "internal" ? "" : formData.external_link,
            })
          }
          className="space-y-2"
        >
          {/* Internal */}
          <label
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
              formData.ticketing_mode === "internal"
                ? "border-sakura bg-sakura/10"
                : "border-muted hover:border-sakura/50"
            )}
          >
            <RadioGroupItem value="internal" className="mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-sakura" />
                <span className="font-medium text-sm">Billetterie Manga Paradise</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Inscription gérée directement dans l'application
              </p>
            </div>
          </label>

          {/* External */}
          <label
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
              formData.ticketing_mode === "external"
                ? "border-sakura bg-sakura/10"
                : "border-muted hover:border-sakura/50"
            )}
          >
            <RadioGroupItem value="external" className="mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-sm">Billetterie Externe / Hybride</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Inscription sur site tiers + Tracking social interne
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* External Link (conditional) */}
      {formData.ticketing_mode === "external" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2 pl-4 border-l-2 border-cyan-400/50"
        >
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Lien de la billetterie officielle *
          </Label>
          <Input
            type="url"
            value={formData.external_link}
            onChange={(e) => onChange({ external_link: e.target.value })}
            placeholder="https://www.billeterie-officielle.fr/event"
            className={cn(INPUT_STYLES, !formData.external_link && "border-destructive/50")}
          />
        </motion.div>
      )}

      {/* Price Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Euro className="w-4 h-4 text-sakura" />
            Tarification
          </Label>
          <div className="flex items-center gap-3">
            <span className={cn("text-xs", formData.is_free && "text-sakura font-medium")}>Gratuit</span>
            <Switch
              checked={!formData.is_free}
              onCheckedChange={(checked) =>
                onChange({ is_free: !checked, price_amount: "", member_price_amount: "" })
              }
            />
            <span className={cn("text-xs", !formData.is_free && "text-sakura font-medium")}>Payant</span>
          </div>
        </div>

        {!formData.is_free && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4"
          >
            {/* Main Price */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tarif principal</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.price_amount}
                  onChange={(e) => onChange({ price_amount: e.target.value })}
                  placeholder="15"
                  className={`w-32 ${INPUT_STYLES}`}
                />
                <span className="text-sm text-muted-foreground">EUR</span>
              </div>
            </div>

            {/* Price Label */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Libellé du tarif (optionnel)</Label>
              <Input
                value={formData.price_label}
                onChange={(e) => onChange({ price_label: e.target.value })}
                placeholder="Ex: Entrée générale, Pass journée"
                className={INPUT_STYLES}
              />
            </div>

            {/* Member Price Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-electric-yellow" />
                <div>
                  <p className="font-medium text-sm">Tarif membre</p>
                  <p className="text-xs text-muted-foreground">
                    Prix réduit pour les membres Manga Paradise
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.has_member_price}
                onCheckedChange={(v) => onChange({ has_member_price: v, member_price_amount: "" })}
              />
            </div>

            {formData.has_member_price && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pl-4 border-l-2 border-electric-yellow/30"
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.member_price_amount}
                    onChange={(e) => onChange({ member_price_amount: e.target.value })}
                    placeholder="10"
                    className={`w-32 ${INPUT_STYLES}`}
                  />
                  <span className="text-sm text-muted-foreground">EUR (membres)</span>
                </div>
              </motion.div>
            )}

            {/* Multi-day Pass Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-turquoise" />
                <div>
                  <p className="font-medium text-sm">Pass multi-jours</p>
                  <p className="text-xs text-muted-foreground">
                    Prix spécial pour l'ensemble du festival
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.has_multi_day_pass}
                onCheckedChange={(v) => onChange({ has_multi_day_pass: v, multi_day_pass_price: "" })}
              />
            </div>

            {formData.has_multi_day_pass && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pl-4 border-l-2 border-turquoise/30"
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.multi_day_pass_price}
                    onChange={(e) => onChange({ multi_day_pass_price: e.target.value })}
                    placeholder="25"
                    className={`w-32 ${INPUT_STYLES}`}
                  />
                  <span className="text-sm text-muted-foreground">EUR (pass complet)</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </Card>

      {/* Payment Methods */}
      {!formData.is_free && (
        <Card className="p-4">
          <Label className="flex items-center gap-2 mb-3 text-sm font-medium">
            <CreditCard className="w-4 h-4 text-sakura" />
            Moyens de paiement acceptés
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isChecked = formData.payment_methods.includes(method.id);
              return (
                <label
                  key={method.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm",
                    isChecked
                      ? "border-sakura/30 bg-sakura/5"
                      : "border-border hover:bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => togglePaymentMethod(method.id)}
                    className="data-[state=checked]:bg-sakura data-[state=checked]:border-sakura"
                  />
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">{method.label}</span>
                </label>
              );
            })}
          </div>
        </Card>
      )}

      {/* Refund Policy */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-muted-foreground" />
          Politique de remboursement (optionnel)
        </Label>
        <Textarea
          value={formData.refund_policy}
          onChange={(e) => onChange({ refund_policy: e.target.value })}
          placeholder="Ex: Remboursement intégral jusqu'à 7 jours avant l'événement..."
          rows={2}
          className={`resize-none ${INPUT_STYLES}`}
        />
      </div>

      {/* Confirmation Message */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-turquoise" />
          Message de confirmation (optionnel)
        </Label>
        <Textarea
          value={formData.confirmation_message}
          onChange={(e) => onChange({ confirmation_message: e.target.value })}
          placeholder="Message affiché après inscription. Ex: Bienvenue nakama ! N'oublie pas ton cosplay..."
          rows={2}
          className={`resize-none ${INPUT_STYLES}`}
        />
      </div>
    </motion.div>
  );
};

export default StepTicketing;
