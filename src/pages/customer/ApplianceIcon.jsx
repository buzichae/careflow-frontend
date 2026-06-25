/* 가전 종류별 SVG 아이콘 + 그라디언트 배경 */

const ICON_MAP = [
  {
    keys: ["냉장고", "냉동"],
    bg: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    color: "#0369a1",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="5" width="22" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <line x1="9" y1="17" x2="31" y2="17" stroke="currentColor" strokeWidth="2"/>
        <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="17" y1="22" x2="17" y2="29" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="20" y1="22" x2="20" y2="32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    keys: ["세탁기"],
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    color: "#1d4ed8",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="5" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="20" cy="23" r="7" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="20" cy="23" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="11" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
        <line x1="22" y1="10" x2="28" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    keys: ["에어컨", "에어컨"],
    bg: "linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)",
    color: "#047857",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="10" width="30" height="12" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <line x1="9" y1="16" x2="31" y2="16" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="27" cy="16" r="2" fill="currentColor"/>
        <path d="M10 24 Q12 30 10 35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M17 24 Q19 30 17 35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M24 24 Q26 30 24 35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  {
    keys: ["tv", "TV", "텔레비전"],
    bg: "linear-gradient(135deg, #d7d5ee 0%, #bbb7ec 100%)",
    color: "#6176df",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="32" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="8" y="12" width="24" height="12" rx="1" fill="currentColor" opacity="0.25"/>
        <line x1="15" y1="30" x2="25" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="20" y1="28" x2="20" y2="30" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    keys: ["건조기"],
    bg: "linear-gradient(135deg, #fdf4ff 0%, #e9d5ff 100%)",
    color: "#7e22ce",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="5" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="20" cy="23" r="7" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M16 20 Q20 17 24 20 Q20 23 16 20Z" fill="currentColor" opacity="0.4"/>
        <path d="M16 26 Q20 23 24 26 Q20 29 16 26Z" fill="currentColor" opacity="0.4"/>
        <line x1="25" y1="10" x2="29" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    keys: ["공기청정기"],
    bg: "linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)",
    color: "#15803d",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="4" width="16" height="34" rx="5" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <line x1="20" y1="9" x2="20" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="26" x2="20" y2="31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 14 Q10 17 6 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M34 14 Q30 17 34 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  {
    keys: ["식기세척기"],
    bg: "linear-gradient(135deg, #fefce8 0%, #fde68a 100%)",
    color: "#92400e",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="7" y="5" width="26" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <line x1="7" y1="14" x2="33" y2="14" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="14" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="25" x2="26" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="10" r="2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    keys: ["전자레인지", "오븐"],
    bg: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
    color: "#c2410c",
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="32" height="22" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="8" y="14" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="31" cy="18" r="1.5" fill="currentColor"/>
        <circle cx="31" cy="24" r="1.5" fill="currentColor"/>
        <circle cx="31" cy="29" r="1" fill="currentColor"/>
      </svg>
    ),
  },
];

const DEFAULT_ICON = {
  bg: "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)",
  color: "#5b21b6",
  svg: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M13 20 Q20 13 27 20 Q20 27 13 20Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="20" r="2.5" fill="currentColor"/>
    </svg>
  ),
};

function getIconMeta(name = "") {
  const lower = name.toLowerCase();
  return ICON_MAP.find((m) => m.keys.some((k) => lower.includes(k.toLowerCase()))) || DEFAULT_ICON;
}

export default function ApplianceIcon({ name = "", size = 68, radius = 12 }) {
  const meta = getIconMeta(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: meta.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: meta.color,
      }}
    >
      <div style={{ width: size * 0.6, height: size * 0.6 }}>
        {meta.svg}
      </div>
    </div>
  );
}
