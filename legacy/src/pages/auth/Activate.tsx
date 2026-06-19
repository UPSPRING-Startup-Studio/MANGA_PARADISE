import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Check, X, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Password validation rules
// ──────────────────────────────────────────────

const PASSWORD_RULES = [
  { label: "Minimum 8 caractères", test: (p: string) => p.length >= 8 },
  { label: "Au moins 1 majuscule", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Au moins 1 chiffre", test: (p: string) => /[0-9]/.test(p) },
];

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

const Activate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Vérifier la session (le lien d'invitation de Supabase Auth crée une session)
  useEffect(() => {
    const checkSession = async () => {
      setChecking(true);

      // Supabase Auth gère le hash fragment (#access_token=...) automatiquement
      // via onAuthStateChange. On attend un court instant pour que le client
      // traite le token.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError("Ce lien d'activation n'est plus valide ou a expiré.");
        setChecking(false);
        return;
      }

      if (session?.user) {
        setUserEmail(session.user.email || null);
        const meta = session.user.user_metadata;
        if (meta?.prenom || meta?.nom) {
          setUserName([meta.prenom, meta.nom].filter(Boolean).join(" "));
        }
        setChecking(false);
        return;
      }

      // Pas de session immédiate — attendre le callback Auth
      const timeout = setTimeout(() => {
        setError("Ce lien d'activation n'est plus valide. Demande une nouvelle invitation.");
        setChecking(false);
      }, 5000);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY" || event === "USER_UPDATED") {
            clearTimeout(timeout);
            if (newSession?.user) {
              setUserEmail(newSession.user.email || null);
              const meta = newSession.user.user_metadata;
              if (meta?.prenom || meta?.nom) {
                setUserName([meta.prenom, meta.nom].filter(Boolean).join(" "));
              }
            }
            setChecking(false);
          }
        }
      );

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    };

    checkSession();
  }, []);

  // Validation
  const allRulesPassed = useMemo(
    () => PASSWORD_RULES.every((r) => r.test(password)),
    [password]
  );
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesPassed && passwordsMatch && !loading;

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        if (updateError.message.includes("weak")) {
          setError("Le mot de passe est trop faible. Choisis-en un plus robuste.");
        } else {
          setError("Une erreur est survenue pendant l'activation du compte.");
        }
        setLoading(false);
        return;
      }

      // Synchroniser le profil avec les métadonnées de l'invitation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata;

        // Préremplir le profil si les champs sont vides
        const updates: Record<string, any> = {};
        if (meta?.prenom) updates.first_name = meta.prenom;
        if (meta?.nom) updates.last_name = meta.nom;
        if (meta?.prenom && meta?.nom) {
          updates.display_name = `${meta.prenom} ${meta.nom}`;
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id);
        }

        // Accepter l'invitation association si invitation_id est dans les métadonnées
        if (meta?.invitation_id) {
          try {
            await supabase.rpc("accept_association_invitation", {
              p_invitation_id: meta.invitation_id,
            });
          } catch {
            // Non bloquant — l'invitation pourra être acceptée manuellement
          }
        }
      }

      setSuccess(true);
      toast.success("Mot de passe défini. Bienvenue dans Manga Paradise !");

      // Redirection après un court délai
      setTimeout(() => {
        navigate("/onboarding");
      }, 2000);
    } catch {
      setError("Une erreur inattendue est survenue.");
      setLoading(false);
    }
  };

  // ── Loading state ──
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-10 h-10 animate-spin text-[#E84A2B] mx-auto" />
          <p className="text-mp-ink-muted text-sm">Vérification de ton invitation...</p>
        </motion.div>
      </div>
    );
  }

  // ── Error state (lien invalide/expiré) ──
  if (error && !userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-display text-slate-50">
            Lien d'activation invalide
          </h1>
          <p className="text-mp-ink-muted">
            {error}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/auth")}
              className="w-full bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] text-white"
            >
              Aller à la connexion
            </Button>
            <p className="text-xs text-mp-ink-muted">
              Besoin d'aide ? Contacte l'association qui t'a invité.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"
          >
            <Check className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h1 className="text-2xl font-display text-slate-50">
            Bienvenue dans Manga Paradise !
          </h1>
          <p className="text-mp-ink-muted">
            Ton compte est activé. Redirection en cours...
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-[#E84A2B] mx-auto" />
        </motion.div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8 space-y-6"
          style={{
            background: "rgba(26,26,46,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Logo */}
          <div className="text-center">
            <img
              src="https://res.cloudinary.com/dkw8snibz/image/upload/v1768062945/Logo_Manga_Paradise_VIERGE_xhahrh.png"
              alt="Manga Paradise"
              className="h-12 mx-auto mb-4"
            />
            <h1 className="text-2xl font-display text-slate-50">
              Active ton compte
            </h1>
            <p className="text-mp-ink-muted text-sm mt-2">
              {userName
                ? `Bienvenue ${userName} ! Choisis ton mot de passe pour rejoindre Manga Paradise.`
                : "Ton compte a été reconnu. Choisis maintenant ton mot de passe."}
            </p>
            {userEmail && (
              <p className="text-xs text-mp-ink-muted mt-1">{userEmail}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-ink-muted" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choisis un mot de passe sécurisé"
                  className="pl-9 pr-10 bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mp-ink-muted hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password rules */}
            <div className="space-y-1.5">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(password);
                return (
                  <div
                    key={rule.label}
                    className="flex items-center gap-2 text-xs"
                  >
                    {passed ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-mp-ink-muted" />
                    )}
                    <span className={passed ? "text-emerald-400" : "text-mp-ink-muted"}>
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-ink-muted" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme ton mot de passe"
                  className="pl-9 bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B]"
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-[#F5A623]">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-11 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white font-semibold disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Continuer
            </Button>
          </form>

          {/* Help */}
          <p className="text-center text-xs text-mp-ink-muted">
            Besoin d'aide ? Contacte l'association qui t'a invité.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Activate;
