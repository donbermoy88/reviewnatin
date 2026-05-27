/**
 * Generates abstract-reasoning SVG images, uploads them to Supabase Storage,
 * and inserts the questions into the DB.
 *
 * Run:  node scripts/seed-abstract-reasoning.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yohewfdafdmwntsbzgxx.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvaGV3ZmRhZmRtd250c2J6Z3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTUwNjQ0NCwiZXhwIjoyMDk1MDgyNDQ0fQ.lTZKF3B-9DpxpskSgRPP-f1-m5QddGv0I4wt74gv3sE';

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ─── SVG helpers ──────────────────────────────────────────────────────────────

const W = 360, H = 260;
const CELL = 80;

const COLORS = {
  fill: '#1e4fd9',
  outline: '#1e4fd9',
  bg: '#f8f9ff',
  missing: '#e2e8f0',
  grid: '#cbd5e1',
};

function svgWrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="background:${COLORS.bg}">
${body}
</svg>`;
}

// Shape primitives
function circle(cx, cy, r, filled) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${filled ? COLORS.fill : 'none'}" stroke="${COLORS.outline}" stroke-width="2.5"/>`;
}
function square(cx, cy, s, filled) {
  const h = s / 2;
  return `<rect x="${cx - h}" y="${cy - h}" width="${s}" height="${s}" fill="${filled ? COLORS.fill : 'none'}" stroke="${COLORS.outline}" stroke-width="2.5" rx="2"/>`;
}
function triangle(cx, cy, s, filled) {
  const h = s * 0.87;
  const pts = `${cx},${cy - h * 0.67} ${cx - s / 2},${cy + h * 0.33} ${cx + s / 2},${cy + h * 0.33}`;
  return `<polygon points="${pts}" fill="${filled ? COLORS.fill : 'none'}" stroke="${COLORS.outline}" stroke-width="2.5"/>`;
}
function diamond(cx, cy, s, filled) {
  const h = s * 0.7;
  const pts = `${cx},${cy - h} ${cx + s * 0.6},${cy} ${cx},${cy + h} ${cx - s * 0.6},${cy}`;
  return `<polygon points="${pts}" fill="${filled ? COLORS.fill : 'none'}" stroke="${COLORS.outline}" stroke-width="2.5"/>`;
}
function cross(cx, cy, s) {
  const t = s * 0.22, h = s / 2;
  return `<path d="M${cx - t} ${cy - h} h${2 * t} v${h - t} h${h - t} v${2 * t} h${-(h - t)} v${h - t} h${-(2 * t)} v${-(h - t)} h${-(h - t)} v${-(2 * t)} h${h - t} z"
    fill="${COLORS.fill}" stroke="none"/>`;
}
function star(cx, cy, s) {
  const r1 = s / 2, r2 = s * 0.22, pts = 5;
  let d = '';
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI / pts) * i - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }
  return `<path d="${d}Z" fill="${COLORS.fill}" stroke="none"/>`;
}

function shape(type, cx, cy, size = 28, filled = true) {
  switch (type) {
    case 'circle':   return circle(cx, cy, size * 0.5, filled);
    case 'square':   return square(cx, cy, size, filled);
    case 'triangle': return triangle(cx, cy, size, filled);
    case 'diamond':  return diamond(cx, cy, size * 0.9, filled);
    case 'cross':    return cross(cx, cy, size);
    case 'star':     return star(cx, cy, size);
    default: return circle(cx, cy, size * 0.5, filled);
  }
}

// 3×3 grid helper — returns SVG string + labels for 9 cells
// cells is array of {type, filled, count, size} or null (for missing cell = '?')
function grid3x3(cells, label = '?', labelPos = 8) {
  const padX = 40, padY = 20;
  const gap = 90;
  let out = '';

  // Grid lines
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = padX + c * gap, y = padY + r * gap;
      out += `<rect x="${x}" y="${y}" width="${gap - 4}" height="${gap - 4}" fill="none" stroke="${COLORS.grid}" stroke-width="1" rx="4"/>`;
    }
  }

  cells.forEach((cell, i) => {
    const r = Math.floor(i / 3), c = i % 3;
    const cx = padX + c * gap + (gap - 4) / 2;
    const cy = padY + r * gap + (gap - 4) / 2;
    if (i === labelPos || cell === null) {
      out += `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="26" font-family="sans-serif" fill="${COLORS.grid}" font-weight="bold">?</text>`;
      return;
    }
    const count = cell.count || 1;
    if (count === 1) {
      out += shape(cell.type, cx, cy, cell.size || 26, cell.filled !== false);
    } else {
      const offsets = [
        [[-14, 0], [14, 0]],
        [[-18, 0], [0, 0], [18, 0]],
        [[-14, -8], [14, -8], [-14, 8], [14, 8]],
      ];
      const off = offsets[count - 2] || offsets[0];
      off.forEach(([dx, dy]) => {
        out += shape(cell.type, cx + dx, cy + dy, 18, cell.filled !== false);
      });
    }
  });

  return svgWrap(out);
}

// Horizontal series (1 row of 4, one missing at end)
function series4(cells) {
  const padX = 20, padY = 60, gap = 82;
  let out = '';
  cells.forEach((cell, i) => {
    const cx = padX + i * gap + (gap / 2);
    const cy = padY + 60;
    out += `<rect x="${padX + i * gap}" y="${padY}" width="${gap - 8}" height="${gap}" fill="none" stroke="${COLORS.grid}" stroke-width="1" rx="4"/>`;
    if (i === cells.length - 1) {
      out += `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="26" font-family="sans-serif" fill="${COLORS.grid}" font-weight="bold">?</text>`;
    } else if (cell) {
      const count = cell.count || 1;
      if (count === 1) {
        out += shape(cell.type, cx, cy, cell.size || 26, cell.filled !== false);
      } else {
        const step = 22;
        const startX = cx - (count - 1) * step / 2;
        for (let k = 0; k < count; k++) {
          out += shape(cell.type, startX + k * step, cy, 16, cell.filled !== false);
        }
      }
    }
  });
  // Arrow
  out += `<text x="${padX + 3 * gap - 4}" y="${padY + 80}" font-size="18" fill="${COLORS.grid}">→</text>`;
  return svgWrap(out);
}

// ─── Question definitions ──────────────────────────────────────────────────────

/*
 Each entry:
 {
   topicSlug: 'pattern-completion' | 'series-completion' | 'analogies' | 'odd-one-out',
   examSlug:  'cse-professional' | 'cse-subprofessional',
   stem, choices [{id,text}], correct_choice_id,
   explanation_en, explanation_fil,
   difficulty: 1-5,
   svg: () => string  — generates the SVG
 }
*/

