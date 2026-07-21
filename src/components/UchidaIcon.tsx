import { useId } from "react";

/**
 * AI Uchida avatar, drawn as an inline SVG (no extra network request).
 * Expression and badge are switched with props, so the same component covers
 * the idle state and the "generating a reply" state.
 *
 * Accessibility: decorative by default (aria-hidden), because every current
 * call site already shows the name "AI内田さん" as text right next to it.
 * Pass `label` when the icon stands alone and needs to be announced.
 */

export type UchidaExpression = "normal" | "think" | "happy" | "surprise";
export type UchidaBadge = "spark" | "chili" | "none";

// Eyes and mouth per expression. Drawn on top of the face, under the glasses.
const EXPRESSIONS: Record<UchidaExpression, React.ReactNode> = {
  normal: (
    <>
      <circle cx="39.5" cy="43" r="1.8" fill="#39424E" />
      <circle cx="56.5" cy="43" r="1.8" fill="#39424E" />
      <path d="M43 57q5 4 10 0" stroke="#C08A63" strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </>
  ),
  think: (
    <>
      <path d="M37.5 43.5q2-2.5 4 0M54.5 43.5q2-2.5 4 0" fill="none" stroke="#39424E" strokeWidth={2} strokeLinecap="round" />
      <path d="M44.5 57h7" stroke="#C08A63" strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </>
  ),
  happy: (
    <>
      <path d="M37.5 44q2-3.5 4 0M54.5 44q2-3.5 4 0" fill="none" stroke="#39424E" strokeWidth={2} strokeLinecap="round" />
      <path d="M42.5 55q5.5 6.5 11 0z" fill="#B4715B" />
    </>
  ),
  surprise: (
    <>
      <circle cx="39.5" cy="43" r="2.5" fill="#39424E" />
      <circle cx="56.5" cy="43" r="2.5" fill="#39424E" />
      <ellipse cx="48" cy="57" rx="3" ry="3.6" fill="#B4715B" />
    </>
  ),
};

type Props = {
  size?: number;
  expression?: UchidaExpression;
  badge?: UchidaBadge;
  /** Blink the badge while a reply is being generated. Ignored when badge is "none". */
  animateBadge?: boolean;
  /** Accessible name. When omitted the icon is hidden from screen readers. */
  label?: string;
  className?: string;
};

export default function UchidaIcon({
  size = 32,
  expression = "normal",
  badge = "none",
  animateBadge = false,
  label,
  className,
}: Props) {
  // Unique per instance, so several icons on one page do not share a clipPath id.
  const clipId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <clipPath id={clipId}>
        <circle cx="48" cy="48" r="47" />
      </clipPath>
      <circle cx="48" cy="48" r="48" fill="#46698A" />
      {/* Body: neck, shirt and collar. Clipped to the background circle. */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="42" y="55" width="12" height="16" rx="5" fill="#E0AD80" />
        <path d="M20 97c1-13 13-21 28-21s27 8 28 21z" fill="#E3E8EE" />
        <path d="M39 74l9 11 1.5-8.5-6.5-5.5z" fill="#FFFFFF" />
        <path d="M57 74l-9 11-1.5-8.5 6.5-5.5z" fill="#FFFFFF" />
        <circle cx="30" cy="45" r="4" fill="#F2C79C" />
        <circle cx="66" cy="45" r="4" fill="#F2C79C" />
        <rect x="31" y="20" width="34" height="42" rx="15" fill="#F2C79C" />
        <path d="M29 46C29 28 37 19 48 19s19 9 19 27l-5.5-1c1-11-4.5-17.5-13.5-17.5S33.5 34 34.5 45z" fill="#E8EBEE" />
        <path d="M39.5 21.5c-2.5 3-4.3 7.5-4.8 12M56.5 21.5c2.5 3 4.3 7.5 4.8 12" stroke="#CBD2D9" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        <path d="M36 34h7M53 34h7" stroke="#E8EBEE" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M48 46v5" stroke="#DCA87E" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </g>
      {EXPRESSIONS[expression]}
      {/* Glasses, always on top so they stay readable down to 24px. */}
      <g fill="rgba(255,255,255,0.16)" stroke="#39424E" strokeWidth={2.5} strokeLinecap="round">
        <rect x="33.5" y="38" width="12" height="10" rx="3.5" />
        <rect x="50.5" y="38" width="12" height="10" rx="3.5" />
        <path d="M45.5 42.5h5M33.5 41.5l-4-1.5M62.5 41.5l4-1.5" fill="none" />
      </g>
      {badge !== "none" && (
        // The blink itself lives in globals.css, where prefers-reduced-motion disables it.
        <g className={animateBadge ? "animate-uchida-spark" : undefined} style={{ transformOrigin: "77px 77px" }}>
          {badge === "spark" ? (
            <>
              <circle cx="77" cy="77" r="15" fill="#2E7D5B" stroke="#FFFFFF" strokeWidth={3} />
              <path d="M77 66l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#FFFFFF" />
            </>
          ) : (
            <>
              <circle cx="77" cy="77" r="15" fill="#FFFFFF" />
              <ellipse cx="76" cy="79" rx="8.5" ry="4.2" transform="rotate(-35 76 79)" fill="#D64541" />
              <path d="M81.5 72.5l3.5-3" stroke="#3E7D4E" strokeWidth={2.8} strokeLinecap="round" fill="none" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
