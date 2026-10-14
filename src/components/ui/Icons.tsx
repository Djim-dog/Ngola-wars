/** Icones profissionais estilo app nativo de tabuleiro — sem emojis */

type IconProps = { className?: string; size?: number };

export function IconMap({ className = '', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M3 6.5L9 4l6 2.5L21 4v15.5L15 22l-6-2.5L3 22V6.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 4v15.5M15 6.5V22" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}

export function IconSword({ className = '', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M14.5 4L20 9.5M9 17.5L4.5 13M12 12l7-7 1.5 1.5-7 7M8.5 15.5L6 18l-2-.5.5-2 2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 13l-1.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function IconShop({ className = '', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 9h16l-1.2 10.2a2 2 0 01-2 1.8H7.2a2 2 0 01-2-1.8L4 9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M8 9V7a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function IconWallet({ className = '', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="16" cy="14.5" r="1.2" fill="currentColor"/>
    </svg>
  );
}

export function IconTrophy({ className = '', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M8 4h8v5a4 4 0 01-8 0V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M8 6H5.5a2 2 0 000 4H8M16 6h2.5a2 2 0 010 4H16" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 13v3M9 20h6M12 16h0a3 3 0 003 3H9a3 3 0 003-3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function IconBell({ className = '', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 9a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M10 20a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function IconCrown({ className = '', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 17l2-9 5 4 2-6 2 6 5-4 2 9H3z"/>
    </svg>
  );
}

export function IconHeart({ className = '', size = 10 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 14s-6-3.8-6-7.2C2 4.5 3.8 3 5.6 3c1.1 0 2.1.6 2.4 1.4C8.3 3.6 9.3 3 10.4 3 12.2 3 14 4.5 14 6.8 14 10.2 8 14 8 14z"/>
    </svg>
  );
}

export function IconBoard({ className = '', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="currentColor" strokeWidth="1.2" opacity="0.7"/>
    </svg>
  );
}
