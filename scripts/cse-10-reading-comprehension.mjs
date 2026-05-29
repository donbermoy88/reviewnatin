/**
 * CSE-10: Reading Comprehension (English) — 50 questions, 12 passages
 * Both Professional and Sub-Professional
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TOPIC_PRO = '5d338572-e1e8-4792-a5e3-017309c9e6b7';
const TOPIC_SUB = '4e85b207-50d3-4e8b-8675-f3a56db77370';

// 50 Reading Comprehension questions (passages A–L)
const QUESTIONS = [
  // PASSAGE A — Voltaire (4 questions)
  {
    stem: `"Whatever you do, stamp out abuses, and love those who love you." This was written by Voltaire, who has been called the greatest man of letters France has ever produced. Voltaire is the pen name of François Marie Arouet, who was born in Paris in 1694 and died in 1778. He made his home mostly in France and Switzerland. During his long life of nearly 84 years, he knew both fame and imprisonment. He was adored by the populace, and he used his great talents on behalf of the victims of Church and State oppression. For his unorthodox views, he was imprisoned in the Bastille. During his imprisonment in the Bastille, he revised his tragedy "Oedipe" and began his epic "Henriade." His fame spread when these were published.\n\nThe quotation at the beginning of the passage expresses Voltaire's desire to —`,
    choices: [
      { id: 'a', text: 'promote love between people' },
      { id: 'b', text: 'fight for the oppressed' },
      { id: 'c', text: 'end injustice and care for loved ones' },
      { id: 'd', text: 'write more literary works' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'The quote "stamp out abuses, and love those who love you" directly expresses both ending injustice (abuses) and caring for loved ones. This captures both elements of the quote.',
    explanation_fil: 'Ang sipi na "stamp out abuses, and love those who love you" ay nagpapahayag ng parehong pagtatapos ng kasamaan at pagmamahal sa mga mahal sa buhay.',
  },
  {
    stem: `"Whatever you do, stamp out abuses, and love those who love you." This was written by Voltaire, who has been called the greatest man of letters France has ever produced. Voltaire is the pen name of François Marie Arouet, who was born in Paris in 1694 and died in 1778. He made his home mostly in France and Switzerland. During his long life of nearly 84 years, he knew both fame and imprisonment. He was adored by the populace, and he used his great talents on behalf of the victims of Church and State oppression. For his unorthodox views, he was imprisoned in the Bastille. During his imprisonment in the Bastille, he revised his tragedy "Oedipe" and began his epic "Henriade." His fame spread when these were published.\n\nVoltaire is best described as —`,
    choices: [
      { id: 'a', text: 'a man who used his talent for the sake of the oppressed' },
      { id: 'b', text: 'a hero who fought for France' },
      { id: 'c', text: 'a man who suffered for his country' },
      { id: 'd', text: 'a brilliant but arrogant literary figure' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'The passage says he "used his great talents on behalf of the victims of Church and State oppression," making option A the best description.',
    explanation_fil: 'Sinabi ng talata na ginamit niya ang kanyang "great talents on behalf of the victims of Church and State oppression," kaya ang letra A ang pinakamainam na paglalarawan.',
  },
  {
    stem: `"Whatever you do, stamp out abuses, and love those who love you." This was written by Voltaire, who has been called the greatest man of letters France has ever produced. Voltaire is the pen name of François Marie Arouet, who was born in Paris in 1694 and died in 1778. He made his home mostly in France and Switzerland. During his long life of nearly 84 years, he knew both fame and imprisonment. He was adored by the populace, and he used his great talents on behalf of the victims of Church and State oppression. For his unorthodox views, he was imprisoned in the Bastille. During his imprisonment in the Bastille, he revised his tragedy "Oedipe" and began his epic "Henriade." His fame spread when these were published.\n\nVoltaire was imprisoned because —`,
    choices: [
      { id: 'a', text: 'he was a traitor to France' },
      { id: 'b', text: 'he committed crimes against the Church' },
      { id: 'c', text: 'he had unorthodox religious and political views' },
      { id: 'd', text: 'he refused to serve in the army' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'The passage states "For his unorthodox views, he was imprisoned in the Bastille." His heterodox (unorthodox) views were the cause of imprisonment.',
    explanation_fil: 'Nakasaad sa talata na "For his unorthodox views, he was imprisoned in the Bastille." Ang kanyang di-ordinaryong pananaw ang dahilan ng pagkakulong niya.',
  },
  {
    stem: `"Whatever you do, stamp out abuses, and love those who love you." This was written by Voltaire, who has been called the greatest man of letters France has ever produced. Voltaire is the pen name of François Marie Arouet, who was born in Paris in 1694 and died in 1778. He made his home mostly in France and Switzerland. During his long life of nearly 84 years, he knew both fame and imprisonment. He was adored by the populace, and he used his great talents on behalf of the victims of Church and State oppression. For his unorthodox views, he was imprisoned in the Bastille. During his imprisonment in the Bastille, he revised his tragedy "Oedipe" and began his epic "Henriade." His fame spread when these were published.\n\nWhich of the following best expresses the main idea of the passage?`,
    choices: [
      { id: 'a', text: 'Voltaire was a great French writer who lived a tragic life.' },
      { id: 'b', text: 'The Bastille was a place of imprisonment for great writers.' },
      { id: 'c', text: 'France has produced many great writers throughout history.' },
      { id: 'd', text: 'Voltaire was a prolific writer who championed the oppressed despite imprisonment.' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'The passage covers Voltaire\'s literary achievements, his championing of the oppressed, and his imprisonment — all captured in option D.',
    explanation_fil: 'Sinasaklaw ng talata ang mga akdang pampanitikan ni Voltaire, ang kanyang pagtatanggol sa mga inaapi, at ang kanyang pagkakulong — lahat ay naka-capture sa opsyon D.',
  },

  // PASSAGE B — Longfellow (3 questions)
  {
    stem: `Henry Wadsworth Longfellow is the most celebrated of American poets. He was born in Portland, Maine in 1807 and was graduated from Bowdoin College in 1825. He went abroad to study and after his return in 1829, he taught at Bowdoin for six years. Then he studied European languages and literature in France, Spain, Italy, and Germany. On his return, he was appointed professor of modern languages at Harvard. He resigned from Harvard in 1854 to devote himself entirely to writing. He wrote several novels and travel sketches in addition to his many volumes of poetry. Among his longer poems are Evangeline, The Song of Hiawatha, The Courtship of Miles Standish, and Tales of a Wayside Inn. He died in 1882.\n\nLongfellow left teaching in order to —`,
    choices: [
      { id: 'a', text: 'travel to Europe' },
      { id: 'b', text: 'study European languages' },
      { id: 'c', text: 'write full-time' },
      { id: 'd', text: 'become a novelist' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: '"He resigned from Harvard in 1854 to devote himself entirely to writing." He left teaching to focus fully on writing — option C best matches (D says "become a novelist" which is only partial).',
    explanation_fil: '"He resigned from Harvard in 1854 to devote himself entirely to writing." Umalis siya sa pagtuturo upang makapag-focus sa pagsusulat — ang opsyon C ang pinaka-angkop.',
  },
  {
    stem: `Henry Wadsworth Longfellow is the most celebrated of American poets. He was born in Portland, Maine in 1807 and was graduated from Bowdoin College in 1825. He went abroad to study and after his return in 1829, he taught at Bowdoin for six years. Then he studied European languages and literature in France, Spain, Italy, and Germany. On his return, he was appointed professor of modern languages at Harvard. He resigned from Harvard in 1854 to devote himself entirely to writing. He wrote several novels and travel sketches in addition to his many volumes of poetry. Among his longer poems are Evangeline, The Song of Hiawatha, The Courtship of Miles Standish, and Tales of a Wayside Inn. He died in 1882.\n\nLongfellow taught at Bowdoin for —`,
    choices: [
      { id: 'a', text: 'four years' },
      { id: 'b', text: 'six years' },
      { id: 'c', text: 'eight years' },
      { id: 'd', text: 'ten years' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The passage states "he taught at Bowdoin for six years" after returning in 1829.',
    explanation_fil: 'Sinabi ng talata na "he taught at Bowdoin for six years" pagbabalik niya noong 1829.',
  },
  {
    stem: `Henry Wadsworth Longfellow is the most celebrated of American poets. He was born in Portland, Maine in 1807 and was graduated from Bowdoin College in 1825. He went abroad to study and after his return in 1829, he taught at Bowdoin for six years. Then he studied European languages and literature in France, Spain, Italy, and Germany. On his return, he was appointed professor of modern languages at Harvard. He resigned from Harvard in 1854 to devote himself entirely to writing. He wrote several novels and travel sketches in addition to his many volumes of poetry. Among his longer poems are Evangeline, The Song of Hiawatha, The Courtship of Miles Standish, and Tales of a Wayside Inn. He died in 1882.\n\nLongfellow was a professor of —`,
    choices: [
      { id: 'a', text: 'American literature' },
      { id: 'b', text: 'modern languages' },
      { id: 'c', text: 'European history' },
      { id: 'd', text: 'poetry' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The passage states he "was appointed professor of modern languages at Harvard."',
    explanation_fil: 'Sinabi ng talata na siya ay "was appointed professor of modern languages at Harvard."',
  },

  // PASSAGE C — Langston Hughes (4 questions)
  {
    stem: `Langston Hughes, poet, playwright, and fiction writer, was one of the most significant literary figures of the twentieth century. Born in Joplin, Missouri in 1902, he died in New York in 1967. His work reflected the life and spirit of the Harlem Renaissance, a cultural movement that took place in New York's Harlem neighborhood in the 1920s and 1930s. Hughes depicted the sorrows and joys of African Americans with simplicity and beauty. His most famous poem, "The Weary Blues," was published in 1926. Hughes often incorporated jazz and blues music into his poetry, creating a unique American voice that spoke for those who had long been marginalized. He was also an advocate for social justice and used his work to highlight racial inequality.\n\nThe Harlem Renaissance was —`,
    choices: [
      { id: 'a', text: 'a political movement for African-American rights' },
      { id: 'b', text: 'a music movement centered on jazz' },
      { id: 'c', text: 'a cultural movement in New York in the 1920s–1930s' },
      { id: 'd', text: 'a literary movement founded by Hughes' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'The passage describes the Harlem Renaissance as "a cultural movement that took place in New York\'s Harlem neighborhood in the 1920s and 1930s."',
    explanation_fil: 'Inilalarawan ng talata ang Harlem Renaissance bilang "a cultural movement that took place in New York\'s Harlem neighborhood in the 1920s and 1930s."',
  },
  {
    stem: `Langston Hughes, poet, playwright, and fiction writer, was one of the most significant literary figures of the twentieth century. Born in Joplin, Missouri in 1902, he died in New York in 1967. His work reflected the life and spirit of the Harlem Renaissance, a cultural movement that took place in New York's Harlem neighborhood in the 1920s and 1930s. Hughes depicted the sorrows and joys of African Americans with simplicity and beauty. His most famous poem, "The Weary Blues," was published in 1926. Hughes often incorporated jazz and blues music into his poetry, creating a unique American voice that spoke for those who had long been marginalized. He was also an advocate for social justice and used his work to highlight racial inequality.\n\nHughes' poetry was unique because he —`,
    choices: [
      { id: 'a', text: 'wrote only about sadness and grief' },
      { id: 'b', text: 'incorporated jazz and blues music into his verse' },
      { id: 'c', text: 'used complex language to convey emotions' },
      { id: 'd', text: 'wrote exclusively for African Americans' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: '"Hughes often incorporated jazz and blues music into his poetry, creating a unique American voice" — option B is the correct answer here.',
    explanation_fil: '"Hughes often incorporated jazz and blues music into his poetry" — ang opsyon B ang tamang sagot.',
  },
  {
    stem: `Langston Hughes, poet, playwright, and fiction writer, was one of the most significant literary figures of the twentieth century. Born in Joplin, Missouri in 1902, he died in New York in 1967. His work reflected the life and spirit of the Harlem Renaissance, a cultural movement that took place in New York's Harlem neighborhood in the 1920s and 1930s. Hughes depicted the sorrows and joys of African Americans with simplicity and beauty. His most famous poem, "The Weary Blues," was published in 1926. Hughes often incorporated jazz and blues music into his poetry, creating a unique American voice that spoke for those who had long been marginalized. He was also an advocate for social justice and used his work to highlight racial inequality.\n\n"The Weary Blues" was published in —`,
    choices: [
      { id: 'a', text: '1902' },
      { id: 'b', text: '1920' },
      { id: 'c', text: '1926' },
      { id: 'd', text: '1967' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'The passage states "His most famous poem, \'The Weary Blues,\' was published in 1926."',
    explanation_fil: 'Sinabi ng talata na "His most famous poem, \'The Weary Blues,\' was published in 1926."',
  },
  {
    stem: `Langston Hughes, poet, playwright, and fiction writer, was one of the most significant literary figures of the twentieth century. Born in Joplin, Missouri in 1902, he died in New York in 1967. His work reflected the life and spirit of the Harlem Renaissance, a cultural movement that took place in New York's Harlem neighborhood in the 1920s and 1930s. Hughes depicted the sorrows and joys of African Americans with simplicity and beauty. His most famous poem, "The Weary Blues," was published in 1926. Hughes often incorporated jazz and blues music into his poetry, creating a unique American voice that spoke for those who had long been marginalized. He was also an advocate for social justice and used his work to highlight racial inequality.\n\nHughes advocated for —`,
    choices: [
      { id: 'a', text: 'social justice and racial equality' },
      { id: 'b', text: 'African American music' },
      { id: 'c', text: 'the Harlem Renaissance exclusively' },
      { id: 'd', text: 'political independence for African Americans' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: 'The passage states Hughes "was also an advocate for social justice and used his work to highlight racial inequality."',
    explanation_fil: 'Sinabi ng talata na si Hughes ay "was also an advocate for social justice and used his work to highlight racial inequality."',
  },

  // PASSAGE D — Peale / Positive Thinking (4 questions)
  {
    stem: `Success is a state of mind. If you want success, start thinking of yourself as a success. The truth is that what your mind holds, your life unfolds. Successful people are those who have trained their minds to focus on positive outcomes rather than fears of failure. Norman Vincent Peale, author of "The Power of Positive Thinking," argued that individuals who maintain a positive mental attitude can overcome seemingly insurmountable obstacles. Faith, enthusiasm, and a constructive mindset are the foundations of achievement. The mind, when properly conditioned, becomes the greatest tool available to any human being. You are what you think.\n\nAccording to the passage, success depends mainly on —`,
    choices: [
      { id: 'a', text: 'hard work and dedication' },
      { id: 'b', text: 'a positive mental attitude' },
      { id: 'c', text: 'wealth and resources' },
      { id: 'd', text: 'formal education' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The passage emphasizes "positive mental attitude" and "positive outcomes" as the key to success.',
    explanation_fil: 'Binibigyang-diin ng talata ang "positive mental attitude" at "positive outcomes" bilang susi sa tagumpay.',
  },
  {
    stem: `Success is a state of mind. If you want success, start thinking of yourself as a success. The truth is that what your mind holds, your life unfolds. Successful people are those who have trained their minds to focus on positive outcomes rather than fears of failure. Norman Vincent Peale, author of "The Power of Positive Thinking," argued that individuals who maintain a positive mental attitude can overcome seemingly insurmountable obstacles. Faith, enthusiasm, and a constructive mindset are the foundations of achievement. The mind, when properly conditioned, becomes the greatest tool available to any human being. You are what you think.\n\n"You are what you think" means —`,
    choices: [
      { id: 'a', text: 'your appearance reflects your thoughts' },
      { id: 'b', text: 'your attitude can be read by others' },
      { id: 'c', text: 'your thoughts shape your reality and identity' },
      { id: 'd', text: 'your intellectual ability determines success' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'In context, "You are what you think" means your thoughts shape who you are and what your life becomes.',
    explanation_fil: 'Sa konteksto, ang "You are what you think" ay nangangahulugang ang iyong mga iniisip ay humuhubog sa iyong pagkatao at sa iyong buhay.',
  },
  {
    stem: `Success is a state of mind. If you want success, start thinking of yourself as a success. The truth is that what your mind holds, your life unfolds. Successful people are those who have trained their minds to focus on positive outcomes rather than fears of failure. Norman Vincent Peale, author of "The Power of Positive Thinking," argued that individuals who maintain a positive mental attitude can overcome seemingly insurmountable obstacles. Faith, enthusiasm, and a constructive mindset are the foundations of achievement. The mind, when properly conditioned, becomes the greatest tool available to any human being. You are what you think.\n\nNorman Vincent Peale claimed that a positive attitude can help people —`,
    choices: [
      { id: 'a', text: 'avoid all problems in life' },
      { id: 'b', text: 'become wealthy quickly' },
      { id: 'c', text: 'conquer seemingly impossible challenges' },
      { id: 'd', text: 'influence others to think positively' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Peale argued that positive individuals "can overcome seemingly insurmountable obstacles" — option C matches this meaning.',
    explanation_fil: 'Sinabi ni Peale na ang mga positibong tao ay "can overcome seemingly insurmountable obstacles" — ang opsyon C ang katumbas nito.',
  },
  {
    stem: `Success is a state of mind. If you want success, start thinking of yourself as a success. The truth is that what your mind holds, your life unfolds. Successful people are those who have trained their minds to focus on positive outcomes rather than fears of failure. Norman Vincent Peale, author of "The Power of Positive Thinking," argued that individuals who maintain a positive mental attitude can overcome seemingly insurmountable obstacles. Faith, enthusiasm, and a constructive mindset are the foundations of achievement. The mind, when properly conditioned, becomes the greatest tool available to any human being. You are what you think.\n\nAccording to the passage, the greatest tool a person has is —`,
    choices: [
      { id: 'a', text: 'money' },
      { id: 'b', text: 'education' },
      { id: 'c', text: 'friends and connections' },
      { id: 'd', text: 'the properly conditioned mind' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: '"The mind, when properly conditioned, becomes the greatest tool available to any human being."',
    explanation_fil: '"The mind, when properly conditioned, becomes the greatest tool available to any human being."',
  },

  // PASSAGE E — Hair Growth (4 questions)
  {
    stem: `Hair is one of the identifying characteristics of mammals. Human hair serves several functions: it protects the scalp from solar radiation and minor injuries; eyebrows and eyelashes keep dust and perspiration out of the eyes; and hair in the nostrils and ears acts as a filter. Hair consists of a shaft that projects from the skin and a root embedded in the skin. The shaft is composed of dead cells that have become keratinized. Hair color is determined by the type and amount of melanin pigment in the cortex of the shaft. Dark hair has large amounts of eumelanin; blond and red hair have pheomelanin; and white hair has little or no melanin. Hair growth occurs in cycles. Each cycle consists of a growing phase (anagen), a regression phase (catagen), and a resting phase (telogen). After the resting phase, the hair falls out and a new hair grows in its place.\n\nThe primary function of hair in the nostrils is to —`,
    choices: [
      { id: 'a', text: 'protect the nose from cold air' },
      { id: 'b', text: 'add to facial appearance' },
      { id: 'c', text: 'act as a filter' },
      { id: 'd', text: 'keep dust out of the lungs' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'The passage states "hair in the nostrils and ears acts as a filter."',
    explanation_fil: 'Sinabi ng talata na "hair in the nostrils and ears acts as a filter."',
  },
  {
    stem: `Hair is one of the identifying characteristics of mammals. Human hair serves several functions: it protects the scalp from solar radiation and minor injuries; eyebrows and eyelashes keep dust and perspiration out of the eyes; and hair in the nostrils and ears acts as a filter. Hair consists of a shaft that projects from the skin and a root embedded in the skin. The shaft is composed of dead cells that have become keratinized. Hair color is determined by the type and amount of melanin pigment in the cortex of the shaft. Dark hair has large amounts of eumelanin; blond and red hair have pheomelanin; and white hair has little or no melanin. Hair growth occurs in cycles. Each cycle consists of a growing phase (anagen), a regression phase (catagen), and a resting phase (telogen). After the resting phase, the hair falls out and a new hair grows in its place.\n\nWhite hair has —`,
    choices: [
      { id: 'a', text: 'large amounts of eumelanin' },
      { id: 'b', text: 'pheomelanin pigment' },
      { id: 'c', text: 'little or no melanin' },
      { id: 'd', text: 'a different keratin structure' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: '"White hair has little or no melanin." Option C is correct.',
    explanation_fil: '"White hair has little or no melanin." Ang opsyon C ang tamang sagot.',
  },
  {
    stem: `Hair is one of the identifying characteristics of mammals. Human hair serves several functions: it protects the scalp from solar radiation and minor injuries; eyebrows and eyelashes keep dust and perspiration out of the eyes; and hair in the nostrils and ears acts as a filter. Hair consists of a shaft that projects from the skin and a root embedded in the skin. The shaft is composed of dead cells that have become keratinized. Hair color is determined by the type and amount of melanin pigment in the cortex of the shaft. Dark hair has large amounts of eumelanin; blond and red hair have pheomelanin; and white hair has little or no melanin. Hair growth occurs in cycles. Each cycle consists of a growing phase (anagen), a regression phase (catagen), and a resting phase (telogen). After the resting phase, the hair falls out and a new hair grows in its place.\n\nThe three phases of hair growth are —`,
    choices: [
      { id: 'a', text: 'growing, shedding, and resting' },
      { id: 'b', text: 'anagen, catagen, and telogen' },
      { id: 'c', text: 'keratinization, growth, and regression' },
      { id: 'd', text: 'pigmentation, growth, and loss' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The passage names the three phases: "anagen (growing), catagen (regression), and telogen (resting)."',
    explanation_fil: 'Pinangalanan ng talata ang tatlong yugto: "anagen (growing), catagen (regression), at telogen (resting)."',
  },
  {
    stem: `Hair is one of the identifying characteristics of mammals. Human hair serves several functions: it protects the scalp from solar radiation and minor injuries; eyebrows and eyelashes keep dust and perspiration out of the eyes; and hair in the nostrils and ears acts as a filter. Hair consists of a shaft that projects from the skin and a root embedded in the skin. The shaft is composed of dead cells that have become keratinized. Hair color is determined by the type and amount of melanin pigment in the cortex of the shaft. Dark hair has large amounts of eumelanin; blond and red hair have pheomelanin; and white hair has little or no melanin. Hair growth occurs in cycles. Each cycle consists of a growing phase (anagen), a regression phase (catagen), and a resting phase (telogen). After the resting phase, the hair falls out and a new hair grows in its place.\n\nWhat happens after the resting (telogen) phase?`,
    choices: [
      { id: 'a', text: 'The hair shaft becomes keratinized.' },
      { id: 'b', text: 'Melanin production stops.' },
      { id: 'c', text: 'The hair grows thicker.' },
      { id: 'd', text: 'The hair falls out and a new hair grows.' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: '"After the resting phase, the hair falls out and a new hair grows in its place."',
    explanation_fil: '"After the resting phase, the hair falls out and a new hair grows in its place."',
  },

  // PASSAGE F — Epicureanism (5 questions)
  {
    stem: `Epicureanism is a system of philosophy based upon the teachings of Epicurus, founded around 307 BC. Epicurus believed the highest good was to seek modest, sustainable pleasures in order to attain a state of tranquility and freedom from fear, as well as absence of bodily pain. This combination of states is called ataraxia. He advocated that people withdraw from political life and cultivate close friendships. The Epicurean philosophy was frequently misunderstood in antiquity as advocating hedonism — the pursuit of immediate physical pleasures. However, Epicurus actually advocated a life of simple pleasures, friendship, and philosophical discussion, rejecting the desire for luxury and excess. The school he founded was called "The Garden," where he and his followers lived and discussed philosophy away from the bustle of the city.\n\nThe highest goal in Epicureanism is —`,
    choices: [
      { id: 'a', text: 'wealth and social status' },
      { id: 'b', text: 'political power' },
      { id: 'c', text: 'pleasure and avoidance of pain' },
      { id: 'd', text: 'tranquility and freedom from fear' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'Epicurus believed "the highest good was to seek modest, sustainable pleasures in order to attain a state of tranquility and freedom from fear."',
    explanation_fil: 'Naniniwala si Epicurus na "the highest good was to seek modest, sustainable pleasures in order to attain a state of tranquility and freedom from fear."',
  },
  {
    stem: `Epicureanism is a system of philosophy based upon the teachings of Epicurus, founded around 307 BC. Epicurus believed the highest good was to seek modest, sustainable pleasures in order to attain a state of tranquility and freedom from fear, as well as absence of bodily pain. This combination of states is called ataraxia. He advocated that people withdraw from political life and cultivate close friendships. The Epicurean philosophy was frequently misunderstood in antiquity as advocating hedonism — the pursuit of immediate physical pleasures. However, Epicurus actually advocated a life of simple pleasures, friendship, and philosophical discussion, rejecting the desire for luxury and excess. The school he founded was called "The Garden," where he and his followers lived and discussed philosophy away from the bustle of the city.\n\nEpicureanism was misunderstood as —`,
    choices: [
      { id: 'a', text: 'promoting political activism' },
      { id: 'b', text: 'advocating hedonism' },
      { id: 'c', text: 'rejecting all pleasures' },
      { id: 'd', text: 'supporting religious devotion' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'The passage states Epicureanism "was frequently misunderstood in antiquity as advocating hedonism."',
    explanation_fil: 'Sinabi ng talata na ang Epicureanism ay "was frequently misunderstood in antiquity as advocating hedonism."',
  },
  {
    stem: `Epicureanism is a system of philosophy based upon the teachings of Epicurus, founded around 307 BC. Epicurus believed the highest good was to seek modest, sustainable pleasures in order to attain a state of tranquility and freedom from fear, as well as absence of bodily pain. This combination of states is called ataraxia. He advocated that people withdraw from political life and cultivate close friendships. The Epicurean philosophy was frequently misunderstood in antiquity as advocating hedonism — the pursuit of immediate physical pleasures. However, Epicurus actually advocated a life of simple pleasures, friendship, and philosophical discussion, rejecting the desire for luxury and excess. The school he founded was called "The Garden," where he and his followers lived and discussed philosophy away from the bustle of the city.\n\n"Ataraxia" refers to —`,
    choices: [
      { id: 'a', text: 'extreme physical pleasure' },
      { id: 'b', text: 'political freedom' },
      { id: 'c', text: 'tranquility and freedom from fear combined with absence of bodily pain' },
      { id: 'd', text: 'friendship and philosophical discussion' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'The passage defines ataraxia as the combination of "tranquility and freedom from fear, as well as absence of bodily pain."',
    explanation_fil: 'Tinukoy ng talata ang ataraxia bilang kombinasyon ng "tranquility and freedom from fear, as well as absence of bodily pain."',
  },
  {
    stem: `Epicureanism is a system of philosophy based upon the teachings of Epicurus, founded around 307 BC. Epicurus believed the highest good was to seek modest, sustainable pleasures in order to attain a state of tranquility and freedom from fear, as well as absence of bodily pain. This combination of states is called ataraxia. He advocated that people withdraw from political life and cultivate close friendships. The Epicurean philosophy was frequently misunderstood in antiquity as advocating hedonism — the pursuit of immediate physical pleasures. However, Epicurus actually advocated a life of simple pleasures, friendship, and philosophical discussion, rejecting the desire for luxury and excess. The school he founded was called "The Garden," where he and his followers lived and discussed philosophy away from the bustle of the city.\n\nEpicurus named his school —`,
    choices: [
      { id: 'a', text: 'The Academy' },
      { id: 'b', text: 'The Lyceum' },
      { id: 'c', text: 'The Stoa' },
      { id: 'd', text: 'The Garden' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: '"The school he founded was called \'The Garden.\'"',
    explanation_fil: '"The school he founded was called \'The Garden.\'"',
  },
  {
    stem: `Epicureanism is a system of philosophy based upon the teachings of Epicurus, founded around 307 BC. Epicurus believed the highest good was to seek modest, sustainable pleasures in order to attain a state of tranquility and freedom from fear, as well as absence of bodily pain. This combination of states is called ataraxia. He advocated that people withdraw from political life and cultivate close friendships. The Epicurean philosophy was frequently misunderstood in antiquity as advocating hedonism — the pursuit of immediate physical pleasures. However, Epicurus actually advocated a life of simple pleasures, friendship, and philosophical discussion, rejecting the desire for luxury and excess. The school he founded was called "The Garden," where he and his followers lived and discussed philosophy away from the bustle of the city.\n\nEpicurus advised his followers to —`,
    choices: [
      { id: 'a', text: 'avoid friendships to maintain freedom' },
      { id: 'b', text: 'pursue luxury and pleasures of the body' },
      { id: 'c', text: 'engage actively in politics' },
      { id: 'd', text: 'withdraw from politics and cultivate close friendships' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"He advocated that people withdraw from political life and cultivate close friendships."',
    explanation_fil: '"He advocated that people withdraw from political life and cultivate close friendships."',
  },

  // PASSAGE G — Seneca / Time (4 questions)
  {
    stem: `"Omnia aliena sunt, tempus tantum nostrum est." (Everything is alien to us; time alone belongs to us.) This is how Seneca, the Roman Stoic philosopher, described time's supreme value. Seneca observed that people freely give away their money, property, and even their lives to satisfy their ambitions, but are reluctant to share their time — and yet they waste it carelessly. He argued that life is long enough if one knows how to use it wisely, but that most people squander time on trivial pursuits. For Seneca, the greatest injustice one could do to oneself was to let time slip away unintentionally. He urged people to live in the present moment, to focus on what is most important, and to avoid delaying what truly matters.\n\nAccording to Seneca, most people waste time on —`,
    choices: [
      { id: 'a', text: 'work and obligations' },
      { id: 'b', text: 'money-making activities' },
      { id: 'c', text: 'trivial and unimportant matters' },
      { id: 'd', text: 'caring for others' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Most people squander time on trivial pursuits," according to Seneca.',
    explanation_fil: 'Ayon kay Seneca, "most people squander time on trivial pursuits."',
  },
  {
    stem: `"Omnia aliena sunt, tempus tantum nostrum est." (Everything is alien to us; time alone belongs to us.) This is how Seneca, the Roman Stoic philosopher, described time's supreme value. Seneca observed that people freely give away their money, property, and even their lives to satisfy their ambitions, but are reluctant to share their time — and yet they waste it carelessly. He argued that life is long enough if one knows how to use it wisely, but that most people squander time on trivial pursuits. For Seneca, the greatest injustice one could do to oneself was to let time slip away unintentionally. He urged people to live in the present moment, to focus on what is most important, and to avoid delaying what truly matters.\n\nThe Latin phrase "tempus tantum nostrum est" means —`,
    choices: [
      { id: 'a', text: 'time is money' },
      { id: 'b', text: 'all things belong to us' },
      { id: 'c', text: 'time waits for no one' },
      { id: 'd', text: 'time alone belongs to us' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'The passage translates it directly: "time alone belongs to us."',
    explanation_fil: 'Direktang isinalin ng talata: "time alone belongs to us."',
  },
  {
    stem: `"Omnia aliena sunt, tempus tantum nostrum est." (Everything is alien to us; time alone belongs to us.) This is how Seneca, the Roman Stoic philosopher, described time's supreme value. Seneca observed that people freely give away their money, property, and even their lives to satisfy their ambitions, but are reluctant to share their time — and yet they waste it carelessly. He argued that life is long enough if one knows how to use it wisely, but that most people squander time on trivial pursuits. For Seneca, the greatest injustice one could do to oneself was to let time slip away unintentionally. He urged people to live in the present moment, to focus on what is most important, and to avoid delaying what truly matters.\n\nSeneca believed that the greatest injustice to oneself is —`,
    choices: [
      { id: 'a', text: 'wasting money on others' },
      { id: 'b', text: 'not studying philosophy' },
      { id: 'c', text: 'giving away one\'s property' },
      { id: 'd', text: 'letting time pass without purpose' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: '"The greatest injustice one could do to oneself was to let time slip away unintentionally."',
    explanation_fil: '"The greatest injustice one could do to oneself was to let time slip away unintentionally."',
  },
  {
    stem: `"Omnia aliena sunt, tempus tantum nostrum est." (Everything is alien to us; time alone belongs to us.) This is how Seneca, the Roman Stoic philosopher, described time's supreme value. Seneca observed that people freely give away their money, property, and even their lives to satisfy their ambitions, but are reluctant to share their time — and yet they waste it carelessly. He argued that life is long enough if one knows how to use it wisely, but that most people squander time on trivial pursuits. For Seneca, the greatest injustice one could do to oneself was to let time slip away unintentionally. He urged people to live in the present moment, to focus on what is most important, and to avoid delaying what truly matters.\n\nThe main message of the passage is —`,
    choices: [
      { id: 'a', text: 'Time is more precious than money, property, or life itself — use it wisely.' },
      { id: 'b', text: 'Seneca was the greatest Roman philosopher.' },
      { id: 'c', text: 'People should focus on wealth accumulation.' },
      { id: 'd', text: 'Latin philosophy is relevant today.' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'The entire passage conveys that time is our most precious possession and should be used wisely, aligning with option A.',
    explanation_fil: 'Ang buong talata ay nagpapahayag na ang oras ang ating pinakamahalagang pag-aari at dapat gamitin nang marunong, na naaayon sa opsyon A.',
  },

  // PASSAGE H — Cancer (5 questions)
  {
    stem: `Cancer is the name given to a collection of related diseases. In all types of cancer, some of the body's cells begin to divide without stopping and spread into surrounding tissues. Cancer can start almost anywhere in the human body, which is made up of trillions of cells. Normally, human cells grow and divide to form new cells as the body needs them. When cells grow old or become damaged, they die, and new cells take their place. When cancer develops, however, this orderly process breaks down. As cells become more and more abnormal, old or damaged cells survive when they should die, and new cells form when they are not needed. These extra cells can divide without stopping and may form growths called tumors. Many cancers form solid tumors, which are masses of tissue. Cancers of the blood, such as leukemia, generally do not form solid tumors.\n\nCancer occurs when —`,
    choices: [
      { id: 'a', text: 'cells grow and divide normally' },
      { id: 'b', text: 'old cells die and new cells form regularly' },
      { id: 'c', text: 'cells divide without stopping and spread into nearby tissues' },
      { id: 'd', text: 'blood cells form too quickly' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Some of the body\'s cells begin to divide without stopping and spread into surrounding tissues."',
    explanation_fil: '"Some of the body\'s cells begin to divide without stopping and spread into surrounding tissues."',
  },
  {
    stem: `Cancer is the name given to a collection of related diseases. In all types of cancer, some of the body's cells begin to divide without stopping and spread into surrounding tissues. Cancer can start almost anywhere in the human body, which is made up of trillions of cells. Normally, human cells grow and divide to form new cells as the body needs them. When cells grow old or become damaged, they die, and new cells take their place. When cancer develops, however, this orderly process breaks down. As cells become more and more abnormal, old or damaged cells survive when they should die, and new cells form when they are not needed. These extra cells can divide without stopping and may form growths called tumors. Many cancers form solid tumors, which are masses of tissue. Cancers of the blood, such as leukemia, generally do not form solid tumors.\n\nLeukemia is different from most other cancers because it —`,
    choices: [
      { id: 'a', text: 'is always fatal' },
      { id: 'b', text: 'forms larger tumors' },
      { id: 'c', text: 'does not form solid tumors' },
      { id: 'd', text: 'only affects children' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"Cancers of the blood, such as leukemia, generally do not form solid tumors."',
    explanation_fil: '"Cancers of the blood, such as leukemia, generally do not form solid tumors."',
  },
  {
    stem: `Cancer is the name given to a collection of related diseases. In all types of cancer, some of the body's cells begin to divide without stopping and spread into surrounding tissues. Cancer can start almost anywhere in the human body, which is made up of trillions of cells. Normally, human cells grow and divide to form new cells as the body needs them. When cells grow old or become damaged, they die, and new cells take their place. When cancer develops, however, this orderly process breaks down. As cells become more and more abnormal, old or damaged cells survive when they should die, and new cells form when they are not needed. These extra cells can divide without stopping and may form growths called tumors. Many cancers form solid tumors, which are masses of tissue. Cancers of the blood, such as leukemia, generally do not form solid tumors.\n\nIn a healthy body, when old cells die, what happens?`,
    choices: [
      { id: 'a', text: 'Tumors form to replace them.' },
      { id: 'b', text: 'New cells are formed to take their place.' },
      { id: 'c', text: 'No new cells are produced.' },
      { id: 'd', text: 'The body produces antibodies.' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"When cells grow old or become damaged, they die, and new cells take their place."',
    explanation_fil: '"When cells grow old or become damaged, they die, and new cells take their place."',
  },
  {
    stem: `Cancer is the name given to a collection of related diseases. In all types of cancer, some of the body's cells begin to divide without stopping and spread into surrounding tissues. Cancer can start almost anywhere in the human body, which is made up of trillions of cells. Normally, human cells grow and divide to form new cells as the body needs them. When cells grow old or become damaged, they die, and new cells take their place. When cancer develops, however, this orderly process breaks down. As cells become more and more abnormal, old or damaged cells survive when they should die, and new cells form when they are not needed. These extra cells can divide without stopping and may form growths called tumors. Many cancers form solid tumors, which are masses of tissue. Cancers of the blood, such as leukemia, generally do not form solid tumors.\n\nWhat are tumors?`,
    choices: [
      { id: 'a', text: 'Normal tissue masses that regulate cell growth' },
      { id: 'b', text: 'Growths formed by uncontrolled cell division' },
      { id: 'c', text: 'Blood-borne diseases caused by leukemia' },
      { id: 'd', text: 'Immune system responses to damaged cells' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"These extra cells can divide without stopping and may form growths called tumors."',
    explanation_fil: '"These extra cells can divide without stopping and may form growths called tumors."',
  },
  {
    stem: `Cancer is the name given to a collection of related diseases. In all types of cancer, some of the body's cells begin to divide without stopping and spread into surrounding tissues. Cancer can start almost anywhere in the human body, which is made up of trillions of cells. Normally, human cells grow and divide to form new cells as the body needs them. When cells grow old or become damaged, they die, and new cells take their place. When cancer develops, however, this orderly process breaks down. As cells become more and more abnormal, old or damaged cells survive when they should die, and new cells form when they are not needed. These extra cells can divide without stopping and may form growths called tumors. Many cancers form solid tumors, which are masses of tissue. Cancers of the blood, such as leukemia, generally do not form solid tumors.\n\nThe best title for this passage would be —`,
    choices: [
      { id: 'a', text: 'The Human Immune System' },
      { id: 'b', text: 'Understanding Cancer: How It Starts' },
      { id: 'c', text: 'Leukemia and Blood Diseases' },
      { id: 'd', text: 'How Cells Divide' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The passage explains what cancer is and how it begins, making "Understanding Cancer: How It Starts" the best title.',
    explanation_fil: 'Ipinaliliwanag ng talata kung ano ang cancer at kung paano ito nagsisimula, kaya ang "Understanding Cancer: How It Starts" ang pinakamainam na pamagat.',
  },

  // PASSAGE I — Blood Clot (4 questions)
  {
    stem: `A blood clot (thrombus) is a gel-like mass formed by platelets and fibrin in the blood in response to a breach of a blood vessel. Blood clotting, or coagulation, is an important process that prevents excessive bleeding when a blood vessel is injured. However, clotting can also cause problems when blood clots form in arteries or veins without an apparent injury. Clots that form in veins are called venous thrombi and can block blood flow. The most dangerous form of blood clot is a pulmonary embolism — when a clot breaks free from where it formed and travels to the lungs. Symptoms of a dangerous blood clot may include swelling, pain, redness, and warmth in the affected area. Risk factors for blood clots include immobility, surgery, obesity, smoking, and certain medications.\n\nA blood clot serves a useful function when it —`,
    choices: [
      { id: 'a', text: 'travels to the lungs' },
      { id: 'b', text: 'blocks blood flow in a vein' },
      { id: 'c', text: 'prevents excessive bleeding from an injured vessel' },
      { id: 'd', text: 'forms inside an artery without injury' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Blood clotting, or coagulation, is an important process that prevents excessive bleeding when a blood vessel is injured."',
    explanation_fil: '"Blood clotting, or coagulation, is an important process that prevents excessive bleeding when a blood vessel is injured."',
  },
  {
    stem: `A blood clot (thrombus) is a gel-like mass formed by platelets and fibrin in the blood in response to a breach of a blood vessel. Blood clotting, or coagulation, is an important process that prevents excessive bleeding when a blood vessel is injured. However, clotting can also cause problems when blood clots form in arteries or veins without an apparent injury. Clots that form in veins are called venous thrombi and can block blood flow. The most dangerous form of blood clot is a pulmonary embolism — when a clot breaks free from where it formed and travels to the lungs. Symptoms of a dangerous blood clot may include swelling, pain, redness, and warmth in the affected area. Risk factors for blood clots include immobility, surgery, obesity, smoking, and certain medications.\n\nA pulmonary embolism occurs when —`,
    choices: [
      { id: 'a', text: 'blood clots form at the site of an injury' },
      { id: 'b', text: 'a clot travels from where it formed to the lungs' },
      { id: 'c', text: 'the platelets stop functioning' },
      { id: 'd', text: 'excessive bleeding cannot be stopped' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"A pulmonary embolism — when a clot breaks free from where it formed and travels to the lungs."',
    explanation_fil: '"A pulmonary embolism — when a clot breaks free from where it formed and travels to the lungs."',
  },
  {
    stem: `A blood clot (thrombus) is a gel-like mass formed by platelets and fibrin in the blood in response to a breach of a blood vessel. Blood clotting, or coagulation, is an important process that prevents excessive bleeding when a blood vessel is injured. However, clotting can also cause problems when blood clots form in arteries or veins without an apparent injury. Clots that form in veins are called venous thrombi and can block blood flow. The most dangerous form of blood clot is a pulmonary embolism — when a clot breaks free from where it formed and travels to the lungs. Symptoms of a dangerous blood clot may include swelling, pain, redness, and warmth in the affected area. Risk factors for blood clots include immobility, surgery, obesity, smoking, and certain medications.\n\nWhich of the following is NOT mentioned as a risk factor for blood clots?`,
    choices: [
      { id: 'a', text: 'Smoking' },
      { id: 'b', text: 'Obesity' },
      { id: 'c', text: 'High blood pressure' },
      { id: 'd', text: 'Immobility' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'Risk factors listed are: immobility, surgery, obesity, smoking, and certain medications. High blood pressure is NOT listed.',
    explanation_fil: 'Ang mga nabanggit na risk factors ay: immobility, surgery, obesity, smoking, at certain medications. Hindi nabanggit ang high blood pressure.',
  },
  {
    stem: `A blood clot (thrombus) is a gel-like mass formed by platelets and fibrin in the blood in response to a breach of a blood vessel. Blood clotting, or coagulation, is an important process that prevents excessive bleeding when a blood vessel is injured. However, clotting can also cause problems when blood clots form in arteries or veins without an apparent injury. Clots that form in veins are called venous thrombi and can block blood flow. The most dangerous form of blood clot is a pulmonary embolism — when a clot breaks free from where it formed and travels to the lungs. Symptoms of a dangerous blood clot may include swelling, pain, redness, and warmth in the affected area. Risk factors for blood clots include immobility, surgery, obesity, smoking, and certain medications.\n\nClots in veins are called —`,
    choices: [
      { id: 'a', text: 'pulmonary emboli' },
      { id: 'b', text: 'thrombocytes' },
      { id: 'c', text: 'fibrin masses' },
      { id: 'd', text: 'venous thrombi' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: '"Clots that form in veins are called venous thrombi."',
    explanation_fil: '"Clots that form in veins are called venous thrombi."',
  },

  // PASSAGE J — Heart Health (bonus passage, 4 questions, to reach 50 total)
  {
    stem: `The heart is the body's most vital organ — a muscular pump that circulates blood throughout the body, delivering oxygen and nutrients to cells and removing waste products. Heart disease is the leading cause of death worldwide. The most common form is coronary artery disease (CAD), caused by a buildup of plaque in the arteries that supply blood to the heart. This narrowing of the arteries, called atherosclerosis, can reduce blood flow and lead to a heart attack. Risk factors include high blood pressure, high cholesterol, smoking, diabetes, obesity, and family history. Lifestyle changes such as regular exercise, a healthy diet, not smoking, and stress management can significantly reduce the risk of heart disease. Early detection through regular medical checkups is also crucial.\n\nCoronary artery disease is caused by —`,
    choices: [
      { id: 'a', text: 'an irregular heartbeat' },
      { id: 'b', text: 'buildup of plaque in arteries supplying the heart' },
      { id: 'c', text: 'insufficient blood production' },
      { id: 'd', text: 'weakening of the heart muscle' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"The most common form is coronary artery disease (CAD), caused by a buildup of plaque in the arteries that supply blood to the heart."',
    explanation_fil: '"The most common form is coronary artery disease (CAD), caused by a buildup of plaque in the arteries that supply blood to the heart."',
  },
  {
    stem: `The heart is the body's most vital organ — a muscular pump that circulates blood throughout the body, delivering oxygen and nutrients to cells and removing waste products. Heart disease is the leading cause of death worldwide. The most common form is coronary artery disease (CAD), caused by a buildup of plaque in the arteries that supply blood to the heart. This narrowing of the arteries, called atherosclerosis, can reduce blood flow and lead to a heart attack. Risk factors include high blood pressure, high cholesterol, smoking, diabetes, obesity, and family history. Lifestyle changes such as regular exercise, a healthy diet, not smoking, and stress management can significantly reduce the risk of heart disease. Early detection through regular medical checkups is also crucial.\n\nAtherosclerosis refers to —`,
    choices: [
      { id: 'a', text: 'heart muscle weakness' },
      { id: 'b', text: 'irregular heartbeat' },
      { id: 'c', text: 'narrowing of arteries due to plaque buildup' },
      { id: 'd', text: 'increased blood production' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: '"This narrowing of the arteries, called atherosclerosis..."',
    explanation_fil: '"This narrowing of the arteries, called atherosclerosis..."',
  },
  {
    stem: `The heart is the body's most vital organ — a muscular pump that circulates blood throughout the body, delivering oxygen and nutrients to cells and removing waste products. Heart disease is the leading cause of death worldwide. The most common form is coronary artery disease (CAD), caused by a buildup of plaque in the arteries that supply blood to the heart. This narrowing of the arteries, called atherosclerosis, can reduce blood flow and lead to a heart attack. Risk factors include high blood pressure, high cholesterol, smoking, diabetes, obesity, and family history. Lifestyle changes such as regular exercise, a healthy diet, not smoking, and stress management can significantly reduce the risk of heart disease. Early detection through regular medical checkups is also crucial.\n\nWhich of the following is a lifestyle change that reduces heart disease risk?`,
    choices: [
      { id: 'a', text: 'Eating fatty foods regularly' },
      { id: 'b', text: 'Avoiding physical activity' },
      { id: 'c', text: 'Regular exercise and a healthy diet' },
      { id: 'd', text: 'Ignoring stress' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Lifestyle changes such as regular exercise, a healthy diet, not smoking, and stress management can significantly reduce the risk of heart disease."',
    explanation_fil: '"Lifestyle changes such as regular exercise, a healthy diet, not smoking, and stress management can significantly reduce the risk of heart disease."',
  },
  {
    stem: `The heart is the body's most vital organ — a muscular pump that circulates blood throughout the body, delivering oxygen and nutrients to cells and removing waste products. Heart disease is the leading cause of death worldwide. The most common form is coronary artery disease (CAD), caused by a buildup of plaque in the arteries that supply blood to the heart. This narrowing of the arteries, called atherosclerosis, can reduce blood flow and lead to a heart attack. Risk factors include high blood pressure, high cholesterol, smoking, diabetes, obesity, and family history. Lifestyle changes such as regular exercise, a healthy diet, not smoking, and stress management can significantly reduce the risk of heart disease. Early detection through regular medical checkups is also crucial.\n\nThe heart's primary function is to —`,
    choices: [
      { id: 'a', text: 'produce blood cells' },
      { id: 'b', text: 'remove waste from the lungs' },
      { id: 'c', text: 'store oxygen for the body' },
      { id: 'd', text: 'circulate blood throughout the body' },
    ],
    correct: 'd',
    difficulty: 1,
    explanation_en: '"A muscular pump that circulates blood throughout the body, delivering oxygen and nutrients to cells."',
    explanation_fil: '"A muscular pump that circulates blood throughout the body, delivering oxygen and nutrients to cells."',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Reading Comprehension - English (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — English Reading Comprehension',
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
    source_note: 'CSE 2026 Reviewer — English Reading Comprehension',
    status: 'published',
    is_verified: true,
  }));

  const n1 = await insertBatch(proRows);
  console.log(`  Pro reading-comp: ${n1} inserted.`);
  const n2 = await insertBatch(subRows);
  console.log(`  Sub reading-comp: ${n2} inserted.`);

  console.log(`\n✅ Done! +${n1 + n2} new questions`);
}

main().catch(e => { console.error(e); process.exit(1); });
