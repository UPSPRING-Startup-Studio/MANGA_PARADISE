import type { Metadata } from "next";
import {
  LegalLayout,
  type LegalSection,
} from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Les règles d'utilisation de la plateforme Manga Paradise.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Objet",
    paragraphs: [
      "Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme communautaire Manga Paradise, éditée par l'association Manga Paradise (loi 1901).",
    ],
  },
  {
    heading: "Acceptation",
    paragraphs: [
      "La création d'un compte et l'utilisation du service impliquent l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.",
    ],
  },
  {
    heading: "Accès au service",
    paragraphs: [
      "L'accès à la communauté nécessite la création d'un compte gratuit. L'association s'efforce d'assurer la disponibilité du service mais ne garantit pas un fonctionnement ininterrompu et peut le faire évoluer ou le suspendre pour maintenance.",
    ],
  },
  {
    heading: "Compte utilisateur",
    paragraphs: [
      "Vous vous engagez à fournir des informations exactes, à préserver la confidentialité de vos identifiants et à ne pas céder votre compte. Chaque personne ne peut détenir qu'un seul compte. L'inscription d'un mineur requiert l'accord de son représentant légal.",
    ],
  },
  {
    heading: "Charte de bonne conduite",
    paragraphs: [
      "En utilisant la plateforme, vous vous engagez à respecter les autres membres et à ne pas publier de contenu :",
    ],
    list: [
      "Illicite, haineux, diffamatoire, harcelant ou discriminatoire.",
      "À caractère violent, pornographique ou inadapté à un public incluant des mineurs.",
      "Portant atteinte au droit à l'image ou aux droits d'autrui.",
      "Constituant du spam, de la publicité non sollicitée ou de l'usurpation d'identité.",
    ],
  },
  {
    heading: "Contenus publiés",
    paragraphs: [
      "Vous restez propriétaire des contenus que vous publiez et garantissez détenir les droits nécessaires à leur diffusion. Vous concédez à l'association une licence non exclusive et gratuite pour héberger et afficher ces contenus dans le cadre du fonctionnement du service.",
      "L'association se réserve le droit de modérer, masquer ou supprimer tout contenu contraire aux présentes CGU, sans préavis.",
    ],
  },
  {
    heading: "Otaku Coins (OTK)",
    paragraphs: [
      "Les Otaku Coins (OTK) sont une monnaie virtuelle interne sans aucune valeur monétaire. Ils ne sont ni convertibles en argent réel, ni remboursables, ni transférables hors de la plateforme, et peuvent être utilisés uniquement au sein des fonctionnalités prévues à cet effet.",
    ],
  },
  {
    heading: "Propriété intellectuelle",
    paragraphs: [
      "La marque, les logos, l'interface et le code de la plateforme sont la propriété de l'association. Toute utilisation non autorisée est interdite. Voir également les mentions légales.",
    ],
  },
  {
    heading: "Responsabilité",
    paragraphs: [
      "Le service est fourni « en l'état ». L'association ne saurait être tenue responsable des contenus publiés par les membres ni des dommages indirects résultant de l'utilisation de la plateforme.",
    ],
  },
  {
    heading: "Suspension et résiliation",
    paragraphs: [
      "En cas de manquement aux présentes CGU, l'association peut suspendre ou supprimer le compte concerné. Vous pouvez à tout moment demander la suppression de votre compte.",
    ],
  },
  {
    heading: "Modification des CGU",
    paragraphs: [
      "Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs sont informés des évolutions substantielles, et la poursuite de l'utilisation du service vaut acceptation de la version mise à jour.",
    ],
  },
  {
    heading: "Droit applicable et litiges",
    paragraphs: [
      "Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité avant toute action devant les tribunaux compétents.",
    ],
  },
];

export default function CguPage() {
  return (
    <LegalLayout
      eyebrow="Conditions"
      title="Conditions générales d'utilisation"
      updated="19 juin 2026"
      sections={SECTIONS}
    />
  );
}
