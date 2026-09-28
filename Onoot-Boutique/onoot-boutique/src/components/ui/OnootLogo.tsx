import React from "react";

interface OnootLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "color" | "white";
}

export function OnootLogo({ size = "md", variant = "color" }: OnootLogoProps) {
  const sizes = { sm: 32, md: 44, lg: 64 };
  const h = sizes[size];
  const textScale = h / 44;

  if (variant === "white") {
    return (
      <div className="flex items-center gap-2 select-none">
        <svg width={h} height={h} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="14" width="16" height="20" rx="2" fill="white" fillOpacity="0.6" transform="rotate(-12 12 24)" />
          <path d="M9 14 Q9 10 13 10 Q17 10 17 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" transform="rotate(-12 12 24)" />
          <rect x="14" y="12" width="16" height="22" rx="2" fill="white" fillOpacity="0.85" />
          <path d="M18 12 Q18 7 22 7 Q26 7 26 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
          <rect x="24" y="11" width="16" height="22" rx="2" fill="white" transform="rotate(12 32 22)" />
          <path d="M27 11 Q27 6 31 6 Q35 6 35 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" transform="rotate(12 32 22)" />
        </svg>
        <div className="flex flex-col leading-none">
          <span style={{ fontSize: `${Math.round(18 * textScale)}px`, fontWeight: 800, letterSpacing: "-0.03em", color: "white" }}>
            Onoot
          </span>
          <span style={{ fontSize: `${Math.round(8 * textScale)}px`, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.75)" }}>
            BOUTIQUE
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={h} height={h} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Blue bag (back-left) */}
        <g transform="rotate(-14 14 26)">
          <rect x="4" y="14" width="16" height="20" rx="2.5" fill="#4BB5E8" />
          <rect x="4" y="14" width="16" height="5" rx="0" fill="#3A9FD4" />
          <path d="M9 14 Q9 9.5 12 9.5 Q15 9.5 15 14" stroke="#1D3D6B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>
        {/* Yellow bag (middle) */}
        <rect x="14" y="11" width="16" height="23" rx="2.5" fill="#F5C430" />
        <rect x="14" y="11" width="16" height="6" rx="0" fill="#E0AF20" />
        <path d="M18 11 Q18 6 22 6 Q26 6 26 11" stroke="#1D3D6B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        {/* Orange bag (front-right) */}
        <g transform="rotate(14 30 24)">
          <rect x="24" y="12" width="16" height="22" rx="2.5" fill="#E87C2A" />
          <rect x="24" y="12" width="16" height="6" rx="0" fill="#D06820" />
          <path d="M28 12 Q28 7 32 7 Q36 7 36 12" stroke="#1D3D6B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>
      </svg>
      <div className="flex flex-col leading-none">
        <span style={{ fontSize: `${Math.round(18 * textScale)}px`, fontWeight: 800, letterSpacing: "-0.03em", color: "#111827" }}>
          Onoot
        </span>
        <span style={{ fontSize: `${Math.round(8 * textScale)}px`, fontWeight: 700, letterSpacing: "0.2em", color: "#3DB649" }}>
          BOUTIQUE
        </span>
      </div>
    </div>
  );
}
