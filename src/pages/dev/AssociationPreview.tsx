/**
 * ──────────────────────────────────────────────
 * TEMPORAIRE – DEV PREVIEW
 * Route : /dev/association-preview
 *
 * Permet de visualiser la page Membres de l'association
 * SANS passer par le guard AssociationLayout / membership.
 * À SUPPRIMER avant mise en production finale.
 * ──────────────────────────────────────────────
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarDays,
  FileText,
  BookUser,
  Settings,
  ArrowLeft,
  Building2,
  UserPlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const sections = [
  {
    label: "Tableau de bord",
    description: "Vue d'ensemble de l'association",
    href: "/association/dashboard",
    icon: Building2,
    color: "text-[#E84A2B]",
    bgColor: "bg-[#E84A2B]/10",
  },
  {
    label: "Membres",
    description: "Gérer les rôles et les accès des membres",
    href: "/association/membres",
    icon: Users,
    color: "text-[#E84A2B]",
    bgColor: "bg-[#E84A2B]/10",
  },
  {
    label: "Invitations",
    description: "Inviter de nouveaux membres",
    href: "/association/invitations",
    icon: UserPlus,
    color: "text-[#F26B2E]",
    bgColor: "bg-[#F26B2E]/10",
  },
  {
    label: "Événements",
    description: "Événements liés à l'association",
    href: "/association/evenements",
    icon: CalendarDays,
    color: "text-[#F5A623]",
    bgColor: "bg-[#F5A623]/10",
  },
  {
    label: "Annuaire CRM",
    description: "Contacts et partenaires externes",
    href: "/association/contacts",
    icon: BookUser,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
  {
    label: "Documents",
    description: "Suivi documentaire et validation",
    href: "/association/documents",
    icon: FileText,
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
  },
  {
    label: "Paramètres",
    description: "Fiche association et configuration",
    href: "/association/parametres",
    icon: Settings,
    color: "text-mp-ink-muted",
    bgColor: "bg-slate-400/10",
  },
];

const AssociationPreview = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Banner dev */}
        <div className="mb-6 rounded-lg border border-[#E84A2B]/30 bg-[#E84A2B]/5 p-4 text-center">
          <p className="text-sm text-[#E84A2B] font-medium">
            Page de preview dev — Accès rapide au module Association
          </p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display text-foreground mb-2">
            Module Association
          </h1>
          <p className="text-muted-foreground">
            Accède rapidement aux différentes sections du back-office associatif.
            Clique sur une card pour y naviguer.
          </p>
        </div>

        {/* Grid de navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <Link key={section.href} to={section.href}>
              <Card className="h-full bg-[#111827]/60 border-border/50 hover:border-[#E84A2B]/30 hover:bg-[#111827]/80 transition-all cursor-pointer group">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${section.bgColor} group-hover:scale-110 transition-transform`}>
                    <section.icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-[#E84A2B] transition-colors">
                      {section.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Lien retour */}
        <div className="mt-8 text-center">
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AssociationPreview;
