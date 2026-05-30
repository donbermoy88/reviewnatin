/**
 * Flashcard Batch C: Basic Operations (27 new), Number Series (18 new),
 * Word Problems (18 new Pro + 20 new Sub)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase','utf8')
    .split('\n').filter(l=>l&&!l.startsWith('#'))
    .map(l=>[l.split('=')[0].trim(),l.slice(l.indexOf('=')+1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const T = {
  PRO_basic_ops:    'fee58356-630c-416c-8c5c-3dbfaeb28804',
  PRO_num_series:   '05987dfb-0f8e-4f74-a026-846b26347bcb',
  PRO_word_probs:   '097e3e89-db17-4f8f-ab8f-c816e9a11c80',
  SUB_basic_ops:    '8ba47590-7a27-4576-a849-60baf7826152',
  SUB_num_series:   'dec5d971-da1e-40cf-b359-d533e4160b02',
  SUB_word_probs:   '388e380d-69cb-4d91-b071-e7fde8c44e47',
};

async function getFronts(topicId) {
  const { data } = await sb.from('flashcards').select('front').eq('topic_id', topicId).limit(2000);
  return new Set((data||[]).map(r => r.front));
}
const f = (t, fr, bk) => ({ topic_id:t, front:fr, back:bk, is_premium:false });

// ── BASIC OPERATIONS (27 new) ─────────────────────────────────────────────────
const basicOps = [
  f(T.PRO_basic_ops,'Divisibility rule for 3','A number is divisible by 3 if the SUM of its digits is divisible by 3.\nExample: 456 → 4+5+6=15; 15÷3=5 → YES, 456 is divisible by 3.\nExample: 124 → 1+2+4=7; 7 not divisible by 3 → NOT divisible by 3.'),
  f(T.PRO_basic_ops,'Divisibility rule for 4','A number is divisible by 4 if its LAST TWO DIGITS form a number divisible by 4.\nExample: 1,324 → last two digits: 24; 24÷4=6 → YES.\nExample: 1,326 → last two digits: 26; 26÷4=6.5 → NO.\nShortcut: If last two digits are 00, 04, 08, 12, 16, 20, 24, 28, 32, 36, 40... → divisible by 4.'),
  f(T.PRO_basic_ops,'Divisibility rule for 6','A number is divisible by 6 if it is divisible by BOTH 2 AND 3.\nStep 1: Check if last digit is even (divisible by 2).\nStep 2: Check if sum of digits is divisible by 3.\nExample: 312 → last digit 2 (even ✓); 3+1+2=6 (divisible by 3 ✓) → YES.\nExample: 314 → last digit 4 (even ✓); 3+1+4=8 (NOT div. by 3) → NO.'),
  f(T.PRO_basic_ops,'Divisibility rule for 8','A number is divisible by 8 if its LAST THREE DIGITS form a number divisible by 8.\nExample: 1,728 → last three: 728; 728÷8=91 → YES.\nExample: 5,240 → last three: 240; 240÷8=30 → YES.\nAlternate: Double-check by dividing the last 3 digits by 8.'),
  f(T.PRO_basic_ops,'Divisibility rule for 9','A number is divisible by 9 if the SUM of its digits is divisible by 9.\nExample: 729 → 7+2+9=18; 18÷9=2 → YES.\nExample: 456 → 4+5+6=15; 15÷9=1.67 → NO.\nNote: All numbers divisible by 9 are also divisible by 3 (but NOT vice versa).'),
  f(T.PRO_basic_ops,'Divisibility rule for 11','Alternately ADD and SUBTRACT digits from right to left (or left to right). If the result is 0 or divisible by 11 → divisible by 11.\nExample: 2,728 → 8-2+7-2=11 → YES (11÷11=1).\nExample: 1,234 → 4-3+2-1=2 → NO.'),
  f(T.PRO_basic_ops,'How to find the GCF (Greatest Common Factor)?','Method 1 — PRIME FACTORIZATION: Factor both numbers into primes; GCF = product of common prime factors (lowest power).\nExample: GCF(36, 48).\n36 = 2²×3²; 48 = 2⁴×3. GCF = 2²×3 = 4×3 = 12.\nMethod 2 — EUCLIDEAN ALGORITHM: Divide the larger by smaller, replace larger with smaller and smaller with remainder. Repeat until remainder=0; last divisor = GCF.'),
  f(T.PRO_basic_ops,'How to find the LCM (Least Common Multiple)?','Method: LCM = (A × B) / GCF(A, B).\nExample: LCM(12, 18).\nGCF(12,18)=6. LCM = (12×18)/6 = 216/6 = 36.\nAlternate — Prime factorization: LCM = product of ALL prime factors (highest power).\n12=2²×3; 18=2×3². LCM=2²×3²=4×9=36.'),
  f(T.PRO_basic_ops,'How to add and subtract fractions with unlike denominators?','STEP 1: Find the LCM of the denominators (= LCD).\nSTEP 2: Convert each fraction to an equivalent fraction with the LCD.\nSTEP 3: Add or subtract the numerators; keep the LCD.\nSTEP 4: Simplify.\nExample: 1/3 + 1/4. LCD=12. 4/12 + 3/12 = 7/12.'),
  f(T.PRO_basic_ops,'How to multiply fractions?','Multiply NUMERATOR × NUMERATOR and DENOMINATOR × DENOMINATOR. Simplify.\nExample: (3/4) × (2/5) = (3×2)/(4×5) = 6/20 = 3/10.\nCross-cancellation shortcut: Cancel common factors before multiplying.\n(3/4) × (8/9) = (1/4) × (8/3) = 8/12 = 2/3. [Cancelled 3 from 3 and 9]'),
  f(T.PRO_basic_ops,'How to divide fractions?','Multiply the first fraction by the RECIPROCAL of the second (flip and multiply).\nExample: (3/4) ÷ (2/5) = (3/4) × (5/2) = 15/8 = 1 7/8.\nMemory rule: "Keep, Change, Flip." Keep the first fraction, change ÷ to ×, flip the second fraction.'),
  f(T.PRO_basic_ops,'How to convert a fraction to a percent?','Divide numerator by denominator → multiply by 100.\nExample: 3/4 = 0.75 × 100 = 75%.\nCommon conversions to memorize:\n1/2=50%, 1/4=25%, 3/4=75%, 1/5=20%, 2/5=40%, 3/5=60%, 4/5=80%, 1/8=12.5%, 3/8=37.5%.'),
  f(T.PRO_basic_ops,'What is a "proportion" and how is it solved?','A proportion states that two ratios are equal: a/b = c/d.\nCross-multiplication: a×d = b×c.\nExample: 3/4 = x/20. Cross-multiply: 3×20 = 4×x → 60 = 4x → x = 15.\nDirect proportion: as one increases, the other increases. Inverse proportion: as one increases, the other decreases.'),
  f(T.PRO_basic_ops,'What is the PEMDAS rule? Apply it to: 3 + 4 × 2² − 1','PEMDAS: Parentheses → Exponents → Multiplication/Division (left to right) → Addition/Subtraction (left to right).\n3 + 4 × 2² − 1\n= 3 + 4 × 4 − 1 [Exponents: 2²=4]\n= 3 + 16 − 1 [Multiplication: 4×4=16]\n= 18 [Add/Subtract left to right: 3+16=19, 19-1=18]'),
  f(T.PRO_basic_ops,'How do you convert a repeating decimal to a fraction?','Example: Convert 0.333... to a fraction.\nLet x = 0.333... → 10x = 3.333...\n10x − x = 3.333... − 0.333... → 9x = 3 → x = 3/9 = 1/3.\nFor 0.727272...: Let x = 0.72̄. 100x = 72.72̄. 100x−x=72 → 99x=72 → x=72/99=8/11.'),
  f(T.PRO_basic_ops,'What are perfect squares and perfect cubes up to 15?','Perfect SQUARES (n²):\n1,4,9,16,25,36,49,64,81,100,121,144,169,196,225.\nPerfect CUBES (n³):\n1,8,27,64,125,216,343,512,729,1000,1331,1728,2197,2744,3375.\nCSE tip: Memorize at least up to 12² (144) and 10³ (1000).'),
  f(T.PRO_basic_ops,'What is scientific notation? Convert 456,000 and 0.00078 to scientific notation.','Scientific notation: a × 10ⁿ where 1 ≤ a < 10.\n456,000 = 4.56 × 10⁵ (move decimal 5 places left → positive exponent).\n0.00078 = 7.8 × 10⁻⁴ (move decimal 4 places right → negative exponent).\nOperations: Multiply coefficients and add exponents; divide coefficients and subtract exponents.'),
  f(T.PRO_basic_ops,'How do you calculate the original price after a discount?','Original price = Discounted price ÷ (1 − discount rate).\nExample: An item is sold for ₱480 after a 20% discount. Original price = 480 ÷ (1−0.20) = 480 ÷ 0.80 = ₱600.\nAlternate: "480 is 80% of original." → Original = 480/0.80 = 600.'),
  f(T.PRO_basic_ops,'What is successive discount vs. single equivalent discount?','SUCCESSIVE discounts are NOT the same as their sum.\nExample: 20% then 10% discount:\nFirst: 100 × 0.80 = 80. Second: 80 × 0.90 = 72.\nSingle equivalent discount = (100−72)/100 = 28% (NOT 30%).\nFormula: Single equiv. = 1 − (1−d₁)(1−d₂) = 1 − (0.80)(0.90) = 1 − 0.72 = 0.28 = 28%.'),
  f(T.PRO_basic_ops,'How to calculate tax-inclusive price?','Tax-inclusive price = Original Price × (1 + tax rate).\nExample: Item costs ₱1,000. VAT = 12%.\nVAT-inclusive price = 1,000 × 1.12 = ₱1,120.\nVAT amount = ₱120.\nTo find original price from VAT-inclusive price: Original = VAT-inclusive ÷ 1.12.'),
  f(T.PRO_basic_ops,'What are prime numbers and how do you test for primality?','A PRIME number has exactly 2 factors: 1 and itself.\nFirst 20 primes: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71.\nTest: Divide by all primes up to √n. If none divide evenly → prime.\nExample: Is 97 prime? √97≈9.8. Test: 97÷2,3,5,7 → none divide evenly → 97 is PRIME.'),
  f(T.PRO_basic_ops,'How to compute floor, ceiling, and absolute value?','FLOOR ⌊x⌋: Round DOWN to nearest integer. ⌊3.7⌋=3, ⌊−3.2⌋=−4.\nCEILING ⌈x⌉: Round UP to nearest integer. ⌈3.2⌉=4, ⌈−3.7⌉=−3.\nABSOLUTE VALUE |x|: Distance from zero; always non-negative. |−5|=5, |3|=3.\nKey: ⌊−3.2⌋=−4 (floor goes more negative, NOT toward zero).'),
  f(T.PRO_basic_ops,'What is the shortcut for multiplying by 11?','To multiply a two-digit number by 11: add the two digits and place the sum in the middle.\nExample: 63 × 11: 6+3=9 → 6,9,3 → 693.\nIf the middle sum ≥ 10: carry the 1.\nExample: 67 × 11: 6+7=13 → write 7, carry 1 → 7,3 from right; 6+1=7 → 737.\nVerification: 67×11 = 67×10 + 67 = 670+67=737 ✓'),
  f(T.PRO_basic_ops,'What is the trick for squaring numbers ending in 5?','Pattern: (n5)² = n×(n+1) followed by 25.\nExample: 35² = 3×4=12; answer: 1225.\nExample: 75² = 7×8=56; answer: 5625.\nExample: 45² = 4×5=20; answer: 2025.\nVerification: 35²=35×35=1225 ✓'),
  f(T.PRO_basic_ops,'What is the formula for the sum of an arithmetic sequence?','Sum = (n/2) × (first term + last term), where n = number of terms.\nOR: Sum = (n/2) × [2a + (n−1)d], where a = first term, d = common difference.\nExample: Sum of 1+2+3+...+100.\nn=100, first=1, last=100. Sum = (100/2)×(1+100) = 50×101 = 5,050.'),
  f(T.PRO_basic_ops,'How to find the sum of a geometric sequence?','Sum of n terms = a × (rⁿ − 1) / (r − 1), where a = first term, r = common ratio.\nExample: 1 + 2 + 4 + 8 + 16 (5 terms, r=2).\nSum = 1 × (2⁵ − 1) / (2 − 1) = (32−1)/1 = 31.\nInfinite sum (|r|<1): S = a / (1−r).\nExample: 1 + 0.5 + 0.25 + ... = 1/(1−0.5) = 2.'),
  f(T.PRO_basic_ops,'What is the "Rule of Three" (Simple Proportion)?','The Rule of Three solves for a missing value in a proportion.\nDirect: a/b = c/x → x = (b×c)/a.\nExample: If 4 workers paint 1 house in 3 days, how many days for 2 workers?\nInverse proportion (more workers = less time): 4×3 = 2×x → x = 12/2 = 6 days.'),
  f(T.SUB_basic_ops,'What is the decimal equivalent of common fractions?','1/2=0.5; 1/4=0.25; 3/4=0.75\n1/5=0.20; 2/5=0.40; 3/5=0.60; 4/5=0.80\n1/8=0.125; 3/8=0.375; 5/8=0.625; 7/8=0.875\n1/3≈0.333; 2/3≈0.667\n1/10=0.1; 1/100=0.01; 1/1000=0.001\nTip: To convert fraction to decimal, divide top by bottom.'),
  f(T.SUB_basic_ops,'How do you find the percentage of a number?','FORMULA: Percentage = (Rate/100) × Base.\n"What is 25% of 80?" → (25/100) × 80 = 0.25 × 80 = 20.\n"What percent of 200 is 50?" → (50/200) × 100 = 25%.\n"30 is 15% of what number?" → Base = 30/0.15 = 200.\nThree elements: RATE (%), BASE (whole), PERCENTAGE (part).'),
  f(T.SUB_basic_ops,'What are the PEMDAS rules in simple terms?','PEMDAS = order of operations:\n1. Parentheses first: solve what\'s inside ( ) or [ ] first.\n2. Exponents: calculate powers and roots.\n3. Multiply and Divide: left to right.\n4. Add and Subtract: left to right.\nExample: 5 + 3 × 4 = 5 + 12 = 17 (multiply first, NOT 5+3=8 then ×4=32).'),
  f(T.SUB_basic_ops,'Divisibility shortcut: When is a number divisible by 2 and 5?','Divisible by 2: last digit is EVEN (0,2,4,6,8).\nDivisible by 5: last digit is 0 or 5.\nDivisible by 10: last digit is 0 (divisible by BOTH 2 and 5).\nExamples: 130 → divisible by 2,5,10. 125 → divisible by 5 only. 136 → divisible by 2 only.'),
];

// ── NUMBER SERIES (18 new) ────────────────────────────────────────────────────
const numSeries = [
  f(T.PRO_num_series,'Pattern: 5, 10, 20, 40, ___ → What is the rule and next term?','Rule: GEOMETRIC SERIES — multiply by 2 each time.\n5×2=10, 10×2=20, 20×2=40, 40×2=80.\nNext term: 80.\nHow to identify: check if consecutive ratio is constant (40÷20=2, 20÷10=2, 10÷5=2) ✓'),
  f(T.PRO_num_series,'Pattern: 1, 3, 6, 10, 15, ___ → What is the rule and next term?','Rule: TRIANGULAR NUMBERS — differences increase by 1 each time.\nDifferences: +2, +3, +4, +5, +6...\n1+2=3, 3+3=6, 6+4=10, 10+5=15, 15+6=21.\nNext term: 21.\nFormula: nth triangular number = n(n+1)/2.'),
  f(T.PRO_num_series,'Pattern: 2, 6, 12, 20, 30, ___ → Rule and next term?','Rule: PRODUCT SERIES — each term = n × (n+1).\n1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42.\nNext term: 42.\nAlternately: differences are +4, +6, +8, +10, +12 (even numbers, increasing by 2).'),
  f(T.PRO_num_series,'Pattern: 729, 243, 81, 27, ___ → Rule and next term?','Rule: GEOMETRIC SERIES — divide by 3 (or multiply by 1/3).\n729÷3=243, 243÷3=81, 81÷3=27, 27÷3=9.\nNext term: 9.\nNote: These are powers of 3: 3⁶=729, 3⁵=243, 3⁴=81, 3³=27, 3²=9.'),
  f(T.PRO_num_series,'Pattern: 3, 5, 9, 17, 33, ___ → Rule and next term?','Rule: Each term = (previous term × 2) − 1.\n3×2−1=5, 5×2−1=9, 9×2−1=17, 17×2−1=33, 33×2−1=65.\nNext term: 65.\nAlternate view: differences double each time: +2, +4, +8, +16, +32.'),
  f(T.PRO_num_series,'Pattern: 1, 8, 27, 64, 125, ___ → Rule and next term?','Rule: PERFECT CUBES — each term = n³.\n1=1³, 8=2³, 27=3³, 64=4³, 125=5³, 216=6³.\nNext term: 216 (6³).\nMemorize cubes: 1,8,27,64,125,216,343,512,729,1000.'),
  f(T.PRO_num_series,'Pattern: 2, 3, 5, 7, 11, 13, ___ → Rule and next term?','Rule: PRIME NUMBER SERIES — each term is the next prime number.\nPrimes: 2,3,5,7,11,13,17,19,23,29...\nNext term: 17.\nHow to identify: no regular arithmetic/geometric pattern → check if terms are consecutive primes.'),
  f(T.PRO_num_series,'Pattern: 1, 1, 2, 3, 5, 8, 13, ___ → Rule and next term?','Rule: FIBONACCI SEQUENCE — each term = sum of two preceding terms.\n1+1=2, 1+2=3, 2+3=5, 3+5=8, 5+8=13, 8+13=21.\nNext term: 21.\nFibonacci numbers appear in nature (spirals, golden ratio). Ratio of consecutive terms approaches the golden ratio (≈1.618).'),
  f(T.PRO_num_series,'What is an ALTERNATING NUMBER SERIES? Give an example.',
    'An ALTERNATING series interleaves TWO separate sequences.\nExample: 1, 2, 4, 6, 7, 18, 10, 54, ___, ___\nOdd positions: 1,4,7,10,... (+3 each) → next = 13\nEven positions: 2,6,18,54,... (×3 each) → next = 162\nStrategy: Separate odd-positioned and even-positioned terms; find each pattern independently.'),
  f(T.PRO_num_series,'Pattern: 50, 45, 41, 38, 36, ___ → Rule and next term?','Rule: DECREASING DIFFERENCES — differences themselves decrease by 1.\nDifferences: −5, −4, −3, −2, −1...\n50−5=45, 45−4=41, 41−3=38, 38−2=36, 36−1=35.\nNext term: 35.'),
  f(T.PRO_num_series,'Pattern: 3, 12, 48, 192, ___ → Rule and next term?','Rule: GEOMETRIC SERIES — multiply by 4 each time.\n3×4=12, 12×4=48, 48×4=192, 192×4=768.\nNext term: 768.\nIdentification: 192÷48=4, 48÷12=4, 12÷3=4 → constant ratio of 4 ✓'),
  f(T.PRO_num_series,'Pattern: 7, 14, 28, 56, ___ (missing term between 14 and 28: which is it?)','If pattern: ×2 each time: 7→14→28→56→112. All terms shown double the previous.\nIf the question gives: 7, 14, ___, 56 and asks for missing:\nMissing = 14×2 = 28.\nAlways verify: 28×2=56 ✓'),
  f(T.PRO_num_series,'How to identify a "constant second-difference" series?','If first differences are NOT constant but second differences ARE constant → QUADRATIC SERIES.\nExample: 1, 4, 9, 16, 25...\nFirst differences: 3,5,7,9 (not constant). Second differences: 2,2,2 (constant!) → quadratic.\nTo find next term: add the last first-difference + 2, then add to last term.\n25 + (9+2) = 25+11 = 36 (which is 6²) ✓'),
  f(T.PRO_num_series,'Pattern: Z, Y, X, W, V, ___ → Rule and next term (letter series)?','Rule: REVERSE ALPHABET — letters go backward from Z.\nZ(26), Y(25), X(24), W(23), V(22), U(21).\nNext term: U.\nLetter series tip: Convert letters to numbers (A=1, Z=26), find arithmetic pattern, convert back.'),
  f(T.PRO_num_series,'Pattern: A, C, F, J, O, ___ → Rule and next term?','Gaps between letters: +2, +3, +4, +5, +6...\nA(1)+2=C(3), C(3)+3=F(6), F(6)+4=J(10), J(10)+5=O(15), O(15)+6=U(21).\nNext term: U.\nPattern: gaps increase by 1 each time.'),
  f(T.PRO_num_series,'What are "mixed operation" series? Give an example.',
    'MIXED OPERATION SERIES alternates different operations (add, subtract, multiply, divide).\nExample: 3, 6, 5, 10, 9, 18, 17, ___, ___\nPattern: ×2, −1, ×2, −1, ×2, −1, ×2, −1\n17×2=34, 34−1=33.\nStrategy: Write the operations between each consecutive pair to spot the alternating pattern.'),
  f(T.PRO_num_series,'Pattern: 100, 95, 85, 70, 50, ___ → Rule and next term?','Differences: −5, −10, −15, −20, −25.\nDifferences decrease (become more negative) by 5 each time.\n50−25=25.\nNext term: 25.\nThis is an ARITHMETIC series of differences (second-order arithmetic).'),
  f(T.PRO_num_series,'Pattern: 2, 4, 12, 48, 240, ___ → Rule and next term?','Each term is multiplied by: ×2, ×3, ×4, ×5, ×6...\n2×2=4, 4×3=12, 12×4=48, 48×5=240, 240×6=1440.\nNext term: 1440.\nKey: The multiplier increases by 1 each step.'),
  f(T.SUB_num_series,'Pattern: 2, 4, 6, 8, 10, ___ → Rule and next term?','ARITHMETIC SERIES: add 2 each time (even numbers).\nNext term: 12.\nThis is the simplest arithmetic series: common difference = +2.\nFormula: nth term = 2n. For n=6: 2×6=12.'),
  f(T.SUB_num_series,'Pattern: 1, 4, 9, 16, 25, ___ → Rule and next term?','PERFECT SQUARES: each term = n².\n1=1², 4=2², 9=3², 16=4², 25=5², 36=6².\nNext term: 36.\nMemorize perfect squares up to at least 15: 1,4,9,16,25,36,49,64,81,100,121,144,169,196,225.'),
  f(T.SUB_num_series,'Pattern: 50, 40, 30, 20, 10, ___ → Rule and next term?','ARITHMETIC SERIES: subtract 10 each time (common difference = −10).\nNext term: 0.\nCheck: 10−10=0 ✓. This is a decreasing arithmetic series.'),
];

// ── WORD PROBLEMS (18 new Pro) ────────────────────────────────────────────────
const wordProbsPro = [
  f(T.PRO_word_probs,'AGE PROBLEM formula and setup','Setup: Let x = person\'s current age. Represent all ages in terms of x. Write an equation from the given relationship.\nKey phrases: "5 years ago" → (x−5); "in 10 years" → (x+10); "twice as old" → 2x; "sum of ages" → add all ages.\nAlways verify by substituting the answer back into the original conditions.'),
  f(T.PRO_word_probs,'Solve: Ana is 4 times older than her son. In 12 years, she will be twice as old as her son. How old is the son now?','Let son = x. Ana = 4x.\nIn 12 years: 4x+12 = 2(x+12) → 4x+12 = 2x+24 → 2x=12 → x=6.\nSon is currently 6 years old. Ana is 24.\nVerify: In 12 years, Ana=36, Son=18. 36=2×18 ✓'),
  f(T.PRO_word_probs,'MIXTURE PROBLEM: Two solutions of different concentrations are combined.','Formula: (Amount₁ × Conc₁) + (Amount₂ × Conc₂) = (Total Amount × Final Conc).\nExample: Mix 4L of 30% salt with 6L of 50% salt.\n(4×0.30)+(6×0.50) = 10×C → 1.2+3.0 = 10C → C = 4.2/10 = 42%.\nFinal concentration: 42%.'),
  f(T.PRO_word_probs,'Solve: How many liters of pure acid must be added to 20L of 30% acid to make 50% acid?','Let x = liters of pure acid added.\n(20×0.30) + x = (20+x) × 0.50\n6 + x = 10 + 0.5x\n0.5x = 4 → x = 8 liters.\nVerify: (6+8)/(20+8) = 14/28 = 50% ✓'),
  f(T.PRO_word_probs,'WORK PROBLEM: Combined work rate formula','If A does a job in a days and B in b days: Combined time = ab/(a+b).\nRate per day: A does 1/a, B does 1/b. Combined rate = 1/a + 1/b.\nExample: A in 6 days, B in 4 days. Combined = (6×4)/(6+4) = 24/10 = 2.4 days.\nWith time done together: work done = rate × time.'),
  f(T.PRO_word_probs,'Solve: Pipe A fills a tank in 3 hours, Pipe B empties it in 5 hours. Both open — how long to fill an empty tank?','Fill rate of A = 1/3 per hour. Drain rate of B = −1/5 per hour.\nNet rate = 1/3 − 1/5 = 5/15 − 3/15 = 2/15 per hour.\nTime to fill = 1 ÷ (2/15) = 15/2 = 7.5 hours.'),
  f(T.PRO_word_probs,'DISTANCE-SPEED-TIME (uniform motion) formula','D = S × T (Distance = Speed × Time).\nDerivations: S = D/T; T = D/S.\nFor OPPOSITE DIRECTIONS: closing distance = sum of speeds × time.\nFor SAME DIRECTION: closing distance = difference of speeds × time.\nExample: Two buses, 300km apart, travel toward each other at 60kph and 40kph. Time to meet: 300/(60+40) = 300/100 = 3 hours.'),
  f(T.PRO_word_probs,'Solve: A train travels 360 km in 4 hours. How long to travel 540 km at same speed?','Speed = D/T = 360/4 = 90 kph.\nTime for 540 km = D/S = 540/90 = 6 hours.'),
  f(T.PRO_word_probs,'PERCENTAGE INCREASE/DECREASE: formula and application','Percent change = [(New − Old) / Old] × 100.\nINCREASE: If enrollment went from 500 to 650 → % change = (150/500)×100 = 30% increase.\nDECREASE: If salary dropped from ₱40,000 to ₱34,000 → % change = (−6,000/40,000)×100 = −15% (15% decrease).\nNote: Percent increase then percent decrease ≠ original value.'),
  f(T.PRO_word_probs,'PROFIT AND LOSS: key formulas','Cost Price (CP): purchase price. Selling Price (SP): selling price.\nProfit = SP − CP (if SP > CP). Loss = CP − SP (if CP > SP).\nProfit % = (Profit/CP) × 100. Loss % = (Loss/CP) × 100.\nSP = CP × (1 + profit%) [for profit] or SP = CP × (1 − loss%) [for loss].'),
  f(T.PRO_word_probs,'Solve: A merchant buys goods at ₱800 and sells them at a 25% profit. What is the selling price?','SP = CP × (1 + profit%) = 800 × 1.25 = ₱1,000.\nProfit = ₱1,000 − ₱800 = ₱200.\nVerify: 200/800 × 100 = 25% ✓'),
  f(T.PRO_word_probs,'SIMPLE INTEREST: formula and application','I = P × R × T (Interest = Principal × Rate × Time).\nTotal Amount = P + I = P(1 + RT).\nTo find unknown variable: rearrange formula.\nExample: Invest ₱50,000 at 8% per year for 3 years.\nI = 50,000 × 0.08 × 3 = ₱12,000. Total = ₱62,000.'),
  f(T.PRO_word_probs,'Solve: What principal invested at 6% per annum will earn ₱1,800 in 2.5 years (simple interest)?','I = P × R × T → 1,800 = P × 0.06 × 2.5\n1,800 = 0.15P → P = 1,800/0.15 = ₱12,000.'),
  f(T.PRO_word_probs,'RATIO AND PROPORTION word problem approach','Setup: Write ratio as a:b. Let parts = ax and bx (where x is the multiplier).\nTotal: ax + bx = total → x(a+b) = total → x = total/(a+b).\nThen each part: ax and bx.\nExample: Divide 180 in ratio 2:3:4. Sum = 9 parts. x = 180/9 = 20.\nParts: 40, 60, 80. Verify: 40+60+80=180 ✓'),
  f(T.PRO_word_probs,'Solve: In a class of 42, the ratio of girls to boys is 4:3. How many girls and boys?','Girls:Boys = 4:3. Total parts = 7. x = 42/7 = 6.\nGirls = 4×6 = 24. Boys = 3×6 = 18.\nVerify: 24+18=42 ✓; 24:18 = 4:3 ✓'),
  f(T.PRO_word_probs,'INVESTMENT PROBLEM: two amounts at different rates','Setup: Let x = amount at rate 1. (Total − x) = amount at rate 2.\nEquation: x×r₁ + (Total−x)×r₂ = Total interest.\nSolve for x.\nExample: ₱30,000 invested at 5% and 8%. Total interest = ₱2,100.\nx(0.05) + (30,000−x)(0.08) = 2,100 → 0.05x + 2,400−0.08x = 2,100 → −0.03x = −300 → x = 10,000.\n₱10,000 at 5%, ₱20,000 at 8%.'),
  f(T.PRO_word_probs,'NUMBER PROBLEM: Find two consecutive integers whose sum is 87.','Let the two consecutive integers be n and n+1.\nn + (n+1) = 87 → 2n+1=87 → 2n=86 → n=43.\nIntegers: 43 and 44. Verify: 43+44=87 ✓\nFor consecutive EVEN or ODD integers: n and n+2.'),
  f(T.PRO_word_probs,'COIN/DENOMINATION PROBLEM approach','Setup: Let n = number of coins of one type.\nTotal VALUE: Σ(denomination × number of coins) = given total value.\nTotal COUNT: Σ(number of coins) = given total count.\nExample: ₱1 and ₱5 coins total ₱47 with 23 coins.\nLet x = ₱1 coins. 23−x = ₱5 coins.\n1(x) + 5(23−x) = 47 → x+115−5x=47 → −4x=−68 → x=17.\n17 peso coins and 6 five-peso coins.'),
];

// ── WORD PROBLEMS (20 new Sub) ────────────────────────────────────────────────
const wordProbsSub = [
  f(T.SUB_word_probs,'Basic percentage: What is 35% of 200?','35% of 200 = (35/100) × 200 = 0.35 × 200 = 70.\nShortcut: 10% of 200 = 20; 35% = 3.5 × 20 = 70.'),
  f(T.SUB_word_probs,'Basic percentage: 60 is what percent of 240?','Percent = (Part/Whole) × 100 = (60/240) × 100 = 25%.'),
  f(T.SUB_word_probs,'Basic percentage: 45 is 30% of what number?','Base = Part/Rate = 45/0.30 = 150.'),
  f(T.SUB_word_probs,'Simple interest: ₱5,000 at 4% per year for 2 years. Find total interest.','I = P×R×T = 5,000 × 0.04 × 2 = ₱400 total interest.\nTotal amount = 5,000+400 = ₱5,400.'),
  f(T.SUB_word_probs,'Simple interest: What rate earns ₱750 interest on ₱10,000 in 1.5 years?','R = I/(P×T) = 750/(10,000×1.5) = 750/15,000 = 0.05 = 5% per year.'),
  f(T.SUB_word_probs,'Distance-speed-time: A jeep travels 180 km in 3 hours. What is its speed?','Speed = Distance/Time = 180/3 = 60 km/h.'),
  f(T.SUB_word_probs,'Distance-speed-time: At 45 km/h, how long to travel 270 km?','Time = Distance/Speed = 270/45 = 6 hours.'),
  f(T.SUB_word_probs,'Solve: A car goes 60 km/h; a bus goes 40 km/h. They start 400 km apart heading toward each other. When do they meet?','Closing speed = 60+40 = 100 km/h.\nTime = 400/100 = 4 hours. They meet after 4 hours.'),
  f(T.SUB_word_probs,'Basic ratio: Divide ₱240 in ratio 3:5.','Total parts = 8. Value of 1 part = 240/8 = 30.\n3 parts = 90; 5 parts = 150.\nVerify: 90+150=240; 90:150=3:5 ✓'),
  f(T.SUB_word_probs,'Ratio problem: If 3 pens cost ₱45, how much do 7 pens cost?','Cost per pen = 45/3 = ₱15.\n7 pens = 7×15 = ₱105.\nAlternately (proportion): 3/45 = 7/x → x = (7×45)/3 = 105.'),
  f(T.SUB_word_probs,'Unit conversion: Convert 5 km to meters.','1 km = 1,000 m.\n5 km = 5 × 1,000 = 5,000 m.'),
  f(T.SUB_word_probs,'Unit conversion: Convert 3.5 hours to minutes.','1 hour = 60 minutes.\n3.5 hours = 3.5 × 60 = 210 minutes.'),
  f(T.SUB_word_probs,'Solve: Maria earns ₱12,000/month. She saves 20% and spends the rest. How much does she spend monthly?','Savings = 20% of 12,000 = 0.20 × 12,000 = ₱2,400.\nSpending = 12,000 − 2,400 = ₱9,600.'),
  f(T.SUB_word_probs,'Solve: A jacket is marked ₱1,500. A 10% discount is given. What is the sale price?','Discount = 10% of 1,500 = ₱150.\nSale price = 1,500 − 150 = ₱1,350.\nOR: Sale price = 1,500 × 0.90 = ₱1,350.'),
  f(T.SUB_word_probs,'Perimeter problem: A room is 8m long and 5m wide. Find the perimeter.','Perimeter of rectangle = 2 × (length + width) = 2 × (8+5) = 2 × 13 = 26 m.'),
  f(T.SUB_word_probs,'Area problem: Find the area of a rectangular garden 12m by 7m.','Area = length × width = 12 × 7 = 84 m².'),
  f(T.SUB_word_probs,'Solve: Pedro and Juan can mow a lawn together in 4 hours. Pedro alone takes 6 hours. How long does Juan take alone?','Combined rate = 1/4. Pedro\'s rate = 1/6.\nJuan\'s rate = 1/4 − 1/6 = 3/12 − 2/12 = 1/12.\nJuan alone: 12 hours.'),
  f(T.SUB_word_probs,'Profit problem: Bought for ₱500, sold for ₱650. What is the profit percent?','Profit = 650−500 = ₱150.\nProfit % = (150/500) × 100 = 30%.'),
  f(T.SUB_word_probs,'Solve: A number increased by 30 equals 95. What is the number?','Let n = the number.\nn + 30 = 95 → n = 95−30 = 65.'),
  f(T.SUB_word_probs,'Solve: Two numbers are in ratio 2:3. Their sum is 75. Find the numbers.','Let the numbers be 2x and 3x. 2x+3x=75 → 5x=75 → x=15.\nNumbers: 30 and 45. Verify: 30+45=75; 30:45=2:3 ✓'),
];

const allCards = [...basicOps, ...numSeries, ...wordProbsPro, ...wordProbsSub];
console.log(`\nBatch C: ${allCards.length} total cards`);
console.log(`  Basic Ops Pro: ${basicOps.filter(c=>c.topic_id===T.PRO_basic_ops).length}`);
console.log(`  Basic Ops Sub: ${basicOps.filter(c=>c.topic_id===T.SUB_basic_ops).length}`);
console.log(`  Num Series Pro: ${numSeries.filter(c=>c.topic_id===T.PRO_num_series).length}`);
console.log(`  Num Series Sub: ${numSeries.filter(c=>c.topic_id===T.SUB_num_series).length}`);
console.log(`  Word Probs Pro: ${wordProbsPro.length}`);
console.log(`  Word Probs Sub: ${wordProbsSub.length}\n`);

const byTopic = {};
for (const card of allCards) {
  if (!byTopic[card.topic_id]) byTopic[card.topic_id] = [];
  byTopic[card.topic_id].push(card);
}

let totalInserted = 0, totalSkipped = 0;
for (const [topicId, cards] of Object.entries(byTopic)) {
  const { data: ex } = await sb.from('flashcards').select('front').eq('topic_id', topicId).limit(2000);
  const existing = new Set((ex||[]).map(r => r.front));
  const newCards = cards.filter(c => !existing.has(c.front));
  const skipped = cards.length - newCards.length;
  if (newCards.length === 0) { console.log(`  Skip all (${skipped} dupes) for ${topicId.slice(0,8)}`); continue; }
  const { error } = await sb.from('flashcards').insert(newCards);
  if (error) { console.error(`  ERROR ${topicId.slice(0,8)}: ${error.message}`); continue; }
  totalInserted += newCards.length;
  totalSkipped += skipped;
  console.log(`  ✓ Inserted ${newCards.length} (skipped ${skipped}) for ${topicId.slice(0,8)}`);
}

const { count } = await sb.from('flashcards').select('*',{count:'exact',head:true});
console.log(`\n✅ Batch C done. Inserted: ${totalInserted}, Skipped: ${totalSkipped}`);
console.log(`📊 Total flashcards: ${count}`);
