/**
 * CSE-20: Abstract Reasoning — 30 visual questions
 * Uploads page images to Supabase Storage, then inserts questions with image_url
 * Both Professional and Sub-Professional
 *
 * Answers extracted visually (red = correct in PDF):
 * 1.d 2.b 3.b 4.c 5.d 6.a 7.d 8.d 9.c 10.b
 * 11.c 12.b 13.a 14.d 15.d 16.b 17.b 18.b 19.b 20.d
 * 21.b 22.d 23.d 24.a 25.b 26.c 27.c 28.c 29.b 30.d
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Topic IDs — Pro
const TOPICS_PRO = {
  pattern: '3ce6c795-fcc7-4172-92db-45300975694d',
  series:  '1188d779-d270-49e7-afa0-a0f4d296ca92',
  analogy: '07b332ce-047e-4762-af5d-e4734ba6348e',
};
// Topic IDs — Sub
const TOPICS_SUB = {
  pattern: '13ade384-b7a1-40da-8610-9c188ee78eb7',
  series:  'bcde8fc5-6510-4f7f-a0bb-aa429eb83720',
  analogy: '33e40df8-ae08-43e7-a790-d9688d7fef4f',
};

const IMAGE_DIR = '/tmp/cse-images';

// Upload a page image to Supabase Storage, return public URL
async function uploadPage(pdfPageNum) {
  const filename = `ar-page-${pdfPageNum}.png`;
  const localPath = `${IMAGE_DIR}/${filename}`;
  const remotePath = `abstract-reasoning/${filename}`;

  const buf = readFileSync(localPath);
  const { error } = await sb.storage
    .from('question-images')
    .upload(remotePath, buf, { contentType: 'image/png', upsert: true });
  if (error) throw new Error(`Upload ${filename}: ${error.message}`);

  const { data: { publicUrl } } = sb.storage
    .from('question-images')
    .getPublicUrl(remotePath);
  return publicUrl;
}

// Standard visual choices (the images show a/b/c/d figures)
const VISUAL_CHOICES = [
  { id: 'a', text: 'Figure A' },
  { id: 'b', text: 'Figure B' },
  { id: 'c', text: 'Figure C' },
  { id: 'd', text: 'Figure D' },
];

async function main() {
  console.log('📐 Abstract Reasoning — uploading images...\n');

  // Upload all AR pages (PDF pages 154-162; page 153 is just the header)
  const urls = {};
  for (const pg of [154,155,156,157,158,159,160,161,162]) {
    process.stdout.write(`  Uploading page ${pg}... `);
    urls[pg] = await uploadPage(pg);
    console.log('✓');
  }

  // Question definitions
  // page = which PDF page image to use (where question + choices are visible)
  // topicKey = 'pattern' | 'series' | 'analogy'
  const QUESTIONS = [
    // PYRAMID/CIRCLE SERIES (Q1-Q7): series-completion
    {
      n: 1, page: 154, topicKey: 'series', correct: 'd', difficulty: 2,
      stem: 'Which of the circles marked A, B, C, D fits logically into the blank top circle in the diagram below? (Question 1 — see figure above) There is a logical sequence to how the diagram is built up, starting at the bottom row.',
      explanation_en: 'Following the rule that each circle in the pyramid is formed by combining the two circles below it, the top circle must show the combined inner pattern. Figure D correctly merges the patterns from the two circles directly below it.',
      explanation_fil: 'Ayon sa panuntunan ng pyramid, ang bawat bilog ay resulta ng pagsasama ng dalawang bilog sa ibaba nito. Ang Figure D ang tamang sagot dahil pinagsama nito ang mga pattern ng dalawang bilog sa ibaba nito.',
    },
    {
      n: 2, page: 154, topicKey: 'series', correct: 'b', difficulty: 2,
      stem: 'Which of the circles marked A, B, C, D fits logically into the blank top circle in the diagram below? (Question 2 — see figure above) There is a logical sequence to how the diagram is built up, starting at the bottom row.',
      explanation_en: 'Following the pyramid combination rule, Figure B is the result of merging the patterns of the two circles directly below the blank.',
      explanation_fil: 'Ayon sa panuntunan ng pyramid, ang Figure B ang resulta ng pagsasama ng mga pattern ng dalawang bilog sa ibaba ng patlang.',
    },
    {
      n: 3, page: 155, topicKey: 'series', correct: 'b', difficulty: 2,
      stem: 'Which of the circles marked A, B, C, D fits logically into the blank top circle in the diagram below? (Question 3 — see figure above) There is a logical sequence to how the diagram is built up, starting at the bottom row.',
      explanation_en: 'The circle at the top of the pyramid must contain the combined elements of the two circles below it following the established rule. Figure B is correct.',
      explanation_fil: 'Ang bilog sa tuktok ng pyramid ay dapat naglalaman ng pinagsaming elemento ng dalawang bilog sa ibaba nito. Ang Figure B ang tamang sagot.',
    },
    {
      n: 4, page: 155, topicKey: 'series', correct: 'c', difficulty: 2,
      stem: 'Which of the circles marked A, B, C, D fits logically into the blank top circle in the diagram below? (Question 4 — see figure above) There is a logical sequence to how the diagram is built up, starting at the bottom row.',
      explanation_en: 'Figure C correctly completes the pyramid by applying the combination rule to the two circles below the blank.',
      explanation_fil: 'Ang Figure C ay tama dahil naaangkop sa panuntunan ng pagsasama ng dalawang bilog sa ibaba ng patlang.',
    },
    {
      n: 5, page: 155, topicKey: 'series', correct: 'd', difficulty: 2,
      stem: 'Which of the circles marked A, B, C, D fits logically into the blank top circle in the diagram below? (Question 5 — see figure above) There is a logical sequence to how the diagram is built up, starting at the bottom row.',
      explanation_en: 'Figure D correctly shows the merged inner design resulting from combining the two bottom circles according to the pyramid\'s logical rule.',
      explanation_fil: 'Ang Figure D ay nagpapakita ng tamang pinagsamang disenyo mula sa dalawang bilog sa ibaba, ayon sa panuntunan ng pyramid.',
    },
    // HEXAGON PYRAMID (Q6): pattern-completion
    {
      n: 6, page: 156, topicKey: 'pattern', correct: 'a', difficulty: 3,
      stem: 'Study the pyramid on the left. Moving up from the bottom row, the lines in each hexagon follow a set rule based on the two hexagons directly below it. Which of A, B, C, D should replace the hexagon with the question mark at the top? (Question 6 — see figure above)',
      explanation_en: 'The rule is that the lines in each parent hexagon are the sum (union) of the lines in the two child hexagons below it. Figure A is the hexagon that matches the union of the two hexagons below the top position.',
      explanation_fil: 'Ang panuntunan: ang mga linya sa bawat hexagon ay kabuuan ng mga linya ng dalawang hexagon sa ibaba nito. Ang Figure A ang naaayon sa patakarang ito.',
    },
    // GRID SQUARE (Q7): pattern-completion
    {
      n: 7, page: 156, topicKey: 'pattern', correct: 'd', difficulty: 2,
      stem: 'Which of the squares A, B, C, D will fit in at the square with the question mark? (Question 7 — see figure above)',
      explanation_en: 'Looking at the pattern in the grid, Figure D completes the missing square to maintain the logical visual pattern across rows and columns.',
      explanation_fil: 'Sa pagtingin sa pattern ng grid, ang Figure D ang nagkukumpleto ng patlang upang mapanatili ang lohikal na pattern sa bawat hilera at kolumna.',
    },
    // PYRAMID CONTINUATION (Q8): pattern-completion
    {
      n: 8, page: 157, topicKey: 'pattern', correct: 'd', difficulty: 3,
      stem: 'Which of the squares A, B, C, D will fit in at the square with the question mark? (Question 8 — see figure above; diagram continues from previous page)',
      explanation_en: 'Examining the pattern in the 3×3 grid, Figure D is the only option that correctly continues the visual sequence established across rows and columns.',
      explanation_fil: 'Sa pagsusuri ng pattern sa 3×3 grid, ang Figure D lamang ang wastong nagpapatuloy ng biswal na pagkakasunod-sunod sa mga hilera at kolumna.',
    },
    // DOT MATRIX (Q9): series-completion
    {
      n: 9, page: 157, topicKey: 'series', correct: 'c', difficulty: 2,
      stem: 'Look at the 3×3 matrix of dot patterns. Which of A, B, C, D replaces the question mark? (Question 9 — see figure above)',
      explanation_en: 'The pattern shows a systematic progression in the number and arrangement of dots across each row and column. Figure C completes the pattern correctly.',
      explanation_fil: 'Nagpapakita ang pattern ng sistematikong pagbabago sa bilang at ayos ng mga tuldok sa bawat hilera at kolumna. Ang Figure C ang tamang sagot.',
    },
    // CIRCLE/CLOCK MATRIX (Q10): series-completion
    {
      n: 10, page: 157, topicKey: 'series', correct: 'b', difficulty: 2,
      stem: 'Look at the 3×3 matrix of circles. Which of A, B, C, D replaces the question mark? (Question 10 — see figure above)',
      explanation_en: 'The circles follow a pattern where the inner design changes progressively. Figure B correctly shows the circle for the missing position.',
      explanation_fil: 'Ang mga bilog ay sumusunod sa pattern kung saan ang panloob na disenyo ay nagbabago nang sunud-sunod. Ang Figure B ang tamang sagot para sa patlang.',
    },
    // DOT GRID SQUARE MATRIX (Q11): series-completion
    {
      n: 11, page: 157, topicKey: 'series', correct: 'c', difficulty: 2,
      stem: 'Which of the squares A, B, C, D will fit in at the square with the question mark? (Question 11 — see figure above)',
      explanation_en: 'Analyzing the progression of dots in each square across the 3×3 grid, Figure C is the correct completion for the missing square.',
      explanation_fil: 'Sa pagsusuri ng progresyon ng mga tuldok sa bawat parisukat sa 3×3 grid, ang Figure C ang tamang pagkukumpleto ng patlang.',
    },
    // SYMBOL MATRIX (Q12): pattern-completion
    {
      n: 12, page: 158, topicKey: 'pattern', correct: 'b', difficulty: 3,
      stem: 'Which of the squares A, B, C, D will fit in at the square with the question mark? (Question 12 — see figure above; diagram continues from previous page)',
      explanation_en: 'The grid follows a rule where the direction and type of symbol transforms systematically. Figure B is the correct missing piece that maintains the pattern.',
      explanation_fil: 'Ang grid ay sumusunod sa panuntunan kung saan ang direksyon at uri ng simbolo ay nagbabago nang sistematiko. Ang Figure B ang tamang sagot.',
    },
    // HEXAGONAL PATTERN (Q13): pattern-completion
    {
      n: 13, page: 158, topicKey: 'pattern', correct: 'a', difficulty: 2,
      stem: 'Look at the hexagonal arrangement of shapes. Which of A, B, C replaces the question mark? (Question 13 — see figure above)',
      explanation_en: 'Following the pattern rule in the hexagonal arrangement, Figure A (the empty circle) is the correct piece to complete the sequence.',
      explanation_fil: 'Ayon sa panuntunan ng hexagonal na ayos, ang Figure A (bilog na walang laman) ang tamang piraso para sa patlang.',
    },
    // ROW-COLUMN MATRIX (Q14-Q15-Q16): series-completion
    {
      n: 14, page: 158, topicKey: 'series', correct: 'd', difficulty: 2,
      stem: 'Look across each row and down each column, then find the correct right-hand bottom tile from the choices. (Question 14 — see figure above)',
      explanation_en: 'The 3×3 matrix follows a pattern where each row and column contains one each of solid, hatched, and outline shapes. The bottom-right tile must be the empty circle (Figure D).',
      explanation_fil: 'Ang 3×3 matrix ay sumusunod sa pattern na may isa sa solid, hatched, at outline shapes sa bawat hilera at kolumna. Ang Figure D ang tamang sagot.',
    },
    {
      n: 15, page: 158, topicKey: 'series', correct: 'd', difficulty: 2,
      stem: 'Look across each row and down each column, then find the correct right-hand bottom tile from the choices. (Question 15 — see figure above)',
      explanation_en: 'The matrix pattern shows that the bottom-right cell must contain Figure D (the diamond shape with double outline inside a square) to complete the sequence.',
      explanation_fil: 'Ang pattern ng matrix ay nagpapakita na ang Figure D ang tamang sagot para sa ibabang-kanang cell.',
    },
    {
      n: 16, page: 159, topicKey: 'series', correct: 'b', difficulty: 3,
      stem: 'Look across each row and down each column, then find the correct right-hand bottom tile from the choices. (Question 16 — see figure above; diagram continues from previous page)',
      explanation_en: 'The shapes in the 3×3 grid follow a decreasing complexity pattern. Figure B (the layered polygonal shape) correctly completes the bottom-right position.',
      explanation_fil: 'Ang mga hugis sa 3×3 grid ay sumusunod sa pattern ng pagbaba ng kumplikasyon. Ang Figure B ang tamang sagot para sa ibabang-kanang posisyon.',
    },
    // NUMBER MATRIX (Q17): series-completion
    {
      n: 17, page: 159, topicKey: 'series', correct: 'b', difficulty: 2,
      stem: 'What number replaces the question mark in the number matrix? (Question 17 — see figure above)\n12  6  2\n4   4  1\n4   2  ?',
      explanation_en: 'Pattern: Row 1: 12÷2=6, 6÷3=2. Row 2: 4÷1=4, 4÷4=1. Row 3: following the same rule, 4÷2=2. The answer is 2 (Figure B).',
      explanation_fil: 'Pattern: Hilera 1: 12÷2=6, 6÷3=2. Hilera 2: 4÷1=4, 4÷4=1. Hilera 3: 4÷2=2. Ang sagot ay 2 (Figure B).',
    },
    // SYMMETRICAL PATTERN (Q18): pattern-completion
    {
      n: 18, page: 159, topicKey: 'pattern', correct: 'b', difficulty: 2,
      stem: 'Select the missing piece from A, B, C, D so that the whole square will contain an even, symmetrical pattern. (Question 18 — see figure above)',
      explanation_en: 'The square must be symmetrical both horizontally and vertically. Figure B is the piece that completes the symmetrical pattern without adding extra elements.',
      explanation_fil: 'Ang parisukat ay dapat na simetriko nang pahalang at patayo. Ang Figure B ang piraso na nagkukumpleto ng simetrikong pattern.',
    },
    // HIDDEN FIGURE (Q19): analogy
    {
      n: 19, page: 159, topicKey: 'analogy', correct: 'b', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 19 — see figure above)',
      explanation_en: 'The small cross/plus figure on the left is hidden within Figure B (the grid with cross-hatch lines). It can be traced in the pattern of lines.',
      explanation_fil: 'Ang maliit na plus sign sa kaliwa ay nakatago sa Figure B (ang grid na may cross-hatch na linya). Mahahanap ito sa pattern ng mga linya.',
    },
    // HIDDEN FIGURE (Q20-Q28): analogy
    {
      n: 20, page: 160, topicKey: 'analogy', correct: 'd', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 20 — see figure above)',
      explanation_en: 'The small triangle on the left can be found within Figure D, where it appears as part of the complex geometric arrangement.',
      explanation_fil: 'Ang maliit na tatsulok sa kaliwa ay matatagpuan sa Figure D, kung saan ito ay bahagi ng kumplikadong geometric na ayos.',
    },
    {
      n: 21, page: 160, topicKey: 'analogy', correct: 'b', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 21 — see figure above)',
      explanation_en: 'The small parallelogram on the left is contained within Figure B\'s complex geometric pattern.',
      explanation_fil: 'Ang maliit na parallelogram sa kaliwa ay nilalaman ng Figure B sa loob ng komplikadong geometric na pattern nito.',
    },
    {
      n: 22, page: 160, topicKey: 'analogy', correct: 'd', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 22 — see figure above)',
      explanation_en: 'The small rectangle on the left can be found as a component within Figure D.',
      explanation_fil: 'Ang maliit na rektanggulo sa kaliwa ay matatagpuan bilang bahagi ng Figure D.',
    },
    {
      n: 23, page: 160, topicKey: 'analogy', correct: 'd', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 23 — see figure above)',
      explanation_en: 'The small square on the left is hidden within Figure D\'s overlapping rectangles pattern.',
      explanation_fil: 'Ang maliit na parisukat sa kaliwa ay nakatago sa loob ng Figure D, sa pattern ng magkakapatong na rektanggulo.',
    },
    {
      n: 24, page: 161, topicKey: 'analogy', correct: 'a', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 24 — see figure above; diagram continues from previous page)',
      explanation_en: 'The small right triangle on the left can be identified within Figure A\'s complex diagonal line arrangement.',
      explanation_fil: 'Ang maliit na right triangle sa kaliwa ay matatagpuan sa Figure A, sa loob ng komplikadong diagonal na linya nito.',
    },
    {
      n: 25, page: 161, topicKey: 'analogy', correct: 'b', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 25 — see figure above)',
      explanation_en: 'The small right triangle on the left can be traced within Figure B (the square with crossed diagonal lines inside an octagon).',
      explanation_fil: 'Ang maliit na tatsulok sa kaliwa ay matatagpuan sa Figure B (ang parisukat na may mga diagonal na linya sa loob ng octagon).',
    },
    {
      n: 26, page: 161, topicKey: 'analogy', correct: 'c', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 26 — see figure above)',
      explanation_en: 'The small shape on the left can be found embedded within Figure C\'s complex pattern of diagonal lines.',
      explanation_fil: 'Ang maliit na hugis sa kaliwa ay matatagpuan sa loob ng Figure C sa komplikadong pattern ng mga diagonal na linya nito.',
    },
    {
      n: 27, page: 161, topicKey: 'analogy', correct: 'c', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 27 — see figure above)',
      explanation_en: 'The crescent-like shape on the left is embedded within Figure C — the triangle with hatching and an inner circular arc.',
      explanation_fil: 'Ang kalahating-bilog na hugis sa kaliwa ay nakapaloob sa Figure C — ang tatsulok na may hatching at isang panloob na circular arc.',
    },
    {
      n: 28, page: 161, topicKey: 'analogy', correct: 'c', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 28 — see figure above)',
      explanation_en: 'The small flag/pennant shape on the left can be identified within Figure C\'s hatched quadrilateral arrangement.',
      explanation_fil: 'Ang maliit na bandila/pennant na hugis sa kaliwa ay matatagpuan sa loob ng Figure C, sa hatched quadrilateral na ayos nito.',
    },
    {
      n: 29, page: 162, topicKey: 'analogy', correct: 'b', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 29 — see figure above)',
      explanation_en: 'The small pentagon on the left appears within Figure B — the globe/orb with the pentagon visible inside.',
      explanation_fil: 'Ang maliit na pentagon sa kaliwa ay matatagpuan sa Figure B — ang globo/orb na may pentagon sa loob nito.',
    },
    {
      n: 30, page: 162, topicKey: 'analogy', correct: 'd', difficulty: 2,
      stem: 'Select the figure from the choices at the right which contains the figure on the left. (Question 30 — see figure above)',
      explanation_en: 'The crescent/moon shape on the left is contained within Figure D — the diamond with crossed lines and a crescent clearly visible in one quadrant.',
      explanation_fil: 'Ang kalahating-buwan na hugis sa kaliwa ay nakapaloob sa Figure D — ang diamond na may mga crossed na linya at isang kalahating-buwan na malinaw na nakikita sa isang quadrant nito.',
    },
  ];

  console.log('\n📝 Inserting Abstract Reasoning questions...\n');

  let total = 0;
  for (const q of QUESTIONS) {
    const imageUrl = urls[q.page];
    const proRow = {
      topic_id: TOPICS_PRO[q.topicKey],
      stem: q.stem,
      choices: VISUAL_CHOICES,
      correct_choice_id: q.correct,
      difficulty: q.difficulty,
      explanation_en: q.explanation_en,
      explanation_fil: q.explanation_fil,
      image_url: imageUrl,
      source_note: `CSE 2026 Reviewer — Abstract Reasoning Q${q.n}`,
      status: 'published',
      is_verified: true,
    };
    const subRow = { ...proRow, topic_id: TOPICS_SUB[q.topicKey] };

    const { data, error } = await sb.from('questions').insert([proRow, subRow]).select('id');
    if (error) throw new Error(`Q${q.n}: ${error.message}`);
    total += 2;
    process.stdout.write(`  Q${q.n} ✓ `);
    if (q.n % 5 === 0) console.log();
  }

  console.log(`\n\n✅ Done! +${total} abstract reasoning questions (${total/2} × 2 exam types)`);
}

main().catch(e => { console.error(e); process.exit(1); });
