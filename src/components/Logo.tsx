export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 2 L44 10 V22 C44 34 36 42 24 46 C12 42 4 34 4 22 V10 Z"
        fill="currentColor"
        className="text-navy-700"
      />
      <path
        d="M15 24 L21 30 L33 17"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
