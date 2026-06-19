import type { Metadata } from "next";
import {
  LegalLayout,
  type LegalSection,
} from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Manga Paradise.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Éditeur du site",
    paragraphs: [
      "Le présent site est édité par l'association Manga Paradise, association à but non lucratif régie par la loi du 1er juillet 1901, fondée en 2020 et dont le siège social est situé à Nice, Alpes-Maritimes (06) — [Adresse postale complète à compléter].",
      "Numéro RNA : [À COMPLÉTER] — Numéro SIRET (le cas échéant) : [À COMPLÉTER].",
      "Directeur / Directrice de la publication : [Nom du·de la président·e à compléter].",
      "Contact : contact@manga-paradise.fr — 06 82 62 45 35 — www.manga-paradise.fr.",
    ],
  },
  {
    heading: "Hébergement",
    paragraphs: [
      "L'application est hébergée par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis (vercel.com).",
      "Les données applicatives sont hébergées via Supabase (Supabase Inc.), prestataire d'infrastructure de base de données — région d'hébergement : [À COMPLÉTER].",
    ],
  },
  {
    heading: "Propriété intellectuelle",
    paragraphs: [
      "L'ensemble des éléments du site (textes, visuels, logos, marque « Manga Paradise », interfaces, code) est protégé par le droit de la propriété intellectuelle et reste la propriété exclusive de l'association ou de ses partenaires, sauf mention contraire.",
      "Toute reproduction, représentation ou réutilisation, totale ou partielle, sans autorisation écrite préalable, est interdite et susceptible de constituer une contrefaçon.",
      "Les contenus publiés par les membres (photos de cosplay, publications, commentaires) restent la propriété de leurs auteurs, qui en concèdent à l'association un droit d'usage dans le cadre du fonctionnement du service.",
    ],
  },
  {
    heading: "Liens hypertextes",
    paragraphs: [
      "Le site peut contenir des liens vers des sites tiers. L'association n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou à l'usage qui pourrait en être fait.",
    ],
  },
  {
    heading: "Responsabilité",
    paragraphs: [
      "L'association s'efforce d'assurer l'exactitude des informations diffusées et le bon fonctionnement du service, sans toutefois garantir l'absence d'erreurs ou d'interruptions. Sa responsabilité ne saurait être engagée pour tout dommage résultant de l'utilisation du site.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Pour toute question relative aux présentes mentions légales, vous pouvez écrire à contact@manga-paradise.fr.",
    ],
  },
];

export default function MentionsLegalesPage() {
  return (
    <LegalLayout
      eyebrow="Informations légales"
      title="Mentions légales"
      updated="19 juin 2026"
      sections={SECTIONS}
    />
  );
}
