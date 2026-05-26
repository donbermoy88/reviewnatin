import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ReviewNatin — Filipino Exam Reviewer | CSE, LET, PNLE';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #08245C 0%, #0B5FFF 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
          gap: '52px',
        }}
      >
        {/* Icon — book-checkmark with gold star */}
        <svg width="160" height="160" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="ogbg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1A72FF" />
              <stop offset="100%" stopColor="#08245C" />
            </linearGradient>
            <linearGradient id="ogpg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E8EFFF" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#ogbg)" />
          <rect x="10" y="6" width="80" height="30" rx="14" fill="white" fill-opacity="0.06" />
          <path d="M46.53,55.92 L18.53,71.92 L25.47,84.08 L53.47,68.08 Z" fill="url(#ogpg)" />
          <circle cx="22" cy="78" r="6.3" fill="url(#ogpg)" />
          <path d="M55.40,66.45 L83.40,32.45 L72.60,23.55 L44.60,57.55 Z" fill="url(#ogpg)" />
          <circle cx="78" cy="28" r="6.3" fill="url(#ogpg)" />
          <circle cx="50" cy="62" r="5.95" fill="url(#ogpg)" />
          <path d="M50,17.5 L51.6,22.23 L56.5,21.25 L53.2,25 L56.5,28.75 L51.6,27.77 L50,32.5 L48.4,27.77 L43.5,28.75 L46.8,25 L43.5,21.25 L48.4,22.23 Z" fill="#FFC928" />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: 86, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>Review</span>
            <span style={{ fontSize: 86, fontWeight: 800, color: '#FFC928', letterSpacing: '-0.03em', lineHeight: 1 }}>Natin</span>
            <sup style={{ fontSize: 36, fontWeight: 700, color: '#FFC928', marginLeft: '4px' }}>PH</sup>
          </div>
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: '0.02em' }}>
            Review together. Pass together.
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            {['PRC Board', 'Civil Service', 'Bar Exam', 'UPCAT'].map((exam) => (
              <span key={exam} style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.08)', padding: '6px 14px', borderRadius: '99px' }}>
                {exam}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
