import type { CSSProperties } from 'react';
import { FaqAccordion } from '../components/faq-accordion';

// ── Design tokens ──────────────────────────────────────────
const RN = {
  royal:     '#0B5FFF',
  royalLight:'#3B82FF',
  navy:      '#08245C',
  gold:      '#FFC928',
  goldDeep:  '#F5A623',
  bg:        '#FAFBFE',
  ink:       '#0E1B3D',
  inkSub:    '#5B6B8C',
  inkMute:   '#9AA7BF',
  line:      '#E7ECF5',
};

// ── BrandMark — exact port of RNIcon from Claude Logo design ──
// Book-as-checkmark: two page strips forming a ✓, gold 6-pt star above spine.
function BrandMark({ size = 40 }: { size?: number }) {
  // Unique gradient IDs per size to avoid SSR collisions
  const uid = `rn${size}`;

  // ── Book geometry (100×100 unit space) ──
  const spineX = 50, spineY = 62;
  const lx1 = 22, ly1 = 78;   // left tip
  const rx1 = 78, ry1 = 28;   // right tip
  const pw = 7;                 // half-width of page strip

  // Left page normal
  const ldx = lx1 - spineX, ldy = ly1 - spineY;
  const lLen = Math.sqrt(ldx * ldx + ldy * ldy);
  const lnx = -ldy / lLen * pw, lny = ldx / lLen * pw;
  const leftPts = [
    [spineX + lnx, spineY + lny], [lx1 + lnx, ly1 + lny],
    [lx1 - lnx, ly1 - lny],       [spineX - lnx, spineY - lny],
  ];

  // Right page normal
  const rdx = rx1 - spineX, rdy = ry1 - spineY;
  const rLen = Math.sqrt(rdx * rdx + rdy * rdy);
  const rnx = -rdy / rLen * pw, rny = rdx / rLen * pw;
  const rightPts = [
    [spineX + rnx, spineY + rny], [rx1 + rnx, ry1 + rny],
    [rx1 - rnx, ry1 - rny],       [spineX - rnx, spineY - rny],
  ];

  const toPath = (pts: number[][]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z';

  // Gold 6-point star above spine junction
  const starX = 50, starY = 25, starPts = 6, outer = 7.5, inner = 3.2;
  const starPath = Array.from({ length: starPts * 2 }, (_, i) => {
    const a = (i * Math.PI / starPts) - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    return `${i === 0 ? 'M' : 'L'}${(starX + Math.cos(a) * r).toFixed(2)},${(starY + Math.sin(a) * r).toFixed(2)}`;
  }).join(' ') + ' Z';

  const tipR = pw * 0.9;
  const spineR = pw * 0.85;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`${uid}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A72FF" />
          <stop offset="100%" stopColor="#08245C" />
        </linearGradient>
        <linearGradient id={`${uid}pg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8EFFF" />
        </linearGradient>
        <filter id={`${uid}glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="100" height="100" rx="22" fill={`url(#${uid}bg)`} />
      {/* Inner top highlight */}
      <rect x="10" y="6" width="80" height="30" rx="14" fill="white" fillOpacity="0.06" />

      {/* Left page */}
      <path d={toPath(leftPts)} fill={`url(#${uid}pg)`} />
      <circle cx={lx1} cy={ly1} r={tipR} fill={`url(#${uid}pg)`} />

      {/* Right page */}
      <path d={toPath(rightPts)} fill={`url(#${uid}pg)`} />
      <circle cx={rx1} cy={ry1} r={tipR} fill={`url(#${uid}pg)`} />

      {/* Spine junction */}
      <circle cx={spineX} cy={spineY} r={spineR} fill={`url(#${uid}pg)`} />

      {/* Gold star */}
      <path d={starPath} fill="#FFC928" filter={`url(#${uid}glow)`} />
    </svg>
  );
}

function Wordmark({ size = 22, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span style={{ fontWeight: 800, fontSize: size, letterSpacing: '-0.03em', lineHeight: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: dark ? '#fff' : RN.navy }}>Review</span>
      <span style={{ color: dark ? RN.gold : RN.royal }}>Natin</span>
      <sup style={{ color: dark ? RN.gold : RN.royal, fontSize: size * 0.45, fontWeight: 700, marginLeft: 1 }}>PH</sup>
    </span>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '6px 14px',
      background: 'rgba(11,95,255,0.08)', color: RN.royal,
      fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
      borderRadius: 99,
    }}>{text}</span>
  );
}

