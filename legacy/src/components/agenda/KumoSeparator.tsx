/** Reusable kumo cloud section separator — light, organic SVG shapes */
export default function KumoSeparator({ color = "#FFFFFF", flip = false }: { color?: string; flip?: boolean }) {
  return (
    <div className="w-full leading-[0] overflow-hidden" style={{ transform: flip ? "scaleY(-1)" : undefined }}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full block" style={{ height: 80 }}>
        <path d="M0,120 C120,100 180,40 320,60 C420,75 480,20 600,40 C720,60 780,10 900,30 C1020,50 1080,15 1200,35 C1300,50 1380,20 1440,40 L1440,120 Z" fill={color} />
        <path d="M0,120 C160,90 240,50 400,70 C520,85 580,35 720,50 C860,65 920,25 1060,45 C1160,58 1280,30 1440,55 L1440,120 Z" fill={color} opacity="0.6" />
      </svg>
    </div>
  );
}
