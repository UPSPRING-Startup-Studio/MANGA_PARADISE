import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BetaGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | locked | unlocked
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Vérifie côté serveur si le cookie est valide
  useEffect(() => {
    // En développement local, on bypasse le BetaGate
    if (import.meta.env.DEV) {
      setStatus("unlocked");
      return;
    }

    fetch("/api/beta-check")
      .then((r) => r.json())
      .then((data) => setStatus(data.authenticated ? "unlocked" : "locked"))
      .catch(() => setStatus("locked"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/beta-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: input }),
    });

    if (res.ok) {
      setStatus("unlocked");
    } else {
      setError(true);
    }
    setLoading(false);
  };

  // Chargement initial
  if (status === "checking") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // App déverrouillée
  if (status === "unlocked") return children;

  // Page de protection bêta
  return (
    <div className="beta-gate-root flex items-center justify-center relative overflow-hidden">
      {/* Ambiance visuelle */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-950/40 via-gray-950 to-cyan-950/40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl mb-4 inline-block"
            >
              ⛩️
            </motion.div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Manga Paradise
            </h1>
            <p className="text-gray-500 text-sm mt-1 tracking-widest uppercase">
              Nice · Japon de cœur
            </p>

            {/* Badge bêta */}
            <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/10 to-cyan-500/10 border border-pink-500/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
              <span className="text-pink-300 text-xs font-semibold tracking-wider">
                BÊTA PRIVÉE · ACCÈS RESTREINT
              </span>
            </div>
          </div>

          {/* Message */}
          <p className="text-gray-400 text-center text-sm leading-relaxed mb-6">
            La plateforme est en phase de test privé.<br />
            Entre le mot de passe transmis par l'équipe pour rejoindre l'aventure. 🌸
          </p>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(false); }}
                placeholder="••••••••••••"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition-all ${
                  error
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                }`}
                autoFocus
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  ❌ Mot de passe incorrect — contacte l'équipe Manga Paradise
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full relative overflow-hidden bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-pink-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Vérification...
                </span>
              ) : (
                "Entrer dans le Paradis ✨"
              )}
            </button>
          </form>

          <p className="text-gray-700 text-xs text-center mt-6">
            Manga Paradise © 2025
          </p>
        </div>
      </motion.div>
    </div>
  );
}