"use client";

// Scene illustrations for the guided-activation choice cards.
// Each one literally depicts the scenario in the card: real product objects
// (phones, app tiles, browser chrome, checklists) on a soft gradient panel,
// so the picture carries the meaning rather than decorating it.

const SVG = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {children}
  </svg>
);

const Shadow = ({ id }: { id: string }) => (
  <filter id={id} x="-40%" y="-40%" width="180%" height="190%">
    <feDropShadow dx="0" dy="3" stdDeviation="4.5" floodColor="#12303f" floodOpacity="0.18" />
  </filter>
);

/* ── Official brand marks ──────────────────────────────────────
   WhatsApp and Meta use their real published glyph outlines so the
   connect screens look like the services merchants actually recognise. */

const WA_GLYPH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

const META_GLYPH =
  "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z";

/** WhatsApp app icon — official green disc + official white glyph. */
const WaMark = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g transform={`translate(${cx},${cy})`}>
    <circle r={r} fill="#25D366" />
    <g transform={`scale(${(r * 1.22) / 24}) translate(-12,-12)`}>
      <path d={WA_GLYPH} fill="#ffffff" />
    </g>
  </g>
);

/** Meta mark — official outline, Meta blue. */
const MetaMark = ({ cx, cy, w }: { cx: number; cy: number; w: number }) => (
  <g transform={`translate(${cx},${cy}) scale(${w / 24}) translate(-12,-12)`}>
    <path d={META_GLYPH} fill="#0081FB" />
  </g>
);

/** Salla Engage mark — mint tile + teal chat bubble. */
const EngageMark = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <g transform={`translate(${x},${y}) scale(${s / 64})`}>
    <rect width="64" height="64" rx="18" fill="#a3ffe5" />
    <g transform="translate(32,32) scale(1.35) translate(-12,-12)" fill="none" stroke="#004a57" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.3 7.6L3.9 20.4l1.3-4.4A8.5 8.5 0 1 1 20.5 11.6z" />
      <path d="M9 10.8h6M9 14h3.6" />
    </g>
  </g>
);

/* ── 1. Number is used by another app ───────────────────────────── */
export function IlloSwitch({ className }: { className?: string }) {
  return (
    <SVG className={className}>
      <defs>
        <linearGradient id="a-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e7effd" />
          <stop offset="1" stopColor="#d9e5f7" />
        </linearGradient>
        <Shadow id="a-sh" />
      </defs>
      <rect width="320" height="180" rx="14" fill="url(#a-bg)" />

      {/* your WhatsApp number, currently held by another provider */}
      <g filter="url(#a-sh)">
        <rect x="20" y="22" width="96" height="136" rx="19" fill="#ffffff" stroke="#173f2e" strokeWidth="3" />
        <rect x="28" y="40" width="80" height="110" rx="10" fill="#e9f9ef" />
        <rect x="55" y="30" width="26" height="4" rx="2" fill="#173f2e" />
      </g>
      <WaMark cx={68} cy={88} r={26} />
      {/* it's tied to an app that isn't yours */}
      <g filter="url(#a-sh)">
        <rect x="34" y="120" width="68" height="24" rx="12" fill="#ffffff" />
        <path d="M48 132a5 5 0 015-5h2M62 132a5 5 0 01-5 5h-2" stroke="#8ea0b8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M50 126l10 12" stroke="#e2637a" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="86" cy="132" r="2" fill="#c2ccdb" />
        <circle cx="93" cy="132" r="2" fill="#c2ccdb" />
      </g>

      {/* release it, and it moves to Engage */}
      <path d="M130 88h44" stroke="#2f9e5f" strokeWidth="4" strokeLinecap="round" strokeDasharray="9 7" />
      <path d="M172 80l10 8-10 8" stroke="#2f9e5f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <g transform="translate(140,124)">
        <circle cx="0" cy="0" r="7.5" fill="none" stroke="#93a4bb" strokeWidth="3" />
        <path d="M6.5 0h16M18 0v5.5M22.5 0v4.5" stroke="#93a4bb" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Salla Engage */}
      <g filter="url(#a-sh)">
        <rect x="198" y="42" width="102" height="102" rx="26" fill="#ffffff" />
      </g>
      <EngageMark x={217} y={61} s={64} />
      <g filter="url(#a-sh)">
        <circle cx="292" cy="60" r="15" fill="#ffffff" />
        <path d="M286 60l4 4 8-8" stroke="#2f9e5f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </SVG>
  );
}

