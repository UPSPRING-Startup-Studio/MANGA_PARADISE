import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CalendarDays,
  Users,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FicheQuickActionsProps {
  /** If the user has back-office access for this association */
  hasBackOfficeAccess: boolean;
}

const FicheQuickActions = ({ hasBackOfficeAccess }: FicheQuickActionsProps) => {
  const actions = [
    ...(hasBackOfficeAccess
      ? [
          {
            label: "Back-Office Associatif",
            href: "/association/dashboard",
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      label: "Agenda Evenements",
      href: "/agenda",
      icon: CalendarDays,
    },
    {
      label: "Annuaire des Membres",
      href: "/communaute/annuaire",
      icon: Users,
    },
    {
      label: "Mes Avantages",
      href: "/communaute/bazar",
      icon: Gift,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h2 className="text-2xl font-display text-foreground mb-6 text-center">
        Actions Rapides
      </h2>
      <div className="flex flex-wrap justify-center gap-4">
        {actions.map((action) => (
          <Link key={action.label} to={action.href}>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 hover:bg-sakura/10 hover:border-sakura hover:text-sakura transition-all"
            >
              <action.icon className="w-5 h-5" />
              {action.label}
            </Button>
          </Link>
        ))}
      </div>
    </motion.section>
  );
};

export default FicheQuickActions;
