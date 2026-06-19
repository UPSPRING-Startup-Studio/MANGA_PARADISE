import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import ConsentBlock from "./ConsentBlock";
import SignatureField from "./SignatureField";
import type { FormField } from "@/types/membershipForm";

interface FormFieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  error?: string;
  touched: boolean;
}

const FormFieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  touched,
}: FormFieldRendererProps) => {
  const showError = touched && error;
  const isRequired = field.validation?.required;

  switch (field.type) {
    // ── Decorative / layout ──
    case "heading":
      return (
        <h3 className="text-lg font-display text-foreground pt-2">
          {field.label}
        </h3>
      );

    case "paragraph":
      return (
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {field.content || field.label}
        </p>
      );

    case "divider":
      return <Separator className="my-2" />;

    // ── Text inputs ──
    case "text":
    case "email":
    case "tel":
    case "date":
    case "number":
      return (
        <div className="space-y-1.5">
          {field.label && (
            <Label htmlFor={field.key} className="text-sm">
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <Input
            id={field.key}
            type={field.type}
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
          />
          {showError && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    // ── Textarea ──
    case "textarea":
      return (
        <div className="space-y-1.5">
          {field.label && (
            <Label htmlFor={field.key} className="text-sm">
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <Textarea
            id={field.key}
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            rows={3}
          />
          {showError && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    // ── Select ──
    case "select":
      return (
        <div className="space-y-1.5">
          {field.label && (
            <Label className="text-sm">
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <Select
            value={String(value || "")}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Selectionner..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showError && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    // ── Radio group ──
    case "radio":
      return (
        <div className="space-y-2">
          {field.label && (
            <Label className="text-sm">
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <RadioGroup
            value={String(value || "")}
            onValueChange={(v) => onChange(v)}
            className="space-y-2"
          >
            {field.options?.map((opt) => (
              <div
                key={opt.value}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
              >
                <RadioGroupItem value={opt.value} id={`${field.key}-${opt.value}`} />
                <div>
                  <Label
                    htmlFor={`${field.key}-${opt.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {opt.label}
                  </Label>
                  {opt.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {opt.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
          {showError && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    // ── Single checkbox ──
    case "checkbox":
      return (
        <div className="space-y-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              id={field.key}
              checked={value === true}
              onCheckedChange={(c) => onChange(c === true)}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor={field.key} className="text-sm cursor-pointer">
                {field.label}
                {isRequired && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.helpText && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {field.helpText}
                </p>
              )}
            </div>
          </div>
          {showError && <p className="text-xs text-destructive ml-7">{error}</p>}
        </div>
      );

    // ── Checkbox group (multi-select) ──
    case "checkbox-group": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {field.label && (
            <Label className="text-sm">
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <div
                key={opt.value}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10"
              >
                <Checkbox
                  id={`${field.key}-${opt.value}`}
                  checked={selected.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selected, opt.value]);
                    } else {
                      onChange(selected.filter((v) => v !== opt.value));
                    }
                  }}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`${field.key}-${opt.value}`}
                  className="text-sm cursor-pointer"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
          {showError && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    }

    // ── Consent block ──
    case "consent":
      return (
        <ConsentBlock
          fieldKey={field.key}
          label={field.label || ""}
          content={field.content}
          checked={value === true}
          onChange={(c) => onChange(c)}
          error={showError ? error : undefined}
          required={isRequired}
        />
      );

    // ── Signature ──
    case "signature":
      return (
        <SignatureField
          fieldKey={field.key}
          label={field.label || "Signature"}
          value={String(value || "")}
          onChange={(v) => onChange(v)}
          error={showError ? error : undefined}
          helpText={field.helpText}
        />
      );

    default:
      return null;
  }
};

export default FormFieldRenderer;
