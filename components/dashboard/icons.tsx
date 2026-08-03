type P = { size?: number };
const S = { fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const Icons = {
  Home: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"/>
    </svg>
  ),
  Camera: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Users: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Card: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  Settings: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  LogOut: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Search: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  ChevronRight: ({ size = 16 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Scan: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" y1="12" x2="17" y2="12"/>
    </svg>
  ),
  Print: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Wifi: ({ size = 16 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <circle cx="12" cy="20" r="1" fill="currentColor"/>
    </svg>
  ),
  Check: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ArrowLeft: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...S}>
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
};
