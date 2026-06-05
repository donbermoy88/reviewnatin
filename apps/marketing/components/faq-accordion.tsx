'use client';

import { useState } from 'react';

const QA = [
  { q: 'Available ba sa iOS at Android?', a: 'Oo! ReviewNatin PH is on both the App Store (iOS 15+) and Google Play (Android 8+). Same account works on both.' },
  { q: 'Free ba talaga or may catch?', a: 'The Free tier is forever free with 50 questions per day across CSE, PNLE, and LET. Premium unlocks unlimited usage and Kuya AI, with a 7-day trial — no card needed.' },
  { q: 'Pwede ba offline?', a: 'Yes, Premium users can download exam packs for offline review — great for long commutes, brownouts, or sa probinsya na walang signal.' },
  { q: 'How updated are the questions?', a: 'We review and expand the CSE, PNLE, and LET question banks regularly, adding new items and refining explanations as the exams evolve.' },
  { q: 'Is my progress safe if I switch phones?', a: 'Lahat ng data ay naka-cloud-sync with your account. Sign in on a new device and everything is there — streak intact.' },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number>(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {QA.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            onClick={() => setOpen(isOpen ? -1 : i)}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '20px 24px',
              border: `1px solid ${isOpen ? '#0B5FFF' : '#E7ECF5'}`,
              cursor: 'pointer',
              boxShadow: isOpen ? '0 4px 16px rgba(11,95,255,0.08)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: '#0E1B3D', letterSpacing: '-0.015em' }}>
                {item.q}
              </span>
              <div style={{
                width: 28, height: 28, borderRadius: 99, flexShrink: 0,
                background: isOpen ? '#0B5FFF' : '#F2F5FB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: isOpen ? 'rotate(45deg)' : 'none',
                transition: 'all 0.2s',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke={isOpen ? '#fff' : '#0E1B3D'} strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            {isOpen && (
              <p style={{ fontSize: 15, color: '#5B6B8C', lineHeight: 1.6, marginTop: 14, fontWeight: 500 }}>
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
