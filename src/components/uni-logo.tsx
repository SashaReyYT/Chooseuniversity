const PALETTE = [
  "bg-primary text-on-primary",
  "bg-tertiary-container text-on-tertiary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-primary-container text-on-primary-container",
  "bg-error-container text-on-error-container",
];

function hue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

interface UniLogoProps {
  name: string;
  /** Tailwind size classes, e.g. "w-12 h-12 text-lg". */
  className?: string;
}

/**
 * Deterministic initial-avatar shown whenever a university has no seeded
 * logo. Colour is derived from the name so the same institution always
 * renders identically across pages.
 */
export function UniLogo({ name, className = "w-14 h-14 text-xl" }: UniLogoProps) {
  const palette = PALETTE[hue(name) % PALETTE.length];
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-headline-sm font-semibold ${palette} ${className}`}
    >
      {initials(name)}
    </div>
  );
}