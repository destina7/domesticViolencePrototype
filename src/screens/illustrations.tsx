/**
 * Animated how-to for the loading screen's way in. Loops every 7 seconds.
 * A small phone shows the cover app's loading screen (drawn to match screens/lock.tsx: logo, cover name, thin bar,
 * "Loading…"), a finger taps the logo three times, a ripple and a dot under the phone mark each tap, then Nura opens.
 * It uses the same ti-… keyframes as the cover app's how-to below (index.css), so both tap animations keep the same
 * rhythm. With reduced motion on, it shows one still frame: the finger on the logo.
 */
export function LoadingWayArt({ cover }: { cover: string }) {
  return (
    <svg data-art="loading-taps" viewBox="0 0 160 232" className="ti-anim h-full w-full" role="img"
      aria-label={`Animation: on the ${cover} loading screen a finger taps the logo 3 times, then Nura opens`}>
      <defs>
        <clipPath id="li-screen"><rect x="31" y="11" width="98" height="198" rx="15" /></clipPath>
      </defs>

      {/* Phone */}
      <rect x="30" y="10" width="100" height="200" rx="16" fill="#fff" stroke="#1a1a1a" strokeWidth="2" />
      <rect x="70" y="16" width="20" height="4" rx="2" fill="#1a1a1a" />

      {/* Loading screen: logo, name, bar */}
      <rect x="62" y="70" width="36" height="36" rx="10" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="80" cy="88" r="8" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      <text x="80" y="126" textAnchor="middle" className="f-b" fontSize="11" fill="#1a1a1a">{cover}</text>
      <rect x="55" y="172" width="50" height="4" rx="2" fill="#ebebeb" />
      <rect x="55" y="172" width="20" height="4" rx="2" fill="#1a1a1a" />
      <text x="80" y="188" textAnchor="middle" className="f-r" fontSize="7" fill="#666">Loading…</text>

      {/* A ripple on the logo for each tap */}
      <circle className="ti-ripple" cx="80" cy="88" r="22" fill="none" stroke="#1a1a1a" strokeWidth="1.5" opacity="0" />

      {/* Nura opens: title, a few lines, the three capture buttons (the same as the other how-to) */}
      <g className="ti-nura" opacity="0" clipPath="url(#li-screen)">
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

      {/* Finger, coming in from the lower right. Its tip is at (0, 0) and rests on the logo; between taps it lifts. */}
      <g transform="translate(82 92) rotate(-45)">
        <g className="ti-finger">
          <rect x="-11" y="-2" width="22" height="110" rx="11" fill="#fff" stroke="#1a1a1a" strokeWidth="2" />
          <rect x="-6.5" y="3" width="13" height="15" rx="5.5" fill="none" stroke="#1a1a1a" strokeWidth="1.3" />
          <line x1="-7" y1="34" x2="7" y2="34" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </g>

      {/* Tap counter under the phone: one dot fills per tap */}
      {[68, 80, 92].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="222" r="3.5" fill="none" stroke="#1a1a1a" strokeWidth="1.2" />
          <circle className={`ti-dot${i + 1}`} cx={x} cy="222" r="3.5" fill="#1a1a1a" opacity="0" />
        </g>
      ))}
    </svg>
  );
}

/**
 * Animated how-to for the other way in: a small phone shows Bloom (the cover app), a finger taps the progress ring
 * three times, a ripple and a dot under the phone mark each tap, then Nura opens. Loops every 7 seconds.
 * Drawn to match the real Bloom screen (screens/cover.tsx): title, outlined card with the ring, filled habit rows, nav bar.
 * Timings live in index.css (the ti-… keyframes). With reduced motion on, it shows one still frame: finger on the ring.
 */
export function TapRingArt({ cover }: { cover: string }) {
  // Progress ring: radius 9, so its length is 2πr ≈ 56.5. Drawn 4 of 6 done, like the real screen.
  const RING = 56.5;
  const rows = [92, 110, 128, 146];
  return (
    <svg data-art="tap-ring" viewBox="0 0 160 232" className="ti-anim h-full w-full" role="img"
      aria-label={`Animation: a finger taps the progress ring in ${cover} 3 times, then Nura opens`}>
      <defs>
        <clipPath id="ti-screen"><rect x="31" y="11" width="98" height="198" rx="15" /></clipPath>
      </defs>

      {/* Phone */}
      <rect x="30" y="10" width="100" height="200" rx="16" fill="#fff" stroke="#1a1a1a" strokeWidth="2" />
      <rect x="70" y="16" width="20" height="4" rx="2" fill="#1a1a1a" />

      {/* Bloom: title, the ring card, habit rows, nav bar */}
      <text x="42" y="40" className="f-b" fontSize="11" fill="#1a1a1a">{cover}</text>
      <rect x="40" y="50" width="80" height="34" rx="6" fill="none" stroke="#c7c7c7" strokeWidth="1.2" />
      <circle cx="56" cy="67" r="9" fill="none" stroke="#ebebeb" strokeWidth="3" />
      <circle cx="56" cy="67" r="9" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={RING} strokeDashoffset={RING / 3} transform="rotate(-90 56 67)" />
      <text x="56" y="69" textAnchor="middle" className="f-b" fontSize="5.5" fill="#1a1a1a">4/6</text>
      <rect x="72" y="61" width="38" height="4" rx="2" fill="#c7c7c7" />
      <rect x="72" y="69" width="26" height="3" rx="1.5" fill="#ebebeb" />
      {rows.map((y, i) => (
        <g key={y}>
          <rect x="40" y={y} width="80" height="14" rx="4" fill="#ebebeb" />
          <rect x="45" y={y + 4} width="6" height="6" rx="1" fill={i < 3 ? "#1a1a1a" : "#fff"} stroke="#1a1a1a" strokeWidth="1" />
          <rect x="55" y={y + 5.5} width={[34, 40, 26, 30][i]} height="3" rx="1.5" fill="#999" />
        </g>
      ))}
      <line x1="31" y1="186" x2="129" y2="186" stroke="#ebebeb" strokeWidth="1" />
      {[43, 68, 92, 117].map((x, i) => (
        <rect key={x} x={x - 3.5} y="193" width="7" height="7" rx="2" fill={i === 0 ? "#1a1a1a" : "none"} stroke="#1a1a1a" strokeWidth="1" />
      ))}

      {/* A ripple on the ring for each tap */}
      <circle className="ti-ripple" cx="56" cy="67" r="13" fill="none" stroke="#1a1a1a" strokeWidth="1.5" opacity="0" />

      {/* Nura opens: title, a few lines, the three capture buttons (the same as the other how-to) */}
      <g className="ti-nura" opacity="0" clipPath="url(#ti-screen)">
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

      {/* Finger, coming in from the lower right. Its tip is at (0, 0) and rests on the ring; between taps it lifts. */}
      <g transform="translate(57 69) rotate(-45)">
        <g className="ti-finger">
          <rect x="-11" y="-2" width="22" height="110" rx="11" fill="#fff" stroke="#1a1a1a" strokeWidth="2" />
          <rect x="-6.5" y="3" width="13" height="15" rx="5.5" fill="none" stroke="#1a1a1a" strokeWidth="1.3" />
          <line x1="-7" y1="34" x2="7" y2="34" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </g>

      {/* Tap counter under the phone: one dot fills per tap */}
      {[68, 80, 92].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="222" r="3.5" fill="none" stroke="#1a1a1a" strokeWidth="1.2" />
          <circle className={`ti-dot${i + 1}`} cx={x} cy="222" r="3.5" fill="#1a1a1a" opacity="0" />
        </g>
      ))}
    </svg>
  );
}
