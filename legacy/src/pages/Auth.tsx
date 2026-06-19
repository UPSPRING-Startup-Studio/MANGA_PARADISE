import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Mail, Lock, User, ArrowRight, AlertCircle, Building2, Handshake, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type AuthMode = "login" | "signup" | "partner";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") as AuthMode || "login";
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Partner fields
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [contactName, setContactName] = useState("");
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  
  // Parallax effect for mascots
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Calculate offset from center (-1 to 1)
      const offsetX = (clientX - centerX) / centerX;
      const offsetY = (clientY - centerY) / centerY;
      
      setMousePosition({ x: offsetX, y: offsetY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    // If already logged in, redirect based on role.
    // IMPORTANT: for partner signup flow, we must NOT auto-redirect before we finished setting partner role/status.
    if (user && mode !== "partner" && !partnerSubmitted) {
      navigate("/");
    }
  }, [user, navigate, partnerSubmitted, mode]);

  useEffect(() => {
    const modeParam = searchParams.get("mode") as AuthMode;
    if (modeParam && ["login", "signup", "partner"].includes(modeParam)) {
      setMode(modeParam);
    }
  }, [searchParams]);

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            setError("Email ou mot de passe incorrect");
          } else {
            setError(error.message);
          }
        } else {
          toast.success("Connexion réussie !");
          // Redirect will be handled by useEffect
        }
      } else {
        if (!username.trim()) {
          setError("Le pseudo est requis");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Le mot de passe doit contenir au moins 6 caractères");
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes("already registered")) {
            setError("Cet email est déjà utilisé");
          } else {
            setError(error.message);
          }
        } else {
          toast.success("Bienvenue dans la communauté ! 🎉 Vous avez reçu 100 OTK Coins !");
          navigate("/onboarding");
        }
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const { error, redirected } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (redirected) {
        return;
      }

      if (error) {
        setError("Erreur lors de la connexion avec Google");
        console.error("Google sign in error:", error);
      } else {
        toast.success("Connexion réussie !");
      }
    } catch (err) {
      console.error("Google sign in error:", err);
      setError("Une erreur est survenue avec Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!companyName.trim()) {
      setError("Le nom de la structure est requis");
      return;
    }
    if (!contactName.trim()) {
      setError("Le nom du contact est requis");
      return;
    }
    
    // Strict email validation for professional email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer un email professionnel valide");
      return;
    }
    
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: companyName.toLowerCase().replace(/\s+/g, "_"),
            display_name: companyName,
          }
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("Cet email est déjà utilisé");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Update profile with partner info
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            partner_company_name: companyName.trim(),
            partner_siret: siret.trim() || null,
            partner_contact_name: contactName.trim(),
            partner_status: "pending",
            role_function: "partner",
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
          setError("Impossible d'enregistrer les informations partenaire. Réessaie dans quelques instants.");
          return;
        }

        // Add partner role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "partner" as any,
        });

        if (roleError) {
          console.error("Role insert error:", roleError);
          setError("Impossible d'attribuer le rôle partenaire. Contacte le support si le problème persiste.");
          return;
        }

        // Ensure routing checks see the new role immediately
        await queryClient.invalidateQueries({
          queryKey: ["user-is-partner", authData.user.id],
        });

        setPartnerSubmitted(true);
      }
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (partnerSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-indigo-900/20"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md text-center"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Handshake className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="font-display text-2xl mb-4">Demande envoyée !</h1>
            
            <p className="text-muted-foreground mb-6">
              Votre demande est en cours d'examen par notre Bureau. 
              Vous recevrez une notification une fois l'accès validé.
            </p>
            
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-6">
              <p className="text-sm">
                <strong>Structure :</strong> {companyName}<br/>
                <strong>Contact :</strong> {contactName}<br/>
                <strong>Email :</strong> {email}
              </p>
            </div>
            
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Accéder à l'accueil partenaire
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Calculate parallax transforms with increased amplitude
  const aikoTransform = {
    x: mousePosition.x * -30,
    y: mousePosition.y * -15,
  };
  const sakuraTransform = {
    x: mousePosition.x * 30,
    y: mousePosition.y * -15,
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Immersive Background - Different for each mode */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: mode === "partner" 
            ? "url('https://res.cloudinary.com/dkw8snibz/image/upload/v1753258636/Cap-Manga-WEB-3_xamtvc.jpg')"
            : "url('https://res.cloudinary.com/dkw8snibz/image/upload/v1753049615/_DSC5347_lpfqzd.jpg')" 
        }}
      />
      {/* Dark overlay with blur effect */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[1]" />
      
      {/* Guardian Mascots - Member Mode (Naruto/Nezuko) */}
      {mode !== "partner" && (
        <>
          <img
            src="https://res.cloudinary.com/dkw8snibz/image/upload/v1768039948/Manga_Paradise_-_Mascotte_Aiko_Naruto_PNG_s7tvvo.png"
            alt="Aiko Mascotte"
            className="hidden lg:block fixed bottom-0 left-0 h-[80vh] object-contain pointer-events-none select-none z-[5] opacity-90"
            style={{
              transform: `translate(${aikoTransform.x}px, ${aikoTransform.y}px)`,
              transition: "transform 0.15s ease-out",
            }}
          />
          <img
            src="https://res.cloudinary.com/dkw8snibz/image/upload/v1768039964/Manga_Paradise_-_Mascotte_Sakura_Nezuko_Demon_Slayer_PNG_xdqafv.png"
            alt="Sakura Mascotte"
            className="hidden lg:block fixed bottom-0 right-0 h-[80vh] object-contain pointer-events-none select-none z-[5] opacity-90"
            style={{
              transform: `translate(${sakuraTransform.x}px, ${sakuraTransform.y}px)`,
              transition: "transform 0.15s ease-out",
            }}
          />
        </>
      )}
      
      {/* Guardian Mascots - Partner Mode (Pokémon/SNK) */}
      {mode === "partner" && (
        <>
          <img
            src="https://res.cloudinary.com/dkw8snibz/image/upload/v1768040873/Manga_Paradise_-_Mascotte_Aiko_Pokemon_Mix_PNG_crpnnv.png"
            alt="Aiko Pokémon Mascotte"
            className="hidden lg:block fixed bottom-0 left-0 h-[80vh] object-contain pointer-events-none select-none z-[5] opacity-90"
            style={{
              transform: `translate(${aikoTransform.x}px, ${aikoTransform.y}px)`,
              transition: "transform 0.15s ease-out",
            }}
          />
          <img
            src="https://res.cloudinary.com/dkw8snibz/image/upload/v1768040837/Manga_Paradise_-_Mascotte_Sakura_SNK_PNG_ww9vid.png"
            alt="Sakura SNK Mascotte"
            className="hidden lg:block fixed bottom-0 right-0 h-[80vh] object-contain pointer-events-none select-none z-[5] opacity-90"
            style={{
              transform: `translate(${sakuraTransform.x}px, ${sakuraTransform.y}px)`,
              transition: "transform 0.15s ease-out",
            }}
          />
        </>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={mode}
        className="relative z-20 w-full max-w-md"
      >
        {/* Logo with Official Brand Image */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          {mode === "partner" ? (
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)]">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          ) : (
            <img 
              src="https://res.cloudinary.com/dkw8snibz/image/upload/v1768039878/Logo_Manga_paradise-03_de5vg4.png"
              alt="Manga Paradise Logo"
              className="h-12 w-auto object-contain drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]"
            />
          )}
          <span className="font-display text-4xl text-white drop-shadow-lg">
            {mode === "partner" ? "Espace Pro" : "Manga Paradise"}
          </span>
        </Link>

        {/* Glassmorphism Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <h1 className="font-display text-3xl text-center mb-2 text-white">
            {mode === "login" ? "Connexion" : mode === "signup" ? "Inscription" : "Devenir Partenaire"}
          </h1>
          <p className="text-white/70 text-center mb-6">
            {mode === "login" 
              ? "Content de te revoir, Nakama !" 
              : mode === "signup"
              ? "Rejoins la communauté et gagne des OTK Coins !"
              : "Entreprises & Institutions : Collaborez avec nous"
            }
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/20 border border-red-400/40 rounded-xl text-red-200 text-sm backdrop-blur-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {mode === "partner" ? (
            <form onSubmit={handlePartnerSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-white/90">Nom de la Structure *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Société, Association, Mairie..."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siret" className="text-white/90">SIRET (Facultatif)</Label>
                <Input
                  id="siret"
                  type="text"
                  placeholder="XXX XXX XXX XXXXX"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  maxLength={17}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-white/90">Contact (Nom / Prénom) *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="contactName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">Email Professionnel *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 hover:from-purple-400 hover:via-purple-500 hover:to-indigo-500 text-white font-semibold shadow-[0_4px_20px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_30px_rgba(139,92,246,0.6)] hover:-translate-y-0.5 transition-all duration-300"
                disabled={loading}
              >
                {loading ? "Envoi en cours..." : "Soumettre ma demande"}
                <ArrowRight size={18} />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/90">Pseudo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ton pseudo unique"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ton@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-to-r from-pink-500 via-primary to-orange-400 hover:from-pink-400 hover:via-pink-500 hover:to-orange-300 text-white font-bold text-lg shadow-[0_4px_25px_rgba(236,72,153,0.5)] hover:shadow-[0_8px_35px_rgba(236,72,153,0.7)] hover:-translate-y-1 transition-all duration-300"
                disabled={loading || googleLoading}
              >
                {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
                <ArrowRight size={18} />
              </Button>

              <div className="relative my-4">
                <Separator className="bg-white/20" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm px-3 text-xs text-white/60">
                  ou
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full bg-white/10 border-white/30 hover:bg-white/20 hover:border-white/50 text-white font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {googleLoading ? "Connexion..." : "Continuer avec Google"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center space-y-3">
            {mode === "partner" ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                ← Retour à la connexion membre
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setError("");
                  }}
                  className="text-sm text-white/70 hover:text-white transition-colors block w-full"
                >
                  {mode === "login" 
                    ? "Pas encore membre ? Inscris-toi !" 
                    : "Déjà membre ? Connecte-toi !"
                  }
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("partner");
                    setError("");
                  }}
                  className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                >
                  Vous êtes un professionnel ? Espace Pro →
                </button>
              </>
            )}
          </div>

          {mode === "signup" && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                🎁 <span className="text-accent font-semibold">Bonus de bienvenue : 100 OTK Coins</span> offerts à l'inscription !
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          En créant un compte, tu acceptes nos{" "}
          <Link to="/cgv" className="text-primary hover:underline">CGV</Link>
          {" "}et notre{" "}
          <Link to="/confidentialite" className="text-primary hover:underline">Politique de confidentialité</Link>.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
