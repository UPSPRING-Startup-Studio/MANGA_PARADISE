const RTF = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/** « il y a 3 h », « hier »… à partir d'une date ISO. */
export function relativeTime(iso: string): string {
  let duration = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const div of DIVISIONS) {
    if (Math.abs(duration) < div.amount)
      return RTF.format(Math.round(duration), div.unit);
    duration /= div.amount;
  }
  return "";
}
