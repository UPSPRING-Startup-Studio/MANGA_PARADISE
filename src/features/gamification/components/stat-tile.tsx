export function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="border-border bg-card flex flex-col gap-1 rounded-xl border p-3 sm:p-4">
      <div className="text-mp-primary flex items-center gap-1.5 text-xs font-semibold uppercase">
        {icon} {label}
      </div>
      <span className="text-2xl font-bold sm:text-3xl">{value}</span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}
