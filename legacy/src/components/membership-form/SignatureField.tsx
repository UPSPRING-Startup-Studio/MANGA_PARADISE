import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureFieldProps {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helpText?: string;
}

const SignatureField = ({
  fieldKey,
  label,
  value,
  onChange,
  error,
  helpText,
}: SignatureFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldKey} className="text-sm font-medium">
        {label}
        <span className="text-destructive ml-1">*</span>
      </Label>
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      <div
        className={cn(
          "relative rounded-xl border p-4",
          value
            ? "bg-emerald-500/5 border-emerald-500/30"
            : "bg-white/5 border-white/10",
          error && "border-destructive/50"
        )}
      >
        <div className="flex items-center gap-3">
          <PenLine className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Input
            id={fieldKey}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tape ton nom complet pour signer"
            className="border-0 bg-transparent p-0 h-auto text-base font-medium focus-visible:ring-0"
          />
        </div>
        {value && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Signe electroniquement par :{" "}
              <span className="font-semibold text-foreground italic">
                {value}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              {new Date().toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default SignatureField;