/* ── 2. Has a Meta Business account ─────────────────────────────── */
export function IlloAccount({ className }: { className?: string }) {
  return (
    <SVG className={className}>
      <defs>
        <linearGradient id="b-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b8ef5" />
          <stop offset="1" stopColor="#43bb85" />
        </linearGradient>
        <Shadow id="b-sh" />
      </defs>
      <rect width="320" height="180" rx="14" fill="url(#b-bg)" />

      {/* Meta account tile */}
      <g filter="url(#b-sh)">
        <rect x="20" y="40" width="92" height="92" rx="22" fill="#ffffff" />
        <MetaMark cx={66} cy={86} w={58} />
      </g>

      {/* business manager window */}
      <g filter="url(#b-sh)">
        <rect x="126" y="24" width="170" height="112" rx="12" fill="#ffffff" />
        <circle cx="140" cy="38" r="3.5" fill="#ff5f57" />
        <circle cx="151" cy="38" r="3.5" fill="#febc2e" />
        <circle cx="162" cy="38" r="3.5" fill="#28c840" />
        <rect x="126" y="50" width="170" height="1.5" fill="#eaeef4" />
        <circle cx="152" cy="76" r="13" fill="#dbe7f7" />
        <circle cx="152" cy="71" r="5" fill="#93b4dd" />
        <path d="M143 84a9 9 0 0118 0z" fill="#93b4dd" />
        <rect x="174" y="66" width="76" height="7" rx="3.5" fill="#e6ebf2" />
        <rect x="174" y="79" width="52" height="7" rx="3.5" fill="#eef1f6" />
        <rect x="174" y="112" width="12" height="12" rx="3" fill="#cfe0f5" />
        <rect x="192" y="104" width="12" height="20" rx="3" fill="#cfe0f5" />
        <rect x="210" y="96" width="12" height="28" rx="3" fill="#4f86f7" />
        <rect x="228" y="106" width="12" height="18" rx="3" fill="#cfe0f5" />
      </g>
      {/* secure */}
      <g filter="url(#b-sh)">
        <circle cx="288" cy="46" r="17" fill="#ffffff" />
        <rect x="280" y="44" width="16" height="13" rx="3.5" fill="#16324a" />
        <path d="M283 44v-3a5 5 0 0110 0v3" stroke="#16324a" strokeWidth="2.6" fill="none" />
      </g>

      {/* the actual action */}
      <g filter="url(#b-sh)">
        <rect x="58" y="132" width="200" height="36" rx="18" fill="#ffffff" />
        <MetaMark cx={84} cy={150} w={22} />
        <text x="100" y="155" fontFamily="Ping AR + LT, Inter, sans-serif" fontSize="12" fontWeight="700" fill="#16324a">
          Sign in with Meta
        </text>
      </g>
    </SVG>
  );
}

