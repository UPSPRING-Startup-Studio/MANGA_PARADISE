import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;
  isCta?: boolean;
  icon?: React.ReactNode;
}

interface NavDropdownProps {
  label: string;
  items: NavDropdownItem[];
  className?: string;
  landingMode?: boolean;
}

export const NavDropdown = ({ label, items, className, landingMode = false }: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "flex items-center gap-1 font-sans font-extrabold text-sm tracking-wider uppercase",
          "transition-all duration-150",
          "py-2 px-3",
          landingMode
            ? cn("text-white hover:text-white/70", isOpen && "text-white/70")
            : cn("text-manga-ink hover:bg-manga-ink hover:text-manga-paper", isOpen && "bg-manga-ink text-manga-paper")
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full left-0 mt-0 min-w-[260px] z-50",
              "bg-manga-paper border-[3px] border-manga-ink",
              "shadow-[4px_4px_0px_0px_hsl(var(--manga-ink))]"
            )}
          >
            <div className="py-2">
              {items.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "block transition-all duration-150",
                    item.isCta
                      ? "bg-manga-ink text-manga-paper font-bold hover:bg-manga-paper hover:text-manga-ink mx-3 my-2 px-4 py-2.5 text-center text-sm uppercase tracking-wider border-2 border-manga-ink"
                      : "px-5 py-2.5 font-semibold text-manga-ink hover:bg-manga-ink hover:text-manga-paper border-l-[3px] border-l-transparent hover:border-l-sakura"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <span className={cn(
                    "font-sans text-[14px]",
                    item.isCta ? "font-bold" : "font-semibold"
                  )}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
