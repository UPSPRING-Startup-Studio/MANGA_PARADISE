import { cn } from "@/lib/utils";

/**
 * Manga Paradise — JapanIcon
 * Pictogrammes culture pop japonaise (charte Pop Sanctuary).
 * SVG géométriques simples utilisant `currentColor` pour héritage de la couleur.
 *
 * Usage :
 * <JapanIcon name="torii" className="text-mp-primary" size={48} />
 */

export type JapanIconName =
  | "torii"
  | "lantern"
  | "pagoda"
  | "sakura"
  | "cloud"
  | "trophy"
  | "speechBubble"
  | "wing"
  | "halo";

export interface JapanIconProps extends React.SVGProps<SVGSVGElement> {
  name: JapanIconName;
  className?: string;
  size?: number;
}

const PATHS: Record<JapanIconName, JSX.Element> = {
  torii: (
    <g fill="currentColor">
      <path d="M3 8 Q24 3 45 8 L45 11 L3 11 Z" />
      <rect x="6" y="11" width="36" height="2.5" />
      <rect x="11" y="13.5" width="3" height="30" />
      <rect x="34" y="13.5" width="3" height="30" />
      <rect x="9" y="20" width="30" height="2" />
    </g>
  ),
  lantern: (
    <g fill="currentColor">
      <rect x="14" y="8" width="20" height="2" rx="1" />
      <ellipse cx="24" cy="24" rx="14" ry="16" />
      <rect x="14" y="38" width="20" height="2" rx="1" />
      <rect x="22" y="40" width="4" height="4" />
    </g>
  ),
  pagoda: (
    <path
      d="M24 4 L40 14 L36 16 L36 22 L40 24 L36 26 L36 32 L40 34 L8 34 L12 32 L12 26 L8 24 L12 22 L12 16 L8 14 Z"
      fill="currentColor"
    />
  ),
  sakura: (
    <path
      d="M24 8 C28 8 32 12 28 18 C34 16 38 22 32 26 C38 28 34 36 28 32 C28 38 20 38 20 32 C14 36 10 28 16 26 C10 22 14 16 20 18 C16 12 20 8 24 8 Z"
      fill="currentColor"
    />
  ),
  cloud: (
    <path
      d="M10 28 C 4 28 4 18 12 18 C 14 10 26 10 28 18 C 36 16 42 22 38 28 Z"
      fill="currentColor"
    />
  ),
  trophy: (
    <g fill="currentColor">
      <path d="M16 8 H32 V18 C32 24 28 28 24 28 C20 28 16 24 16 18 Z" />
      <rect x="20" y="28" width="8" height="6" />
      <rect x="14" y="34" width="20" height="4" rx="1" />
      <path d="M16 12 H10 Q6 12 6 16 Q6 22 14 22" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M32 12 H38 Q42 12 42 16 Q42 22 34 22" fill="none" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  speechBubble: (
    <path
      d="M8 10 H40 Q44 10 44 14 V28 Q44 32 40 32 H22 L14 40 V32 H8 Q4 32 4 28 V14 Q4 10 8 10 Z"
      fill="currentColor"
    />
  ),
  wing: (
    <path
      d="M4 28 Q12 14 24 18 Q20 22 18 28 Q26 22 32 24 Q26 28 24 32 Q32 28 38 30 Q30 34 24 38 Q14 36 4 28 Z"
      fill="currentColor"
    />
  ),
  halo: (
    <ellipse
      cx="24"
      cy="24"
      rx="20"
      ry="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
  ),
};

export function JapanIcon({ name, className, size = 48, ...rest }: JapanIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn("inline-block shrink-0", className)}
      role="img"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

export default JapanIcon;
