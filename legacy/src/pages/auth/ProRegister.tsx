import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Lock, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
// Import pour l'animation
import { motion, useMotionValue, useTransform } from "framer-motion";

const ProRegister = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  // --- Configuration de l'animation souris (Parallaxe) ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Amplitude de mouvement (±30px)
  const moveX = useTransform(x, [0, window.innerWidth], [-30, 30]);
  const moveY = useTransform(y, [0, window.innerHeight], [-30, 30]);
  const rotateX = useTransform(y, [0, window.innerHeight], [3, -3]);
  const rotateY = useTransform(x, [0, window.innerWidth], [-3, 3]);

  const handleMouseMove = (event: React.MouseEvent) => {
    x.set(event.clientX);
    y.set(event.clientY);
  };
  // -------------------------------------------------------

  const [formData, setFormData] = useState({
    structureName: "",
    siret: "",
    contactName: "",
    email: "",
    password: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });
        if (error) throw error;
        navigate("/pro/portal");
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.structureName,
              role: 'pro',
            },
          },
        });
        if (error) throw error;
        toast.success("Demande envoyée ! Vérifiez vos emails.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950 perspective-1000"
      onMouseMove={handleMouseMove}
    >
      
      {/* --- BACKGROUND --- */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-110"
        style={{ backgroundImage: "url('https://res.cloudinary.com/dkw8snibz/image/upload/v1752930059/AD9O0085_fddrbk.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"></div>
      </div>

      {/* --- MASCOTTE GAUCHE (Aiko) - POSITION CORRIGÉE --- */}
      {/* left-0 : Collé au bord gauche | top-1/2 -translate-y-1/2 : Centré verticalement */}
      <motion.div 
        style={{ x: moveX, y: moveY, rotateX, rotateY }}
        className="hidden xl:block absolute left-0 top-1/2 -translate-y-1/2 z-10 w-[800px] pointer-events-none"
      >
         <img 
           src="https://res.cloudinary.com/dkw8snibz/image/upload/v1768040873/Manga_Paradise_-_Mascotte_Aiko_Pokemon_Mix_PNG_crpnnv.png" 
           alt="Mascotte Aiko" 
           className="w-full h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
         />
      </motion.div>

      {/* --- MASCOTTE DROITE (Sakura) - POSITION CORRIGÉE --- */}
       {/* right-0 : Collé au bord droit | top-1/2 -translate-y-1/2 : Centré verticalement */}
      <motion.div 
        style={{ x: moveX, y: moveY, rotateX: rotateX, rotateY: rotateY }}
        className="hidden xl:block absolute right-0 top-1/2 -translate-y-1/2 z-10 w-[850px] pointer-events-none"
      >
         <img 
           src="https://res.cloudinary.com/dkw8snibz/image/upload/v1768040837/Manga_Paradise_-_Mascotte_Sakura_SNK_PNG_ww9vid.png" 
           alt="Mascotte Sakura" 
           className="w-full h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
         />
      </motion.div>

      {/* --- CARD CENTRALE --- */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.7)] relative z-20 animate-in zoom-in duration-500">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10 mb-4 backdrop-blur-sm">
             <Building2 size={16} className="text-white mr-2" />
             <span className="text-white font-semibold text-xs tracking-wider uppercase">Espace Pro</span>
          </div>
          
          <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-lg font-display">
            {isLoginMode ? "CONNEXION" : "DEVENIR PARTENAIRE"}
          </h1>
          <p className="text-slate-200 text-sm mt-2 font-medium">
            {isLoginMode ? "Content de te revoir, Nakama !" : "Entreprises & Institutions : Rejoignez l'aventure"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLoginMode && (
            <>
              <div className="space-y-1">
                <Label htmlFor="structureName" className="text-xs font-bold text-slate-300 uppercase ml-1">Nom de la structure *</Label>
                <div className="relative group">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-mp-ink-muted group-focus-within:text-purple-400 transition-colors" />
                  <Input id="structureName" name="structureName" placeholder="Société..." className="pl-10 bg-black/40 border-white/10 text-white focus:border-purple-500 rounded-xl h-11" onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="siret" className="text-xs font-bold text-slate-300 uppercase ml-1">SIRET (Obligatoire)</Label>
                <div className="relative group">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-mp-ink-muted group-focus-within:text-purple-400 transition-colors" />
                  <Input id="siret" name="siret" placeholder="XXX..." className="pl-10 bg-black/40 border-white/10 text-white focus:border-purple-500 rounded-xl h-11" onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactName" className="text-xs font-bold text-slate-300 uppercase ml-1">Contact *</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-mp-ink-muted group-focus-within:text-purple-400 transition-colors" />
                  <Input id="contactName" name="contactName" placeholder="Nom Prénom" className="pl-10 bg-black/40 border-white/10 text-white focus:border-purple-500 rounded-xl h-11" onChange={handleInputChange} required />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-bold text-slate-300 uppercase ml-1">Email Professionnel *</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-mp-ink-muted group-focus-within:text-purple-400 transition-colors" />
              <Input id="email" type="email" name="email" placeholder="contact@pro.com" className="pl-10 bg-black/40 border-white/10 text-white focus:border-purple-500 rounded-xl h-11" onChange={handleInputChange} required />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-bold text-slate-300 uppercase ml-1">Mot de passe *</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-mp-ink-muted group-focus-within:text-purple-400 transition-colors" />
              <Input id="password" type="password" name="password" placeholder="••••••••" className="pl-10 bg-black/40 border-white/10 text-white focus:border-purple-500 rounded-xl h-11" onChange={handleInputChange} required />
            </div>
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-purple-900/40 border border-white/10 mt-2 transform hover:scale-[1.02] transition-all" disabled={isLoading}>
            {isLoading ? "Chargement..." : (isLoginMode ? "Se connecter →" : "Soumettre ma demande →")}
          </Button>

        </form>

        <div className="mt-6 text-center space-y-4">
            <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm text-slate-300 hover:text-white transition-colors">
                {isLoginMode ? (
                    <>Pas encore partenaire ? <span className="text-purple-400 font-bold hover:underline ml-1">Faire une demande</span></>
                ) : (
                    <>Vous avez déjà un compte ? <span className="text-purple-400 font-bold hover:underline ml-1">Se connecter</span></>
                )}
            </button>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <Link to="/gateway" className="inline-flex items-center text-xs text-mp-ink-muted hover:text-white transition-colors uppercase tracking-widest font-bold opacity-70 hover:opacity-100">
                <ArrowLeft className="mr-2 h-3 w-3" />
                Retour au choix du profil
            </Link>
        </div>

      </div>
    </div>
  );
};

export default ProRegister;