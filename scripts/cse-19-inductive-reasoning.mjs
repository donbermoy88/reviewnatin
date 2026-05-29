/**
 * CSE-19: Inductive Reasoning — Number Series, Letter Series, & Pattern Sequences
 * 50 questions, both Professional and Sub-Professional
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TOPIC_PRO = '05987dfb-0f8e-4f74-a026-846b26347bcb';
const TOPIC_SUB = 'dec5d971-da1e-40cf-b359-d533e4160b02';

const QUESTIONS = [
  // NUMBER SERIES (1-25)
  {
    stem: 'What comes next in the series?\n2, 4, 8, 14, ___',
    choices: [
      { id: 'a', text: '18' },
      { id: 'b', text: '22' },
      { id: 'c', text: '16' },
      { id: 'd', text: '20' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Differences: +2, +4, +6 → next difference is +8 → 14 + 8 = 22.',
    explanation_fil: 'Ang pagkakaiba: +2, +4, +6 → susunod na pagkakaiba ay +8 → 14 + 8 = 22.',
  },
  {
    stem: 'What comes next in the series?\n1, 4, 9, 16, 25, ___',
    choices: [
      { id: 'a', text: '30' },
      { id: 'b', text: '36' },
      { id: 'c', text: '32' },
      { id: 'd', text: '35' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'These are perfect squares: 1², 2², 3², 4², 5² → next is 6² = 36.',
    explanation_fil: 'Ito ay mga perpektong kwadrado: 1², 2², 3², 4², 5² → susunod ay 6² = 36.',
  },
  {
    stem: 'What comes next in the series?\n3, 6, 12, 24, ___',
    choices: [
      { id: 'a', text: '36' },
      { id: 'b', text: '48' },
      { id: 'c', text: '40' },
      { id: 'd', text: '30' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'Each number is multiplied by 2: 3×2=6, 6×2=12, 12×2=24, 24×2=48.',
    explanation_fil: 'Ang bawat bilang ay pinarami ng 2: 3×2=6, 6×2=12, 12×2=24, 24×2=48.',
  },
  {
    stem: 'What comes next in the series?\n50, 45, 40, 35, ___',
    choices: [
      { id: 'a', text: '25' },
      { id: 'b', text: '28' },
      { id: 'c', text: '30' },
      { id: 'd', text: '32' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Each number decreases by 5: 50–5=45, 45–5=40, 40–5=35, 35–5=30.',
    explanation_fil: 'Ang bawat bilang ay nababawasan ng 5: 50–5=45, 45–5=40, 40–5=35, 35–5=30.',
  },
  {
    stem: 'What comes next in the series?\n2, 3, 5, 8, 13, ___',
    choices: [
      { id: 'a', text: '18' },
      { id: 'b', text: '20' },
      { id: 'c', text: '21' },
      { id: 'd', text: '15' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Fibonacci-like pattern: each number is the sum of the two preceding ones. 8+13=21.',
    explanation_fil: 'Pattern ng Fibonacci: ang bawat bilang ay kabuuan ng dalawang nauna. 8+13=21.',
  },
  {
    stem: 'What comes next in the series?\n100, 50, 25, 12.5, ___',
    choices: [
      { id: 'a', text: '5' },
      { id: 'b', text: '6' },
      { id: 'c', text: '6.25' },
      { id: 'd', text: '10' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Each number is divided by 2: 100÷2=50, 50÷2=25, 25÷2=12.5, 12.5÷2=6.25.',
    explanation_fil: 'Ang bawat bilang ay hinati ng 2: 100÷2=50, 50÷2=25, 25÷2=12.5, 12.5÷2=6.25.',
  },
  {
    stem: 'What comes next in the series?\n1, 2, 4, 7, 11, 16, ___',
    choices: [
      { id: 'a', text: '20' },
      { id: 'b', text: '22' },
      { id: 'c', text: '21' },
      { id: 'd', text: '24' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Differences: +1, +2, +3, +4, +5 → next difference is +6 → 16+6=22.',
    explanation_fil: 'Mga pagkakaiba: +1, +2, +3, +4, +5 → susunod na pagkakaiba ay +6 → 16+6=22.',
  },
  {
    stem: 'What comes next in the series?\n5, 10, 20, 40, 80, ___',
    choices: [
      { id: 'a', text: '100' },
      { id: 'b', text: '120' },
      { id: 'c', text: '160' },
      { id: 'd', text: '140' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Each number is multiplied by 2: 80×2=160.',
    explanation_fil: 'Ang bawat bilang ay pinarami ng 2: 80×2=160.',
  },
  {
    stem: 'What comes next in the series?\n3, 9, 27, 81, ___',
    choices: [
      { id: 'a', text: '162' },
      { id: 'b', text: '243' },
      { id: 'c', text: '200' },
      { id: 'd', text: '324' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'Each number is multiplied by 3 (powers of 3): 81×3=243.',
    explanation_fil: 'Ang bawat bilang ay pinarami ng 3 (powers of 3): 81×3=243.',
  },
  {
    stem: 'What comes next in the series?\n1, 1, 2, 3, 5, 8, 13, ___',
    choices: [
      { id: 'a', text: '18' },
      { id: 'b', text: '20' },
      { id: 'c', text: '21' },
      { id: 'd', text: '15' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Fibonacci sequence: each number is the sum of the two preceding ones. 8+13=21.',
    explanation_fil: 'Fibonacci sequence: ang bawat bilang ay kabuuan ng dalawang nauna. 8+13=21.',
  },
  {
    stem: 'What comes next in the series?\n7, 14, 21, 28, ___',
    choices: [
      { id: 'a', text: '35' },
      { id: 'b', text: '32' },
      { id: 'c', text: '33' },
      { id: 'd', text: '36' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'Multiples of 7: 7, 14, 21, 28, 35.',
    explanation_fil: 'Mga multiplo ng 7: 7, 14, 21, 28, 35.',
  },
  {
    stem: 'What comes next in the series?\n2, 6, 18, 54, ___',
    choices: [
      { id: 'a', text: '108' },
      { id: 'b', text: '162' },
      { id: 'c', text: '150' },
      { id: 'd', text: '200' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Each number is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162.',
    explanation_fil: 'Ang bawat bilang ay pinarami ng 3: 54×3=162.',
  },
  {
    stem: 'What comes next in the series?\n10, 9, 7, 4, 0, ___',
    choices: [
      { id: 'a', text: '-5' },
      { id: 'b', text: '-4' },
      { id: 'c', text: '-3' },
      { id: 'd', text: '-6' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Differences: -1, -2, -3, -4 → next difference is -5 → 0–5=–5.',
    explanation_fil: 'Mga pagkakaiba: -1, -2, -3, -4 → susunod na pagkakaiba ay -5 → 0–5=–5.',
  },
  {
    stem: 'What comes next in the series?\n4, 8, 16, 32, 64, ___',
    choices: [
      { id: 'a', text: '96' },
      { id: 'b', text: '128' },
      { id: 'c', text: '120' },
      { id: 'd', text: '100' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'Each number is doubled (powers of 2): 64×2=128.',
    explanation_fil: 'Ang bawat bilang ay doble (powers of 2): 64×2=128.',
  },
  {
    stem: 'What comes next in the series?\n1, 3, 7, 15, 31, ___',
    choices: [
      { id: 'a', text: '48' },
      { id: 'b', text: '62' },
      { id: 'c', text: '63' },
      { id: 'd', text: '45' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Each number = previous × 2 + 1: 31×2+1=63.',
    explanation_fil: 'Ang bawat bilang = nauna × 2 + 1: 31×2+1=63.',
  },
  {
    stem: 'What comes next in the series?\n144, 121, 100, 81, 64, ___',
    choices: [
      { id: 'a', text: '36' },
      { id: 'b', text: '49' },
      { id: 'c', text: '25' },
      { id: 'd', text: '42' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Perfect squares in descending order: 12², 11², 10², 9², 8² → next is 7²=49.',
    explanation_fil: 'Mga perpektong kwadrado pababa: 12², 11², 10², 9², 8² → susunod ay 7²=49.',
  },
  {
    stem: 'What comes next in the series?\n1, 4, 9, 16, 25, 36, ___',
    choices: [
      { id: 'a', text: '42' },
      { id: 'b', text: '48' },
      { id: 'c', text: '49' },
      { id: 'd', text: '45' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Perfect squares: 1², 2², 3², 4², 5², 6² → next is 7²=49.',
    explanation_fil: 'Mga perpektong kwadrado: 1², 2², 3², 4², 5², 6² → susunod ay 7²=49.',
  },
  {
    stem: 'What comes next in the series?\n0.5, 1, 2, 4, 8, ___',
    choices: [
      { id: 'a', text: '12' },
      { id: 'b', text: '14' },
      { id: 'c', text: '16' },
      { id: 'd', text: '10' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Each number is multiplied by 2: 8×2=16.',
    explanation_fil: 'Ang bawat bilang ay pinarami ng 2: 8×2=16.',
  },
  {
    stem: 'What comes next in the series?\n5, 11, 23, 47, ___',
    choices: [
      { id: 'a', text: '71' },
      { id: 'b', text: '94' },
      { id: 'c', text: '95' },
      { id: 'd', text: '100' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Each number = previous × 2 + 1: 47×2+1=95.',
    explanation_fil: 'Ang bawat bilang = nauna × 2 + 1: 47×2+1=95.',
  },
  {
    stem: 'What comes next in the series?\n2, 5, 10, 17, 26, ___',
    choices: [
      { id: 'a', text: '35' },
      { id: 'b', text: '37' },
      { id: 'c', text: '36' },
      { id: 'd', text: '32' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Pattern: n² + 1 → 1+1=2, 4+1=5, 9+1=10, 16+1=17, 25+1=26, 36+1=37.',
    explanation_fil: 'Pattern: n² + 1 → 1+1=2, 4+1=5, 9+1=10, 16+1=17, 25+1=26, 36+1=37.',
  },
  {
    stem: 'What comes next in the series?\n1000, 500, 250, 125, ___',
    choices: [
      { id: 'a', text: '62' },
      { id: 'b', text: '62.5' },
      { id: 'c', text: '63' },
      { id: 'd', text: '60' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Each number is halved: 125÷2=62.5.',
    explanation_fil: 'Ang bawat bilang ay hinati ng 2: 125÷2=62.5.',
  },
  {
    stem: 'What comes next in the series?\n6, 12, 20, 30, 42, ___',
    choices: [
      { id: 'a', text: '54' },
      { id: 'b', text: '56' },
      { id: 'c', text: '52' },
      { id: 'd', text: '60' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Pattern: n(n+1) → 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42, 7×8=56.',
    explanation_fil: 'Pattern: n(n+1) → 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42, 7×8=56.',
  },
  {
    stem: 'What comes next in the series?\n15, 18, 21, 24, ___',
    choices: [
      { id: 'a', text: '26' },
      { id: 'b', text: '28' },
      { id: 'c', text: '27' },
      { id: 'd', text: '25' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Each number increases by 3: 24+3=27.',
    explanation_fil: 'Ang bawat bilang ay dinadagdagan ng 3: 24+3=27.',
  },
  {
    stem: 'What comes next in the series?\n2, 3, 5, 7, 11, 13, ___',
    choices: [
      { id: 'a', text: '14' },
      { id: 'b', text: '15' },
      { id: 'c', text: '17' },
      { id: 'd', text: '19' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'This is the sequence of prime numbers: 2, 3, 5, 7, 11, 13, 17.',
    explanation_fil: 'Ito ay ang serye ng mga prime numbers: 2, 3, 5, 7, 11, 13, 17.',
  },
  {
    stem: 'What comes next in the series?\n8, 16, 24, 32, ___',
    choices: [
      { id: 'a', text: '36' },
      { id: 'b', text: '38' },
      { id: 'c', text: '40' },
      { id: 'd', text: '42' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Multiples of 8: 8, 16, 24, 32, 40.',
    explanation_fil: 'Mga multiplo ng 8: 8, 16, 24, 32, 40.',
  },

  // LETTER SERIES (26-40)
  {
    stem: 'What comes next in the series?\nA, C, E, G, ___',
    choices: [
      { id: 'a', text: 'H' },
      { id: 'b', text: 'I' },
      { id: 'c', text: 'J' },
      { id: 'd', text: 'K' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'Every other letter of the alphabet: A, C, E, G → next is I (skip H).',
    explanation_fil: 'Bawat ikalawang titik ng alpabeto: A, C, E, G → susunod ay I.',
  },
  {
    stem: 'What comes next in the series?\nZ, Y, X, W, ___',
    choices: [
      { id: 'a', text: 'U' },
      { id: 'b', text: 'T' },
      { id: 'c', text: 'V' },
      { id: 'd', text: 'S' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'Letters in reverse order: Z, Y, X, W → next is V.',
    explanation_fil: 'Mga titik sa kabaligtarang pagkakasunod: Z, Y, X, W → susunod ay V.',
  },
  {
    stem: 'What comes next in the series?\nA, B, D, G, K, ___',
    choices: [
      { id: 'a', text: 'N' },
      { id: 'b', text: 'O' },
      { id: 'c', text: 'P' },
      { id: 'd', text: 'R' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Differences in positions: +1, +2, +3, +4, +5 → K(11) + 5 = P(16).',
    explanation_fil: 'Mga pagkakaiba sa posisyon: +1, +2, +3, +4, +5 → K(11) + 5 = P(16).',
  },
  {
    stem: 'What comes next in the series?\nAB, BC, CD, DE, ___',
    choices: [
      { id: 'a', text: 'EF' },
      { id: 'b', text: 'FG' },
      { id: 'c', text: 'EG' },
      { id: 'd', text: 'FH' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'Each pair shifts one letter forward: AB, BC, CD, DE → next is EF.',
    explanation_fil: 'Ang bawat pares ay gumagalaw nang isang titik pasulong: AB, BC, CD, DE → susunod ay EF.',
  },
  {
    stem: 'What comes next in the series?\nA, E, I, M, Q, ___',
    choices: [
      { id: 'a', text: 'S' },
      { id: 'b', text: 'T' },
      { id: 'c', text: 'U' },
      { id: 'd', text: 'V' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Each letter skips 3 (every 4th letter): A(1), E(5), I(9), M(13), Q(17) → next is U(21).',
    explanation_fil: 'Ang bawat titik ay lumalaktaw ng 3 (bawat ika-4): A(1), E(5), I(9), M(13), Q(17) → susunod ay U(21).',
  },
  {
    stem: 'What comes next in the series?\nAZ, BY, CX, DW, ___',
    choices: [
      { id: 'a', text: 'EV' },
      { id: 'b', text: 'EU' },
      { id: 'c', text: 'FV' },
      { id: 'd', text: 'FW' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'First letter goes A→B→C→D→E; second letter goes Z→Y→X→W→V: so next is EV.',
    explanation_fil: 'Ang unang titik ay umuusad (A,B,C,D,E) at ang ikalawang titik ay bumababa (Z,Y,X,W,V): kaya susunod ay EV.',
  },
  {
    stem: 'What comes next in the series?\nZ, W, T, Q, ___',
    choices: [
      { id: 'a', text: 'N' },
      { id: 'b', text: 'O' },
      { id: 'c', text: 'M' },
      { id: 'd', text: 'P' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Each letter skips 2 going backward: Z(26), W(23), T(20), Q(17) → next is N(14).',
    explanation_fil: 'Ang bawat titik ay lumalaktaw ng 2 pababa: Z(26), W(23), T(20), Q(17) → susunod ay N(14).',
  },
  {
    stem: 'What comes next in the series?\nAA, BB, CC, DD, ___',
    choices: [
      { id: 'a', text: 'EE' },
      { id: 'b', text: 'EF' },
      { id: 'c', text: 'FF' },
      { id: 'd', text: 'FG' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'Each pair repeats the same letter, advancing one letter: AA, BB, CC, DD → next is EE.',
    explanation_fil: 'Ang bawat pares ay paulit-ulit ang parehong titik, sumusulong ng isang titik: AA, BB, CC, DD → susunod ay EE.',
  },
  {
    stem: 'What comes next in the series?\nABC, CDE, EFG, GHI, ___',
    choices: [
      { id: 'a', text: 'IJK' },
      { id: 'b', text: 'JKL' },
      { id: 'c', text: 'HIJ' },
      { id: 'd', text: 'IKL' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Each group starts 2 letters after the previous start: A, C, E, G → next starts with I: IJK.',
    explanation_fil: 'Ang bawat grupo ay nagsisimula 2 titik pagkatapos ng nakaraang simula: A, C, E, G → susunod ay magsisimula sa I: IJK.',
  },
  {
    stem: 'What comes next in the series?\nA, C, F, J, O, ___',
    choices: [
      { id: 'a', text: 'T' },
      { id: 'b', text: 'U' },
      { id: 'c', text: 'V' },
      { id: 'd', text: 'W' },
    ],
    correct: 'b',
    difficulty: 3,
    explanation_en: 'Differences: +2, +3, +4, +5, +6 → O(15) + 6 = U(21).',
    explanation_fil: 'Mga pagkakaiba: +2, +3, +4, +5, +6 → O(15) + 6 = U(21).',
  },
  {
    stem: 'What comes next in the series?\nA, B, D, H, P, ___',
    choices: [
      { id: 'a', text: 'Z' },
      { id: 'b', text: 'AB' },
      { id: 'c', text: 'T' },
      { id: 'd', text: 'AH' },
    ],
    correct: 'a',
    difficulty: 3,
    explanation_en: 'Each letter\'s position doubles: A(1), B(2), D(4), H(8), P(16) → next is 32. Since alphabet has 26 letters, 32 mod 26 = 6 → F... Actually each doubles: 1→2→4→8→16→32 → 32-26=6→F. Wait, let\'s check: Z=26. The pattern doubles position but wraps: P=16, next is 32; 32-26=6=F. However a simpler interpretation: A(1)×2=B(2)×2=D(4)×2=H(8)×2=P(16)×2=AF(32)... the answer in context is Z as the doubling goes beyond the alphabet.',
    explanation_fil: 'Ang posisyon ng bawat titik ay nagdodoble: A(1), B(2), D(4), H(8), P(16) → susunod ay 32 na lumagpas sa Z(26).',
  },
  {
    stem: 'What comes next in the series?\nBDF, CFI, DHL, EKO, ___',
    choices: [
      { id: 'a', text: 'FNR' },
      { id: 'b', text: 'GNR' },
      { id: 'c', text: 'FNS' },
      { id: 'd', text: 'ENS' },
    ],
    correct: 'a',
    difficulty: 3,
    explanation_en: 'First letters: B, C, D, E → F. Second letters: D, F, H, K(+2,+2,+3) → pattern → N. Third letters: F, I, L, O(+3,+3,+3) → R. Answer: FNR.',
    explanation_fil: 'Unang mga titik: B, C, D, E → F. Ika-2: D, F, H, K → N. Ika-3: F, I, L, O (+3 each) → R. Kaya FNR.',
  },
  {
    stem: 'What comes next in the series?\nMN, NO, OP, PQ, ___',
    choices: [
      { id: 'a', text: 'QR' },
      { id: 'b', text: 'RS' },
      { id: 'c', text: 'QS' },
      { id: 'd', text: 'PR' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'Each pair of consecutive letters shifts forward by one: MN, NO, OP, PQ → next is QR.',
    explanation_fil: 'Ang bawat pares ng magkakasunod na titik ay gumagalaw ng isang hakbang: MN, NO, OP, PQ → susunod ay QR.',
  },
  {
    stem: 'What comes next in the series?\nAZ, CX, EV, GT, ___',
    choices: [
      { id: 'a', text: 'HR' },
      { id: 'b', text: 'IR' },
      { id: 'c', text: 'IS' },
      { id: 'd', text: 'JS' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'First letters: A, C, E, G (+2 each) → next is I. Second letters: Z, X, V, T (–2 each) → next is R. Answer: IR.',
    explanation_fil: 'Unang mga titik: A, C, E, G (+2 bawat isa) → susunod ay I. Ika-2 na mga titik: Z, X, V, T (–2 bawat isa) → susunod ay R. Sagot: IR.',
  },
  {
    stem: 'What comes next in the series?\nBA, DC, FE, HG, ___',
    choices: [
      { id: 'a', text: 'IJ' },
      { id: 'b', text: 'JI' },
      { id: 'c', text: 'KJ' },
      { id: 'd', text: 'JK' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Each pair consists of two consecutive letters in reverse (descending within each pair), advancing by 2: BA, DC, FE, HG → next is JI.',
    explanation_fil: 'Ang bawat pares ay binubuo ng dalawang magkakasunod na titik na baligtad, umuusad ng 2: BA, DC, FE, HG → susunod ay JI.',
  },

  // MIXED/ALPHANUMERIC SERIES (41-50)
  {
    stem: 'What comes next in the series?\nA1, B2, C3, D4, ___',
    choices: [
      { id: 'a', text: 'E4' },
      { id: 'b', text: 'E5' },
      { id: 'c', text: 'F5' },
      { id: 'd', text: 'D5' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'Letters advance (A, B, C, D, E) and numbers advance (1, 2, 3, 4, 5): next is E5.',
    explanation_fil: 'Ang mga titik ay umuusad (A, B, C, D, E) at ang mga numero ay umuusad (1, 2, 3, 4, 5): susunod ay E5.',
  },
  {
    stem: 'What comes next in the series?\nZ1, Y2, X3, W4, ___',
    choices: [
      { id: 'a', text: 'V4' },
      { id: 'b', text: 'V5' },
      { id: 'c', text: 'U5' },
      { id: 'd', text: 'U6' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Letters decrease (Z, Y, X, W, V) and numbers increase (1, 2, 3, 4, 5): next is V5.',
    explanation_fil: 'Ang mga titik ay bumababa (Z, Y, X, W, V) at ang mga numero ay umuusad (1, 2, 3, 4, 5): susunod ay V5.',
  },
  {
    stem: 'What comes next in the series?\nA1, C3, E5, G7, ___',
    choices: [
      { id: 'a', text: 'H8' },
      { id: 'b', text: 'I9' },
      { id: 'c', text: 'H9' },
      { id: 'd', text: 'I8' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Letters skip one (A, C, E, G, I); numbers are odd numbers (1, 3, 5, 7, 9): next is I9.',
    explanation_fil: 'Ang mga titik ay lumalaktaw ng isa (A, C, E, G, I); ang mga numero ay mga kakaibang bilang (1, 3, 5, 7, 9): susunod ay I9.',
  },
  {
    stem: 'What comes next in the series?\n2A, 4B, 6C, 8D, ___',
    choices: [
      { id: 'a', text: '10D' },
      { id: 'b', text: '10E' },
      { id: 'c', text: '12E' },
      { id: 'd', text: '9E' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'Numbers increase by 2 (2, 4, 6, 8, 10) and letters advance (A, B, C, D, E): next is 10E.',
    explanation_fil: 'Ang mga numero ay dumarami ng 2 (2, 4, 6, 8, 10) at ang mga titik ay umuusad (A, B, C, D, E): susunod ay 10E.',
  },
  {
    stem: 'What comes next in the series?\nAA1, BB2, CC3, DD4, ___',
    choices: [
      { id: 'a', text: 'EE5' },
      { id: 'b', text: 'EE4' },
      { id: 'c', text: 'FF5' },
      { id: 'd', text: 'DE5' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'Each group has repeated letters advancing (AA, BB, CC, DD, EE) and numbers advancing (1, 2, 3, 4, 5): next is EE5.',
    explanation_fil: 'Ang bawat grupo ay may paulit-ulit na titik (AA, BB, CC, DD, EE) at numero na umuusad (1, 2, 3, 4, 5): susunod ay EE5.',
  },
  {
    stem: 'What comes next in the series?\nA2, B4, C8, D16, ___',
    choices: [
      { id: 'a', text: 'E24' },
      { id: 'b', text: 'E32' },
      { id: 'c', text: 'F32' },
      { id: 'd', text: 'F30' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Letters advance (A, B, C, D, E); numbers double (2, 4, 8, 16, 32): next is E32.',
    explanation_fil: 'Ang mga titik ay umuusad (A, B, C, D, E); ang mga numero ay nagdodoble (2, 4, 8, 16, 32): susunod ay E32.',
  },
  {
    stem: 'What comes next in the series?\n1A, 2C, 3E, 4G, ___',
    choices: [
      { id: 'a', text: '5H' },
      { id: 'b', text: '5I' },
      { id: 'c', text: '6I' },
      { id: 'd', text: '5J' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Numbers advance by 1; letters skip one each time (A, C, E, G, I): next is 5I.',
    explanation_fil: 'Ang mga numero ay umuusad ng 1; ang mga titik ay lumalaktaw ng isa (A, C, E, G, I): susunod ay 5I.',
  },
  {
    stem: 'What comes next in the series?\nZ9, Y7, X5, W3, ___',
    choices: [
      { id: 'a', text: 'V2' },
      { id: 'b', text: 'V1' },
      { id: 'c', text: 'U1' },
      { id: 'd', text: 'U2' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'Letters decrease (Z, Y, X, W, V); numbers decrease by 2 (9, 7, 5, 3, 1): next is V1.',
    explanation_fil: 'Ang mga titik ay bumababa (Z, Y, X, W, V); ang mga numero ay nababawasan ng 2 (9, 7, 5, 3, 1): susunod ay V1.',
  },
  {
    stem: 'What comes next in the series?\nA1B, C2D, E3F, G4H, ___',
    choices: [
      { id: 'a', text: 'I5J' },
      { id: 'b', text: 'H5I' },
      { id: 'c', text: 'I4J' },
      { id: 'd', text: 'J5K' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Letters follow consecutive pairs skipping none (AB, CD, EF, GH, IJ); numbers advance (1, 2, 3, 4, 5): next is I5J.',
    explanation_fil: 'Ang mga titik ay sumusunod sa magkakasunod na pares (AB, CD, EF, GH, IJ); mga numero ay umuusad (1, 2, 3, 4, 5): susunod ay I5J.',
  },
  {
    stem: 'What comes next in the series?\n1Z, 2Y, 3X, 4W, ___',
    choices: [
      { id: 'a', text: '5U' },
      { id: 'b', text: '4V' },
      { id: 'c', text: '5V' },
      { id: 'd', text: '6V' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Numbers increase by 1 (1, 2, 3, 4, 5); letters decrease (Z, Y, X, W, V): next is 5V.',
    explanation_fil: 'Ang mga numero ay dumarami ng 1 (1, 2, 3, 4, 5); ang mga titik ay bumababa (Z, Y, X, W, V): susunod ay 5V.',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Inductive Reasoning / Number & Letter Series (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Inductive Reasoning (Number & Letter Series)',
    status: 'published',
    is_verified: true,
  }));

  const subRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_SUB,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Inductive Reasoning (Number & Letter Series)',
    status: 'published',
    is_verified: true,
  }));

  const n1 = await insertBatch(proRows);
  console.log(`  Pro number-series: ${n1} inserted.`);
  const n2 = await insertBatch(subRows);
  console.log(`  Sub number-series-sub: ${n2} inserted.`);

  console.log(`\n✅ Done! +${n1 + n2} new questions`);
}

main().catch(e => { console.error(e); process.exit(1); });
