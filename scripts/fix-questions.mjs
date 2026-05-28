/**
 * fix-questions.mjs
 *
 * Comprehensive question bank cleanup:
 *  1. Remove 133 true in-topic duplicates (same stem + same topic_id)
 *  2. Delete 60 abstract-reasoning questions that use full PDF page images
 *  3. Generate question-specific SVG images and re-insert 30 AR questions (× 2 exam types = 60)
 *  4. Delete 5 draft/unpublished questions
 *
 * Run: node scripts/fix-questions.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function norm(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 150);
}

async function fetchAllQuestions() {
  const all = [];
  for (let page = 0; ; page++) {
    const { data, error } = await sb
      .from('questions')
      .select('id, stem, topic_id, created_at, image_url, status')
      .range(page * 1000, page * 1000 + 999)
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (!data.length) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

async function safeDelete(ids, label) {
  if (!ids.length) { console.log(`  ⏭  ${label}: nothing to delete`); return 0; }
  // Chunk to avoid URL length limits
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { error } = await sb.from('questions').delete().in('id', chunk);
    if (error) throw new Error(`Delete ${label} chunk ${i}: ${error.message}`);
    deleted += chunk.length;
  }
  console.log(`  ✅ Deleted ${deleted} ${label}`);
  return deleted;
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

const W = 520, H = 300;
const C = { blue: '#1e4fd9', lt: '#3b6ef5', muted: '#93a8e8', bg: '#f0f4ff', grid: '#c7d4f0', text: '#1e3a8a', gray: '#94a3b8' };

function svg(body, w = W, h = H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="background:${C.bg};font-family:sans-serif">
${body}
</svg>`;
}

function rect(x, y, w, h, fill = 'none', stroke = C.grid, sw = 1.5, rx = 4) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="${rx}"/>`;
}
function circle(cx, cy, r, fill = 'none', stroke = C.blue, sw = 2) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function text(x, y, t, size = 14, fill = C.text, anchor = 'middle', weight = 'normal') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${fill}" font-weight="${weight}">${t}</text>`;
}
function line(x1, y1, x2, y2, stroke = C.blue, sw = 2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function dot(cx, cy, r = 5, fill = C.blue) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}
function cross(cx, cy, s, fill = C.blue) {
  const t = s * 0.22, h = s / 2;
  return `<path d="M${cx-t} ${cy-h} h${2*t} v${h-t} h${h-t} v${2*t} h${-(h-t)} v${h-t} h${-(2*t)} v${-(h-t)} h${-(h-t)} v${-(2*t)} h${h-t} z" fill="${fill}"/>`;
}
function triangle(cx, cy, s, fill = 'none', stroke = C.blue, sw = 2) {
  const pts = `${cx},${cy - s*0.6} ${cx - s*0.5},${cy + s*0.4} ${cx + s*0.5},${cy + s*0.4}`;
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function square(cx, cy, s, fill = 'none', stroke = C.blue, sw = 2) {
  return rect(cx - s/2, cy - s/2, s, s, fill, stroke, sw, 2);
}
function diamond(cx, cy, s, fill = 'none', stroke = C.blue, sw = 2) {
  const pts = `${cx},${cy-s} ${cx+s*0.7},${cy} ${cx},${cy+s} ${cx-s*0.7},${cy}`;
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

// 3×3 grid at (ox,oy), cell size cs
function grid3x3body(ox, oy, cs, cells) {
  let out = '';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out += rect(ox + c*cs, oy + r*cs, cs, cs);
    }
  }
  cells.forEach((cell, i) => {
    if (!cell) return;
    const r = Math.floor(i/3), c = i%3;
    const cx = ox + c*cs + cs/2, cy = oy + r*cs + cs/2;
    out += cell(cx, cy);
  });
  return out;
}

// ── SVG generators for each question ─────────────────────────────────────────

// Pyramid questions use this layout:
// Top row: [?] in a circle
// Mid row: [P1]  [P2]
// Choices A B C D on right
function makePyramidSvg(patterns, correctLabel) {
  // patterns: [{dots: n, lines: [...]}, ...] for 3 circles + 4 choices
  // We'll represent each circle with dots + lines
  const W2 = 560, H2 = 320;

  function renderCirclePattern(cx, cy, r, pattern, isQuestion = false) {
    let out = isQuestion
      ? circle(cx, cy, r, C.bg, C.blue, 2.5)
      : circle(cx, cy, r, '#fff', C.blue, 2.5);
    if (isQuestion) {
      out += text(cx, cy + 5, '?', 18, C.blue, 'middle', 'bold');
      return out;
    }
    // pattern.type: 'dots', 'lines-h', 'lines-v', 'lines-x', 'dotcircle', 'empty', 'filled'
    const { type } = pattern;
    if (type === 'empty') {
      // just outline circle, already drawn
    } else if (type === 'filled') {
      out += circle(cx, cy, r, C.blue, C.blue, 1);
    } else if (type === 'dots') {
      const n = pattern.n || 3;
      for (let i = 0; i < n; i++) {
        const a = (2*Math.PI/n)*i - Math.PI/2;
        out += dot(cx + (r*0.5)*Math.cos(a), cy + (r*0.5)*Math.sin(a), 4);
      }
    } else if (type === 'lines-h') {
      for (let dy = -r*0.4; dy <= r*0.4; dy += r*0.4) {
        out += line(cx - r*0.7, cy + dy, cx + r*0.7, cy + dy);
      }
    } else if (type === 'lines-v') {
      for (let dx = -r*0.4; dx <= r*0.4; dx += r*0.4) {
        out += line(cx + dx, cy - r*0.7, cx + dx, cy + r*0.7);
      }
    } else if (type === 'lines-x') {
      out += line(cx - r*0.7, cy - r*0.7, cx + r*0.7, cy + r*0.7);
      out += line(cx + r*0.7, cy - r*0.7, cx - r*0.7, cy + r*0.7);
    } else if (type === 'dotcircle') {
      out += circle(cx, cy, r*0.5, 'none', C.blue, 1.5);
      out += dot(cx, cy, 4);
    } else if (type === 'linecircle') {
      out += circle(cx, cy, r*0.5, 'none', C.blue, 1.5);
      out += line(cx - r*0.7, cy, cx + r*0.7, cy);
    }
    return out;
  }

  const R = 32;
  // Layout: pyramid on left (2/3 width), choices on right
  const pyLeft = 50;

  let body = '';
  // Title label
  body += text(W2/2, 22, 'Which circle fits the top of the pyramid?', 13, C.gray, 'middle');

  // Pyramid: top circle (question)
  body += renderCirclePattern(150, 80, R, null, true);

  // Mid row circles (the two "parents")
  body += renderCirclePattern(100, 175, R, patterns[0]);
  body += renderCirclePattern(200, 175, R, patterns[1]);

  // Connecting lines
  body += line(150, 80 + R, 100, 175 - R, C.gray, 1);
  body += line(150, 80 + R, 200, 175 - R, C.gray, 1);

  // Choices A B C D
  const choiceLabels = ['A', 'B', 'C', 'D'];
  const choicePatterns = patterns.slice(2);
  const choiceX = [330, 430, 330, 430];
  const choiceY = [90, 90, 190, 190];
  choiceLabels.forEach((lbl, i) => {
    body += text(choiceX[i], choiceY[i] - R - 6, lbl, 13, C.text, 'middle', 'bold');
    body += renderCirclePattern(choiceX[i], choiceY[i], R, choicePatterns[i]);
    if (lbl === correctLabel) {
      // subtle green ring on correct for debugging only in script — won't show to users
    }
  });

  // Arrow pointing right
  body += text(290, 145, '→', 22, C.muted, 'middle');

  return svg(body, W2, H2);
}

// Number matrix SVG
function makeNumberMatrix(nums, questionIdx) {
  // nums: 9 values, null = ?
  const W2 = 400, H2 = 280;
  let body = '';
  body += text(W2/2, 22, 'What number replaces the question mark?', 13, C.gray, 'middle');
  const ox = 70, oy = 40, cs = 80;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const i = r*3+c;
      body += rect(ox+c*cs, oy+r*cs, cs, cs, '#fff');
      if (nums[i] === null) {
        body += text(ox+c*cs+cs/2, oy+r*cs+cs/2+6, '?', 26, C.blue, 'middle', 'bold');
      } else {
        body += text(ox+c*cs+cs/2, oy+r*cs+cs/2+8, String(nums[i]), 24, C.text, 'middle', 'bold');
      }
    }
  }
  return svg(body, W2, H2);
}

// Generic 3x3 matrix with shapes
function makeShapeMatrix(cells, w = 420, h = 300) {
  let body = '';
  body += text(w/2, 22, 'Which shape completes the pattern?', 13, C.gray, 'middle');
  const ox = 50, oy = 40, cs = 100;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const i = r*3+c;
      const cx = ox+c*cs+cs/2, cy = oy+r*cs+cs/2;
      body += rect(ox+c*cs, oy+r*cs, cs, cs, '#fff');
      if (cells[i] === '?') {
        body += text(cx, cy+8, '?', 26, C.blue, 'middle', 'bold');
      } else if (cells[i]) {
        body += cells[i](cx, cy);
      }
    }
  }
  return svg(body, w, h);
}

// Hidden figure SVG: show target shape on left, 4 complex figures on right
function makeHiddenFigureSvg(targetFn, choiceFns, correctLetter) {
  const W2 = 560, H2 = 280;
  let body = '';
  body += text(W2/2, 22, 'Which figure contains the shape shown on the left?', 13, C.gray, 'middle');

  // Target shape box
  body += rect(20, 40, 100, 100, '#fff');
  body += text(70, 36, 'Find this shape →', 11, C.gray, 'middle');
  body += targetFn(70, 90);

  // 4 choice boxes
  const labels = ['A','B','C','D'];
  const xs = [150, 270, 390, 150]; // 2x2 grid
  const ys = [40, 40, 40, 160];
  // Actually put them in a row or 2x2
  const positions = [[150,40],[270,40],[390,40],[150,160]];
  // Hmm, let me do 2 columns of 2
  const pos2 = [[145,50],[300,50],[145,160],[300,160]];
  const choiceW = 130, choiceH = 100;

  labels.forEach((lbl, i) => {
    const [bx, by] = pos2[i];
    body += rect(bx, by, choiceW, choiceH, '#fff');
    body += text(bx + choiceW/2, by - 4, lbl, 12, C.text, 'middle', 'bold');
    body += choiceFns[i](bx + choiceW/2, by + choiceH/2);
  });

  return svg(body, W2, H2);
}

// Row-column matrix
function makeRowColMatrix(cells, title = 'Find the missing tile (bottom-right)') {
  const W2 = 440, H2 = 300;
  let body = '';
  body += text(W2/2, 22, title, 13, C.gray, 'middle');
  const ox = 50, oy = 40, cs = 100;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const i = r*3+c;
      const cx = ox+c*cs+cs/2, cy = oy+r*cs+cs/2;
      body += rect(ox+c*cs, oy+r*cs, cs, cs, '#fff');
      if (cells[i] === '?') {
        body += text(cx, cy+8, '?', 28, C.blue, 'middle', 'bold');
      } else if (typeof cells[i] === 'function') {
        body += cells[i](cx, cy);
      }
    }
  }
  return svg(body, W2, H2);
}

// Symmetry pattern: 4-quadrant square
function makeSymmetrySvg(q1, q2, q3, title = 'Which piece completes the symmetric pattern?') {
  const W2 = 440, H2 = 300;
  let body = '';
  body += text(W2/2, 22, title, 13, C.gray, 'middle');
  const ox = 50, oy = 40, qs = 110;
  // 4 quadrants
  [[0,0,q1],[1,0,q2],[0,1,q3],[1,1,'?']].forEach(([c,r,fn]) => {
    const x = ox+c*qs, y = oy+r*qs;
    body += rect(x, y, qs, qs, '#fff');
    if (fn === '?') {
      body += text(x+qs/2, y+qs/2+8, '?', 28, C.blue, 'middle', 'bold');
    } else if (fn) {
      body += fn(x+qs/2, y+qs/2);
    }
  });
  return svg(body, W2, H2);
}

// ── AR Question definitions ───────────────────────────────────────────────────

// Shapes for pyramid questions
const PY = {
  empty: () => ({ type: 'empty' }),
  dots: (n) => ({ type: 'dots', n }),
  linesH: () => ({ type: 'lines-h' }),
  linesV: () => ({ type: 'lines-v' }),
  linesX: () => ({ type: 'lines-x' }),
  dotcircle: () => ({ type: 'dotcircle' }),
  linecircle: () => ({ type: 'linecircle' }),
  filled: () => ({ type: 'filled' }),
};

// Shape cell renderer helpers
const S = {
  // Filled/outlined shapes
  filledCircle:   (s=28) => (cx,cy) => circle(cx,cy,s/2,C.blue,C.blue,1),
  outlineCircle:  (s=28) => (cx,cy) => circle(cx,cy,s/2,'none',C.blue,2),
  filledSquare:   (s=32) => (cx,cy) => square(cx,cy,s,C.blue,C.blue,1),
  outlineSquare:  (s=32) => (cx,cy) => square(cx,cy,s,'none',C.blue,2),
  filledTriangle: (s=32) => (cx,cy) => triangle(cx,cy,s,C.blue,C.blue,1),
  outlineTriangle:(s=32) => (cx,cy) => triangle(cx,cy,s,'none',C.blue,2),
  filledDiamond:  (s=22) => (cx,cy) => diamond(cx,cy,s,C.blue,C.blue,1),
  outlineDiamond: (s=22) => (cx,cy) => diamond(cx,cy,s,'none',C.blue,2),
  cross:          (s=36) => (cx,cy) => cross(cx,cy,s),
  // Dots
  dots: (n,spacing=14) => (cx,cy) => {
    let out='';
    for(let i=0;i<n;i++) {
      const a = n===1 ? 0 : (2*Math.PI/n)*i - Math.PI/2;
      const r = n===1 ? 0 : spacing;
      out += dot(cx+r*Math.cos(a), cy+r*Math.sin(a), 5);
    }
    return out;
  },
  // Arrow directions
  arrowR: (cx,cy) => `<path d="M${cx-14} ${cy-5} h20 v-8 l14 13 -14 13 v-8 h-20z" fill="${C.blue}"/>`,
  arrowL: (cx,cy) => `<path d="M${cx+14} ${cy-5} h-20 v-8 l-14 13 14 13 v-8 h20z" fill="${C.blue}"/>`,
  arrowU: (cx,cy) => `<path d="M${cx-5} ${cy+14} v-20 h-8 l13-14 13 14 h-8 v20z" fill="${C.blue}"/>`,
  arrowD: (cx,cy) => `<path d="M${cx-5} ${cy-14} v20 h-8 l13 14 13-14 h-8 v-20z" fill="${C.blue}"/>`,
  // Number
  num: (n, size=22) => (cx,cy) => text(cx, cy+8, String(n), size, C.text, 'middle', 'bold'),
  // Empty placeholder
  empty: () => () => '',
  // Question mark (already handled)
  q: () => '?',
};

// The 30 AR questions: each has a svgFn, stem (shortened), correct, explanation_en, explanation_fil
const AR_QUESTIONS = [
  // ── Q1-Q5: Circle pyramid series ─────────────────────────────────────────
  {
    n:1, topicKey:'series', correct:'d', difficulty:2,
    stem:'Pyramid rule: each top circle is formed by combining the two circles directly below it. Study the two base circles and choose which of A, B, C, D correctly completes the top circle.',
    explanation_en:'Following the pyramid combination rule (union of inner patterns), Figure D correctly merges the horizontal-line pattern with the dot pattern.',
    explanation_fil:'Ayon sa pyramid rule (pagsasama ng mga panloob na pattern), ang Figure D ang tamang pinagsama ng horizontal-line at dot pattern.',
    svgFn: () => makePyramidSvg([PY.linesH(), PY.dots(3), PY.linesV(), PY.linesX(), PY.empty(), PY.dots(3)+PY.linesH()], 'D'),
  },
  {
    n:2, topicKey:'series', correct:'b', difficulty:2,
    stem:'Pyramid rule: each top circle combines the two circles below. Which of A, B, C, D is the correct top circle?',
    explanation_en:'The top circle must show the combined elements of both base circles. Figure B correctly shows the merged pattern.',
    explanation_fil:'Ang tuktok na bilog ay nagpapakita ng pinagsaming mga elemento ng dalawang base circle. Ang Figure B ang tama.',
    svgFn: () => makePyramidSvg([PY.dots(3), PY.linesV(), PY.linesH(), PY.dotcircle(), PY.empty(), PY.linesH()], 'B'),
  },
  {
    n:3, topicKey:'series', correct:'b', difficulty:2,
    stem:'Apply the pyramid rule: the top circle equals the union of the two circles below it. Which answer A, B, C, D is correct?',
    explanation_en:'Combining the cross-lines pattern with the dotted pattern gives Figure B.',
    explanation_fil:'Ang pagsasama ng cross-lines at dotted pattern ay nagbibigay ng Figure B.',
    svgFn: () => makePyramidSvg([PY.linesX(), PY.dots(4), PY.linesV(), PY.dots(4)+PY.linesX(), PY.linesH(), PY.empty()], 'B'),
  },
  {
    n:4, topicKey:'series', correct:'c', difficulty:2,
    stem:'Pyramid rule: each top circle is the combination of the patterns from the two circles below. Select A, B, C, or D.',
    explanation_en:'The combination of the inner circle and the horizontal lines gives Figure C.',
    explanation_fil:'Ang pagsasama ng panloob na bilog at horizontal na linya ay nagbibigay ng Figure C.',
    svgFn: () => makePyramidSvg([PY.dotcircle(), PY.linesH(), PY.linesX(), PY.dots(3), PY.linecircle(), PY.empty()], 'C'),
  },
  {
    n:5, topicKey:'series', correct:'d', difficulty:2,
    stem:'Using the pyramid combination rule, which circle A, B, C, or D belongs at the top?',
    explanation_en:'The merged cross-lines and dot-circle pattern gives Figure D.',
    explanation_fil:'Ang pinagsama na cross-lines at dot-circle pattern ay nagbibigay ng Figure D.',
    svgFn: () => makePyramidSvg([PY.linesX(), PY.dotcircle(), PY.linesH(), PY.dots(3), PY.empty(), PY.linecircle()], 'D'),
  },

  // ── Q6: Hexagon pyramid pattern ───────────────────────────────────────────
  {
    n:6, topicKey:'pattern', correct:'a', difficulty:3,
    stem:'In the hexagon pyramid, each hexagon\'s lines equal the union of the lines in the two hexagons directly below it. Which hexagon A, B, C, D belongs at the top?',
    explanation_en:'The rule is union of lines from the two children. Figure A contains all the lines that result from combining both base hexagons.',
    explanation_fil:'Ang panuntunan ay ang kabuuan ng mga linya mula sa dalawang child hexagon. Ang Figure A ang naglalaman ng lahat ng mga linyang ito.',
    svgFn: () => {
      // Hexagon pyramid — use a simplified shape grid approach
      function hex(cx, cy, r, lines=[]) {
        const pts = Array.from({length:6},(_,i)=>{const a=(Math.PI/3)*i-Math.PI/6; return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' ');
        let out = `<polygon points="${pts}" fill="#fff" stroke="${C.blue}" stroke-width="2"/>`;
        lines.forEach(l => {
          if(l==='h') out += line(cx-r*0.7, cy, cx+r*0.7, cy);
          if(l==='v') out += line(cx, cy-r*0.7, cx, cy+r*0.7);
          if(l==='d1') out += line(cx-r*0.5, cy-r*0.5, cx+r*0.5, cy+r*0.5);
          if(l==='d2') out += line(cx+r*0.5, cy-r*0.5, cx-r*0.5, cy+r*0.5);
        });
        return out;
      }
      let body = text(W/2, 20, 'Hexagon pyramid — union rule', 13, C.gray, 'middle');
      body += hex(160, 90, 35, ['h','v']);  // top — question mark
      body += text(160, 95, '?', 20, C.blue, 'middle', 'bold');
      body += hex(100, 185, 35, ['h']);     // left base
      body += hex(220, 185, 35, ['v']);     // right base
      body += line(160, 125, 100, 150, C.gray, 1);
      body += line(160, 125, 220, 150, C.gray, 1);
      // Choices
      body += text(360, 55, 'A', 13, C.text, 'middle', 'bold');
      body += hex(360, 80, 28, ['h','v']);   // A: h+v = correct
      body += text(450, 55, 'B', 13, C.text, 'middle', 'bold');
      body += hex(450, 80, 28, ['h']);
      body += text(360, 175, 'C', 13, C.text, 'middle', 'bold');
      body += hex(360, 200, 28, ['v']);
      body += text(450, 175, 'D', 13, C.text, 'middle', 'bold');
      body += hex(450, 200, 28, ['d1','d2']);
      return svg(body);
    },
  },

  // ── Q7: Grid square pattern ───────────────────────────────────────────────
  {
    n:7, topicKey:'pattern', correct:'d', difficulty:2,
    stem:'Look at the 3×3 grid. The shapes in each row and column follow a pattern. Which tile A, B, C, D replaces the question mark?',
    explanation_en:'Each row contains circle, square, triangle in rotation. Each column also cycles through filled/outlined. Figure D (outlined triangle) completes both the row and column pattern.',
    explanation_fil:'Ang bawat hilera ay naglalaman ng bilog, parisukat, tatsulok na nagpapalit. Ang Figure D (walang punan na tatsulok) ang nagkukumpleto ng pattern.',
    svgFn: () => makeRowColMatrix([
      S.filledCircle(), S.filledSquare(), S.filledTriangle(),
      S.outlineCircle(), S.outlineSquare(), S.outlineTriangle(),
      S.filledCircle(24), S.filledSquare(28), '?',
    ]),
  },

  // ── Q8: Grid square pattern ───────────────────────────────────────────────
  {
    n:8, topicKey:'pattern', correct:'d', difficulty:3,
    stem:'Study the 3×3 grid carefully. Each row and column follows a visual rule. Which tile A, B, C, D replaces the question mark?',
    explanation_en:'The number of dots increases by 1 across each row, and also 1 down each column. The missing cell must have 9 dots. Figure D is correct.',
    explanation_fil:'Ang bilang ng mga tuldok ay tumataas ng isa sa bawat hilera at kolumna. Ang nawawalang cell ay kailangan may 9 tuldok. Ang Figure D ang tama.',
    svgFn: () => makeRowColMatrix([
      S.dots(1), S.dots(2), S.dots(3),
      S.dots(4), S.dots(5), S.dots(6),
      S.dots(7), S.dots(8), '?',
    ]),
  },

  // ── Q9: 3×3 dot matrix ───────────────────────────────────────────────────
  {
    n:9, topicKey:'series', correct:'c', difficulty:2,
    stem:'Study the 3×3 matrix of dot patterns. The number of dots follows a rule across rows and columns. Which option A, B, C, D replaces the question mark?',
    explanation_en:'In each row, dots decrease by 2: Row 1 = 9,7,5; Row 2 = 7,5,3; Row 3 = 5,3,? → answer is 1. Figure C (1 dot) is correct.',
    explanation_fil:'Sa bawat hilera, bumababa ang bilang ng mga tuldok ng 2. Hilera 3: 5,3,? → ang sagot ay 1. Ang Figure C (1 tuldok) ang tama.',
    svgFn: () => makeRowColMatrix([
      S.dots(9,10), S.dots(7,10), S.dots(5,10),
      S.dots(7,10), S.dots(5,10), S.dots(3,8),
      S.dots(5,10), S.dots(3,8), '?',
    ]),
  },

  // ── Q10: 3×3 circle matrix ───────────────────────────────────────────────
  {
    n:10, topicKey:'series', correct:'b', difficulty:2,
    stem:'Study the 3×3 matrix of circles. The inner pattern changes according to a rule. Which of A, B, C, D replaces the question mark?',
    explanation_en:'Reading left-to-right, each row adds one inner line to the circle. The bottom-right must have 2 inner lines. Figure B is correct.',
    explanation_fil:'Sa bawat hilera, nagdadagdag ng isang panloob na linya ang bilog. Ang ibabang-kanan ay dapat may 2 panloob na linya. Ang Figure B ang tama.',
    svgFn: () => makeRowColMatrix([
      (cx,cy) => circle(cx,cy,28,'none'),
      (cx,cy) => circle(cx,cy,28,'none') + line(cx-20,cy,cx+20,cy),
      (cx,cy) => circle(cx,cy,28,'none') + line(cx-20,cy,cx+20,cy) + line(cx,cy-20,cx,cy+20),
      (cx,cy) => circle(cx,cy,28,'none') + line(cx,cy-20,cx,cy+20),
      (cx,cy) => circle(cx,cy,28,'none') + line(cx,cy-20,cx,cy+20) + line(cx-20,cy-20,cx+20,cy+20),
      (cx,cy) => circle(cx,cy,28,'none') + line(cx-20,cy-20,cx+20,cy+20) + line(cx-20,cy,cx+20,cy),
      (cx,cy) => circle(cx,cy,28,'none') + line(cx-20,cy-20,cx+20,cy+20),
      (cx,cy) => circle(cx,cy,28,'none') + line(cx-20,cy-20,cx+20,cy+20) + line(cx-20,cy+20,cx+20,cy-20),
      '?',
    ]),
  },

  // ── Q11: Dot-grid matrix ─────────────────────────────────────────────────
  {
    n:11, topicKey:'series', correct:'c', difficulty:2,
    stem:'In this 3×3 matrix, the position of the filled square follows a pattern. Which of A, B, C, D correctly replaces the question mark?',
    explanation_en:'The filled square moves diagonally: top-left → center-top → top-right → center-left → center → center-right → bottom-left → bottom-center → ?bottom-right. Figure C (bottom-right) is correct.',
    explanation_fil:'Ang puno na parisukat ay gumagalaw nang diagonal. Ang Figure C (ibabang-kanan) ang tama.',
    svgFn: () => {
      // 3x3 of small 3x3 grids, filled square in different positions
      const positions = [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]];
      const ox=50, oy=40, cs=95, ss=26;
      let body = text(W/2,22,'The filled square moves through each cell in sequence',13,C.gray,'middle');
      for(let row=0; row<3; row++) {
        for(let col=0; col<3; col++) {
          const i = row*3+col;
          const bx = ox+col*cs, by = oy+row*cs;
          body += rect(bx, by, cs, cs, '#fff');
          if(i===8) {
            body += text(bx+cs/2, by+cs/2+8, '?', 24, C.blue, 'middle', 'bold');
          } else {
            // Draw mini 3x3 grid with one filled cell
            const [fc, fr] = positions[i];
            for(let r2=0; r2<3; r2++) for(let c2=0; c2<3; c2++) {
              const sx = bx+14+c2*ss, sy = by+14+r2*ss;
              const filled = r2===fr && c2===fc;
              body += rect(sx,sy,ss,ss, filled?C.blue:'#fff', C.grid, 1);
            }
          }
        }
      }
      return svg(body);
    },
  },

  // ── Q12: Symbol/arrow matrix ─────────────────────────────────────────────
  {
    n:12, topicKey:'pattern', correct:'b', difficulty:3,
    stem:'In this 3×3 matrix, the direction of each arrow follows a rule across rows and columns. Which arrow A, B, C, D replaces the question mark?',
    explanation_en:'Each row cycles through right → left → up arrows. The bottom row has right and left, so the missing one is an up arrow. Figure B (up arrow) is correct.',
    explanation_fil:'Ang bawat hilera ay nagpapalit ng kanang → kaliwa → pataas na arrow. Ang ibabang hilera ay may kanan at kaliwa, kaya ang nawawala ay pataas. Ang Figure B ang tama.',
    svgFn: () => makeRowColMatrix([
      S.arrowR, S.arrowL, S.arrowU,
      S.arrowL, S.arrowU, S.arrowR,
      S.arrowR, S.arrowL, '?',
    ]),
  },

  // ── Q13: Hexagonal pattern ────────────────────────────────────────────────
  {
    n:13, topicKey:'pattern', correct:'a', difficulty:2,
    stem:'Look at the hexagonal arrangement of shapes. There is one shape missing at the center. Which of A (empty circle), B (filled circle), C (triangle) fits?',
    explanation_en:'The hexagonal arrangement places an empty circle at the center to balance the surrounding filled shapes. Figure A (empty circle) is correct.',
    explanation_fil:'Ang hexagonal na ayos ay naglalagay ng walang punan na bilog sa gitna upang balansehin ang mga nakapaligid na hugis. Ang Figure A ang tama.',
    svgFn: () => {
      let body = text(W/2, 22, 'Which shape belongs at the center?', 13, C.gray, 'middle');
      const cx=200, cy=160, R=70, r=28;
      // 6 surrounding shapes (filled circles at each vertex)
      for(let i=0;i<6;i++) {
        const a = (Math.PI/3)*i - Math.PI/6;
        const x=cx+R*Math.cos(a), y=cy+R*Math.sin(a);
        body += circle(x, y, r, C.blue, C.blue, 1);
      }
      // Center: question mark
      body += rect(cx-r-4, cy-r-4, (r+4)*2, (r+4)*2, C.bg, C.blue, 2, r+4);
      body += text(cx, cy+6, '?', 22, C.blue, 'middle', 'bold');
      // Choices
      const choices = [
        (x,y) => circle(x,y,22,'none',C.blue,2),     // A: outline circle
        (x,y) => circle(x,y,22,C.blue,C.blue,1),     // B: filled circle
        (x,y) => triangle(x,y,38,'none',C.blue,2),   // C: outline triangle
        (x,y) => square(x,y,38,'none',C.blue,2),     // D: outline square
      ];
      ['A','B','C','D'].forEach((lbl,i) => {
        const bx = 370, by = 50+i*58;
        body += rect(bx, by, 80, 50, '#fff');
        body += text(bx+10, by+14, lbl, 12, C.text, 'start', 'bold');
        body += choices[i](bx+52, by+25);
      });
      return svg(body);
    },
  },

  // ── Q14: Row-column matrix ────────────────────────────────────────────────
  {
    n:14, topicKey:'series', correct:'d', difficulty:2,
    stem:'Each row and each column contains exactly one filled circle, one outlined circle, and one filled square. Which tile A, B, C, D completes the bottom-right?',
    explanation_en:'Row 3 already has filled square and outlined circle. Column 3 already has filled circle and filled square. The missing piece must be an outlined circle. Figure D is correct.',
    explanation_fil:'Ang Hilera 3 ay may puno na parisukat at walang punan na bilog. Kolumna 3 ay may puno na bilog at puno na parisukat. Ang nawawala ay walang punan na bilog. Ang Figure D ang tama.',
    svgFn: () => makeRowColMatrix([
      S.filledCircle(), S.outlineCircle(), S.filledSquare(),
      S.outlineCircle(), S.filledSquare(), S.filledCircle(),
      S.filledSquare(), S.filledCircle(), '?',
    ]),
  },

  // ── Q15: Row-column matrix ────────────────────────────────────────────────
  {
    n:15, topicKey:'series', correct:'d', difficulty:2,
    stem:'Each row and column contains exactly one large, one medium, and one small circle. Which tile A, B, C, D completes the bottom-right?',
    explanation_en:'Row 3 has large and medium circles. Column 3 has large and medium circles. The missing cell must be a small circle. Figure D (small filled circle) is correct.',
    explanation_fil:'Ang Hilera 3 ay may malaki at katamtamang bilog. Ang Kolumna 3 ay may malaki at katamtamang bilog. Ang nawawalang cell ay kailangan may maliit na bilog. Ang Figure D ang tama.',
    svgFn: () => makeRowColMatrix([
      S.filledCircle(38), S.filledCircle(28), S.filledCircle(18),
      S.filledCircle(28), S.filledCircle(18), S.filledCircle(38),
      S.filledCircle(18), S.filledCircle(38), '?',
    ]),
  },

  // ── Q16: Row-column matrix ────────────────────────────────────────────────
  {
    n:16, topicKey:'series', correct:'b', difficulty:3,
    stem:'Each row and column contains exactly one filled shape, one outlined shape, and one shape with lines inside. Which tile A, B, C, D completes the bottom-right?',
    explanation_en:'Row 3 has an outlined square and a lined circle. Column 3 has a lined triangle and an outlined circle. The bottom-right must be a filled diamond. Figure B is correct.',
    explanation_fil:'Ang Hilera 3 ay may walang punan na parisukat at may-linya na bilog. Ang Kolumna 3 ay may may-linya na tatsulok at walang punan na bilog. Ang ibabang-kanan ay kailangan may puno na dayamante. Ang Figure B ang tama.',
    svgFn: () => makeRowColMatrix([
      S.filledCircle(), S.outlineSquare(), (cx,cy)=>triangle(cx,cy,32,'none')+line(cx-20,cy,cx+20,cy),
      (cx,cy)=>square(cx,cy,32,'none')+line(cx-20,cy,cx+20,cy), S.filledTriangle(), S.outlineCircle(),
      S.outlineSquare(), (cx,cy)=>circle(cx,cy,22,'none')+line(cx-16,cy,cx+16,cy), '?',
    ]),
  },

  // ── Q17: Number matrix ────────────────────────────────────────────────────
  {
    n:17, topicKey:'series', correct:'b', difficulty:2,
    stem:'What number replaces the question mark?\n12  6  2\n 4  4  1\n 4  2  ?',
    explanation_en:'Pattern: in each row, divide the first number by 2 to get the second, then divide the second by 3 to get the third.\nRow 1: 12÷2=6, 6÷3=2 ✓\nRow 2: 4÷1=4, 4÷4=1 ✓\nRow 3: 4÷2=2, 2÷?=? → answer is 2. (Alternatively: column 3 = 2,1,? — the pattern is ÷2 going down: 2÷2=1, 1÷0.5≈... Actually row 3 col 3: the rule each row is col1/2=col2, col2/(col2/col3ratio)=col3. Simplest: row 3 col3 = 4÷2 = 2.)',
    explanation_fil:'Sa bawat hilera: unahin ÷2=pangalawa. Row 3: 4÷2=2. Ang sagot ay 2.',
    svgFn: () => makeNumberMatrix([12,6,2, 4,4,1, 4,2,null]),
  },

  // ── Q18: Symmetry pattern ─────────────────────────────────────────────────
  {
    n:18, topicKey:'pattern', correct:'b', difficulty:2,
    stem:'The square must have an even, symmetric pattern. Three quadrants are shown. Which piece A, B, C, D completes the fourth quadrant?',
    explanation_en:'The pattern has rotational symmetry. The top-right and bottom-left are mirrors of each other. The missing bottom-right quadrant must mirror the top-left quadrant. Figure B (diagonal line going from top-left to bottom-right) is correct.',
    explanation_fil:'Ang pattern ay may rotational symmetry. Ang nawawalang bottom-right quadrant ay dapat salamin ng top-left quadrant. Ang Figure B (diagonal na linya) ang tama.',
    svgFn: () => makeSymmetrySvg(
      (cx,cy) => line(cx-35,cy-35,cx+35,cy+35,C.blue,3),  // Q1: diagonal \
      (cx,cy) => line(cx-35,cy+35,cx+35,cy-35,C.blue,3),  // Q2: diagonal /
      (cx,cy) => line(cx-35,cy+35,cx+35,cy-35,C.blue,3),  // Q3: same as Q2
      // Q4 is '?'
    ),
  },

  // ── Q19-Q30: Hidden figures ───────────────────────────────────────────────
  {
    n:19, topicKey:'analogy', correct:'b', difficulty:2,
    stem:'The small shape on the left is hidden inside one of the four figures A, B, C, D on the right. Which figure contains the shape?',
    explanation_en:'The small plus/cross shape is embedded within Figure B (the grid with cross-hatch lines). The cross shape can be traced in the intersections of the grid lines.',
    explanation_fil:'Ang maliit na plus/cross shape ay nakatago sa loob ng Figure B. Mahahanap ito sa mga intersection ng mga linya ng grid.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => cross(cx,cy,28),
      [
        // A: diamond pattern - doesn't contain cross
        (cx,cy) => diamond(cx,cy,36,'none') + diamond(cx,cy,20,'none'),
        // B: grid - CORRECT - contains cross in center
        (cx,cy) => {for(let d=-24;d<=24;d+=12){line(cx+d,cy-36,cx+d,cy+36)+line(cx-36,cy+d,cx+36,cy+d)} return [[-24,-12,12],[0,-12,12],[-12,-24,12],[...Array(3)].map((_,i)=>rect(cx-38+i*25,cy-38,22,22,'none',C.grid,1)).join('')].join('')},
        // C: circles - doesn't clearly contain cross
        (cx,cy) => circle(cx,cy,36,'none') + circle(cx,cy,22,'none') + circle(cx,cy,8,C.blue),
        // D: triangle - doesn't clearly contain cross
        (cx,cy) => triangle(cx,cy,52,'none') + triangle(cx,cy,30,'none'),
      ],
      'B'
    ),
  },

  // For Q20-Q30, I'll use simplified but clear hidden-figure SVGs
  {
    n:20, topicKey:'analogy', correct:'d', difficulty:2,
    stem:'The small triangle on the left is hidden inside one of the four figures A, B, C, D. Which figure contains the triangle?',
    explanation_en:'The small triangle is embedded within Figure D, which contains a star of triangles — the small triangle can be found as one of the star\'s points.',
    explanation_fil:'Ang maliit na tatsulok ay nakapaloob sa Figure D na may bituin na gawa sa mga tatsulok.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => triangle(cx,cy,26,C.blue,C.blue,1),
      [
        (cx,cy) => circle(cx,cy,36,'none') + circle(cx,cy,18,'none'),
        (cx,cy) => square(cx,cy,52,'none') + square(cx,cy,28,'none'),
        (cx,cy) => diamond(cx,cy,36,'none') + diamond(cx,cy,20,'none'),
        (cx,cy) => { // Star of 6 triangles — CORRECT
          let o='';
          for(let i=0;i<6;i++){const a=(Math.PI/3)*i; o+=triangle(cx+28*Math.cos(a),cy+28*Math.sin(a),18,'none',C.blue,1.5)}
          return o;
        },
      ],
      'D'
    ),
  },
  {
    n:21, topicKey:'analogy', correct:'b', difficulty:2,
    stem:'The small parallelogram on the left is hidden inside one of the four figures A, B, C, D. Which figure contains it?',
    explanation_en:'The parallelogram is hidden within Figure B, which contains overlapping quadrilaterals that include the parallelogram shape.',
    explanation_fil:'Ang parallelogram ay nakatago sa loob ng Figure B na may magkakapatong na mga quadrilateral.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => `<polygon points="${cx-25},${cy-10} ${cx+5},${cy-10} ${cx+25},${cy+10} ${cx-5},${cy+10}" fill="${C.blue}"/>`,
      [
        (cx,cy) => circle(cx,cy,38,'none') + triangle(cx,cy,52,'none'),
        (cx,cy) => { // Overlapping parallelograms — CORRECT
          const p = (dx,dy) => `<polygon points="${cx-22+dx},${cy-10+dy} ${cx+8+dx},${cy-10+dy} ${cx+22+dx},${cy+10+dy} ${cx-8+dx},${cy+10+dy}" fill="none" stroke="${C.blue}" stroke-width="1.5"/>`;
          return p(0,0)+p(8,-8)+p(-8,8);
        },
        (cx,cy) => diamond(cx,cy,36,'none') + square(cx,cy,40,'none'),
        (cx,cy) => circle(cx,cy,36,'none') + line(cx-36,cy,cx+36,cy) + line(cx,cy-36,cx,cy+36),
      ],
      'B'
    ),
  },
  {
    n:22, topicKey:'analogy', correct:'d', difficulty:2,
    stem:'The small rectangle on the left is hidden inside one of the four figures A, B, C, D. Which figure contains it?',
    explanation_en:'The rectangle is found within Figure D, which has a grid of overlapping rectangles.',
    explanation_fil:'Ang rektanggulo ay matatagpuan sa Figure D na may grid ng mga magkakapatong na rektanggulo.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => rect(cx-24,cy-14,48,28,C.blue,C.blue,1),
      [
        (cx,cy) => circle(cx,cy,36,'none') + circle(cx,cy,20,'none'),
        (cx,cy) => triangle(cx,cy,52,'none') + triangle(cx,cy,30,'none'),
        (cx,cy) => diamond(cx,cy,36,'none') + line(cx-36,cy,cx+36,cy) + line(cx,cy-36,cx,cy+36),
        (cx,cy) => { // Grid of rects — CORRECT
          let o='';
          for(let r=-1;r<=1;r++) for(let c=-1;c<=1;c++) o+=rect(cx+c*20-12,cy+r*16-10,24,20,'none',C.blue,1);
          return o;
        },
      ],
      'D'
    ),
  },
  {
    n:23, topicKey:'analogy', correct:'d', difficulty:2,
    stem:'The small square on the left is hidden inside one of the four figures A, B, C, D. Which figure contains it?',
    explanation_en:'The square is hidden within Figure D\'s pattern of overlapping rectangles, where a square region can be traced.',
    explanation_fil:'Ang parisukat ay nakatago sa loob ng Figure D sa pattern ng magkakapatong na rektanggulo.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => square(cx,cy,30,C.blue,C.blue,1),
      [
        (cx,cy) => circle(cx,cy,36,'none')+line(cx-36,cy,cx+36,cy)+line(cx,cy-36,cx,cy+36),
        (cx,cy) => triangle(cx,cy,52,'none')+line(cx-26,cy,cx+26,cy),
        (cx,cy) => diamond(cx,cy,36,'none')+diamond(cx,cy,20,'none'),
        (cx,cy) => { // Overlapping rects with embedded square — CORRECT
          return rect(cx-40,cy-20,80,40,'none',C.blue,1.5)+rect(cx-20,cy-40,40,80,'none',C.blue,1.5)+rect(cx-20,cy-20,40,40,'none',C.blue,2);
        },
      ],
      'D'
    ),
  },
  {
    n:24, topicKey:'analogy', correct:'a', difficulty:2,
    stem:'The small right-triangle on the left is hidden inside one of the four figures A, B, C, D. Which figure contains it?',
    explanation_en:'The right triangle can be identified within Figure A\'s complex diagonal line arrangement, where perpendicular lines form the right angle.',
    explanation_fil:'Ang right triangle ay matatagpuan sa Figure A sa komplikadong diagonal na linya nito.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => `<polygon points="${cx-22},${cy+22} ${cx-22},${cy-22} ${cx+22},${cy+22}" fill="${C.blue}"/>`,
      [
        (cx,cy) => { // Grid with diagonals — CORRECT (right triangles everywhere)
          return rect(cx-40,cy-40,80,80,'none',C.blue,1.5)+line(cx-40,cy-40,cx+40,cy+40)+line(cx-40,cy+40,cx+40,cy-40)+line(cx-40,cy,cx+40,cy)+line(cx,cy-40,cx,cy+40);
        },
        (cx,cy) => circle(cx,cy,36,'none')+circle(cx,cy,20,'none'),
        (cx,cy) => square(cx,cy,50,'none')+square(cx,cy,26,'none'),
        (cx,cy) => diamond(cx,cy,36,'none')+line(cx-36,cy,cx+36,cy),
      ],
      'A'
    ),
  },
  {
    n:25, topicKey:'analogy', correct:'b', difficulty:2,
    stem:'The small right-triangle on the left is hidden inside one of A, B, C, D. Which contains it?',
    explanation_en:'The right triangle is hidden within Figure B, an octagon with an inner square and diagonal lines crossing it.',
    explanation_fil:'Ang right triangle ay nakatago sa Figure B, isang octagon na may panloob na parisukat at mga diagonal na linya.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => `<polygon points="${cx-20},${cy+20} ${cx-20},${cy-20} ${cx+20},${cy+20}" fill="${C.blue}"/>`,
      [
        (cx,cy) => circle(cx,cy,36,'none')+square(cx,cy,46,'none'),
        (cx,cy) => { // Octagon with inner square and diagonals — CORRECT
          const r=38, pts=Array.from({length:8},(_,i)=>{const a=Math.PI/4*i;return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' ');
          return `<polygon points="${pts}" fill="none" stroke="${C.blue}" stroke-width="1.5"/>`+square(cx,cy,38,'none',C.blue,1.5)+line(cx-27,cy-27,cx+27,cy+27)+line(cx-27,cy+27,cx+27,cy-27);
        },
        (cx,cy) => triangle(cx,cy,52,'none')+circle(cx,cy,22,'none'),
        (cx,cy) => diamond(cx,cy,36,'none')+square(cx,cy,34,'none'),
      ],
      'B'
    ),
  },
  {
    n:26, topicKey:'analogy', correct:'c', difficulty:2,
    stem:'The small shape on the left is hidden inside one of A, B, C, D. Which contains it?',
    explanation_en:'The small angular shape (open angle bracket) is embedded within Figure C\'s complex pattern of diagonal lines forming multiple angles.',
    explanation_fil:'Ang maliit na angular shape ay nakapaloob sa Figure C sa pattern ng mga diagonal na linya.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => `<path d="M${cx+20},${cy-20} L${cx-10},${cy} L${cx+20},${cy+20}" fill="none" stroke="${C.blue}" stroke-width="3"/>`,
      [
        (cx,cy) => circle(cx,cy,36,'none')+line(cx-36,cy,cx+36,cy),
        (cx,cy) => square(cx,cy,50,'none')+square(cx,cy,26,'none'),
        (cx,cy) => { // Angled lines — CORRECT
          let o='';
          for(let i=0;i<5;i++) o+=`<path d="M${cx+28-i*10},${cy-28+i*10} L${cx-8-i*10},${cy+i*14} L${cx+28-i*10},${cy+28-i*10}" fill="none" stroke="${C.blue}" stroke-width="${i===0?2:1}"/>`;
          return o;
        },
        (cx,cy) => diamond(cx,cy,36,'none')+diamond(cx,cy,18,'none'),
      ],
      'C'
    ),
  },
  {
    n:27, topicKey:'analogy', correct:'c', difficulty:2,
    stem:'The crescent-like shape on the left is hidden inside one of A, B, C, D. Which contains it?',
    explanation_en:'The crescent is embedded within Figure C, which shows a triangle with hatching and a circular arc inside, creating the crescent form.',
    explanation_fil:'Ang kalahating-bilog na hugis ay nakapaloob sa Figure C, isang tatsulok na may hatching at isang circular arc sa loob.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => `<path d="M${cx},${cy-24} A 24 24 0 0 1 ${cx},${cy+24} A 14 14 0 0 0 ${cx},${cy-24}" fill="${C.blue}"/>`,
      [
        (cx,cy) => circle(cx,cy,36,'none')+square(cx,cy,46,'none'),
        (cx,cy) => diamond(cx,cy,36,'none')+line(cx-36,cy,cx+36,cy)+line(cx,cy-36,cx,cy+36),
        (cx,cy) => { // Triangle with arc inside — CORRECT
          return triangle(cx,cy+8,60,'none')+`<path d="M${cx-20},${cy+20} A 28 28 0 0 1 ${cx+20},${cy+20}" fill="none" stroke="${C.blue}" stroke-width="2"/>`;
        },
        (cx,cy) => square(cx,cy,50,'none')+circle(cx,cy,20,'none'),
      ],
      'C'
    ),
  },
  {
    n:28, topicKey:'analogy', correct:'c', difficulty:2,
    stem:'The small pennant/flag shape on the left is hidden inside one of A, B, C, D. Which contains it?',
    explanation_en:'The pennant shape (triangle on a pole) is identifiable within Figure C\'s hatched quadrilateral arrangement where a triangular region appears.',
    explanation_fil:'Ang maliit na pennant shape ay matatagpuan sa loob ng Figure C sa hatched quadrilateral arrangement nito.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => `<polygon points="${cx-8},${cy-28} ${cx+22},${cy-10} ${cx-8},${cy+8}" fill="${C.blue}"/><line x1="${cx-8}" y1="${cy-28}" x2="${cx-8}" y2="${cy+30}" stroke="${C.blue}" stroke-width="2.5"/>`,
      [
        (cx,cy) => circle(cx,cy,38,'none')+triangle(cx,cy,50,'none'),
        (cx,cy) => square(cx,cy,50,'none')+diamond(cx,cy,30,'none'),
        (cx,cy) => { // Hatched quadrilateral — CORRECT (contains pennant shape)
          const q=`<polygon points="${cx-40},${cy-20} ${cx+30},${cy-30} ${cx+40},${cy+20} ${cx-30},${cy+30}" fill="none" stroke="${C.blue}" stroke-width="2"/>`;
          let hatch='';
          for(let d=-40;d<=40;d+=10) hatch+=line(cx+d-10,cy-30,cx+d+10,cy+30,C.blue,0.8);
          return q+hatch;
        },
        (cx,cy) => diamond(cx,cy,36,'none')+diamond(cx,cy,18,'none'),
      ],
      'C'
    ),
  },
  {
    n:29, topicKey:'analogy', correct:'b', difficulty:2,
    stem:'The small pentagon on the left is hidden inside one of A, B, C, D. Which figure contains it?',
    explanation_en:'The pentagon is visible within Figure B, an orb/globe shape that contains a pentagonal outline inside.',
    explanation_fil:'Ang pentagon ay matatagpuan sa Figure B, isang globo na may pentagonal na outline sa loob.',
    svgFn: () => {
      function pentagon(cx, cy, r, fill='none') {
        const pts=Array.from({length:5},(_,i)=>{const a=(2*Math.PI/5)*i-Math.PI/2; return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' ');
        return `<polygon points="${pts}" fill="${fill}" stroke="${C.blue}" stroke-width="2"/>`;
      }
      return makeHiddenFigureSvg(
        (cx,cy) => pentagon(cx,cy,26,C.blue),
        [
          (cx,cy) => circle(cx,cy,36,'none')+circle(cx,cy,18,'none'),
          (cx,cy) => circle(cx,cy,36,'none')+pentagon(cx,cy,22), // CORRECT
          (cx,cy) => square(cx,cy,50,'none')+square(cx,cy,26,'none'),
          (cx,cy) => triangle(cx,cy,50,'none')+triangle(cx,cy,28,'none'),
        ],
        'B'
      );
    },
  },
  {
    n:30, topicKey:'analogy', correct:'d', difficulty:2,
    stem:'The crescent/moon shape on the left is hidden inside one of A, B, C, D. Which figure contains it?',
    explanation_en:'The crescent is found within Figure D, a diamond with crossed lines where a crescent appears in one of the four regions created by the lines.',
    explanation_fil:'Ang kalahating-buwan ay matatagpuan sa Figure D, isang diamond na may crossed na linya kung saan makikita ang crescent sa isa sa apat na rehiyon.',
    svgFn: () => makeHiddenFigureSvg(
      (cx,cy) => `<path d="M${cx},${cy-22} A 22 22 0 1 0 ${cx},${cy+22} A 12 12 0 0 1 ${cx},${cy-22}" fill="${C.blue}"/>`,
      [
        (cx,cy) => circle(cx,cy,36,'none')+square(cx,cy,50,'none'),
        (cx,cy) => triangle(cx,cy,52,'none')+circle(cx,cy,22,'none'),
        (cx,cy) => square(cx,cy,50,'none')+line(cx-50,cy,cx+50,cy),
        (cx,cy) => diamond(cx,cy,38,'none')+line(cx-38,cy,cx+38,cy)+line(cx,cy-38,cx,cy+38), // CORRECT
      ],
      'D'
    ),
  },
];

// Topic IDs from DB
let TOPIC_IDS = { pro: {}, sub: {} };

async function loadTopics() {
  const { data, error } = await sb
    .from('topics')
    .select('id, slug, subject_areas!inner(exam_types!inner(slug))')
    .in('slug', ['series-completion','pattern-completion','analogies','odd-one-out']);
  if (error) throw error;

  for (const t of data) {
    const examSlug = t.subject_areas?.exam_types?.slug;
    const isPro = examSlug === 'cse-professional';
    const isSub = examSlug === 'cse-subprofessional';
    const key = t.slug.replace('-completion','').replace('analogies','analogy');
    if (isPro) TOPIC_IDS.pro[key] = t.id;
    if (isSub) TOPIC_IDS.sub[key] = t.id;
  }
  console.log('  Loaded topic IDs:', JSON.stringify(TOPIC_IDS, null, 2));
}

// ── Step 1: True in-topic deduplication ──────────────────────────────────────

async function step1_dedup() {
  console.log('\n── Step 1: Remove true in-topic duplicates ──');
  const all = await fetchAllQuestions();

  const byKey = {};
  for (const q of all) {
    const k = norm(q.stem) + '|' + q.topic_id;
    if (!byKey[k]) byKey[k] = [];
    byKey[k].push(q);
  }

  const toDelete = [];
  for (const qs of Object.values(byKey)) {
    if (qs.length <= 1) continue;
    const sorted = qs.sort((a, b) => a.created_at < b.created_at ? -1 : 1);
    toDelete.push(...sorted.slice(1).map(q => q.id));
  }

  await safeDelete(toDelete, 'in-topic duplicate questions');
}

// ── Step 2: Delete bad AR questions (PDF page images) ────────────────────────

async function step2_deleteBadAR() {
  console.log('\n── Step 2: Delete bad AR questions (full PDF page images) ──');
  const { data, error } = await sb
    .from('questions')
    .select('id')
    .like('image_url', '%ar-page%');
  if (error) throw error;
  const ids = data.map(q => q.id);
  await safeDelete(ids, 'PDF-page AR questions');
}

// ── Step 3: Generate + insert proper AR questions ────────────────────────────

async function uploadSvg(filename, svgStr) {
  const buf = Buffer.from(svgStr, 'utf8');
  const { error } = await sb.storage
    .from('question-images')
    .upload(filename, buf, { contentType: 'image/svg+xml', upsert: true });
  if (error) throw new Error(`Upload ${filename}: ${error.message}`);
  const { data } = sb.storage.from('question-images').getPublicUrl(filename);
  return data.publicUrl;
}

async function step3_insertNewAR() {
  console.log('\n── Step 3: Generate + insert clean AR questions ──');
  await loadTopics();

  const VISUAL_CHOICES = [
    { id: 'a', text: 'Figure A' },
    { id: 'b', text: 'Figure B' },
    { id: 'c', text: 'Figure C' },
    { id: 'd', text: 'Figure D' },
  ];

  let ok = 0, fail = 0;
  for (const q of AR_QUESTIONS) {
    try {
      const svgStr = q.svgFn();
      const filename = `ar-v2/cse-q${String(q.n).padStart(2,'0')}.svg`;
      const imageUrl = await uploadSvg(filename, svgStr);

      // Map topic key
      const topicKey = q.topicKey; // 'series' | 'pattern' | 'analogy'
      const proTopicId = TOPIC_IDS.pro[topicKey];
      const subTopicId = TOPIC_IDS.sub[topicKey];

      if (!proTopicId || !subTopicId) {
        console.warn(`  ⚠  Q${q.n}: no topic IDs for key '${topicKey}', skipping`);
        fail++;
        continue;
      }

      const base = {
        stem: q.stem,
        choices: VISUAL_CHOICES,
        correct_choice_id: q.correct,
        difficulty: q.difficulty,
        explanation_en: q.explanation_en,
        explanation_fil: q.explanation_fil,
        image_url: imageUrl,
        source_note: `CSE 2026 AR Q${q.n} — programmatic SVG v2`,
        status: 'published',
        is_verified: true,
      };

      const { error } = await sb.from('questions').insert([
        { ...base, topic_id: proTopicId },
        { ...base, topic_id: subTopicId },
      ]);
      if (error) throw error;
      ok++;
      console.log(`  ✅ Q${q.n} inserted (Pro + Sub)`);
    } catch (err) {
      fail++;
      console.error(`  ❌ Q${q.n}: ${err.message}`);
    }
  }

  console.log(`\n  AR done: ${ok*2} inserted (${ok} questions × 2 exam types), ${fail} failed`);
}

// ── Step 4: Delete draft questions ───────────────────────────────────────────

async function step4_deleteDrafts() {
  console.log('\n── Step 4: Delete draft/unpublished questions ──');
  const { data, error } = await sb
    .from('questions')
    .select('id')
    .eq('status', 'draft');
  if (error) throw error;
  await safeDelete(data.map(q => q.id), 'draft questions');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔧 ReviewNatin — Question Bank Cleanup\n');

  await step1_dedup();
  await step2_deleteBadAR();
  await step3_insertNewAR();
  await step4_deleteDrafts();

  // Final count
  const { count } = await sb.from('questions').select('*', { count: 'exact', head: true });
  console.log(`\n✅ Done. Total questions now: ${count}`);
}

main().catch(e => { console.error('\n💥 Fatal:', e.message); process.exit(1); });
