interface LogoProps {
  size?: number;
  className?: string;
}

// Clearcast brand mark: an amber sun "casting" signal arcs — a nod to both the
// clear-sky and the forecast/broadcast idea in the name.
const Logo = ({ size = 28, className = "" }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    role="img"
    aria-label="Clearcast logo"
  >
    <circle cx="7" cy="17" r="3" fill="#fbbf24" />
    <path
      d="M7 11 A6 6 0 0 1 13 17"
      stroke="#fbbf24"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M7 8 A9 9 0 0 1 16 17"
      stroke="#ffffff"
      strokeOpacity="0.85"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M7 5 A12 12 0 0 1 19 17"
      stroke="#ffffff"
      strokeOpacity="0.55"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export default Logo;
