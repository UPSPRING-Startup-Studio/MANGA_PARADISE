import { motion, type Variants } from "framer-motion";
import { User, Sparkles, Building, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Role configuration with colors and content
const ROLES = [
  {
    id: "user",
    title: "Utilisateur",
    description: "Je veux compléter mon profil Otaku & Cosplayer.",
    icon: User,
    color: "hsl(var(--mp-primary))",
    bgHover: "rgba(255, 0, 127, 0.15)",
    borderHover: "rgba(255, 0, 127, 0.5)",
    glowColor: "rgba(255, 0, 127, 0.3)",
  },
  {
    id: "creator",
    title: "Créateur +",
    description: "Je veux exposer mon travail et mon portfolio.",
    icon: Sparkles,
    color: "hsl(var(--mp-saffron))",
    bgHover: "rgba(255, 215, 0, 0.15)",
    borderHover: "rgba(255, 215, 0, 0.5)",
    glowColor: "rgba(255, 215, 0, 0.3)",
  },
  {
    id: "pro",
    title: "Professionnel",
    description: "Accédez à votre espace partenaire professionnel.",
    icon: Building,
    color: "hsl(var(--mp-info))",
    bgHover: "rgba(0, 240, 255, 0.15)",
    borderHover: "rgba(0, 240, 255, 0.5)",
    glowColor: "rgba(0, 240, 255, 0.3)",
  },
  {
    id: "association",
    title: "Association",
    description: "Je veux gérer mon club et mes activités.",
    icon: Users,
    color: "#39FF14",
    bgHover: "rgba(57, 255, 20, 0.15)",
    borderHover: "rgba(57, 255, 20, 0.5)",
    glowColor: "rgba(57, 255, 20, 0.3)",
  },
];

// Animation variants for the tiles
const tileVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: index * 0.1,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
  },
};

// Animation variants for the description text
const descriptionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

// Animation variants for the center badge
const badgeVariants: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.5,
      duration: 0.5,
      type: "spring" as const,
      stiffness: 200,
    },
  },
};

interface RoleTileProps {
  role: (typeof ROLES)[number];
  index: number;
  onClick: () => void;
}

function RoleTile({ role, index, onClick }: RoleTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = role.icon;

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden rounded-2xl border border-white/5"
      style={{
        backgroundColor: isHovered ? role.bgHover : "rgb(15, 23, 42)", // bg-mp-paper
        borderColor: isHovered ? role.borderHover : "rgba(255, 255, 255, 0.05)",
        boxShadow: isHovered
          ? `0 0 40px ${role.glowColor}, inset 0 0 60px ${role.glowColor}`
          : "none",
      }}
      variants={tileVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      custom={index}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Background gradient effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0"
        style={{
          background: `radial-gradient(circle at center, ${role.glowColor} 0%, transparent 70%)`,
        }}
        animate={{ opacity: isHovered ? 0.5 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon */}
      <motion.div
        className="relative z-10 mb-4"
        animate={{
          scale: isHovered ? 1.1 : 1,
          color: isHovered ? role.color : "rgba(255, 255, 255, 0.7)",
        }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          size={64}
          strokeWidth={1.5}
          style={{
            filter: isHovered ? `drop-shadow(0 0 20px ${role.color})` : "none",
          }}
        />
      </motion.div>

      {/* Title */}
      <motion.h2
        className="relative z-10 text-2xl md:text-3xl font-bold mb-3 text-center"
        animate={{ color: isHovered ? role.color : "#FFFFFF" }}
        transition={{ duration: 0.2 }}
      >
        {role.title}
      </motion.h2>

      {/* Description - appears on hover */}
      <motion.p
        className="relative z-10 text-sm md:text-base text-center text-slate-300 max-w-[200px]"
        variants={descriptionVariants}
        initial="hidden"
        animate={isHovered ? "visible" : "hidden"}
      >
        {role.description}
      </motion.p>

      {/* Decorative corner accents */}
      <motion.div
        className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 rounded-tl-2xl"
        style={{ borderColor: role.color }}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 rounded-br-2xl"
        style={{ borderColor: role.color }}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleSelect = (roleId: string) => {
    // Special routing for professional/partner registration
    if (roleId === "pro") {
      // Redirect to the professional portal
      navigate("/pro/portal");
      return;
    }
    
    navigate(`/login?role=${roleId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8">
      {/* Background subtle pattern */}
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--mp-primary)) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, hsl(var(--mp-info)) 0%, transparent 50%)`,
        }}
      />

      {/* Main container */}
      <div className="relative w-full max-w-5xl aspect-square md:aspect-auto md:h-[80vh]">
        {/* Grid of 4 tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          {ROLES.map((role, index) => (
            <RoleTile
              key={role.id}
              role={role}
              index={index}
              onClick={() => handleRoleSelect(role.id)}
            />
          ))}
        </div>

        {/* Center floating badge */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex"
          variants={badgeVariants}
          initial="initial"
          animate="animate"
        >
          <div className="bg-slate-950/90 backdrop-blur-xl border border-white/20 rounded-full px-6 py-4 shadow-2xl">
            <span className="text-white font-bold text-lg tracking-wider">
              VOUS ÊTES ?
            </span>
          </div>
        </motion.div>

        {/* Mobile header */}
        <motion.div
          className="md:hidden text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">VOUS ÊTES ?</h1>
          <p className="text-mp-ink-muted text-sm">
            Choisissez votre profil pour continuer
          </p>
        </motion.div>
      </div>
    </div>
  );
}
