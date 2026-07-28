/**
 * Shared look for the master screens. Palette lifted from the master-screen
 * mock so these pages read as part of the same family as /tasks. Kept as
 * constants rather than Tailwind classes because the surrounding admin code
 * already styles with inline colors.
 */
export const C = {
  card: "#ffffff",
  card2: "#f7faf5",
  ink: "#1c2419",
  muted: "#6b7568",
  line: "#e4ebdf",
  accent: "#3b6d11",
  accentSoft: "#eaf3de",
  accentInk: "#173404",
  danger: "#b91c1c",
  dangerBg: "#fee2e2",
  warn: "#c2410c",
  warnBg: "#ffedd5",
  info: "#1d4ed8",
  infoBg: "#dbeafe",
};

export const SHADOW =
  "0 1px 2px rgba(31,50,25,.06), 0 8px 24px rgba(31,50,25,.08)";

export const CARD_STYLE: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 16,
  boxShadow: SHADOW,
};

export function Pill({
  children,
  bg,
  color,
  outlined,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
  outlined?: boolean;
}) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-extrabold"
      style={{
        background: bg,
        color,
        border: outlined ? `1px solid ${C.line}` : undefined,
      }}
    >
      {children}
    </span>
  );
}
