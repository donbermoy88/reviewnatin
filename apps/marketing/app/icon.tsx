import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '22%',
          background: 'linear-gradient(135deg, #1A72FF 0%, #08245C 100%)',
          position: 'relative',
        }}
      >
        {/* Inner top highlight */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '10%',
            width: '80%',
            height: '30%',
            borderRadius: '14%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Book-as-checkmark: two strips forming a ✓ */}
        {/* Using SVG positioned inside for the icon shapes */}
        <svg
          width="512"
          height="512"
          viewBox="0 0 100 100"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E8EFFF" />
            </linearGradient>
          </defs>

          {/* Left page (short leg): spine(50,62) → tip(22,78) */}
          <path
            d="M46.53,55.92 L18.53,71.92 L25.47,84.08 L53.47,68.08 Z"
            fill="url(#pg)"
          />
          <circle cx="22" cy="78" r="6.3" fill="url(#pg)" />

          {/* Right page (long diagonal): spine(50,62) → tip(78,28) */}
          <path
            d="M55.40,66.45 L83.40,32.45 L72.60,23.55 L44.60,57.55 Z"
            fill="url(#pg)"
          />
          <circle cx="78" cy="28" r="6.3" fill="url(#pg)" />

          {/* Spine junction dot */}
          <circle cx="50" cy="62" r="5.95" fill="url(#pg)" />

          {/* Gold 6-point star above spine */}
          <path
            d="M50,17.5 L51.6,22.23 L56.5,21.25 L53.2,25 L56.5,28.75 L51.6,27.77 L50,32.5 L48.4,27.77 L43.5,28.75 L46.8,25 L43.5,21.25 L48.4,22.23 Z"
            fill="#FFC928"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
