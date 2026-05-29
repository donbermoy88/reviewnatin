/**
 * CSE Question Bank — Data Sufficiency (20 questions)
 * Source: CSE Reviewer 2026, pages 18–22
 * Level: Professional only (Analytical Ability — Data Interpretation)
 * Answers are explicitly stated in the PDF.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TOPIC_ID = 'df65e506-4990-4575-b4c0-bade603612a8'; // CSE Pro: data-interpretation

const DIRECTIONS = `Each problem has a question and two statements (1) and (2). Decide if the data given is sufficient to answer the question. Choose:\na. Statement (1) ALONE is sufficient, but (2) alone is not.\nb. Statement (2) ALONE is sufficient, but (1) alone is not.\nc. BOTH statements TOGETHER are sufficient, but NEITHER alone is.\nd. Each statement ALONE is sufficient.\ne. Statements (1) and (2) TOGETHER are NOT sufficient.`;

const CHOICES = [
  { id: 'a', text: 'Statement (1) ALONE is sufficient, but (2) alone is not.' },
  { id: 'b', text: 'Statement (2) ALONE is sufficient, but (1) alone is not.' },
  { id: 'c', text: 'BOTH statements TOGETHER are sufficient, but NEITHER alone is.' },
  { id: 'd', text: 'Each statement ALONE is sufficient.' },
  { id: 'e', text: 'Statements (1) and (2) TOGETHER are NOT sufficient.' },
];

const QUESTIONS = [
  {
    stem: `${DIRECTIONS}\n\nBy what percent was the price per kilo of chicken increased?\n(1) The price per kilo of chicken was increased by Php 20.\n(2) The price per kilo of chicken was increased to Php 120.`,
    correct: 'c', difficulty: 2,
    explanation_en: 'To find the percent increase, you need both the amount of increase AND the original price. (1) gives the increase amount but not the original. (2) gives the new price but not the original. Together: original = 120 − 20 = 100, so increase = 20% ✓',
    explanation_fil: 'Kailangan ng dami ng pagtaas at orihinal na presyo. (1) nagbibigay ng dami; (2) nagbibigay ng bagong presyo. Magkasama: orihinal = 120 − 20 = 100; pagtaas = 20%.',
  },
  {
    stem: `${DIRECTIONS}\n\nA real estate broker received a commission of 8% of the selling price. What was the selling price?\n(1) The selling price minus the agent\'s commission was Php 9,200,000.\n(2) The selling price was 250% of the original purchase price of Php 4,000,000.`,
    correct: 'd', difficulty: 2,
    explanation_en: '(1) alone: 0.92 × SP = 9,200,000 → SP = 10,000,000 ✓. (2) alone: SP = 2.5 × 4,000,000 = 10,000,000 ✓. Each statement is independently sufficient.',
    explanation_fil: '(1) 0.92 × SP = 9,200,000; SP = 10M ✓. (2) 2.5 × 4M = 10M ✓. Bawat pahayag ay sapat na.',
  },
  {
    stem: `${DIRECTIONS}\n\nCherry and Keanna sold a total of 168 raffle tickets. How many did Cherry sell?\n(1) Keanna sold 60% as many tickets as Cherry.\n(2) Keanna sold 8% of all the raffle tickets sold.`,
    correct: 'a', difficulty: 2,
    explanation_en: '(1) alone: Let Cherry = c, Keanna = 0.6c. c + 0.6c = 168 → c = 105 ✓. (2) alone: Keanna sold 8% of all tickets sold (total unknown) — this doesn\'t tell us how many Cherry sold without knowing the grand total of all tickets.',
    explanation_fil: '(1) c + 0.6c = 168; c = 105 ✓. (2) Hindi natin alam ang kabuuang bilang ng tiket. Tanging (1) lamang ang sapat.',
  },
  {
    stem: `${DIRECTIONS}\n\nWhat is the ratio of m : s : a?\n(1) a = 2, and ms = 64.\n(2) m/s = 2 and a/s = ¼.`,
    correct: 'b', difficulty: 3,
    explanation_en: '(2) alone: m = 2s and a = s/4. Ratio m:s:a = 2s:s:s/4 = 8:4:1 ✓. (1) alone: a=2, ms=64 — many combinations of m and s multiply to 64, so the ratio is not uniquely determined.',
    explanation_fil: '(2) m = 2s, a = s/4; ratio = 8:4:1 ✓. (1) Maraming posibleng m at s na nagbibigay ng ms=64.',
  },
  {
    stem: `${DIRECTIONS}\n\nIf x and y are integers, is x divisible by 17?\n(1) The product xy is divisible by 17.\n(2) y is not divisible by 17.`,
    correct: 'c', difficulty: 3,
    explanation_en: 'From (1), xy is divisible by 17 (a prime). From (2), y is NOT divisible by 17. Since 17 is prime and xy is divisible by 17 but y is not, then x must be divisible by 17 ✓. Neither statement alone is sufficient.',
    explanation_fil: 'Mula (1) at (2): dahil prime ang 17, at hindi nahahati si y sa 17, si x ang dapat nahahati sa 17.',
  },
  {
    stem: `${DIRECTIONS}\n\nOn Saturday morning, a printing machine ran continuously to fill an order. At what time did it finish?\n(1) The supervisor began planning at 8:08 AM.\n(2) The machine had filled 50% of the order at 9:48 AM and 5/6 of the order by 10:18 AM.`,
    correct: 'b', difficulty: 3,
    explanation_en: '(2) alone: From 50% to 5/6 (= 83.3%) took 30 min. That means the remaining 1/6 (16.7%) takes 9 min. 5/6 done at 10:18 AM, so 6/6 done at 10:18 + 9 = 10:27 AM ✓. (1) alone gives no info about machine speed.',
    explanation_fil: '(2) Mula 50% hanggang 5/6 = 30 minuto. Natitira = 1/6, kailangan ng 9 minuto. Tapos sa 10:27 AM ✓.',
  },
  {
    stem: `${DIRECTIONS}\n\nHow many books does Gerard have?\n(1) If Gerard had 18 fewer books, he would have only half as many as he actually has.\n(2) Gerard has three times as many fiction as non-fiction books.`,
    correct: 'a', difficulty: 2,
    explanation_en: '(1) alone: n − 18 = n/2 → n/2 = 18 → n = 36 ✓. (2) alone: only gives a ratio, not the total count.',
    explanation_fil: '(1) n − 18 = n/2; n = 36 ✓. (2) Ratio lamang, hindi ang eksaktong bilang.',
  },
  {
    stem: `${DIRECTIONS}\n\nWhat number is 24% of x?\n(1) 16 is 8% of x.\n(2) 1/8 of x is 1,600.`,
    correct: 'd', difficulty: 2,
    explanation_en: '(1) alone: x = 16/0.08 = 200 → 24% of 200 = 48 ✓. (2) alone: x/8 = 1,600 → x = 12,800 → 24% of 12,800 = 3,072 ✓. Each is independently sufficient.',
    explanation_fil: '(1) x = 200; 24% ng 200 = 48 ✓. (2) x = 12,800; 24% ng 12,800 = 3,072 ✓. Bawat isa ay sapat.',
  },
  {
    stem: `${DIRECTIONS}\n\nWhat was the total amount raised for the Payatas Tragedy from private corporations and personal donations?\n(1) Of the amount donated, 48% came from private corporations.\n(2) Of the amount donated, Php 15M came from personal donations.`,
    correct: 'c', difficulty: 2,
    explanation_en: 'Personal donations = 52% of total. (2) gives the peso amount of personal donations = 15M. (1) tells us personal = 52%. Together: total = 15M/0.52 ≈ 28.85M ✓. Neither alone is sufficient.',
    explanation_fil: 'Personal = 52% ng kabuuan. (2) Personal = 15M. Magkasama: Kabuuan = 15M ÷ 0.52 ≈ 28.85M ✓.',
  },
  {
    stem: `${DIRECTIONS}\n\nMary\'s total score in three bowling games was 530. What were her individual scores?\n(1) Mary\'s highest score was 198.\n(2) The sum of Mary\'s two highest scores was 368.`,
    correct: 'c', difficulty: 3,
    explanation_en: 'From (1) and (2) together: highest = 198, sum of two highest = 368, so second highest = 170, third = 530−368 = 162. Unique solution ✓. Neither alone is sufficient.',
    explanation_fil: 'Mula (1) at (2): pinakamataas = 198, ika-2 = 170, ika-3 = 162 ✓. Wala sa isa ang sapat nang mag-isa.',
  },
  {
    stem: `${DIRECTIONS}\n\nIs the value of n closer to 48 than to 78?\n(1) 78 − n > n − 48.\n(2) n > 60.`,
    correct: 'a', difficulty: 2,
    explanation_en: '(1) alone: 78 − n > n − 48 → 126 > 2n → n < 63. The midpoint of 48 and 78 is 63. If n < 63, n is closer to 48 ✓. (2) alone: n > 60 but could be 63 (equidistant) or 70 (closer to 78), so not sufficient.',
    explanation_fil: '(1) n < 63 (midpoint ng 48 at 78). Kaya mas malapit si n sa 48 ✓. (2) Hindi sapat (maaaring n = 70).',
  },
  {
    stem: `${DIRECTIONS}\n\nAt a Saturday Midnight Sale, a shop sold 75% of shirts in inventory at Php 358 each. What was the total revenue?\n(1) When the shop opened, there were 448 shirts in inventory.\n(2) All but 112 of the shop\'s inventory were sold.`,
    correct: 'd', difficulty: 2,
    explanation_en: '(1) alone: 75% of 448 = 336 shirts sold; 336 × 358 = Php 120,288 ✓. (2) alone: 112 shirts unsold = 25%; total = 448; 336 × 358 ✓. Each is independently sufficient.',
    explanation_fil: '(1) 448 × 75% = 336 shirts; 336 × 358 ✓. (2) 112 = 25%; 75% × (112÷0.25) × 358 ✓.',
  },
  {
    stem: `${DIRECTIONS}\n\nHow many more boys than girls are there in the room?\n(1) There is a total of 56 girls and boys in the room.\n(2) The number of boys equals the square of the number of girls.`,
    correct: 'c', difficulty: 3,
    explanation_en: 'Let girls = g, boys = b. (1): g + b = 56. (2): b = g². Together: g + g² = 56 → g² + g − 56 = 0 → g = 7, b = 49. Difference = 42 ✓.',
    explanation_fil: 'g + g² = 56 (mula sa dalawang pahayag); g = 7, b = 49; pagkakaiba = 42 ✓.',
  },
  {
    stem: `${DIRECTIONS}\n\nIn what year was David born?\n(1) David\'s friend Michelle, who is ½ year younger than him, was born in 1979.\n(2) In 1998, David turned 20 years old.`,
    correct: 'b', difficulty: 1,
    explanation_en: '(2) alone: David turned 20 in 1998 → born in 1978 ✓. (1) alone: Michelle born 1979 and is ½ year younger → David born in 1978 or 1979 depending on birth months — not definitive.',
    explanation_fil: '(2) Ika-20 birthday ni David noong 1998; ipinanganak 1978 ✓. (1) Hindi tiyak dahil sa ½ taon na pagkakaiba.',
  },
  {
    stem: `${DIRECTIONS}\n\nA box contains 48 balls: 30 red and 18 blue. If 16 balls are removed, how many blue balls are left?\n(1) Of the removed balls, the ratio of red to blue is 5:3.\n(2) Of the first 8 marbles removed, 5 are red.`,
    correct: 'a', difficulty: 2,
    explanation_en: '(1) alone: 16 removed in ratio 5:3 → 10 red, 6 blue removed. Blue remaining = 18 − 6 = 12 ✓. (2) alone: only tells us about the first 8, not all 16.',
    explanation_fil: '(1) 16 bola sa ratio 5:3 = 10 pula, 6 asul na tinanggal. Natitira: 18 − 6 = 12 asul ✓.',
  },
  {
    stem: `${DIRECTIONS}\n\nHow long did it take Mrs. Lim to drive from her home to Ayala Alabang?\n(1) If her average speed had been 1.5 times as fast, the trip would have taken 2 hours.\n(2) Mrs. Lim\'s average speed was 80 km per hour.`,
    correct: 'a', difficulty: 2,
    explanation_en: '(1) alone: If 1.5× faster takes 2 hours, actual time = 2 × 1.5 = 3 hours ✓. (2) alone: gives speed but not distance, so time cannot be determined.',
    explanation_fil: '(1) Kung 1.5× mas mabilis = 2 oras; actual = 2 × 1.5 = 3 oras ✓. (2) Bilis lang, walang distansya.',
  },
  {
    stem: `${DIRECTIONS}\n\nIf Lorna had a dentist\'s appointment on a certain day, was the appointment on a Friday?\n(1) Exactly 64 hours before the appointment, it was Wednesday.\n(2) The appointment was between 2:00 PM and 7:00 PM.`,
    correct: 'c', difficulty: 2,
    explanation_en: '(1) alone: 64 hours before = Wednesday (unknown time). 64 = 2 days + 16 hours → appointment could be Friday (if Wed = midnight) or Saturday. (2) alone: gives time of day, not the day. Together: 64 hours before = Wednesday at some time + appointment 2–7 PM → only Friday 6 PM to 11 PM qualifies when starting Wednesday 2 AM to 7 AM ✓.',
    explanation_fil: 'Pagsama ng (1) at (2): 64 oras mula Miyerkules = Biyernes sa oras na 2PM–7PM ✓.',
  },
  {
    stem: `${DIRECTIONS}\n\nWhat was the average km per liter of gasoline the car consumed during a 640-km trip?\n(1) The total cost of gasoline was Php 1,152.\n(2) The cost for gasoline was Php 18.00 per liter.`,
    correct: 'c', difficulty: 2,
    explanation_en: '(1) alone: total cost but no price/liter → cannot find liters used. (2) alone: price per liter but not total cost → cannot find liters. Together: Liters = 1,152 ÷ 18 = 64. Average = 640 ÷ 64 = 10 km/L ✓.',
    explanation_fil: 'Liters = 1,152 ÷ 18 = 64; Average = 640 ÷ 64 = 10 km/L ✓. Kailangan ng dalawa.',
  },
  {
    stem: `${DIRECTIONS}\n\nWhat is the ratio of a to b?\n(1) a is 8 more than twice b.\n(2) The ratio of a to 4b is 3:7.`,
    correct: 'b', difficulty: 2,
    explanation_en: '(2) alone: a/4b = 3/7 → a/b = 12/7 ✓. (1) alone: a = 2b + 8 — the ratio a:b depends on the actual value of b, so it\'s not uniquely determined.',
    explanation_fil: '(2) a/4b = 3/7; a/b = 12/7 ✓. (1) a = 2b+8 — hindi tiyak ang ratio nang walang halaga ni b.',
  },
  {
    stem: `${DIRECTIONS}\n\nAt Avanti Review Center, 400 students are enrolled in Review Program (RP), Academic Advancement Program (AAP), or both. If 100 students are NOT in the RP, how many are enrolled in BOTH RP and AAP?\n(1) Of the 400 students, 160 are not enrolled in AAP.\n(2) A total of 240 students are enrolled in AAP.`,
    correct: 'd', difficulty: 3,
    explanation_en: 'In RP = 400−100 = 300. AAP students = 240 (from (2), or equivalently 400−160=240 from (1)). By inclusion-exclusion: Both = RP + AAP − Total = 300+240−400 = 140 ✓. Each statement gives the AAP count independently.',
    explanation_fil: 'Nasa RP: 300; Nasa AAP: 240. Parehong nasa dalawa = 300+240−400 = 140. Bawat pahayag ay nagbibigay ng bilang ng nasa AAP.',
  },
];

async function main() {
  console.log(`\n📊 Inserting ${QUESTIONS.length} Data Sufficiency questions (CSE Professional only)...`);
  let count = 0;
  for (const q of QUESTIONS) {
    const { error } = await sb.from('questions').insert({
      topic_id: TOPIC_ID,
      stem: q.stem,
      choices: CHOICES,
      correct_choice_id: q.correct,
      explanation_en: q.explanation_en,
      explanation_fil: q.explanation_fil,
      difficulty: q.difficulty,
      status: 'published',
      is_verified: true,
      source_note: 'CSE Reviewer 2026 | Analytical: Data Sufficiency | Level: professional | flashcard:no | tutor-ready:yes',
    });
    if (error) console.error(`  ✗ Q${count+1}:`, error.message);
    else count++;
  }
  console.log(`\n✅ Inserted ${count}/${QUESTIONS.length} Data Sufficiency questions.`);
  const { count: total } = await sb.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published');
  console.log(`   Total published questions in DB: ${total}`);
}

main().catch(console.error);