// ── App Store Badges ────────────────────────────────────────
function AppStoreBadge({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#" style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      background: dark ? '#000' : RN.ink, color: '#fff',
      padding: '11px 20px', borderRadius: 14,
      textDecoration: 'none',
      border: '1px solid rgba(255,255,255,0.1)',
      minWidth: 170,
    }}>
      <svg width="26" height="30" viewBox="0 0 24 28" fill="#fff">
        <path d="M17.05 13.66c-.03-2.97 2.42-4.4 2.53-4.47-1.38-2.02-3.53-2.3-4.3-2.33-1.83-.19-3.57 1.08-4.5 1.08-.93 0-2.36-1.05-3.88-1.02-2 .03-3.84 1.16-4.87 2.95-2.08 3.6-.53 8.93 1.5 11.85.99 1.43 2.17 3.04 3.71 2.98 1.5-.06 2.06-.96 3.87-.96 1.8 0 2.32.96 3.9.93 1.6-.03 2.62-1.46 3.6-2.9 1.13-1.67 1.6-3.28 1.62-3.36-.04-.02-3.1-1.19-3.13-4.72zm-2.96-8.7c.82-1 1.38-2.4 1.22-3.78-1.18.05-2.62.79-3.47 1.77-.76.87-1.43 2.27-1.25 3.63 1.32.1 2.67-.66 3.5-1.62z" />
      </svg>
      <div>
        <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, letterSpacing: '0.02em' }}>Download on the</div>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 1 }}>App Store</div>
      </div>
    </a>
  );
}

function PlayStoreBadge() {
  return (
    <a href="#" style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      background: RN.ink, color: '#fff',
      padding: '11px 20px', borderRadius: 14,
      textDecoration: 'none',
      border: '1px solid rgba(255,255,255,0.1)',
      minWidth: 170,
    }}>
      <svg width="26" height="30" viewBox="0 0 28 32">
        <defs>
          <linearGradient id="ps1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00C7B7" /><stop offset="100%" stopColor="#1FD27D" /></linearGradient>
          <linearGradient id="ps2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD93D" /><stop offset="100%" stopColor="#F2A93B" /></linearGradient>
          <linearGradient id="ps3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF7676" /><stop offset="100%" stopColor="#FF3D00" /></linearGradient>
          <linearGradient id="ps4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2196F3" /><stop offset="100%" stopColor="#0D47A1" /></linearGradient>
        </defs>
        <path d="M3 2v28l12-14z" fill="url(#ps4)" />
        <path d="M3 2l20 12-5 5L3 2z" fill="url(#ps1)" />
        <path d="M23 14l4 2.5c1 .6 1 2.4 0 3L23 22l-5-4z" fill="url(#ps2)" />
        <path d="M3 30l20-12-5-4L3 30z" fill="url(#ps3)" />
      </svg>
      <div>
        <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, letterSpacing: '0.02em' }}>GET IT ON</div>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 1 }}>Google Play</div>
      </div>
    </a>
  );
}

