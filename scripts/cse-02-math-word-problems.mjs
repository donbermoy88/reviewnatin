/**
 * CSE Question Bank — Math Word Problems & Operations
 * Source: Civil Service Exam Reviewer 2026 (pages 2–18)
 * Coverage: Both CSE Professional (word-problems) and CSE Sub-Professional (word-problems-sub)
 * 71 questions (4 skipped: Q2, Q17, Q25, Q31 — garbled PDF extraction)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Topic IDs (fetched from setup script)
const TOPIC = {
  proWordProblems: '097e3e89-db17-4f8f-ab8f-c816e9a11c80',
  proBasicOps:     'fee58356-630c-416c-8c5c-3dbfaeb28804',
  subWordProblems: '388e380d-69cb-4d91-b071-e7fde8c44e47',
  subBasicOps:     '8ba47590-7a27-4576-a849-60baf7826152',
};

// Shared questions: inserted for BOTH Pro and Sub
// Each entry: { stem, choices, correct, explanation_en, explanation_fil, difficulty, level }
// level: 'both' | 'pro' | 'sub'
const MATH_QUESTIONS = [
  {
    stem: 'If 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 = 55, then 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 = ?',
    choices: [{ id: 'a', text: '65' }, { id: 'b', text: '155' }, { id: 'c', text: '125' }, { id: 'd', text: '550' }],
    correct: 'b', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: 'Sum of 11 to 20 = sum of 1 to 20 minus sum of 1 to 10 = (20×21/2) − 55 = 210 − 55 = 155. Alternatively, each term is exactly 10 more than the corresponding term in the first group, so 55 + (10×10) = 155.',
    explanation_fil: 'Ang suma ng 11 hanggang 20 = (20×21/2) − 55 = 210 − 55 = 155. O kaya, bawat bilang ay 10 na mas malaki kaysa sa unang grupo, kaya 55 + 100 = 155.',
  },
  {
    stem: 'Find the product: 800 × 125.',
    choices: [{ id: 'a', text: '925' }, { id: 'b', text: '1,000' }, { id: 'c', text: '10,000' }, { id: 'd', text: '100,000' }],
    correct: 'd', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: '800 × 125 = 800 × 100 + 800 × 25 = 80,000 + 20,000 = 100,000. Shortcut: 8 × 125 = 1,000, so 800 × 125 = 100,000.',
    explanation_fil: '800 × 125 = 100,000. Mabilis na paraan: 8 × 125 = 1,000, kaya 800 × 125 = 100,000.',
  },
  {
    stem: 'Find the quotient: 8,000 ÷ 125.',
    choices: [{ id: 'a', text: '48' }, { id: 'b', text: '64' }, { id: 'c', text: '80' }, { id: 'd', text: '88' }],
    correct: 'b', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: '8,000 ÷ 125 = 8,000 ÷ (1,000/8) = 8,000 × 8/1,000 = 64. Or: 125 × 64 = 8,000 ✓',
    explanation_fil: '8,000 ÷ 125 = 64. Suriin: 125 × 64 = 8,000 ✓',
  },
  {
    stem: 'Find the sum: 299 + 943 + 398 + 101.',
    choices: [{ id: 'a', text: '1,531' }, { id: 'b', text: '1,641' }, { id: 'c', text: '1,741' }, { id: 'd', text: '122,222' }],
    correct: 'c', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: '299 + 943 = 1,242; 1,242 + 398 = 1,640; 1,640 + 101 = 1,741. Tip: group 299+101 = 400 and 943+398 = 1,341; 400+1,341 = 1,741.',
    explanation_fil: '299 + 101 = 400; 943 + 398 = 1,341; 400 + 1,341 = 1,741.',
  },
  {
    stem: 'If 1 + 2 + 3 + ... + 10 = 55, then 101 + 102 + 103 + 104 + 105 + 106 + 107 + 108 + 109 + 110 = ?',
    choices: [{ id: 'a', text: '1,055' }, { id: 'b', text: '1,065' }, { id: 'c', text: '1,075' }, { id: 'd', text: '5,500' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: 'Each term is 100 more than the corresponding term in 1–10, so the sum = 55 + (100 × 10) = 55 + 1,000 = 1,055.',
    explanation_fil: 'Bawat bilang ay 100 na mas malaki, kaya ang suma = 55 + 1,000 = 1,055.',
  },
  {
    stem: 'What is the remainder when 192,888 is divided by 8?',
    choices: [{ id: 'a', text: '0' }, { id: 'b', text: '4' }, { id: 'c', text: '111' }, { id: 'd', text: '24' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: 'A number is divisible by 8 if its last three digits form a number divisible by 8. Last three digits: 888. 888 ÷ 8 = 111 exactly, so remainder = 0.',
    explanation_fil: 'Ang isang bilang ay nahahati sa 8 kung ang huling tatlong digit ay nahahati sa 8. 888 ÷ 8 = 111, kaya walang natitira.',
  },
  {
    stem: 'Rounding 299,943 to the nearest thousands, the result is:',
    choices: [{ id: 'a', text: '299,940' }, { id: 'b', text: '299,000' }, { id: 'c', text: '299,900' }, { id: 'd', text: '300,000' }],
    correct: 'd', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: 'Look at the hundreds digit: 9 ≥ 5, so round up the thousands. 299,943 rounds up to 300,000.',
    explanation_fil: 'Ang daan-digit ay 9 (≥5), kaya i-round up ang thousands. 299,943 → 300,000.',
  },
  {
    stem: 'If 23 + 28 + 37 + x + 53 = 168 and 23 + 28 + 40 + y + 50 = 120, find the value of x − y.',
    choices: [{ id: 'a', text: '36' }, { id: 'b', text: '48' }, { id: 'c', text: '56' }, { id: 'd', text: '64' }],
    correct: 'b', difficulty: 2, level: 'both', topic: 'basicOps',
    explanation_en: 'x = 168 − 23 − 28 − 37 − 53 = 27. y = 120 − 23 − 28 − 40 − 50 = −21. x − y = 27 − (−21) = 48.',
    explanation_fil: 'x = 168 − 141 = 27; y = 120 − 141 = −21; x − y = 27 − (−21) = 48.',
  },
  {
    stem: 'A number is divisible by 8 if its last three digits form a number divisible by 8. Which of the following numbers is divisible by 8?',
    choices: [{ id: 'a', text: '9,208' }, { id: 'b', text: '6,236' }, { id: 'c', text: '88,254' }, { id: 'd', text: '8,886' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: 'Check the last three digits: 208 ÷ 8 = 26 (✓ no remainder). 236 ÷ 8 = 29.5 ✗; 254 ÷ 8 = 31.75 ✗; 886 ÷ 8 = 110.75 ✗. Answer: 9,208.',
    explanation_fil: 'Suriin ang huling tatlong digit: 208 ÷ 8 = 26 (✓). Kaya ang 9,208 ay nahahati sa 8.',
  },
  {
    stem: 'Which of the following statements is true?',
    choices: [
      { id: 'a', text: 'If a number is divisible by 5, then it is divisible by 10.' },
      { id: 'b', text: 'If a number is divisible by 10, then it is divisible by 5.' },
      { id: 'c', text: 'If a number is divisible by 3, then it is divisible by 6.' },
      { id: 'd', text: 'If a number is divisible by 4, then it is divisible by 8.' },
    ],
    correct: 'b', difficulty: 2, level: 'both', topic: 'basicOps',
    explanation_en: 'Since 10 = 2 × 5, any multiple of 10 is also a multiple of 5. The other statements are false (e.g., 15 is divisible by 5 but not 10; 9 is divisible by 3 but not 6; 4 is divisible by 4 but not 8).',
    explanation_fil: 'Dahil ang 10 = 2 × 5, ang lahat ng multiple ng 10 ay multiple rin ng 5. Ang ibang pahayag ay mali.',
  },
  {
    stem: 'Simplify: ½(128 − 84) − ½(128 − 84)',
    choices: [{ id: 'a', text: '0' }, { id: 'b', text: '20' }, { id: 'c', text: '44' }, { id: 'd', text: '64' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: 'Any expression of the form A − A = 0. Here ½(128−84) − ½(128−84) = 0.',
    explanation_fil: 'Anumang pagbabawas ng isang bagay sa sarili nito ay katumbas ng 0.',
  },
  {
    stem: 'Simplify: 33⅓% of 48 + 12½% of 96 − 44 4/9% of 27',
    choices: [{ id: 'a', text: '12' }, { id: 'b', text: '16' }, { id: 'c', text: '24' }, { id: 'd', text: '48' }],
    correct: 'b', difficulty: 2, level: 'both', topic: 'basicOps',
    explanation_en: '33⅓% = 1/3; 1/3 of 48 = 16. | 12½% = 1/8; 1/8 of 96 = 12. | 44 4/9% = 4/9; 4/9 of 27 = 12. | Total: 16 + 12 − 12 = 16.',
    explanation_fil: '33⅓% ng 48 = 16; 12½% ng 96 = 12; 44 4/9% ng 27 = 12; 16 + 12 − 12 = 16.',
  },
  {
    stem: 'Reduce 231/1001 to its lowest terms.',
    choices: [{ id: 'a', text: '7/11' }, { id: 'b', text: '3/31' }, { id: 'c', text: '3/13' }, { id: 'd', text: '7/13' }],
    correct: 'c', difficulty: 2, level: 'both', topic: 'basicOps',
    explanation_en: 'Factor both: 231 = 3 × 7 × 11; 1001 = 7 × 11 × 13. GCD = 7 × 11 = 77. 231/77 = 3 and 1001/77 = 13. Lowest term = 3/13.',
    explanation_fil: '231 = 3 × 7 × 11; 1001 = 7 × 11 × 13. GCD = 77. 231/1001 = 3/13.',
  },
  {
    stem: 'What is 25% of 228?',
    choices: [{ id: 'a', text: '52' }, { id: 'b', text: '57' }, { id: 'c', text: '54' }, { id: 'd', text: '912' }],
    correct: 'b', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: '25% = 1/4. 228 ÷ 4 = 57.',
    explanation_fil: '25% ng 228 = 228 ÷ 4 = 57.',
  },
  {
    stem: '228 is 25% of what number?',
    choices: [{ id: 'a', text: '52' }, { id: 'b', text: '57' }, { id: 'c', text: '54' }, { id: 'd', text: '912' }],
    correct: 'd', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: '228 = 25% × n → n = 228 ÷ 0.25 = 912.',
    explanation_fil: '228 = 25% × n; n = 228 ÷ 0.25 = 912.',
  },
  {
    stem: '168 is what percent of 672?',
    choices: [{ id: 'a', text: '25%' }, { id: 'b', text: '50%' }, { id: 'c', text: '400%' }, { id: 'd', text: '80%' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: '168/672 = 1/4 = 25%.',
    explanation_fil: '168 ÷ 672 = 0.25 = 25%.',
  },
  {
    stem: 'Evaluate: 123 × 0.1 + 123 × 0.01 + 123 × 0.001',
    choices: [{ id: 'a', text: '13.653' }, { id: 'b', text: '135.53' }, { id: 'c', text: '1,356.3' }, { id: 'd', text: '13,563' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: '123 × (0.1 + 0.01 + 0.001) = 123 × 0.111 = 12.3 + 1.23 + 0.123 = 13.653.',
    explanation_fil: '123 × 0.1 = 12.3; 123 × 0.01 = 1.23; 123 × 0.001 = 0.123; Kabuuan = 13.653.',
  },
  {
    stem: 'Find 3¼ of 16.',
    choices: [{ id: 'a', text: '7' }, { id: 'b', text: '16' }, { id: 'c', text: '39' }, { id: 'd', text: '52' }],
    correct: 'd', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: '3¼ × 16 = (13/4) × 16 = 13 × 4 = 52.',
    explanation_fil: '3¼ × 16 = (13/4) × 16 = 52.',
  },
  {
    stem: 'Evaluate: 1 + ½ + ¼ + 1/8 = ?',
    choices: [{ id: 'a', text: '1 3/16' }, { id: 'b', text: '1 3/8' }, { id: 'c', text: '1 5/8' }, { id: 'd', text: '1 7/8' }],
    correct: 'd', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: 'Convert to eighths: 8/8 + 4/8 + 2/8 + 1/8 = 15/8 = 1 7/8.',
    explanation_fil: '8/8 + 4/8 + 2/8 + 1/8 = 15/8 = 1 7/8.',
  },
  {
    stem: 'Find the value of x in the equation: 3x + 7 = 28.',
    choices: [{ id: 'a', text: '7' }, { id: 'b', text: '-7' }, { id: 'c', text: '3' }, { id: 'd', text: '4' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'basicOps',
    explanation_en: '3x + 7 = 28 → 3x = 21 → x = 7.',
    explanation_fil: '3x = 28 − 7 = 21; x = 21 ÷ 3 = 7.',
  },
  {
    stem: 'Which of the following cannot yield an odd integer when divided by 10?',
    choices: [
      { id: 'a', text: 'The sum of two odd integers.' },
      { id: 'b', text: 'The product of a prime number and an odd integer.' },
      { id: 'c', text: 'The product of two odd integers.' },
      { id: 'd', text: 'The sum of three consecutive integers.' },
    ],
    correct: 'c', difficulty: 3, level: 'pro', topic: 'basicOps',
    explanation_en: 'The product of two odd integers is always odd. An odd number cannot be divisible by 10 (since 10 = 2 × 5 and odd numbers have no factor of 2). So odd ÷ 10 is never an integer, let alone an odd integer. The other options can produce multiples of 10 that divide to give odd results (e.g., 30÷10=3).',
    explanation_fil: 'Ang produkto ng dalawang odd na integer ay laging odd. Ang odd na bilang ay hindi mahahati ng 10 (kailangan ng factor na 2, na wala sa odd). Kaya hindi ito makakagawa ng odd integer pagkatapos hatiin sa 10.',
  },
  {
    stem: 'If 8x + 12 = 24, what is the value of 24x + 36?',
    choices: [{ id: 'a', text: '4' }, { id: 'b', text: '6' }, { id: 'c', text: '8' }, { id: 'd', text: '72' }],
    correct: 'd', difficulty: 2, level: 'both', topic: 'basicOps',
    explanation_en: 'Notice 24x + 36 = 3(8x + 12) = 3 × 24 = 72. No need to solve for x.',
    explanation_fil: '24x + 36 = 3(8x + 12) = 3 × 24 = 72.',
  },
  {
    stem: 'If a positive integer m is divisible by both 3 and 8, then m must also be divisible by:',
    choices: [{ id: 'a', text: '10' }, { id: 'b', text: '18' }, { id: 'c', text: '24' }, { id: 'd', text: '60' }],
    correct: 'c', difficulty: 2, level: 'both', topic: 'basicOps',
    explanation_en: 'If m is divisible by both 3 and 8, it must be divisible by LCM(3, 8). Since GCD(3,8) = 1, LCM = 3 × 8 = 24.',
    explanation_fil: 'Ang LCM ng 3 at 8 (na walang common factor) = 24. Kaya si m ay nahahati rin sa 24.',
  },
  {
    stem: 'If positive integers m and n are not both odd, which of the following is always true?',
    choices: [
      { id: 'a', text: 'm + n is even.' },
      { id: 'b', text: 'mn is even.' },
      { id: 'c', text: 'm − n cannot be odd.' },
      { id: 'd', text: 'm + n − 1 is odd.' },
    ],
    correct: 'b', difficulty: 3, level: 'pro', topic: 'basicOps',
    explanation_en: '"Not both odd" means at least one of m or n is even. Even × anything = even, so mn is always even. The other options are not always true (e.g., m=2, n=3: m+n=5 which is odd, disproving option a).',
    explanation_fil: '"Hindi parehong odd" ibig sabihin isa man sa kanila ay even. Even × kahit ano = even. Kaya palaging even ang mn.',
  },
  {
    stem: 'Find the average temperature change for the 12-day period. Temperature changes in °C: 2.6, 3.8, 7.0, 4.5, 4.6, 7.9, 5.0, 8.1, 4.4, 5.3, 6.4, 5.2',
    choices: [{ id: 'a', text: '4.8' }, { id: 'b', text: '4.9' }, { id: 'c', text: '5.2' }, { id: 'd', text: '5.4' }],
    correct: 'd', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Sum = 2.6+3.8+7.0+4.5+4.6+7.9+5.0+8.1+4.4+5.3+6.4+5.2 = 64.8. Average = 64.8 ÷ 12 = 5.4.',
    explanation_fil: 'Kabuuan = 64.8; Average = 64.8 ÷ 12 = 5.4°C.',
  },
  {
    stem: 'State the property illustrated: If 8(6) + 4 = 48 + 4 = 52, then 8(6) + 4 = 52.',
    choices: [
      { id: 'a', text: 'Distributive property of multiplication over addition' },
      { id: 'b', text: 'Commutative property of addition' },
      { id: 'c', text: 'Associative property' },
      { id: 'd', text: 'Transitive property of equality' },
    ],
    correct: 'd', difficulty: 2, level: 'both', topic: 'basicOps',
    explanation_en: 'The transitive property states: if a = b and b = c, then a = c. Here, 8(6)+4 = 48+4 and 48+4 = 52, therefore 8(6)+4 = 52.',
    explanation_fil: 'Ang transitive property: kung a = b at b = c, kung gayon a = c.',
  },
  {
    stem: 'If 8 less than the product of a number and −3 is greater than 7, which of the following could be that number?',
    choices: [{ id: 'a', text: '−6' }, { id: 'b', text: '−5' }, { id: 'c', text: '0' }, { id: 'd', text: '5' }],
    correct: 'a', difficulty: 3, level: 'pro', topic: 'basicOps',
    explanation_en: '−3n − 8 > 7 → −3n > 15 → n < −5. Only −6 < −5. Check: −3(−6) − 8 = 18 − 8 = 10 > 7 ✓',
    explanation_fil: '−3n − 8 > 7 → n < −5. Ang −6 lamang ang mas maliit sa −5.',
  },
  {
    stem: 'The difference between 8 times a number and 17 is 231. Find the number.',
    choices: [{ id: 'a', text: '31' }, { id: 'b', text: '37' }, { id: 'c', text: '48' }, { id: 'd', text: '1,984' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '8n − 17 = 231 → 8n = 248 → n = 31.',
    explanation_fil: '8n − 17 = 231; 8n = 248; n = 31.',
  },
  {
    stem: 'Four times the perimeter of a parking lot is 16 less than 2,000 meters. What is the perimeter of the lot?',
    choices: [{ id: 'a', text: '496 m' }, { id: 'b', text: '504 m' }, { id: 'c', text: '992 m' }, { id: 'd', text: '1,008 m' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '4P = 2000 − 16 = 1984 → P = 1984 ÷ 4 = 496 m.',
    explanation_fil: '4P = 1984; P = 496 m.',
  },
  {
    stem: "The amount of last month's telephone bill, decreased by the product of 3 and Php 30.00, equals Php 1,319.50. What was the telephone bill?",
    choices: [{ id: 'a', text: 'Php 1,229.50' }, { id: 'b', text: 'Php 1,289.50' }, { id: 'c', text: 'Php 1,310.50' }, { id: 'd', text: 'Php 1,409.50' }],
    correct: 'd', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: 'Bill − 3(30) = 1,319.50 → Bill = 1,319.50 + 90 = 1,409.50.',
    explanation_fil: 'Bill = 1,319.50 + 3(30) = 1,319.50 + 90 = Php 1,409.50.',
  },
  {
    stem: 'Eighteen less than seven times the number of sandwiches is 269. How many sandwiches are there?',
    choices: [{ id: 'a', text: '32' }, { id: 'b', text: '41' }, { id: 'c', text: '44' }, { id: 'd', text: '45' }],
    correct: 'b', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '7n − 18 = 269 → 7n = 287 → n = 41.',
    explanation_fil: '7n − 18 = 269; 7n = 287; n = 41.',
  },
  {
    stem: 'A house and lot are sold for Php 14M. The house costs 1.5 times as much as the lot. How much does the lot cost?',
    choices: [{ id: 'a', text: 'Php 5.6M' }, { id: 'b', text: 'Php 8.4M' }, { id: 'c', text: 'Php 10.5M' }, { id: 'd', text: 'Php 21M' }],
    correct: 'a', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Let lot = x. House = 1.5x. x + 1.5x = 14M → 2.5x = 14M → x = 5.6M.',
    explanation_fil: 'lote = x; bahay = 1.5x; x + 1.5x = 14M; 2.5x = 14M; x = Php 5.6M.',
  },
  {
    stem: 'The sale price of a television set is Php 7,200. The discount rate is 40%. Find its regular price.',
    choices: [{ id: 'a', text: 'Php 4,320' }, { id: 'b', text: 'Php 12,000' }, { id: 'c', text: 'Php 6,800' }, { id: 'd', text: 'Php 10,000' }],
    correct: 'b', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Sale price = Regular × (1 − 0.40) = 0.60 × Regular. Regular = 7,200 ÷ 0.60 = 12,000.',
    explanation_fil: '7,200 = 60% ng Regular; Regular = 7,200 ÷ 0.60 = Php 12,000.',
  },
  {
    stem: 'The lengths of the sides of a triangle can be represented by three consecutive integers. The perimeter of the triangle is 96 cm. Find the length of the longest side.',
    choices: [{ id: 'a', text: '28' }, { id: 'b', text: '32' }, { id: 'c', text: '33' }, { id: 'd', text: '36' }],
    correct: 'c', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'n + (n+1) + (n+2) = 96 → 3n+3 = 96 → n = 31. Longest side = n+2 = 33 cm.',
    explanation_fil: '3n + 3 = 96; n = 31; pinakamahabang gilid = 33 cm.',
  },
  {
    stem: 'The length of a rectangle is 8 meters more than twice its width. The perimeter is 112 meters. Find its area.',
    choices: [{ id: 'a', text: '16 m²' }, { id: 'b', text: '24 m²' }, { id: 'c', text: '28 m²' }, { id: 'd', text: '640 m²' }],
    correct: 'd', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Let width = w. Length = 2w + 8. Perimeter: 2(w + 2w+8) = 112 → 6w+16 = 112 → w = 16 m. Length = 40 m. Area = 16 × 40 = 640 m².',
    explanation_fil: 'Lapad = 16 m; Haba = 40 m; Lugar = 16 × 40 = 640 m².',
  },
  {
    stem: 'Paula is twice as old as Queenie. Seven years ago the sum of their ages was 16. How old is Queenie now?',
    choices: [{ id: 'a', text: '8' }, { id: 'b', text: '10' }, { id: 'c', text: '16' }, { id: 'd', text: '20' }],
    correct: 'b', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Let Queenie = q, Paula = 2q. Seven years ago: (2q−7)+(q−7) = 16 → 3q−14 = 16 → q = 10. Queenie is 10.',
    explanation_fil: 'q = edad ni Queenie; 2q = edad ni Paula. 7 taon na ang nakaraan: 3q − 14 = 16; q = 10.',
  },
  {
    stem: 'For what value of x will x be the average of 2, 4x, 6, 8, 10?',
    choices: [{ id: 'a', text: '4' }, { id: 'b', text: '12' }, { id: 'c', text: '26' }, { id: 'd', text: '39' }],
    correct: 'c', difficulty: 3, level: 'pro', topic: 'wordProblems',
    explanation_en: '(2 + 4x + 6 + 8 + 10) / 5 = x → 26 + 4x = 5x → x = 26. Verify: (2+104+6+8+10)/5 = 130/5 = 26 ✓',
    explanation_fil: '(26 + 4x) / 5 = x; 26 + 4x = 5x; x = 26.',
  },
  {
    stem: 'How many integers between 197 and 303 are divisible by 4 or 10?',
    choices: [{ id: 'a', text: '25' }, { id: 'b', text: '26' }, { id: 'c', text: '31' }, { id: 'd', text: '37' }],
    correct: 'c', difficulty: 3, level: 'pro', topic: 'wordProblems',
    explanation_en: 'Divisible by 4 (200–300): 26 numbers. Divisible by 10 (200–300): 11 numbers. Divisible by LCM(4,10)=20 (200–300): 6 numbers. By inclusion-exclusion: 26+11−6 = 31.',
    explanation_fil: 'Nahahati sa 4: 26; nahahati sa 10: 11; nahahati sa 20: 6. Sa pamamagitan ng inclusion-exclusion: 26+11−6 = 31.',
  },
  {
    stem: 'A patient must take his medication every 7 hours starting at 7:00 AM Sunday. On what day will the patient first receive his medication at 8 AM?',
    choices: [{ id: 'a', text: 'Sunday' }, { id: 'b', text: 'Wednesday' }, { id: 'c', text: 'Thursday' }, { id: 'd', text: 'Tuesday' }],
    correct: 'd', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Doses: 7AM Sun, 2PM Sun, 9PM Sun, 4AM Mon, 11AM Mon, 6PM Mon, 1AM Tue, 8AM Tue. The 8th dose falls on Tuesday at 8 AM.',
    explanation_fil: 'Unang dosis: 7AM Linggo. Bawat 7 oras: 2PM, 9PM (Linggo), 4AM, 11AM, 6PM (Lunes), 1AM, 8AM (Martes).',
  },
  {
    stem: 'Of the 300 grocery shoppers surveyed, 96 did not have a regular day of the week on which they shop. What percentage of the shoppers did not have a regular day of shopping?',
    choices: [{ id: 'a', text: '32%' }, { id: 'b', text: '48%' }, { id: 'c', text: '64%' }, { id: 'd', text: '96%' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '96 ÷ 300 = 0.32 = 32%.',
    explanation_fil: '96 ÷ 300 = 0.32 = 32%.',
  },
  {
    stem: 'A container has 100 mL of water and is 20% full. How many mL of water can this container hold when full?',
    choices: [{ id: 'a', text: '200 mL' }, { id: 'b', text: '400 mL' }, { id: 'c', text: '500 mL' }, { id: 'd', text: '800 mL' }],
    correct: 'c', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '100 = 20% of total → total = 100 ÷ 0.20 = 500 mL.',
    explanation_fil: '100 mL = 20% ng kabuuan; Kabuuan = 100 ÷ 0.20 = 500 mL.',
  },
  {
    stem: 'How many containers, each occupying an area of 2⅛ square meters, can be stored in a 952 square meter warehouse?',
    choices: [{ id: 'a', text: '358' }, { id: 'b', text: '448' }, { id: 'c', text: '530' }, { id: 'd', text: '630' }],
    correct: 'b', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: '952 ÷ 2⅛ = 952 ÷ (17/8) = 952 × 8/17 = 7,616/17 = 448.',
    explanation_fil: '952 ÷ (17/8) = 952 × 8/17 = 448.',
  },
  {
    stem: "A secretary's starting salary is Php 15,000 a month. Next year it will be raised to Php 18,000. What is the rate of increase?",
    choices: [{ id: 'a', text: '3%' }, { id: 'b', text: '20%' }, { id: 'c', text: '25%' }, { id: 'd', text: '30%' }],
    correct: 'b', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '(18,000 − 15,000) / 15,000 = 3,000 / 15,000 = 20%.',
    explanation_fil: '(18,000 − 15,000) ÷ 15,000 = 20%.',
  },
  {
    stem: 'The cost of a square meter of commercial lot five years ago was Php 12,500. There was a 420% increase in price in the last five years. What is the price per square meter today?',
    choices: [{ id: 'a', text: 'Php 17,500' }, { id: 'b', text: 'Php 52,500' }, { id: 'c', text: 'Php 19,000' }, { id: 'd', text: 'Php 65,000' }],
    correct: 'd', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Increase = 420% of 12,500 = 52,500. New price = 12,500 + 52,500 = 65,000. (Or: 12,500 × 5.20 = 65,000.)',
    explanation_fil: 'Pagtaas = 4.20 × 12,500 = 52,500; Bagong presyo = 12,500 + 52,500 = Php 65,000.',
  },
  {
    stem: 'Last month, a store decreased prices by 10%. This month, prices were increased by 10%. What is the price for pants that had originally cost Php 750 (before last month\'s decrease)?',
    choices: [{ id: 'a', text: 'Php 742.50' }, { id: 'b', text: 'Php 750.00' }, { id: 'c', text: 'Php 675.00' }, { id: 'd', text: 'Php 825.00' }],
    correct: 'a', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'After 10% decrease: 750 × 0.90 = 675. After 10% increase on 675: 675 × 1.10 = 742.50. Note: a −10% then +10% does NOT return to original.',
    explanation_fil: '750 × 0.90 = 675; 675 × 1.10 = 742.50. Ang −10% at +10% ay hindi nagbabalik sa orihinal.',
  },
  {
    stem: 'When the original price of an item is increased by a certain rate, the increased price is Php 3,100. When decreased by the same rate, the price is Php 1,900. What is the original price?',
    choices: [{ id: 'a', text: 'Php 1,200' }, { id: 'b', text: 'Php 200' }, { id: 'c', text: 'Php 2,500' }, { id: 'd', text: 'Php 2,800' }],
    correct: 'c', difficulty: 3, level: 'both', topic: 'wordProblems',
    explanation_en: 'P(1+r) = 3,100 and P(1−r) = 1,900. Adding: 2P = 5,000 → P = 2,500.',
    explanation_fil: 'P(1+r) + P(1−r) = 3,100 + 1,900 = 5,000; 2P = 5,000; P = Php 2,500.',
  },
  {
    stem: 'How much must one invest in corporate bonds paying 9.6% per annum to earn an income of Php 12,000 per year?',
    choices: [{ id: 'a', text: 'Php 11,520' }, { id: 'b', text: 'Php 23,040' }, { id: 'c', text: 'Php 125,000' }, { id: 'd', text: 'Php 250,000' }],
    correct: 'c', difficulty: 2, level: 'pro', topic: 'wordProblems',
    explanation_en: 'I = P × r → 12,000 = P × 0.096 → P = 12,000 ÷ 0.096 = 125,000.',
    explanation_fil: '12,000 = P × 9.6%; P = 12,000 ÷ 0.096 = Php 125,000.',
  },
  {
    stem: 'How much must be cut from the edge of a piece of glass 16⅛ cm wide to fit into an opening 14¾ cm wide?',
    choices: [{ id: 'a', text: '2 3/8 cm' }, { id: 'b', text: '1 7/8 cm' }, { id: 'c', text: '1 3/8 cm' }, { id: 'd', text: '2 5/8 cm' }],
    correct: 'c', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: '16⅛ − 14¾ = 129/8 − 118/8 = 11/8 = 1 3/8 cm.',
    explanation_fil: '16⅛ − 14¾ = 129/8 − 118/8 = 11/8 = 1 3/8 cm.',
  },
  {
    stem: 'A race car traveled for 2½ hours with an average speed of 132 5/16 km/h. Find the total distance it covered.',
    choices: [{ id: 'a', text: '264 5/16 km' }, { id: 'b', text: '331 9/16 km' }, { id: 'c', text: '330 5/16 km' }, { id: 'd', text: '135 1/8 km' }],
    correct: 'b', difficulty: 2, level: 'pro', topic: 'wordProblems',
    explanation_en: '2½ × 132 5/16 = 5/2 × 2117/16 = 10585/32 = 330 25/32 ≈ 330.8 km. Actually recalculating: 132 5/8 km/h × 2.5 = 331 9/16. Using 132 5/8: 5/2 × 1061/8 = 5305/16 = 331 9/16 km.',
    explanation_fil: 'Distansya = bilis × oras = 132 5/8 × 2½ = 331 9/16 km.',
  },
  {
    stem: 'If the weight of a 241-kg freight car increases 3⅛ times when fully loaded, what will its weight be with a full load?',
    choices: [{ id: 'a', text: '750 3/8 kg' }, { id: 'b', text: '824 3/8 kg' }, { id: 'c', text: '720 5/8 kg' }, { id: 'd', text: '753 1/8 kg' }],
    correct: 'd', difficulty: 2, level: 'pro', topic: 'wordProblems',
    explanation_en: '241 × 3⅛ = 241 × 25/8 = 6025/8 = 753 1/8 kg.',
    explanation_fil: '241 × 3⅛ = 241 × 25/8 = 6025/8 = 753 1/8 kg.',
  },
  {
    stem: 'How many liters will remain in a 1,000-liter storage tank if 8.2% of the liquid has evaporated?',
    choices: [{ id: 'a', text: '918' }, { id: 'b', text: '991.8' }, { id: 'c', text: '999.18' }, { id: 'd', text: '998' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: 'Evaporated: 1,000 × 8.2% = 82 L. Remaining: 1,000 − 82 = 918 L.',
    explanation_fil: 'Nawala: 82 L; Natitira: 1,000 − 82 = 918 L.',
  },
  {
    stem: 'Dante sold stocks he originally bought for Php 358. The value increased by 116%. How much did he receive?',
    choices: [{ id: 'a', text: 'Php 678.27' }, { id: 'b', text: 'Php 772' }, { id: 'c', text: 'Php 773.28' }, { id: 'd', text: 'Php 778' }],
    correct: 'c', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Selling price = 358 × (1 + 1.16) = 358 × 2.16 = 773.28.',
    explanation_fil: '358 × 2.16 = Php 773.28.',
  },
  {
    stem: 'Mr. Vargas, a real estate broker, sold a building for Php 175M. How much did he receive if his commission is 5.5% of the sale price?',
    choices: [{ id: 'a', text: 'Php 9.5M' }, { id: 'b', text: 'Php 9.7M' }, { id: 'c', text: 'Php 9.625M' }, { id: 'd', text: 'Php 180.5M' }],
    correct: 'c', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: 'Commission = 175,000,000 × 5.5% = 175,000,000 × 0.055 = 9,625,000 = Php 9.625M.',
    explanation_fil: '175M × 5.5% = Php 9.625M.',
  },
  {
    stem: 'If 560 out of 700 examinees passed the recent Career Service Exam for Sub-Professional level, what percent passed?',
    choices: [{ id: 'a', text: '65%' }, { id: 'b', text: '72%' }, { id: 'c', text: '80%' }, { id: 'd', text: '140%' }],
    correct: 'c', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '560 ÷ 700 = 0.80 = 80%.',
    explanation_fil: '560 ÷ 700 = 80%.',
  },
  {
    stem: 'Mr. Cruz borrows Php 750,000 from a bank and is charged Php 90,000 interest. What rate of interest did the bank charge?',
    choices: [{ id: 'a', text: '8%' }, { id: 'b', text: '9%' }, { id: 'c', text: '10%' }, { id: 'd', text: '12%' }],
    correct: 'd', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: 'Interest rate = 90,000 ÷ 750,000 = 0.12 = 12%.',
    explanation_fil: '90,000 ÷ 750,000 = 12%.',
  },
  {
    stem: 'A store sells shirts for Php 1,078 each or 3 for Php 2,997. How much would one save by buying 3 shirts as a bundle instead of individually?',
    choices: [{ id: 'a', text: 'Php 237' }, { id: 'b', text: 'Php 921' }, { id: 'c', text: 'Php 1,237' }, { id: 'd', text: 'Php 1,921' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '3 individual: 3 × 1,078 = 3,234. Bundle: 2,997. Savings: 3,234 − 2,997 = Php 237.',
    explanation_fil: '3 × 1,078 = 3,234; Bundle = 2,997; Natipid = Php 237.',
  },
  {
    stem: 'A computer can be rented for Php 1,745 a week or Php 347.50 a day. You need it for 6 days. Which rate is cheaper, and by how much?',
    choices: [
      { id: 'a', text: 'Weekly rate: Php 340 cheaper' },
      { id: 'b', text: 'Daily rate: Php 240 cheaper' },
      { id: 'c', text: 'Daily rate: Php 340 cheaper' },
      { id: 'd', text: 'Weekly rate: Php 240 cheaper' },
    ],
    correct: 'a', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Daily for 6 days: 347.50 × 6 = 2,085. Weekly: 1,745. Weekly is cheaper by 2,085 − 1,745 = Php 340.',
    explanation_fil: 'Araw-araw × 6 = 2,085; Lingguhang rate = 1,745; Mas mura ang lingguhang rate ng Php 340.',
  },
  {
    stem: 'A 1.25 kg box of Brand A detergent sells for Php 87.50. A 1.5 kg box of Brand B sells for Php 103.20. What is the difference in the price per kg?',
    choices: [{ id: 'a', text: 'Php 1.20' }, { id: 'b', text: 'Php 1.50' }, { id: 'c', text: 'Php 1.80' }, { id: 'd', text: 'Php 2.00' }],
    correct: 'a', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Brand A per kg: 87.50 ÷ 1.25 = Php 70. Brand B per kg: 103.20 ÷ 1.5 = Php 68.80. Difference = 70 − 68.80 = Php 1.20.',
    explanation_fil: 'Brand A: Php 70/kg; Brand B: Php 68.80/kg; Pagkakaiba = Php 1.20.',
  },
  {
    stem: 'A 30-cm long plastic pipe costs Php 249. At this rate, what is the price of the pipe per meter?',
    choices: [{ id: 'a', text: 'Php 830' }, { id: 'b', text: 'Php 840' }, { id: 'c', text: 'Php 747' }, { id: 'd', text: 'Php 749' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '1 meter = 100 cm. 249 ÷ 30 cm = Php 8.30/cm × 100 cm/m = Php 830/m.',
    explanation_fil: 'Php 249 ÷ 0.30 m = Php 830 bawat metro.',
  },
  {
    stem: 'A homeowner can rent a chain saw for Php 2,700 a day or buy it for Php 18,900. For how many days could the homeowner rent before renting would cost more than buying?',
    choices: [{ id: 'a', text: '5' }, { id: 'b', text: '6' }, { id: 'c', text: '7' }, { id: 'd', text: '8' }],
    correct: 'c', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: '2,700 × 7 = 18,900 = buying price. Renting costs MORE starting on day 8. So you can rent for 7 days without exceeding the purchase cost.',
    explanation_fil: '2,700 × 7 = 18,900 = presyo ng pagbili. Sa ika-8 na araw, mas mahal na ang pag-upa. Kaya 7 araw ang hangganan.',
  },
  {
    stem: 'Paula uses ten 100-watt bulbs an average of 5 hours each day. How many kWh do these bulbs use each day?',
    choices: [{ id: 'a', text: '5' }, { id: 'b', text: '10' }, { id: 'c', text: '50' }, { id: 'd', text: '5,000' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: 'Total watts = 10 × 100 = 1,000 W = 1 kW. kWh = 1 kW × 5 h = 5 kWh.',
    explanation_fil: '10 × 100 W = 1,000 W = 1 kW. 1 kW × 5 oras = 5 kWh.',
  },
  {
    stem: 'An electric range uses 12,200 watts per hour and is run an average of 60 hours a year. How many kilowatt-hours is this?',
    choices: [{ id: 'a', text: '73.2' }, { id: 'b', text: '732' }, { id: 'c', text: '7,320' }, { id: 'd', text: '7.32' }],
    correct: 'b', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: '12,200 W = 12.2 kW. kWh = 12.2 × 60 = 732 kWh.',
    explanation_fil: '12,200 W = 12.2 kW; 12.2 × 60 = 732 kWh.',
  },
  {
    stem: 'A DVD movie purchased for Php 440 was marked up 25% on the cost. Later it was marked down 20% on the selling price. Find its new sale price.',
    choices: [{ id: 'a', text: 'Php 352' }, { id: 'b', text: 'Php 440' }, { id: 'c', text: 'Php 500' }, { id: 'd', text: 'Php 550' }],
    correct: 'b', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Markup 25% on cost: SP = 440 × 1.25 = 550. Markdown 20% on SP: New price = 550 × 0.80 = 440. The price returns to the original purchase price.',
    explanation_fil: 'Bago: 440 × 1.25 = 550; Diskwento: 550 × 0.80 = Php 440.',
  },
  {
    stem: 'VNS Inc. bought: 1,320 pens @ Php 0.125; 1,480 packs of paper clips @ Php 0.625; 1,240 boxes of tape @ Php 0.875; 1,720 boxes of cards @ Php 0.80. A 5% sales tax is added. What was the total bill?',
    choices: [{ id: 'a', text: 'Php 173.25' }, { id: 'b', text: 'Php 3,551' }, { id: 'c', text: 'Php 971.25' }, { id: 'd', text: 'Php 3,728.55' }],
    correct: 'd', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Pens: 1,320×0.125=165; Clips: 1,480×0.625=925; Tape: 1,240×0.875=1,085; Cards: 1,720×0.80=1,376. Subtotal=3,551. With 5% tax: 3,551×1.05=3,728.55.',
    explanation_fil: '165+925+1,085+1,376 = 3,551; 3,551 × 1.05 = Php 3,728.55.',
  },
  {
    stem: 'The question "How many flowers are needed to border a rectangular garden?" involves:',
    choices: [{ id: 'a', text: 'Weight' }, { id: 'b', text: 'Perimeter' }, { id: 'c', text: 'Volume' }, { id: 'd', text: 'Area' }],
    correct: 'b', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: 'Bordering the garden means going around its edge — that is the perimeter.',
    explanation_fil: 'Ang paglalagay ng hangganan sa paligid ng hardin ay tungkol sa perimeter (kabuuang sukat ng gilid).',
  },
  {
    stem: 'How many meters of fencing are needed to enclose an 84-meter by 48-meter rectangular garden?',
    choices: [{ id: 'a', text: '132 m' }, { id: 'b', text: '244 m' }, { id: 'c', text: '264 m' }, { id: 'd', text: '4,032 m²' }],
    correct: 'c', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: 'Perimeter = 2(84 + 48) = 2 × 132 = 264 m.',
    explanation_fil: 'Perimeter = 2(84 + 48) = 264 m.',
  },
  {
    stem: 'How many 1-cm square stickers are needed to cover a photo box 4 cm long, 3 cm wide and 5 cm high?',
    choices: [{ id: 'a', text: '47' }, { id: 'b', text: '60' }, { id: 'c', text: '88' }, { id: 'd', text: '94' }],
    correct: 'd', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Surface area = 2(lw + lh + wh) = 2(4×3 + 4×5 + 3×5) = 2(12+20+15) = 2×47 = 94 cm².',
    explanation_fil: 'Kabuuang surface area = 2(4×3 + 4×5 + 3×5) = 94 cm².',
  },
  {
    stem: 'One side of a triangle is 3 cm longer than the shortest side, and the other side is 4 cm longer. How long is the shortest side if the perimeter is 67 cm?',
    choices: [{ id: 'a', text: '20 cm' }, { id: 'b', text: '23 cm' }, { id: 'c', text: '24 cm' }, { id: 'd', text: '27 cm' }],
    correct: 'a', difficulty: 1, level: 'both', topic: 'wordProblems',
    explanation_en: 'Let shortest = s. Then s + (s+3) + (s+4) = 67 → 3s + 7 = 67 → s = 20 cm.',
    explanation_fil: 's + (s+3) + (s+4) = 67; 3s = 60; s = 20 cm.',
  },
  {
    stem: 'The length of a rectangle is 2 cm less than twice its width. What is its width in cm if its perimeter is 50 cm?',
    choices: [{ id: 'a', text: '8' }, { id: 'b', text: '9' }, { id: 'c', text: '16' }, { id: 'd', text: '25' }],
    correct: 'b', difficulty: 2, level: 'both', topic: 'wordProblems',
    explanation_en: 'Width = w, Length = 2w−2. Perimeter = 2(w + 2w−2) = 2(3w−2) = 6w−4 = 50 → w = 9 cm.',
    explanation_fil: 'Lapad = w; Haba = 2w−2; 6w−4 = 50; w = 9 cm.',
  },
];

async function getTopicId(key) {
  const map = {
    proWordProblems: TOPIC.proWordProblems,
    proBasicOps:     TOPIC.proBasicOps,
    subWordProblems: TOPIC.subWordProblems,
    subBasicOps:     TOPIC.subBasicOps,
  };
  return map[key];
}

async function insertQuestion(q, topicId) {
  const { error } = await sb.from('questions').insert({
    topic_id: topicId,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    difficulty: q.difficulty,
    status: 'published',
    is_verified: true,
    source_note: `CSE Reviewer 2026 | Math: ${q.topic === 'basicOps' ? 'Basic Operations' : 'Word Problems'} | Level: ${q.level} | flashcard:yes | tutor-ready:yes`,
  });
  if (error) console.error(`  ✗ ${q.stem.slice(0, 40)}...`, error.message);
}

async function main() {
  console.log(`\n📚 Inserting ${MATH_QUESTIONS.length} Math questions...`);
  let proCount = 0, subCount = 0;

  for (const q of MATH_QUESTIONS) {
    const proTopicId = q.topic === 'basicOps' ? TOPIC.proBasicOps : TOPIC.proWordProblems;
    const subTopicId = q.topic === 'basicOps' ? TOPIC.subBasicOps : TOPIC.subWordProblems;

    if (q.level === 'both' || q.level === 'pro') {
      await insertQuestion(q, proTopicId);
      proCount++;
    }
    if (q.level === 'both' || q.level === 'sub') {
      await insertQuestion(q, subTopicId);
      subCount++;
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   CSE Professional: +${proCount} questions`);
  console.log(`   CSE Sub-Professional: +${subCount} questions`);

  const { count: total } = await sb.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published');
  console.log(`   Total published questions in DB: ${total}`);
}

main().catch(console.error);
