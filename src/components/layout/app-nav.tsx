"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRole } from "@/features/auth/hooks/use-role";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const BASE_LINKS = [
  { href: "/espace-membre", label: "Espace membre" },
  { href: "/profil", label: "Profil" },
  { href: "/agenda", label: "Agenda" },
  { href: "/cosplay", label: "Cosplay" },
  { href: "/communaute", label: "Communauté" },
  { href: "/mes-amis", label: "Nakamas" },
  { href: "/annuaire", label: "Annuaire" },
] as const;

/**
 * Navigation de l'espace connecté, **responsive** :
 * - ≥ md : liens en ligne + déconnexion.
 * - < md : bouton hamburger + panneau déroulant plein largeur.
 * Rôle-aware (Pro/Admin) ; purement cosmétique (RLS + gardes serveur protègent).
 */
export function AppNav() {
  const { isStaff, has } = useRole();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const links = [
    ...BASE_LINKS,
    ...(has(["admin", "partner"]) ? [{ href: "/pro", label: "Pro" }] : []),
    ...(isStaff ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  function doSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "transition-colors",
              l.label === "Admin"
                ? "text-mp-primary hover:text-mp-coral"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        ))}
        <button
          type="button"
          disabled={pending}
          onClick={doSignOut}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Déconnexion
        </button>
      </nav>

      {/* Mobile : bouton */}
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="text-foreground grid size-10 place-items-center md:hidden"
      >
        {open ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Mobile : panneau */}
      {open && (
        <div className="border-border bg-card absolute inset-x-0 top-14 z-50 flex flex-col gap-1 border-b p-3 shadow-lg md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="hover:bg-muted rounded-lg px-3 py-2.5 text-sm font-medium"
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={doSignOut}
            className="text-muted-foreground hover:bg-muted rounded-lg px-3 py-2.5 text-left text-sm font-medium"
          >
            Déconnexion
          </button>
        </div>
      )}
    </>
  );
}
