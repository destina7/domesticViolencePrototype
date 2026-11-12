/**
 * Animated how-to: a small phone shows the cover app's loading screen, a finger presses and holds the icon,
 * a ring fills around it over 3 seconds, then Nura opens. Loops every 7 seconds.
 * Drawn to match the real loading screen (screens/lock.tsx): icon, cover name, thin progress bar, "Loading…".
 * The loading bar slows down while the finger is down, like the real screen does.
 * Timings live in index.css (the wi-… keyframes). With reduced motion on, it shows one still frame: finger on the icon, ring mostly full.
 */
export function HoldIconArt({ cover }: { cover: string }) {
  // Ring around the icon: radius 27, so its length is 2πr ≈ 169.6. The animation draws it from 0 to full.
  const RING = 169.6;
  return (
    <svg data-art="hold-icon" viewBox="0 0 160 220" className="wi-anim h-full w-full" role="img"
      aria-label={`Animation: a finger holds the ${cover} icon on the loading screen for 3 seconds, then Nura opens`}>
      <defs>
        <clipPath id="wi-screen"><rect x="31" y="11" width="98" height="198" rx="15" /></clipPath>
      </defs>

      {/* Phone */}
      <rect x="30" y="10" width="100" height="200" rx="16" fill="#fff" stroke="#1a1a1a" strokeWidth="2" />
      <rect x="70" y="16" width="20" height="4" rx="2" fill="#1a1a1a" />

      {/* Loading screen: icon, name, bar */}
      <rect x="62" y="70" width="36" height="36" rx="10" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="80" cy="88" r="8" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      <text x="80" y="126" textAnchor="middle" className="f-b" fontSize="11" fill="#1a1a1a">{cover}</text>
      <rect x="55" y="172" width="50" height="4" rx="2" fill="#ebebeb" />
      <rect className="wi-bar" x="55" y="172" width="50" height="4" rx="2" fill="#1a1a1a" />
      <text x="80" y="188" textAnchor="middle" className="f-r" fontSize="7" fill="#666">Loading…</text>

      {/* Hold ring: fills over the 3 seconds the finger is down */}
      <circle className="wi-ring" cx="80" cy="88" r="27" fill="none" stroke="#1a1a1a" strokeWidth="2.5"
        strokeDasharray={RING} strokeDashoffset={RING * 0.25} transform="rotate(-90 80 88)" />

      {/* Nura opens: title, a few lines, the three capture buttons */}
      <g className="wi-nura" opacity="0" clipPath="url(#wi-screen)">
        <rect x="31" y="11" width="98" height="198" fill="#fff" />
        <rect x="70" y="16" width="20" height="4" rx="2" fill="#1a1a1a" />
        <text x="42" y="44" className="f-b" fontSize="13" fill="#1a1a1a">Nura</text>
        <rect x="42" y="58" width="76" height="16" rx="5" fill="none" stroke="#c7c7c7" strokeWidth="1.2" />
        <rect x="42" y="78" width="76" height="16" rx="5" fill="none" stroke="#c7c7c7" strokeWidth="1.2" />
        <rect x="42" y="98" width="76" height="16" rx="5" fill="none" stroke="#c7c7c7" strokeWidth="1.2" />
        <rect x="42" y="140" width="76" height="12" rx="6" fill="#1a1a1a" />
        <rect x="42" y="156" width="76" height="12" rx="6" fill="#1a1a1a" />
        <rect x="42" y="172" width="76" height="12" rx="6" fill="#1a1a1a" />
        <line x1="31" y1="192" x2="129" y2="192" stroke="#ebebeb" strokeWidth="1" />
      </g>

      {/* Finger, coming in from the lower right. Its tip is at (0, 0) and rests on the icon. */}
      {/* Angled 45° so the finger crosses to the right of the cover name instead of hiding it. */}
      <g transform="translate(89 95) rotate(-45)">
        <g className="wi-finger">
          <circle className="wi-press" cx="0" cy="2" r="9" fill="#1a1a1a" opacity="0.12" />
          <rect x="-11" y="-2" width="22" height="110" rx="11" fill="#fff" stroke="#1a1a1a" strokeWidth="2" />
          <rect x="-6.5" y="3" width="13" height="15" rx="5.5" fill="none" stroke="#1a1a1a" strokeWidth="1.3" />
          <line x1="-7" y1="34" x2="7" y2="34" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