/* ── 3. New to WhatsApp Business ────────────────────────────────── */
export function IlloNew({ className }: { className?: string }) {
  return (
    <SVG className={className}>
      <defs>
        <linearGradient id="c-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d3ded6" />
          <stop offset="1" stopColor="#a8cdb3" />
        </linearGradient>
        <Shadow id="c-sh" />
      </defs>
      <rect width="320" height="180" rx="14" fill="url(#c-bg)" />

      {/* brand new number */}
      <g filter="url(#c-sh)">
        <rect x="22" y="22" width="94" height="136" rx="19" fill="#ffffff" stroke="#173f2e" strokeWidth="3" />
        <rect x="30" y="40" width="78" height="110" rx="10" fill="#eaf7ef" />
        <rect x="56" y="30" width="26" height="4" rx="2" fill="#173f2e" />
      </g>
      <WaMark cx={69} cy={95} r={29} />

      {/* the steps you'll follow */}
      <g filter="url(#c-sh)">
        <rect x="132" y="40" width="110" height="88" rx="12" fill="#ffffff" />
        <circle cx="150" cy="62" r="8.5" fill="#2f9e5f" />
        <path d="M146.5 62l2.5 2.5 4.5-5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="164" y="58" width="62" height="7" rx="3.5" fill="#e6ebe8" />
        <circle cx="150" cy="86" r="8.5" fill="#2f9e5f" />
        <path d="M146.5 86l2.5 2.5 4.5-5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="164" y="82" width="50" height="7" rx="3.5" fill="#e6ebe8" />
        <circle cx="150" cy="110" r="8.5" fill="none" stroke="#c3cfc8" strokeWidth="2.6" />
        <rect x="164" y="106" width="40" height="7" rx="3.5" fill="#f0f3f1" />
      </g>

      {/* guide + video */}
      <g filter="url(#c-sh)">
        <rect x="252" y="52" width="54" height="76" rx="8" fill="#2f9e5f" />
        <rect x="252" y="52" width="11" height="76" rx="4" fill="#25834e" />
        <rect x="270" y="78" width="28" height="26" rx="7" fill="#ffffff" />
        <path d="M280 85.5v11l9-5.5z" fill="#2f9e5f" />
        <path d="M292 52h10v22l-5-5-5 5z" fill="#ffd166" />
      </g>
    </SVG>
  );
}

/* ── 4. Ready-made template ─────────────────────────────────────── */
export function IlloReady({ className }: { className?: string }) {
  return (
    <SVG className={className}>
      <defs>
        <linearGradient id="d-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dff7ec" />
          <stop offset="1" stopColor="#c6ecdb" />
        </linearGradient>
        <Shadow id="d-sh" />
      </defs>
      <rect width="320" height="180" rx="14" fill="url(#d-bg)" />

      <g filter="url(#d-sh)">
        <rect x="52" y="22" width="196" height="136" rx="14" fill="#ffffff" />
        {/* chat header */}
        <path d="M52 36a14 14 0 0114-14h168a14 14 0 0114 14v10H52z" fill="#2f9e5f" />
        <circle cx="72" cy="34" r="7" fill="#ffffff" opacity="0.85" />
        <rect x="86" y="30" width="52" height="6" rx="3" fill="#ffffff" opacity="0.85" />
        {/* the message */}
        <rect x="68" y="62" width="150" height="52" rx="10" fill="#eaf7ef" />
        <rect x="80" y="74" width="112" height="6.5" rx="3.2" fill="#b9dcc8" />
        <rect x="80" y="88" width="86" height="6.5" rx="3.2" fill="#cde9d9" />
        {/* the CTA button */}
        <rect x="68" y="124" width="150" height="24" rx="12" fill="#ffffff" stroke="#cfe6db" strokeWidth="1.5" />
        <rect x="108" y="133" width="70" height="6" rx="3" fill="#4aa6ff" />
      </g>

      {/* already approved */}
      <g filter="url(#d-sh)">
        <circle cx="258" cy="44" r="21" fill="#ffffff" />
        <circle cx="258" cy="44" r="13" fill="#2f9e5f" />
        <path d="M252.5 44l4 4 7-8" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </SVG>
  );
}

