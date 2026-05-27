export default function TpLogo({ size = 36 }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size, display: 'block', flexShrink: 0 }}
    >
      <rect width="36" height="36" rx="7" fill="#1C8EE8"/>
      {/* Top H — two posts with crossbar in the middle */}
      <rect x="3"  y="3"  width="8" height="15" rx="1.5" fill="white"/>
      <rect x="25" y="3"  width="8" height="15" rx="1.5" fill="white"/>
      <rect x="11" y="8"  width="14" height="5"  rx="1"   fill="white"/>
      {/* Bottom H — two shorter posts with crossbar in the middle */}
      <rect x="3"  y="20" width="8" height="13" rx="1.5" fill="white"/>
      <rect x="25" y="20" width="8" height="13" rx="1.5" fill="white"/>
      <rect x="11" y="24" width="14" height="5"  rx="1"   fill="white"/>
    </svg>
  );
}
