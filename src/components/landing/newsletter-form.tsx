"use client";

import { useState } from "react";
import { Send } from "lucide-react";

/**
 * Inscription newsletter (pied de page). Stub local pour l'instant : à câbler
 * plus tard sur une Server Action + table `newsletter_subscribers` (api/).
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setDone(true);
  }

  if (done) {
    return <p className="text-mp-saffron text-sm">✓ Merci, à bientôt !</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <label htmlFor="footer-newsletter" className="sr-only">
        Adresse e-mail
      </label>
      <input
        id="footer-newsletter"
        type="email"
        required
        placeholder="votre@email.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="focus:border-mp-primary min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
      />
      <button
        type="submit"
        aria-label="S'inscrire à la newsletter"
        className="bg-mp-primary grid size-9 shrink-0 place-items-center rounded-lg text-white transition-opacity hover:opacity-90"
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}
