export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="dl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d7cff" />
          <stop offset="1" stopColor="#9b6bff" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="56" height="54" rx="14" fill="url(#dl-g)" />
      <rect x="4" y="6" width="56" height="15" rx="14" fill="#fff" opacity=".18" />
      <path
        d="M20 37.5l9 9 16-17"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
