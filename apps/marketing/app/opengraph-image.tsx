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
          background: '#1e4fd9',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 24, color: '#f5b800', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
          Philippines Licensure Exam Reviewer
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
          ReviewNatin
        </div>
        <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.85)', marginTop: 24, textAlign: 'center' }}>
          CSE · LET · PNLE
        </div>
        <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', marginTop: 20 }}>
          Review together. Pass together.
        </div>
      </div>
    ),
    { ...size }
  );
}