// ── Phone shell (scaled iPhone frame) ──────────────────────
function PhoneShell({ children, scale = 0.45, rotate = 0, glow = false }: {
  children: React.ReactNode;
  scale?: number;
  rotate?: number;
  glow?: boolean;
}) {
  const W = 390, H = 844;
  return (
    <div style={{
      width: W * scale,
      height: H * scale,
      position: 'relative',
      transform: `rotate(${rotate}deg)`,
      filter: glow
        ? 'drop-shadow(0 24px 48px rgba(11,95,255,0.4))'
        : 'drop-shadow(0 16px 32px rgba(8,36,92,0.22))',
      flexShrink: 0,
    }}>
      <div style={{
        width: W,
        height: H,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
        position: 'absolute',
        top: 0,
        left: 0,
        borderRadius: 52,
        background: '#0c1a35',
        border: '9px solid #1a2e50',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}>
        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          width: 110, height: 30, borderRadius: 15,
          background: '#000', zIndex: 10,
        }} />
        <div style={{ width: '100%', height: '100%', paddingTop: 54, overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── App screen mockups ──────────────────────────────────────
function ScreenHome() {
  return (
    <div style={{ height: '100%', background: '#0a1628', padding: '0 20px', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 6px', fontSize: 13, color: '#fff', fontWeight: 600 }}>
        <span>9:41</span><span>●●●</span>
      </div>
      <div style={{ paddingTop: 6 }}>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>Magandang umaga!</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 3, letterSpacing: '-0.02em' }}>Ana R. 🎯</div>
      </div>
      <div style={{ marginTop: 18, background: 'rgba(255,201,40,0.14)', borderRadius: 20, padding: '14px 18px', border: '1px solid rgba(255,201,40,0.28)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 34 }}>🔥</div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#FFC928', lineHeight: 1 }}>14</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginTop: 2 }}>day streak</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>32<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>/50</span></div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>today</div>
        </div>
      </div>
      <div style={{ marginTop: 12, height: 7, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: '64%', background: '#0B5FFF', borderRadius: 99 }} />
      </div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Practice',   emoji: '📝', bg: '#0B5FFF' },
          { label: 'Flashcards', emoji: '🃏', bg: '#7B2CBF' },
          { label: 'Mock Exam',  emoji: '⏱️', bg: '#F5A623' },
          { label: 'Analytics',  emoji: '📊', bg: '#22C55E' },
        ].map(a => (
          <div key={a.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{a.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{a.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenExam() {
  return (
    <div style={{ height: '100%', background: '#fff', padding: '0 20px', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 6px', fontSize: 13, color: '#0E1B3D', fontWeight: 600 }}>
        <span>9:41</span><span>●●●</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <div style={{ fontSize: 20 }}>←</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0E1B3D' }}>CSE Professional</div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5B6B8C', fontWeight: 600 }}>
        <span>Question 12 of 50</span><span>⏱ 28:14</span>
      </div>
      <div style={{ marginTop: 6, height: 6, background: '#E7ECF5', borderRadius: 99 }}>
        <div style={{ height: '100%', width: '24%', background: '#0B5FFF', borderRadius: 99 }} />
      </div>
      <div style={{ marginTop: 18, fontSize: 16, fontWeight: 700, color: '#0E1B3D', lineHeight: 1.5 }}>
        Which branch of government enacts national laws in the Philippines?
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[['Executive', false], ['Judicial', false], ['Legislative', true], ['Administrative', false]].map(([c, sel], i) => (
          <div key={String(c)} style={{
            padding: '13px 16px', borderRadius: 14,
            background: sel ? 'rgba(11,95,255,0.08)' : '#F8F9FC',
            border: `1.5px solid ${sel ? '#0B5FFF' : '#E7ECF5'}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: sel ? '#0B5FFF' : '#fff', border: `1.5px solid ${sel ? '#0B5FFF' : '#E7ECF5'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: sel ? '#fff' : '#9AA7BF' }}>
              {String.fromCharCode(65 + i)}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: sel ? '#0B5FFF' : '#0E1B3D' }}>{String(c)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenProfile() {
  const bars = [
    { label: 'Verbal',       pct: 82, color: '#0B5FFF' },
    { label: 'Numerical',    pct: 68, color: '#7B2CBF' },
    { label: 'Analytical',   pct: 75, color: '#22C55E' },
    { label: 'General Info', pct: 91, color: '#F5A623' },
  ];
  return (
    <div style={{ height: '100%', background: '#FAFBFE', padding: '0 20px', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 6px', fontSize: 13, color: '#0E1B3D', fontWeight: 600 }}>
        <span>9:41</span><span>●●●</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0E1B3D', marginTop: 10 }}>My Progress</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'conic-gradient(#0B5FFF 0deg 270deg, #E7ECF5 270deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 82, height: 82, borderRadius: '50%', background: '#FAFBFE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0B5FFF', lineHeight: 1 }}>75%</div>
            <div style={{ fontSize: 11, color: '#5B6B8C', fontWeight: 600 }}>Readiness</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#0E1B3D', marginBottom: 5 }}>
              <span>{b.label}</span><span style={{ color: b.color }}>{b.pct}%</span>
            </div>
            <div style={{ height: 7, background: '#E7ECF5', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${b.pct}%`, background: b.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NAV ────────────────────────────────────────────────────
function Nav() {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(250,251,254,0.88)', backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${RN.line}`,
    }}>
      <div className="rn-nav" style={{ maxWidth: 1240, margin: '0 auto', padding: '15px 32px', display: 'flex', alignItems: 'center', gap: 32 }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <BrandMark size={36} />
          <Wordmark size={19} />
        </a>
        <nav className="rn-nav-links" style={{ display: 'flex', gap: 28, marginLeft: 20 }}>
          {['Features', 'Exams', 'Pricing', 'About', 'Support'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 14, fontWeight: 600, color: RN.inkSub, textDecoration: 'none' }}>{l}</a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <a href="/subscribe" style={{ fontSize: 14, fontWeight: 700, color: RN.ink, textDecoration: 'none' }}>Log in</a>
        <a href="#" style={{
          padding: '10px 18px', background: RN.royal, color: '#fff',
          fontSize: 14, fontWeight: 700, borderRadius: 10,
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(11,95,255,0.28)',
        }}>Download now</a>
      </div>
    </div>
  );
}

// ── HERO ───────────────────────────────────────────────────
function Hero() {
  const starPositions = [
    { x: 12, y: 22, s: 14 }, { x: 85, y: 18, s: 18 },
    { x: 8, y: 70, s: 10 },  { x: 78, y: 75, s: 12 },
  ];
  return (
    <section style={{
      position: 'relative',
      background: 'linear-gradient(180deg, #FAFBFE 0%, #EEF3FF 100%)',
      overflow: 'hidden',
      paddingTop: 80, paddingBottom: 100,
    }}>
      <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(11,95,255,0.12) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,201,40,0.15) 0%, transparent 70%)' }} />
      {starPositions.map((s, i) => (
        <svg key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, opacity: 0.4 }} width={s.s} height={s.s} viewBox="0 0 20 20">
          <path d="M10 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={RN.gold} />
        </svg>
      ))}

      <div className="rn-hero-grid" style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 40, alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#fff', border: `1px solid ${RN.line}`, borderRadius: 99, fontSize: 12, fontWeight: 700, color: RN.royal, boxShadow: '0 2px 8px rgba(8,36,92,0.05)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: '#22C55E', boxShadow: '0 0 0 4px rgba(34,197,94,0.2)', display: 'inline-block' }} />
            Now in beta · Free for early reviewers
          </div>

          <h1 className="rn-h1" style={{ fontSize: 62, fontWeight: 800, color: RN.ink, letterSpacing: '-0.035em', lineHeight: 1.06, marginTop: 20 }}>
            Your study buddy<br />
            for every{' '}
            <span style={{ background: `linear-gradient(120deg, ${RN.royal}, ${RN.navy})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Filipino exam
            </span>.
          </h1>

          <p style={{ fontSize: 18, color: RN.inkSub, marginTop: 22, lineHeight: 1.55, fontWeight: 500, maxWidth: 530 }}>
            Civil Service (CSE), Nursing (PNLE), and LET — one app, one streak, isang goal.{' '}
            <b style={{ color: RN.ink }}>Review together. Pass together.</b>
          </p>

          <div style={{ display: 'flex', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
            <AppStoreBadge />
            <PlayStoreBadge />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 36 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: RN.ink, letterSpacing: '-0.02em' }}>1,600+</div>
              <div style={{ fontSize: 12, color: RN.inkSub, fontWeight: 600 }}>practice questions</div>
            </div>
            <div style={{ width: 1, height: 40, background: RN.line }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: RN.ink, letterSpacing: '-0.02em' }}>EN + TL</div>
              <div style={{ fontSize: 12, color: RN.inkSub, fontWeight: 600 }}>bilingual explanations</div>
            </div>
            <div style={{ width: 1, height: 40, background: RN.line }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: RN.ink, letterSpacing: '-0.02em' }}>₱0</div>
              <div style={{ fontSize: 12, color: RN.inkSub, fontWeight: 600 }}>free to start</div>
            </div>
          </div>
        </div>

        <div className="rn-hero-phones" style={{ position: 'relative', height: 520, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', top: 50, left: 20, opacity: 0.88, zIndex: 1 }}>
            <PhoneShell scale={0.41} rotate={-8}><ScreenExam /></PhoneShell>
          </div>
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
            <PhoneShell scale={0.45} rotate={5} glow><ScreenHome /></PhoneShell>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── TRUST BAR ──────────────────────────────────────────────
function TrustBar() {
  const exams = ['Civil Service (CSE Pro & Sub)', 'Nursing (PNLE)', 'LET — Elementary & Secondary', 'PRC · UPCAT · Bar — coming soon'];
  return (
    <section style={{ borderTop: `1px solid ${RN.line}`, borderBottom: `1px solid ${RN.line}`, background: '#fff' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '26px 32px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: RN.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Covers</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', flex: 1 }}>
          {exams.map(e => (
            <span key={e} style={{ fontSize: 14, fontWeight: 700, color: RN.inkSub, letterSpacing: '-0.01em' }}>{e}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ───────────────────────────────────────────────
const FIcons = {
  Books: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="6" height="16" rx="1" stroke="#0B5FFF" strokeWidth="2"/><rect x="11" y="6" width="6" height="14" rx="1" stroke="#0B5FFF" strokeWidth="2"/><path d="M19 8l2 .5-3 12-2-.5z" stroke="#0B5FFF" strokeWidth="2" strokeLinejoin="round"/></svg>,
  Brain: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M9 4a3 3 0 00-3 3v1a3 3 0 00-2 3v2a3 3 0 002 3 3 3 0 003 3h2V4H9zM15 4a3 3 0 013 3v1a3 3 0 012 3v2a3 3 0 01-2 3 3 3 0 01-3 3h-2V4h2z" stroke="#7B2CBF" strokeWidth="2" strokeLinejoin="round"/></svg>,
  Trophy: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M9 18h6M12 14v4" stroke="#FFC928" strokeWidth="2" strokeLinecap="round"/></svg>,
  Flame: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2s4 4 4 8a4 4 0 11-8 0c0-1 .5-2 .5-2S6 11 6 14a6 6 0 1012 0c0-6-6-12-6-12z" stroke="#FF7A3D" strokeWidth="2" strokeLinejoin="round"/></svg>,
  Chart: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3 20h18M6 16v-4M11 16V8M16 16V4" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  AI:    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="13" rx="3" stroke="#0B5FFF" strokeWidth="2"/><circle cx="9" cy="12" r="1.5" fill="#0B5FFF"/><circle cx="15" cy="12" r="1.5" fill="#0B5FFF"/><path d="M12 3v3M8 19v2M16 19v2" stroke="#0B5FFF" strokeWidth="2" strokeLinecap="round"/></svg>,
};

function Features() {
  const items = [
    { icon: FIcons.Books,  color: '#E8F0FF', title: 'Built for CSE, PNLE & LET',   body: 'Civil Service, Nursing, and Teacher board exams — 1,600+ vetted questions and counting, with more exams on the way.' },
    { icon: FIcons.AI,     color: '#E8F0FF', title: 'Ask Kuya AI',                body: 'Stuck on an item? Tap to get a step-by-step Filipino explanation in seconds.' },
    { icon: FIcons.Flame,  color: '#FFEEE4', title: 'Streaks that stick',          body: 'Daily goals, gentle reminders, and milestone celebrations — habit muna, pass na.' },
    { icon: FIcons.Trophy, color: '#FFF4DC', title: 'Compete with friends',        body: 'Region, friends, and global leaderboards. Sino ang #1 sa LET ngayong week?' },
    { icon: FIcons.Chart,  color: '#E4F8EC', title: 'Know where to focus',         body: 'Topic-level accuracy breakdowns show you the weak spots before exam day.' },
    { icon: FIcons.Brain,  color: '#F1E8FA', title: 'Flashcards & mock exams',     body: 'Spaced-repetition flashcards plus full 100-item timed mocks under real conditions.' },
  ];
  return (
    <section id="features" className="rn-section" style={{ padding: '120px 32px', maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Pill text="WHY REVIEWNATIN" />
        <h2 className="rn-h2" style={{ fontSize: 46, fontWeight: 800, color: RN.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 16 }}>
          Built for Filipino learners,<br />
          <span style={{ color: RN.royal }}>not generic test prep.</span>
        </h2>
        <p style={{ fontSize: 17, color: RN.inkSub, marginTop: 16, fontWeight: 500, maxWidth: 560, margin: '16px auto 0' }}>
          Six things every reviewer wished their book had — wrapped in one Tagalog-friendly app.
        </p>
      </div>
      <div className="rn-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {items.map(it => (
          <div key={it.title} style={{ background: '#fff', borderRadius: 22, padding: 28, border: `1px solid ${RN.line}`, boxShadow: '0 2px 12px rgba(8,36,92,0.04)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: it.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>{it.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: RN.ink, letterSpacing: '-0.015em' }}>{it.title}</div>
            <div style={{ fontSize: 14, color: RN.inkSub, marginTop: 8, lineHeight: 1.55, fontWeight: 500 }}>{it.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── SHOWCASE ───────────────────────────────────────────────
function Showcase() {
  const stars = [
    { x: 8, y: 15, s: 14 }, { x: 92, y: 25, s: 18 },
    { x: 12, y: 80, s: 12 }, { x: 88, y: 75, s: 16 },
    { x: 50, y: 8,  s: 10 }, { x: 30, y: 90, s: 8 },
  ];
  const steps = [
    { num: '01', title: 'Pick your exam',      body: 'Choose CSE, PNLE, or LET — set a daily goal that fits your life.',    screen: <ScreenExam /> },
    { num: '02', title: 'Review every day',    body: 'Bite-sized quizzes, flashcards, and Taglish explanations build mastery day by day.',      screen: <ScreenHome /> },
    { num: '03', title: 'Track your progress', body: 'See exactly where you stand by topic. Take a mock exam when you feel ready.',             screen: <ScreenProfile /> },
  ];
  return (
    <section className="rn-section" style={{ background: `linear-gradient(165deg, ${RN.navy} 0%, ${RN.royal} 100%)`, padding: '120px 32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {stars.map((s, i) => (
        <svg key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, opacity: 0.5 }} width={s.s} height={s.s} viewBox="0 0 20 20">
          <path d="M10 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={RN.gold} />
        </svg>
      ))}
      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ display: 'inline-block', padding: '6px 14px', background: 'rgba(255,201,40,0.2)', color: RN.gold, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 99 }}>HOW IT WORKS</span>
          <h2 className="rn-h2" style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 16 }}>
            Three steps to your<br />
            <span style={{ color: RN.gold }}>passing score.</span>
          </h2>
        </div>
        <div className="rn-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, alignItems: 'start' }}>
          {steps.map(s => (
            <div key={s.num} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                <PhoneShell scale={0.37}>{s.screen}</PhoneShell>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: RN.gold, letterSpacing: '0.1em' }}>STEP {s.num}</div>
              <div style={{ fontSize: 21, fontWeight: 800, marginTop: 8, letterSpacing: '-0.02em' }}>{s.title}</div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 10, lineHeight: 1.55, fontWeight: 500, maxWidth: 260, margin: '10px auto 0' }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── STATS ──────────────────────────────────────────────────
function Stats() {
  const items = [
    { n: '1,600+', l: 'Practice questions' },
    { n: '5',      l: 'Exam tracks (CSE, PNLE, LET)' },
    { n: 'EN + TL', l: 'Bilingual explanations' },
    { n: '₱0',     l: 'Free to start' },
  ];
  return (
    <section className="rn-section" style={{ padding: '80px 32px', background: '#fff', borderTop: `1px solid ${RN.line}`, borderBottom: `1px solid ${RN.line}` }}>
      <div className="rn-grid-4" style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 30 }}>
        {items.map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, background: `linear-gradient(120deg, ${RN.royal}, ${RN.navy})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: RN.inkSub, marginTop: 8 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PRICING ────────────────────────────────────────────────
function Pricing() {
  const plans = [
    { name: 'Free',          price: '₱0',     sub: 'Forever free, no card needed',         features: ['CSE, PNLE & LET question banks', '50 questions per day', 'Daily streak & basic stats', 'Friends leaderboard'],                                                          cta: 'Download free',        ctaHref: '#',           highlight: false },
    { name: 'Premium',       price: '₱159',   sub: 'monthly, ₱699 for 6 months, or ₱1,499 yearly',          features: ['Practice quizzes, mocks, flashcards, diagnostics', 'PasaPath review guidance', 'Progress tracking and weak-area recommendations', 'Offline review packs on longer plans', 'No ads, walang abala'],                              cta: 'Start 7-day free trial', ctaHref: '/subscribe',  highlight: true  },
    { name: 'Review Center', price: 'Custom', sub: 'For schools & review centers',          features: ['Bulk student licenses', 'Custom question banks', 'Class & batch leaderboards', 'Performance reports for instructors', 'Priority support'],                              cta: 'Contact sales',        ctaHref: '#',           highlight: false },
  ];
  return (
    <section id="pricing" className="rn-section" style={{ padding: '120px 32px', background: '#fff' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <Pill text="PRICING" />
          <h2 className="rn-h2" style={{ fontSize: 46, fontWeight: 800, color: RN.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 16 }}>
            Start free. Upgrade when ka-ready.
          </h2>
        </div>
        <div className="rn-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'center' }}>
          {plans.map(p => (
            <div key={p.name} className="rn-pricing-card" style={{
              background: p.highlight ? `linear-gradient(165deg, ${RN.royal}, ${RN.navy})` : '#fff',
              color: p.highlight ? '#fff' : RN.ink,
              borderRadius: 24, padding: 32,
              border: p.highlight ? 'none' : `1px solid ${RN.line}`,
              boxShadow: p.highlight ? '0 16px 40px rgba(11,95,255,0.28)' : '0 2px 12px rgba(8,36,92,0.04)',
              position: 'relative',
              transform: p.highlight ? 'scale(1.03)' : 'none',
            }}>
              {p.highlight && (
                <div style={{ position: 'absolute', top: -12, right: 28, padding: '5px 12px', background: RN.gold, color: RN.navy, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', borderRadius: 99 }}>MOST POPULAR</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: p.highlight ? RN.gold : RN.inkSub }}>{p.name}</div>
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 50, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1 }}>{p.price}</span>
              </div>
              <div style={{ fontSize: 13, color: p.highlight ? 'rgba(255,255,255,0.7)' : RN.inkSub, marginTop: 6, fontWeight: 500 }}>{p.sub}</div>
              <div style={{ height: 1, background: p.highlight ? 'rgba(255,255,255,0.15)' : RN.line, margin: '24px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 99, background: p.highlight ? RN.gold : '#E4F8EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke={p.highlight ? RN.navy : '#22C55E'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: p.highlight ? 'rgba(255,255,255,0.92)' : RN.ink }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={p.ctaHref} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 28, height: 52, borderRadius: 14,
                background: p.highlight ? RN.gold : RN.royal,
                color: p.highlight ? RN.navy : '#fff',
                fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em',
                textDecoration: 'none',
              } as CSSProperties}>{p.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────
function FAQSection() {
  return (
    <section className="rn-section" style={{ padding: '120px 32px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <Pill text="FAQ" />
        <h2 className="rn-h2" style={{ fontSize: 42, fontWeight: 800, color: RN.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 16 }}>
          Madalas itanong
        </h2>
      </div>
      <FaqAccordion />
    </section>
  );
}

// ── FINAL CTA ──────────────────────────────────────────────
function FinalCTA() {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30) * Math.PI / 180;
    return { x2: 50 + Math.cos(a) * 60, y2: 50 + Math.sin(a) * 60 };
  });
  return (
    <section style={{ margin: '0 auto 80px', maxWidth: 1180, padding: '0 32px' }}>
      <div style={{ background: `linear-gradient(165deg, ${RN.royal} 0%, ${RN.navy} 100%)`, borderRadius: 32, padding: '80px 60px', color: '#fff', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <svg style={{ position: 'absolute', right: -100, top: -100, opacity: 0.12 }} width="400" height="400" viewBox="0 0 100 100">
          {rays.map((r, i) => <line key={i} x1="50" y1="50" x2={r.x2} y2={r.y2} stroke={RN.gold} strokeWidth="3" />)}
          <circle cx="50" cy="50" r="18" fill={RN.gold} />
        </svg>
        <svg style={{ position: 'absolute', left: -60, bottom: -60, opacity: 0.1 }} width="280" height="280" viewBox="0 0 20 20">
          <path d="M10 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={RN.gold} />
        </svg>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <BrandMark size={64} />
          </div>
          <h2 className="rn-h2" style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05, maxWidth: 700, margin: '0 auto' }}>
            Magtaas ng GWA.<br />
            <span style={{ color: RN.gold }}>Magpasa together.</span>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 20, fontWeight: 500, maxWidth: 520, margin: '20px auto 0' }}>
            Be one of the first Filipinos reviewing with ReviewNatin. Free while in beta, no credit card needed.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
            <AppStoreBadge dark />
            <PlayStoreBadge />
          </div>
          <div style={{ marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
            Available on iOS 15+ · Android 8+ · 87 MB
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ─────────────────────────────────────────────────
function Footer() {
  const cols = [
    { h: 'Product', items: ['Features', 'Pricing', 'Exams covered', "What's new", 'Mobile apps'] },
    { h: 'Exams',   items: ['Civil Service (CSE)', 'Nursing (PNLE)', 'LET — Teachers', 'PRC · UPCAT · Bar (soon)'] },
    { h: 'Company', items: ['About', 'Careers', 'Blog', 'Press kit', 'Contact'] },
    { h: 'Support', items: ['Help center', 'Privacy policy', 'Terms of service', 'Refunds', 'Report content'] },
  ];
  return (
    <footer style={{ background: RN.ink, color: 'rgba(255,255,255,0.7)', padding: '60px 32px 40px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div className="rn-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 40, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <BrandMark size={34} />
              <Wordmark size={18} dark />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>
              Your all-in-one Filipino exam reviewer for CSE, PNLE & LET — review together, pass together.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {['FB', 'IG', 'TT', 'YT'].map(s => (
                <div key={s} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{s}</div>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.h}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>{col.h}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.items.map(item => (
                  <a key={item} href="#" style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>{item}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>© 2026 ReviewNatin PH · Made with ❤️ in Manila</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>🇵🇭 Para sa bawat Pilipinong nag-aaral</div>
        </div>
      </div>
    </footer>
  );
}

// ── PAGE ───────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Nav />
      <Hero />
      <TrustBar />
      <Features />
      <Showcase />
      <Stats />
      <Pricing />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </>
  );
}
