import type { Metadata } from "next";
import {
  LegalLayout,
  type LegalSection,
} from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment Manga Paradise collecte, utilise et protège vos données personnelles.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Responsable du traitement",
    paragraphs: [
      "Le responsable du traitement des données est l'association Manga Paradise (loi 1901), Nice (06). Pour toute question relative à vos données, contactez : contact@manga-paradise.fr.",
    ],
  },
  {
    heading: "Données que nous collectons",
    paragraphs: [
      "Nous collectons uniquement les données nécessaires au fonctionnement du service :",
    ],
    list: [
      "Données de compte : adresse e-mail et mot de passe (stocké de façon chiffrée).",
      "Données de profil : pseudonyme, prénom et nom (facultatifs), date de naissance, ville, avatar, centres d'intérêt.",
      "Contenus que vous publiez : publications, photos de cosplay, commentaires, participations aux événements, relations (Nakamas).",
      "Données techniques : journaux de connexion et cookies strictement nécessaires à l'authentification.",
    ],
  },
  {
    heading: "Finalités",
    paragraphs: ["Vos données sont utilisées pour :"],
    list: [
      "Créer et gérer votre compte et votre profil.",
      "Faire fonctionner la communauté (feed, annuaire, Nakamas, cosplay).",
      "Organiser et gérer la participation aux événements.",
      "Animer la gamification (XP, badges, OTK).",
      "Assurer la sécurité du service et prévenir les abus.",
    ],
  },
  {
    heading: "Base légale",
    paragraphs: [
      "Les traitements reposent sur l'exécution du contrat (acceptation des CGU) pour le fonctionnement du service, sur votre consentement pour les données facultatives, et sur l'intérêt légitime de l'association pour la sécurité et la prévention de la fraude.",
    ],
  },
  {
    heading: "Durée de conservation",
    paragraphs: [
      "Vos données sont conservées tant que votre compte est actif. En cas de suppression du compte, elles sont effacées ou anonymisées, sous réserve des durées de conservation imposées par la loi. Vous pouvez demander la suppression de votre compte à tout moment.",
    ],
  },
  {
    heading: "Destinataires et sous-traitants",
    paragraphs: [
      "Vos données sont hébergées chez nos sous-traitants techniques : Supabase (base de données) et Vercel (hébergement de l'application). Nous ne vendons ni ne louons vos données personnelles à des tiers.",
    ],
  },
  {
    heading: "Vos droits",
    paragraphs: [
      "Conformément au RGPD, vous disposez des droits suivants, que vous pouvez exercer en écrivant à contact@manga-paradise.fr :",
    ],
    list: [
      "Droit d'accès et de rectification de vos données.",
      "Droit à l'effacement (« droit à l'oubli »).",
      "Droit à la limitation et à l'opposition au traitement.",
      "Droit à la portabilité de vos données.",
      "Droit d'introduire une réclamation auprès de la CNIL (www.cnil.fr).",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: [
      "Le site utilise uniquement des cookies strictement nécessaires à votre authentification et au maintien de votre session. Aucun cookie publicitaire ni traceur tiers à des fins marketing n'est déposé.",
    ],
  },
  {
    heading: "Mineurs",
    paragraphs: [
      "Le service peut être utilisé par des mineurs. L'inscription d'un mineur requiert l'autorisation de son représentant légal, notamment concernant la publication d'images. [Modalités précises de recueil du consentement parental à compléter.]",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Pour toute demande relative à vos données personnelles : contact@manga-paradise.fr.",
    ],
  },
];

export default function ConfidentialitePage() {
  return (
    <LegalLayout
      eyebrow="Vos données"
      title="Politique de confidentialité"
      updated="19 juin 2026"
      intro="Cette politique explique quelles données personnelles nous collectons, pourquoi, et comment vous gardez le contrôle dessus."
      sections={SECTIONS}
    />
  );
}