/* ── 5. Draft it with AI ────────────────────────────────────────── */
export function IlloAI({ className }: { className?: string }) {
  return (
    <SVG className={className}>
      <defs>
        <linearGradient id="e-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eae7fd" />
          <stop offset="1" stopColor="#dbd6f8" />
        </linearGradient>
        <Shadow id="e-sh" />
      </defs>
      <rect width="320" height="180" rx="14" fill="url(#e-bg)" />

      {/* your prompt */}
      <g filter="url(#e-sh)">
        <rect x="34" y="24" width="180" height="34" rx="17" fill="#ffffff" />
        <circle cx="54" cy="41" r="6" fill="#7c6cf0" />
        <rect x="68" y="37" width="118" height="7" rx="3.5" fill="#e7e3fa" />
      </g>

      {/* the draft it writes */}
      <g filter="url(#e-sh)">
        <rect x="34" y="74" width="196" height="84" rx="14" fill="#ffffff" />
        <rect x="52" y="92" width="150" height="7.5" rx="3.7" fill="#e4e0f8" />
        <rect x="52" y="108" width="126" height="7.5" rx="3.7" fill="#eae7fb" />
        <rect x="52" y="124" width="88" height="7.5" rx="3.7" fill="#f1effd" />
        <rect x="146" y="122" width="3" height="12" rx="1.5" fill="#7c6cf0" />
      </g>

      {/* sparkles */}
      <path
        d="M256 50l6 16 16 6-16 6-6 16-6-16-16-6 16-6z"
        fill="#7c6cf0"
      />
      <path d="M292 96l3.5 9 9 3.5-9 3.5-3.5 9-3.5-9-9-3.5 9-3.5z" fill="#a99bf7" />
      <path d="M242 108l2.5 6.5 6.5 2.5-6.5 2.5-2.5 6.5-2.5-6.5-6.5-2.5 6.5-2.5z" fill="#c3b9fb" />
    </SVG>
  );
}

/* ── 6. Write my own ────────────────────────────────────────────── */
export function IlloWrite({ className }: { className?: string }) {
  return (
    <SVG className={className}>
      <defs>
        <linearGradient id="f-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef1f3" />
          <stop offset="1" stopColor="#dee5e9" />
        </linearGradient>
        <Shadow id="f-sh" />
      </defs>
      <rect width="320" height="180" rx="14" fill="url(#f-bg)" />

      <g filter="url(#f-sh)">
        <rect x="34" y="28" width="190" height="124" rx="14" fill="#ffffff" />
        <rect x="52" y="48" width="128" height="7.5" rx="3.7" fill="#e3e8ec" />
        <rect x="52" y="66" width="154" height="7.5" rx="3.7" fill="#eaeff2" />
        {/* merge-field chips */}
        <rect x="52" y="86" width="62" height="20" rx="10" fill="#e5fff9" stroke="#b3ecd4" strokeWidth="1.4" />
        <rect x="62" y="93" width="42" height="6" rx="3" fill="#7fd9bc" />
        <rect x="122" y="86" width="52" height="20" rx="10" fill="#e5fff9" stroke="#b3ecd4" strokeWidth="1.4" />
        <rect x="132" y="93" width="32" height="6" rx="3" fill="#7fd9bc" />
        <rect x="52" y="118" width="96" height="7.5" rx="3.7" fill="#eef2f5" />
        <rect x="152" y="116" width="3" height="12" rx="1.5" fill="#004a57" />
      </g>

      {/* the pencil doing the writing */}
      <g filter="url(#f-sh)" transform="translate(246,44) rotate(24)">
        <path d="M-13 0h26v58l-13 16-13-16z" fill="#ffd166" />
        <path d="M-13 0h26v-14h-26z" fill="#f0a92e" />
        <path d="M-13 58h26l-13 16z" fill="#f7f2e6" />
        <path d="M-5 74l5-16 5 16z" fill="#2f3a3f" />
        <rect x="-13" y="44" width="26" height="3" fill="#f0a92e" />
      </g>
    </SVG>
  );
}
