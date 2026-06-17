import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ConsentBlockProps {
  fieldKey: string;
  label: string;
  content?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  required?: boolean;
}

const ConsentBlock = ({
  fieldKey,
  label,
  content,
  checked,
  onChange,
  error,
  required,
}: ConsentBlockProps) => {
  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-colors",
        checked
          ? "bg-emerald-500/5 border-emerald-500/30"
          : "bg-white/5 border-white/10",
        error && "border-destructive/50"
      )}
    >
      {content && (
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      )}
      <div className="flex items-start gap-3">
        <Checkbox
          id={fieldKey}
          checked={checked}
          onCheckedChange={(c) => onChange(c === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor={fieldKey}
          className="text-sm text-foreground leading-snug cursor-pointer"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      {error && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}
    </div>
  );
};

export default ConsentBlock;