const QUESTIONS = [
  // ── Pattern Completion ─────────────────────────────────────────────────────

  {
    topicSlug: 'pattern-completion',
    examSlug: 'cse-professional',
    stem: 'Which shape correctly completes the 3×3 pattern?',
    difficulty: 2,
    correct_choice_id: 'b',
    choices: [
      { id: 'a', text: 'Filled square' },
      { id: 'b', text: 'Filled circle' },
      { id: 'c', text: 'Outlined triangle' },
      { id: 'd', text: 'Outlined circle' },
    ],
    explanation_en: 'Each row contains a circle, square, and triangle in that order. The third row has a circle and square, so the missing piece is a triangle — but the key pattern is each column: column 3 always has a triangle. Wait — Column 1 = circles, Column 2 = squares, Column 3 = triangles. Row 3 Col 3 must be a filled triangle.',
    explanation_fil: 'Ang bawat kolumna ay may iisang uri ng hugis: kolumna 1 = bilog, kolumna 2 = parisukat, kolumna 3 = tatsulok. Ang nawawalang piraso sa row 3 kolumna 3 ay tatsulok na puno.',
    svgFn: () => grid3x3([
      { type: 'circle',   filled: true  },
      { type: 'square',   filled: true  },
      { type: 'triangle', filled: true  },
      { type: 'circle',   filled: false },
      { type: 'square',   filled: false },
      { type: 'triangle', filled: false },
      { type: 'circle',   filled: true  },
      { type: 'square',   filled: true  },
      null,
    ]),
  },

  {
    topicSlug: 'pattern-completion',
    examSlug: 'cse-professional',
    stem: 'Each row has shapes with 1, 2, and 3 counts. Which completes the pattern?',
    difficulty: 3,
    correct_choice_id: 'c',
    choices: [
      { id: 'a', text: '1 diamond' },
      { id: 'b', text: '2 diamonds' },
      { id: 'c', text: '3 diamonds' },
      { id: 'd', text: '3 circles' },
    ],
    explanation_en: 'The number of shapes increases from 1 to 3 across each row. Row 3 has 1 diamond and 2 diamonds in the first two columns, so the third column must have 3 diamonds.',
    explanation_fil: 'Ang bilang ng mga hugis ay tumataas mula 1 hanggang 3 sa bawat row. Ang ikatlong row ay may 1 at 2 na dayamante, kaya ang ikatlong kolumna ay kailangan may 3 na dayamante.',
    svgFn: () => grid3x3([
      { type: 'circle',  count: 1 },
      { type: 'circle',  count: 2 },
      { type: 'circle',  count: 3 },
      { type: 'square',  count: 1 },
      { type: 'square',  count: 2 },
      { type: 'square',  count: 3 },
      { type: 'diamond', count: 1 },
      { type: 'diamond', count: 2 },
      null,
    ]),
  },

  {
    topicSlug: 'pattern-completion',
    examSlug: 'cse-professional',
    stem: 'Each row shows shapes that alternate filled and outline. What fills the missing cell?',
    difficulty: 2,
    correct_choice_id: 'a',
    choices: [
      { id: 'a', text: 'Filled triangle' },
      { id: 'b', text: 'Outlined triangle' },
      { id: 'c', text: 'Filled circle' },
      { id: 'd', text: 'Filled square' },
    ],
    explanation_en: 'In each row, the pattern alternates: filled, outlined, filled. Row 3, columns 1 and 2 are filled circle and outlined triangle. Following the pattern, column 3 should be filled — and column 3 always has a triangle. Answer: filled triangle.',
    explanation_fil: 'Sa bawat row, ang pattern ay nagpapalit ng puno, walang punan, puno. Ang ikatlong row ay may punong bilog at walang punan na tatsulok — ang ikatlong cell ay dapat punong tatsulok.',
    svgFn: () => grid3x3([
      { type: 'square',   filled: true  },
      { type: 'square',   filled: false },
      { type: 'square',   filled: true  },
      { type: 'circle',   filled: true  },
      { type: 'circle',   filled: false },
      { type: 'circle',   filled: true  },
      { type: 'triangle', filled: true  },
      { type: 'triangle', filled: false },
      null,
    ]),
  },

  {
    topicSlug: 'pattern-completion',
    examSlug: 'cse-subprofessional',
    stem: 'The shapes in each column are the same type. Which shape belongs in the empty cell?',
    difficulty: 1,
    correct_choice_id: 'd',
    choices: [
      { id: 'a', text: 'Circle' },
      { id: 'b', text: 'Square' },
      { id: 'c', text: 'Diamond' },
      { id: 'd', text: 'Triangle' },
    ],
    explanation_en: 'In this matrix, each column has the same shape type: Column 1 = circles, Column 2 = squares, Column 3 = triangles. The missing cell is in Column 3, so the answer is a triangle.',
    explanation_fil: 'Sa matrix na ito, ang bawat kolumna ay may parehong uri ng hugis: Kolumna 1 = mga bilog, Kolumna 2 = mga parisukat, Kolumna 3 = mga tatsulok. Ang nawawalang cell ay nasa Kolumna 3, kaya ang sagot ay tatsulok.',
    svgFn: () => grid3x3([
      { type: 'circle',   size: 22 },
      { type: 'square',   size: 28 },
      { type: 'triangle', size: 28 },
      { type: 'circle',   size: 28 },
      { type: 'square',   size: 34 },
      { type: 'triangle', size: 34 },
      { type: 'circle',   size: 34 },
      { type: 'square',   size: 40 },
      null,
    ]),
  },

  // ── Series Completion ──────────────────────────────────────────────────────

  {
    topicSlug: 'series-completion',
    examSlug: 'cse-professional',
    stem: 'The series shows shapes increasing in count. What comes next?',
    difficulty: 2,
    correct_choice_id: 'b',
    choices: [
      { id: 'a', text: '3 circles' },
      { id: 'b', text: '4 circles' },
      { id: 'c', text: '5 circles' },
      { id: 'd', text: '3 squares' },
    ],
    explanation_en: 'The series shows 1, 2, 3 circles. The pattern is adding one circle each step. Following this, the next frame must have 4 circles.',
    explanation_fil: 'Ang serye ay nagpapakita ng 1, 2, 3 na bilog. Ang pattern ay nagdadagdag ng isang bilog sa bawat hakbang. Kaya ang susunod ay dapat may 4 na bilog.',
    svgFn: () => series4([
      { type: 'circle', count: 1 },
      { type: 'circle', count: 2 },
      { type: 'circle', count: 3 },
      null,
    ]),
  },

  {
    topicSlug: 'series-completion',
    examSlug: 'cse-professional',
    stem: 'The shapes alternate between filled and outlined. What is the next shape?',
    difficulty: 2,
    correct_choice_id: 'a',
    choices: [
      { id: 'a', text: 'Filled square' },
      { id: 'b', text: 'Outlined square' },
      { id: 'c', text: 'Filled circle' },
      { id: 'd', text: 'Outlined triangle' },
    ],
    explanation_en: 'The pattern alternates: filled square → outlined square → filled square → ? The next must be outlined square — but the series also alternates filled/outlined starting with filled. After 3 filled squares, the 4th would continue the alternation: filled.',
    explanation_fil: 'Ang pattern ay puno → walang punan → puno → ?. Ang susunod na hugis ay dapat punong parisukat.',
    svgFn: () => series4([
      { type: 'square', filled: true  },
      { type: 'square', filled: false },
      { type: 'square', filled: true  },
      null,
    ]),
  },

  {
    topicSlug: 'series-completion',
    examSlug: 'cse-professional',
    stem: 'Each step the shape grows larger. What is the correct next step?',
    difficulty: 2,
    correct_choice_id: 'c',
    choices: [
      { id: 'a', text: 'Small circle' },
      { id: 'b', text: 'Medium circle' },
      { id: 'c', text: 'Large circle' },
      { id: 'd', text: 'Large triangle' },
    ],
    explanation_en: 'The series shows a circle growing from small to medium to large. The next shape in the series is a large circle.',
    explanation_fil: 'Ang serye ay nagpapakita ng lumalaking bilog mula maliit hanggang malaking sukat. Ang susunod ay malaking bilog.',
    svgFn: () => series4([
      { type: 'circle', size: 14 },
      { type: 'circle', size: 22 },
      { type: 'circle', size: 30 },
      null,
    ]),
  },

  {
    topicSlug: 'series-completion',
    examSlug: 'cse-subprofessional',
    stem: 'The shapes in this series rotate through circle → square → triangle. What comes next?',
    difficulty: 1,
    correct_choice_id: 'b',
    choices: [
      { id: 'a', text: 'Circle' },
      { id: 'b', text: 'Square' },
      { id: 'c', text: 'Triangle' },
      { id: 'd', text: 'Diamond' },
    ],
    explanation_en: 'The series follows the order: circle → square → triangle → circle → square → triangle… The series shown is circle, square, triangle, circle — so the next shape must be a square.',
    explanation_fil: 'Ang serye ay sumusunod sa pagkakasunod: bilog → parisukat → tatsulok → bilog… Ang ipinapakita ay bilog, parisukat, tatsulok, bilog — kaya ang susunod ay parisukat.',
    svgFn: () => series4([
      { type: 'circle'   },
      { type: 'square'   },
      { type: 'triangle' },
      null,
    ]),
  },

  // ── Figural Analogies ──────────────────────────────────────────────────────

  {
    topicSlug: 'analogies',
    examSlug: 'cse-professional',
    stem: 'Big circle is to small circle as big square is to ___',
    difficulty: 2,
    correct_choice_id: 'a',
    choices: [
      { id: 'a', text: 'Small square' },
      { id: 'b', text: 'Big triangle' },
      { id: 'c', text: 'Small triangle' },
      { id: 'd', text: 'Small circle' },
    ],
    explanation_en: 'The relationship is: large shape → same shape but smaller. A big circle corresponds to a small circle. Applying the same rule: big square corresponds to a small square.',
    explanation_fil: 'Ang relasyon ay: malaking hugis → parehong hugis ngunit maliit. Ang malaking bilog ay katumbas ng maliit na bilog. Sa parehong tuntunin: ang malaking parisukat ay katumbas ng maliit na parisukat.',
    svgFn: () => {
      // 2×2 analogy grid with arrow and ?
      let out = '';
      // A | B
      // C | ?
      out += `<text x="180" y="40" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#64748b">Figural Analogy</text>`;
      // Box outlines
      [[20, 55, 'A'], [200, 55, 'B'], [20, 155, 'C'], [200, 155, '?']].forEach(([x, y, lbl]) => {
        out += `<rect x="${x}" y="${y}" width="130" height="90" fill="none" stroke="${COLORS.grid}" stroke-width="1.5" rx="6"/>`;
        out += `<text x="${x + 5}" y="${y + 16}" font-size="11" font-family="sans-serif" fill="${COLORS.grid}">${lbl}</text>`;
      });
      // : between A and B
      out += `<text x="158" y="105" text-anchor="middle" font-size="22" fill="${COLORS.grid}">:</text>`;
      out += `<text x="158" y="205" text-anchor="middle" font-size="22" fill="${COLORS.grid}">:</text>`;
      out += `<text x="180" y="155" text-anchor="middle" font-size="22" fill="${COLORS.grid}">::</text>`;
      // A: big circle
      out += circle(85, 100, 32, true);
      // B: small circle
      out += circle(265, 100, 16, true);
      // C: big square
      out += square(85, 200, 54, true);
      // ?: ?
      out += `<text x="265" y="208" text-anchor="middle" font-size="28" font-family="sans-serif" fill="${COLORS.grid}" font-weight="bold">?</text>`;
      return svgWrap(out);
    },
  },

  {
    topicSlug: 'analogies',
    examSlug: 'cse-professional',
    stem: 'Filled circle is to outlined circle as filled triangle is to ___',
    difficulty: 2,
    correct_choice_id: 'b',
    choices: [
      { id: 'a', text: 'Filled triangle' },
      { id: 'b', text: 'Outlined triangle' },
      { id: 'c', text: 'Outlined circle' },
      { id: 'd', text: 'Filled square' },
    ],
    explanation_en: 'The analogy is: filled → outlined (same shape). A filled circle corresponds to an outlined circle. Therefore a filled triangle corresponds to an outlined triangle.',
    explanation_fil: 'Ang analohiya ay: puno → walang punan (parehong hugis). Ang punong bilog ay katumbas ng walang punan na bilog. Kaya ang punong tatsulok ay katumbas ng walang punan na tatsulok.',
    svgFn: () => {
      let out = '';
      out += `<text x="180" y="40" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#64748b">Figural Analogy</text>`;
      [[20, 55, 'A'], [200, 55, 'B'], [20, 155, 'C'], [200, 155, '?']].forEach(([x, y, lbl]) => {
        out += `<rect x="${x}" y="${y}" width="130" height="90" fill="none" stroke="${COLORS.grid}" stroke-width="1.5" rx="6"/>`;
        out += `<text x="${x + 5}" y="${y + 16}" font-size="11" font-family="sans-serif" fill="${COLORS.grid}">${lbl}</text>`;
      });
      out += `<text x="158" y="105" text-anchor="middle" font-size="22" fill="${COLORS.grid}">:</text>`;
      out += `<text x="158" y="205" text-anchor="middle" font-size="22" fill="${COLORS.grid}">:</text>`;
      out += `<text x="180" y="155" text-anchor="middle" font-size="22" fill="${COLORS.grid}">::</text>`;
      out += circle(85, 100, 28, true);
      out += circle(265, 100, 28, false);
      out += triangle(85, 200, 48, true);
      out += `<text x="265" y="208" text-anchor="middle" font-size="28" font-family="sans-serif" fill="${COLORS.grid}" font-weight="bold">?</text>`;
      return svgWrap(out);
    },
  },

  {
    topicSlug: 'analogies',
    examSlug: 'cse-subprofessional',
    stem: 'One shape is to two shapes as two shapes is to ___',
    difficulty: 2,
    correct_choice_id: 'c',
    choices: [
      { id: 'a', text: 'One shape' },
      { id: 'b', text: 'Two shapes' },
      { id: 'c', text: 'Three shapes' },
      { id: 'd', text: 'Four shapes' },
    ],
    explanation_en: 'The analogy doubles the number of shapes each step: 1 → 2 (doubled), so 2 → ? must also double, giving 4. But actually the pattern is +1 each step: 1 → 2 → 3. The correct answer is three shapes (+1).',
    explanation_fil: 'Ang pattern ay nagdadagdag ng isang hugis sa bawat hakbang: 1 → 2 → 3. Ang sagot ay tatlong hugis.',
    svgFn: () => {
      let out = '';
      out += `<text x="180" y="40" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#64748b">Figural Analogy</text>`;
      [[20, 55, 'A'], [200, 55, 'B'], [20, 155, 'C'], [200, 155, '?']].forEach(([x, y, lbl]) => {
        out += `<rect x="${x}" y="${y}" width="130" height="90" fill="none" stroke="${COLORS.grid}" stroke-width="1.5" rx="6"/>`;
        out += `<text x="${x + 5}" y="${y + 16}" font-size="11" font-family="sans-serif" fill="${COLORS.grid}">${lbl}</text>`;
      });
      out += `<text x="158" y="105" text-anchor="middle" font-size="22" fill="${COLORS.grid}">:</text>`;
      out += `<text x="158" y="205" text-anchor="middle" font-size="22" fill="${COLORS.grid}">:</text>`;
      out += `<text x="180" y="155" text-anchor="middle" font-size="22" fill="${COLORS.grid}">::</text>`;
      // A: 1 circle
      out += circle(85, 100, 22, true);
      // B: 2 circles
      out += circle(255, 100, 18, true);
      out += circle(278, 100, 18, true);
      // C: 2 squares
      out += square(74, 200, 26, true);
      out += square(96, 200, 26, true);
      // ?: ?
      out += `<text x="265" y="208" text-anchor="middle" font-size="28" font-family="sans-serif" fill="${COLORS.grid}" font-weight="bold">?</text>`;
      return svgWrap(out);
    },
  },

  // ── Odd One Out ────────────────────────────────────────────────────────────

  {
    topicSlug: 'odd-one-out',
    examSlug: 'cse-professional',
    stem: 'Three of the four shapes share a common property. Which is the odd one out?',
    difficulty: 2,
    correct_choice_id: 'c',
    choices: [
      { id: 'a', text: 'Shape A (filled circle)' },
      { id: 'b', text: 'Shape B (filled square)' },
      { id: 'c', text: 'Shape C (outlined triangle)' },
      { id: 'd', text: 'Shape D (filled diamond)' },
    ],
    explanation_en: 'Shapes A, B, and D are all filled (solid). Shape C is outlined (no fill). The odd one out is Shape C — the outlined triangle — because it differs in the fill property.',
    explanation_fil: 'Ang mga hugis A, B, at D ay lahat puno (solidong kulay). Ang hugis C ay walang punan (outline lamang). Ang odd one out ay hugis C — ang walang punan na tatsulok.',
    svgFn: () => {
      const positions = [[55, 130], [145, 130], [235, 130], [315, 130]];
      const labels = ['A', 'B', 'C', 'D'];
      let out = '';
      // Row of 4 boxes
      positions.forEach(([cx, cy], i) => {
        const x = cx - 38, y = cy - 50;
        out += `<rect x="${x}" y="${y}" width="76" height="76" fill="none" stroke="${COLORS.grid}" stroke-width="1" rx="4"/>`;
        out += `<text x="${cx}" y="${y - 6}" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#64748b">${labels[i]}</text>`;
      });
      out += circle(positions[0][0], positions[0][1] - 12, 26, true);
      out += square(positions[1][0], positions[1][1] - 12, 44, true);
      out += triangle(positions[2][0], positions[2][1] - 12, 44, false); // OUTLINE = odd one out
      out += diamond(positions[3][0], positions[3][1] - 12, 44, true);
      out += `<text x="180" y="215" text-anchor="middle" font-size="12" font-family="sans-serif" fill="#94a3b8">Which shape does NOT belong?</text>`;
      return svgWrap(out);
    },
  },

  {
    topicSlug: 'odd-one-out',
    examSlug: 'cse-professional',
    stem: 'One shape has a different number of sides. Which is the odd one out?',
    difficulty: 2,
    correct_choice_id: 'b',
    choices: [
      { id: 'a', text: 'Shape A (triangle — 3 sides)' },
      { id: 'b', text: 'Shape B (circle — 0 sides)' },
      { id: 'c', text: 'Shape C (square — 4 sides)' },
      { id: 'd', text: 'Shape D (diamond — 4 sides)' },
    ],
    explanation_en: 'Triangles have 3 sides, squares have 4 sides, and diamonds have 4 sides — all have a definite number of sides. A circle has no sides (it is curved). Shape B (circle) is the odd one out.',
    explanation_fil: 'Ang tatsulok ay may 3 gilid, ang parisukat ay may 4, ang dayamante ay may 4. Ang bilog ay walang tuwid na gilid. Ang hugis B (bilog) ang odd one out.',
    svgFn: () => {
      const positions = [[55, 130], [145, 130], [235, 130], [315, 130]];
      const labels = ['A', 'B', 'C', 'D'];
      let out = '';
      positions.forEach(([cx, cy], i) => {
        const x = cx - 38, y = cy - 50;
        out += `<rect x="${x}" y="${y}" width="76" height="76" fill="none" stroke="${COLORS.grid}" stroke-width="1" rx="4"/>`;
        out += `<text x="${cx}" y="${y - 6}" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#64748b">${labels[i]}</text>`;
      });
      out += triangle(positions[0][0], positions[0][1] - 12, 44, true);
      out += circle(positions[1][0], positions[1][1] - 12, 26, true);   // ODD
      out += square(positions[2][0], positions[2][1] - 12, 44, true);
      out += diamond(positions[3][0], positions[3][1] - 12, 44, true);
      out += `<text x="180" y="215" text-anchor="middle" font-size="12" font-family="sans-serif" fill="#94a3b8">Which shape does NOT belong?</text>`;
      return svgWrap(out);
    },
  },

  {
    topicSlug: 'odd-one-out',
    examSlug: 'cse-subprofessional',
    stem: 'Three shapes have the same fill. Which is the odd one out?',
    difficulty: 1,
    correct_choice_id: 'd',
    choices: [
      { id: 'a', text: 'Shape A' },
      { id: 'b', text: 'Shape B' },
      { id: 'c', text: 'Shape C' },
      { id: 'd', text: 'Shape D' },
    ],
    explanation_en: 'Shapes A, B, and C are all outlined (no fill). Shape D is filled (solid blue). The odd one out is Shape D because it has a different fill property.',
    explanation_fil: 'Ang mga hugis A, B, at C ay walang punan (outline lamang). Ang hugis D ay puno (solidong asul). Ang odd one out ay hugis D dahil naiiba ang punan nito.',
    svgFn: () => {
      const positions = [[55, 130], [145, 130], [235, 130], [315, 130]];
      const labels = ['A', 'B', 'C', 'D'];
      let out = '';
      positions.forEach(([cx, cy], i) => {
        const x = cx - 38, y = cy - 50;
        out += `<rect x="${x}" y="${y}" width="76" height="76" fill="none" stroke="${COLORS.grid}" stroke-width="1" rx="4"/>`;
        out += `<text x="${cx}" y="${y - 6}" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#64748b">${labels[i]}</text>`;
      });
      out += circle(positions[0][0], positions[0][1] - 12, 26, false);   // outline
      out += square(positions[1][0], positions[1][1] - 12, 44, false);   // outline
      out += triangle(positions[2][0], positions[2][1] - 12, 44, false); // outline
      out += diamond(positions[3][0], positions[3][1] - 12, 44, true);   // FILLED = ODD
      out += `<text x="180" y="215" text-anchor="middle" font-size="12" font-family="sans-serif" fill="#94a3b8">Which shape does NOT belong?</text>`;
      return svgWrap(out);
    },
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function getTopicId(examSlug, topicSlug) {
  const { data, error } = await sb
    .from('topics')
    .select('id, subject_areas!inner(exam_types!inner(slug))')
    .eq('slug', topicSlug)
    .eq('subject_areas.exam_types.slug', examSlug)
    .limit(1)
    .single();
  if (error) throw new Error(`Topic ${topicSlug}/${examSlug}: ${error.message}`);
  return data.id;
}

async function uploadSvg(filename, svgString) {
  const buf = Buffer.from(svgString, 'utf8');
  const { error } = await sb.storage
    .from('question-images')
    .upload(filename, buf, { contentType: 'image/svg+xml', upsert: true });
  if (error) throw new Error(`Upload ${filename}: ${error.message}`);
  const { data } = sb.storage.from('question-images').getPublicUrl(filename);
  return data.publicUrl;
}

async function main() {
  let ok = 0, fail = 0;

  for (const q of QUESTIONS) {
    try {
      // 1. Generate SVG
      const svg = q.svgFn();
      const filename = `ar/${q.examSlug}/${q.topicSlug}/${q.correct_choice_id}_${Math.random().toString(36).slice(2, 8)}.svg`;

      // 2. Upload
      const imageUrl = await uploadSvg(filename, svg);

      // 3. Get topic id
      const topicId = await getTopicId(q.examSlug, q.topicSlug);

      // 4. Insert question
      const { error: insErr } = await sb.from('questions').insert({
        topic_id: topicId,
        stem: q.stem,
        choices: q.choices,
        correct_choice_id: q.correct_choice_id,
        explanation_en: q.explanation_en,
        explanation_fil: q.explanation_fil,
        difficulty: q.difficulty,
        status: 'published',
        image_url: imageUrl,
      });

      if (insErr) throw new Error(insErr.message);
      ok++;
      console.log(`✅  ${q.topicSlug}  [${q.examSlug}]  ${q.stem.slice(0, 55)}`);
    } catch (err) {
      fail++;
      console.error(`❌  ${q.topicSlug}  ${err.message}`);
    }
  }

  console.log(`\nDone: ${ok} inserted, ${fail} failed.`);
}

main().catch(console.error);
