import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormStepLayoutProps {
  children: React.ReactNode;
  description?: string;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
}

const FormStepLayout = ({
  children,
  description,
  onNext,
  onPrev,
  isFirst,
  isLast,
  isSubmitting,
}: FormStepLayoutProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      <div className="space-y-5">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        {!isFirst ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onPrev}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Precedent
          </Button>
        ) : (
          <div />
        )}

        <Button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className={
            isLast
              ? "gap-2 bg-sakura hover:bg-sakura/90"
              : "gap-2"
          }
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isLast ? (
            <>
              Envoyer ma candidature
              <Send className="w-4 h-4" />
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default FormStepLayout;
