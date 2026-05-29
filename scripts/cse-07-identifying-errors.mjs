/**
 * CSE Question Bank — Step 7: Identifying Errors (60 questions)
 * Topic: grammar — both CSE Professional and Sub-Professional
 * Source: CSE Reviewer 2026, pages 63–69
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Grammar topic IDs
const TOPIC_PRO = '90ba4b46-caf1-41bc-9039-1cfbc2e0baf1'; // CSE Pro verbal → grammar
const TOPIC_SUB = 'd5388143-2857-4f97-bb76-8dd02f42a982'; // CSE Sub verbal → grammar

async function insertBatch(rows) {
  const { error } = await sb.from('questions').insert(rows);
  if (error) { console.error('Insert error:', error.message); process.exit(1); }
}

/**
 * Each question: one of a/b/c/d is the erroneous portion; 'e' = no error.
 * The choices show the actual underlined text from the sentence.
 */
const QUESTIONS = [
  // ── Part 1: Subject-Verb Agreement (Philippine Government & Institutions) ──
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nNo one (a) were (b) happy (c) about the Mindanao crisis (d). No error (e).',
    choices: [
      { id: 'a', text: 'No one' },
      { id: 'b', text: 'were' },
      { id: 'c', text: 'happy' },
      { id: 'd', text: 'about the Mindanao crisis' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"No one" is singular and requires a singular verb. Change "were" → "was." Rule: Indefinite pronouns like no one, nobody, everyone, each always take singular verbs.',
    explanation_fil: 'Ang "No one" ay isahan at nangangailangan ng isahang pandiwa. Palitan ang "were" → "was." Panuntunan: Ang mga indefinite pronoun tulad ng no one, nobody, everyone, each ay laging gumagamit ng isahang pandiwa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe House of Representatives\' (a) decision to decrease (b) the budget for the Department of Education (c) was met with protests (d). No error (e).',
    choices: [
      { id: 'a', text: "The House of Representatives'" },
      { id: 'b', text: 'decision to decrease' },
      { id: 'c', text: 'the budget for the Department of Education' },
      { id: 'd', text: 'was met with protests' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 1,
    explanation_en: 'The sentence is grammatically correct. "Representatives\'" is the correct possessive form; the verb "was met" agrees with the singular subject "decision."',
    explanation_fil: 'Ang pangungusap ay tama sa gramatika. Ang "Representatives\'" ay tamang anyo ng possessive; ang pandiwa na "was met" ay nakaayon sa isahang paksa na "decision."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe Cabinet (a) regularly (b) meet (c) once a week (d). No error (e).',
    choices: [
      { id: 'a', text: 'The Cabinet' },
      { id: 'b', text: 'regularly' },
      { id: 'c', text: 'meet' },
      { id: 'd', text: 'once a week' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"The Cabinet" is a collective noun treated as singular in formal English. Change "meet" → "meets." Rule: Collective nouns (Cabinet, jury, committee) take singular verbs when acting as a unit.',
    explanation_fil: 'Ang "The Cabinet" ay isang collective noun na itinuturing na isahan sa pormal na Ingles. Palitan ang "meet" → "meets." Panuntunan: Ang mga collective noun (Cabinet, jury, committee) ay gumagamit ng isahang pandiwa kapag kumikilos bilang isang pangkat.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nBoth the Senators (a) and the Congressmen (b) legislates (c) laws (d). No error (e).',
    choices: [
      { id: 'a', text: 'Both the Senators' },
      { id: 'b', text: 'and the Congressmen' },
      { id: 'c', text: 'legislates' },
      { id: 'd', text: 'laws' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'When a compound subject is joined by "both...and," use a plural verb. Change "legislates" → "legislate."',
    explanation_fil: 'Kapag ang paksa ay pinagsama ng "both...and," gamitin ang maramihang pandiwa. Palitan ang "legislates" → "legislate."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe Philippine government (a) have (b) three branches of powers (c): the executive, the legislative and the judicial (d). No error (e).',
    choices: [
      { id: 'a', text: 'The Philippine government' },
      { id: 'b', text: 'have' },
      { id: 'c', text: 'three branches of powers' },
      { id: 'd', text: 'the executive, the legislative and the judicial' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Government" is a collective/singular noun. Change "have" → "has." The Philippine government is treated as a single entity.',
    explanation_fil: 'Ang "government" ay isahang pangngalan. Palitan ang "have" → "has." Ang pamahalaan ng Pilipinas ay itinuturing na isang entidad.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe Supreme Court upholds (a) the highest principles and standards (b) of morality (c) as embodied in the Constitution (d). No error (e).',
    choices: [
      { id: 'a', text: 'upholds' },
      { id: 'b', text: 'the highest principles and standards' },
      { id: 'c', text: 'of morality' },
      { id: 'd', text: 'as embodied in the Constitution' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 1,
    explanation_en: 'The sentence is grammatically correct. The verb "upholds" agrees with the singular subject "Supreme Court"; all other elements are used properly.',
    explanation_fil: 'Ang pangungusap ay tama sa gramatika. Ang pandiwa na "upholds" ay nakaayon sa isahang paksa na "Supreme Court"; ang lahat ng iba pang elemento ay tamang ginagamit.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nSome historians (a) contests (b) the origin (c) of the Filipino flag (d). No error (e).',
    choices: [
      { id: 'a', text: 'Some historians' },
      { id: 'b', text: 'contests' },
      { id: 'c', text: 'the origin' },
      { id: 'd', text: 'of the Filipino flag' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Some historians" is a plural subject. Change "contests" → "contest." Adding -s to a verb is for singular third-person subjects.',
    explanation_fil: 'Ang "Some historians" ay maramihang paksa. Palitan ang "contests" → "contest." Ang pagdaragdag ng -s sa pandiwa ay para sa isahang third-person na paksa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nSome believe (a) that the flag we use now (b) is not the same (c) as the one made by Marcela Agoncillo (d). No error (e).',
    choices: [
      { id: 'a', text: 'Some believe' },
      { id: 'b', text: 'the flag we use now' },
      { id: 'c', text: 'is not the same' },
      { id: 'd', text: 'as the one made by Marcela Agoncillo' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 1,
    explanation_en: 'The sentence is grammatically correct. "Some believe" (plural), "the flag...is" (singular), and the comparison structure are all proper.',
    explanation_fil: 'Ang pangungusap ay tama sa gramatika. Ang "Some believe" (maramihan), "the flag...is" (isahan), at ang istruktura ng paghahambing ay lahat tama.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nEither Prof. Teodoro Agoncillo (a) or Dr. Gregorio F. Zaide (b) affirm (c) the history of our flag (d). No error (e).',
    choices: [
      { id: 'a', text: 'Either Prof. Teodoro Agoncillo' },
      { id: 'b', text: 'or Dr. Gregorio F. Zaide' },
      { id: 'c', text: 'affirm' },
      { id: 'd', text: 'the history of our flag' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'With "either...or," the verb agrees with the subject closer to it. "Dr. Zaide" is singular, so change "affirm" → "affirms." This is the proximity rule.',
    explanation_fil: 'Sa "either...or," ang pandiwa ay nakaayon sa paksang pinakamalapit dito. Ang "Dr. Zaide" ay isahan, kaya palitan ang "affirm" → "affirms." Ito ang proximity rule.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe news (a) are (b) written immediately (c) to meet the previous deadline (d). No error (e).',
    choices: [
      { id: 'a', text: 'The news' },
      { id: 'b', text: 'are' },
      { id: 'c', text: 'written immediately' },
      { id: 'd', text: 'to meet the previous deadline' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"News" is a singular noun despite ending in -s (like mathematics, physics). Change "are" → "is."',
    explanation_fil: 'Ang "news" ay isahang pangngalan kahit nagtatapos sa -s (tulad ng mathematics, physics). Palitan ang "are" → "is."',
  },
  // ── Part 2: Subject-Verb Agreement (Books & Media) ──────────────────────
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nAttempts (a) is (b) made to locate and restore (c) the last original Filipino flag (d). No error (e).',
    choices: [
      { id: 'a', text: 'Attempts' },
      { id: 'b', text: 'is' },
      { id: 'c', text: 'made to locate and restore' },
      { id: 'd', text: 'the last original Filipino flag' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Attempts" is plural. Change "is" → "are." The verb must agree with the plural subject "Attempts."',
    explanation_fil: 'Ang "Attempts" ay maramihan. Palitan ang "is" → "are." Ang pandiwa ay dapat makaayon sa maramihang paksang "Attempts."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nBoth Chelle (a) and Charm (b) enjoys (c) reading (d). No error (e).',
    choices: [
      { id: 'a', text: 'Both Chelle' },
      { id: 'b', text: 'and Charm' },
      { id: 'c', text: 'enjoys' },
      { id: 'd', text: 'reading' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: '"Both Chelle and Charm" is a compound plural subject. Change "enjoys" → "enjoy."',
    explanation_fil: 'Ang "Both Chelle and Charm" ay maramihang compound na paksa. Palitan ang "enjoys" → "enjoy."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nReading books (a) widens (b) one\'s (c) horizons (d). No error (e).',
    choices: [
      { id: 'a', text: 'Reading books' },
      { id: 'b', text: 'widens' },
      { id: 'c', text: "one's" },
      { id: 'd', text: 'horizons' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 1,
    explanation_en: 'The sentence is correct. "Reading books" is a gerund phrase acting as a singular subject; "widens" (singular verb) is correct; "one\'s" is the correct possessive form.',
    explanation_fil: 'Ang pangungusap ay tama. Ang "Reading books" ay gerund phrase na kumikilos bilang isahang paksa; "widens" (isahang pandiwa) ay tama; ang "one\'s" ay tamang possessive form.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nIf everybody (a) know (b) how to read (c), then books will never cease to be useful (d). No error (e).',
    choices: [
      { id: 'a', text: 'If everybody' },
      { id: 'b', text: 'know' },
      { id: 'c', text: 'how to read' },
      { id: 'd', text: 'books will never cease to be useful' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Everybody" is a singular indefinite pronoun. Change "know" → "knows." Other indefinite pronouns that follow this rule: everyone, nobody, no one, someone.',
    explanation_fil: 'Ang "Everybody" ay isahang indefinite pronoun. Palitan ang "know" → "knows." Ibang mga indefinite pronoun na sumusunod sa panuntunang ito: everyone, nobody, no one, someone.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nNo one (a) dares to question (b) how invaluable (c) books are (d). No error (e).',
    choices: [
      { id: 'a', text: 'No one' },
      { id: 'b', text: 'dares to question' },
      { id: 'c', text: 'how invaluable' },
      { id: 'd', text: 'books are' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 1,
    explanation_en: 'The sentence is correct. "No one dares" (singular verb with singular pronoun) is proper, and "how invaluable books are" is a correct nominal clause.',
    explanation_fil: 'Ang pangungusap ay tama. Ang "No one dares" (isahang pandiwa sa isahang pronoun) ay tama, at ang "how invaluable books are" ay tamang nominal clause.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nGreat literary works (a) enriches (b) the vocabulary (c) of their readers (d). No error (e).',
    choices: [
      { id: 'a', text: 'Great literary works' },
      { id: 'b', text: 'enriches' },
      { id: 'c', text: 'the vocabulary' },
      { id: 'd', text: 'of their readers' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Literary works" is plural. Change "enriches" → "enrich." The plural subject requires a plural verb.',
    explanation_fil: 'Ang "literary works" ay maramihan. Palitan ang "enriches" → "enrich." Ang maramihang paksa ay nangangailangan ng maramihang pandiwa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nHave (a) either of (b) the books (c) been returned (d)? No error (e).',
    choices: [
      { id: 'a', text: 'Have' },
      { id: 'b', text: 'either of' },
      { id: 'c', text: 'the books' },
      { id: 'd', text: 'been returned' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: '"Either" is singular. Change "Have" → "Has." Rule: "either/neither" as subjects take singular verbs. The books is a prepositional phrase, not the subject.',
    explanation_fil: 'Ang "Either" ay isahan. Palitan ang "Have" → "Has." Panuntunan: Ang "either/neither" bilang paksa ay gumagamit ng isahang pandiwa. Ang "the books" ay prepositional phrase, hindi paksa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nOne hundred fifty pesos (a) are (b) the average selling price (c) of one textbook (d). No error (e).',
    choices: [
      { id: 'a', text: 'One hundred fifty pesos' },
      { id: 'b', text: 'are' },
      { id: 'c', text: 'the average selling price' },
      { id: 'd', text: 'of one textbook' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'When an amount of money is treated as a single sum, use a singular verb. Change "are" → "is." "One hundred fifty pesos" is viewed as one price.',
    explanation_fil: 'Kapag ang halaga ng pera ay itinuturing bilang isang kabuuang halaga, gamitin ang isahang pandiwa. Palitan ang "are" → "is." Ang "One hundred fifty pesos" ay itinuturing na isang presyo.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nOne of the machines (a) in the printing press (b) weren\'t (c) functioning properly (d). No error (e).',
    choices: [
      { id: 'a', text: 'One of the machines' },
      { id: 'b', text: 'in the printing press' },
      { id: 'c', text: "weren't" },
      { id: 'd', text: 'functioning properly' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"One" is the subject (not "machines"). Change "weren\'t" → "wasn\'t." Rule: With "one of the [plural noun]," the verb agrees with "one" (singular).',
    explanation_fil: 'Ang "One" ang paksa (hindi ang "machines"). Palitan ang "weren\'t" → "wasn\'t." Panuntunan: Sa "one of the [plural noun]," ang pandiwa ay nakaayon sa "one" (isahan).',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nEither the teachers (a) or the librarian (b), take care (c) of the books (d). No error (e).',
    choices: [
      { id: 'a', text: 'Either the teachers' },
      { id: 'b', text: 'or the librarian' },
      { id: 'c', text: 'take care' },
      { id: 'd', text: 'of the books' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'With "either...or," the verb agrees with the subject closer to it. "The librarian" is singular, so change "take" → "takes."',
    explanation_fil: 'Sa "either...or," ang pandiwa ay nakaayon sa paksang pinakamalapit dito. Ang "the librarian" ay isahan, kaya palitan ang "take" → "takes."',
  },
  // ── Part 3: More S-V Agreement & Pronoun Cases ──────────────────────────
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nA number of books (a) is (b) regularly donated (c) to public schools (d). No error (e).',
    choices: [
      { id: 'a', text: 'A number of books' },
      { id: 'b', text: 'is' },
      { id: 'c', text: 'regularly donated' },
      { id: 'd', text: 'to public schools' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"A number of" + plural noun takes a plural verb. Change "is" → "are." Note: "The number of" takes a singular verb, but "a number of" takes a plural verb.',
    explanation_fil: 'Ang "A number of" + maramihang pangngalan ay gumagamit ng maramihang pandiwa. Palitan ang "is" → "are." Tandaan: "The number of" ay gumagamit ng isahang pandiwa, ngunit "a number of" ay gumagamit ng maramihang pandiwa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe number of readers (a) continually (b) rise (c) each year (d). No error (e).',
    choices: [
      { id: 'a', text: 'The number of readers' },
      { id: 'b', text: 'continually' },
      { id: 'c', text: 'rise' },
      { id: 'd', text: 'each year' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"The number" is the singular subject. Change "rise" → "rises." Unlike "a number of," "the number of" takes a singular verb.',
    explanation_fil: 'Ang "The number" ang isahang paksa. Palitan ang "rise" → "rises." Hindi tulad ng "a number of," ang "the number of" ay gumagamit ng isahang pandiwa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nFor I (a), Reader\'s Digest (b) is informative (c) as well as entertaining (d). No error (e).',
    choices: [
      { id: 'a', text: 'For I' },
      { id: 'b', text: "Reader's Digest" },
      { id: 'c', text: 'is informative' },
      { id: 'd', text: 'as well as entertaining' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'After a preposition ("For"), use the objective (accusative) case. Change "I" → "me." Correct: "For me, Reader\'s Digest..."',
    explanation_fil: 'Pagkatapos ng preposisyon ("For"), gamitin ang objective (accusative) case. Palitan ang "I" → "me." Tama: "For me, Reader\'s Digest..."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe Manila Bulletin (a) has been published (b) the Panorama magazine (c) for over a hundred years (d). No error (e).',
    choices: [
      { id: 'a', text: 'The Manila Bulletin' },
      { id: 'b', text: 'has been published' },
      { id: 'c', text: 'the Panorama magazine' },
      { id: 'd', text: 'for over a hundred years' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'The Manila Bulletin is the publisher (active), not the one being published (passive). Change "has been published" → "has been publishing." Active voice is required.',
    explanation_fil: 'Ang Manila Bulletin ang publisher (aktibo), hindi ang isang nipa-publish (pasibo). Palitan ang "has been published" → "has been publishing." Kailangan ang active voice.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nAll children (a) has (b) inherent rights (c) that must be protected (d). No error (e).',
    choices: [
      { id: 'a', text: 'All children' },
      { id: 'b', text: 'has' },
      { id: 'c', text: 'inherent rights' },
      { id: 'd', text: 'that must be protected' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"All children" is plural. Change "has" → "have."',
    explanation_fil: 'Ang "All children" ay maramihan. Palitan ang "has" → "have."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe editor-in-chief (a), together with the writers (b), confers (c) about the contents of their newspapers (d). No error (e).',
    choices: [
      { id: 'a', text: 'The editor-in-chief' },
      { id: 'b', text: 'together with the writers' },
      { id: 'c', text: 'confers' },
      { id: 'd', text: 'the contents of their newspapers' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 2,
    explanation_en: 'The sentence is correct. "Together with the writers" is a parenthetical phrase—it does not change the singular subject "editor-in-chief," so "confers" is correct.',
    explanation_fil: 'Ang pangungusap ay tama. Ang "together with the writers" ay isang parenthetical phrase—hindi nito binabago ang isahang paksa na "editor-in-chief," kaya tama ang "confers."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nGorio and Tekla (a), in addition to Captain Barbel (b), was (c) popular comic strips during the \'70s (d). No error (e).',
    choices: [
      { id: 'a', text: 'Gorio and Tekla' },
      { id: 'b', text: 'in addition to Captain Barbel' },
      { id: 'c', text: 'was' },
      { id: 'd', text: "popular comic strips during the '70s" },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"Gorio and Tekla" is a compound subject (plural). Change "was" → "were." Note: "In addition to" is parenthetical and does not affect the subject.',
    explanation_fil: 'Ang "Gorio and Tekla" ay compound na paksa (maramihan). Palitan ang "was" → "were." Tandaan: Ang "In addition to" ay parenthetical at hindi nakakaapekto sa paksa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nPol Medina (a) has drew (b) the very famous (c) Pugad Baboy characters (d). No error (e).',
    choices: [
      { id: 'a', text: 'Pol Medina' },
      { id: 'b', text: 'has drew' },
      { id: 'c', text: 'the very famous' },
      { id: 'd', text: 'Pugad Baboy characters' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'In the present perfect, the past participle form must be used. "Drew" is simple past; change "has drew" → "has drawn."',
    explanation_fil: 'Sa present perfect, kailangan ang past participle form. Ang "drew" ay simple past; palitan ang "has drew" → "has drawn."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nPugad Baboy (a) first appear (b) in the Philippine Daily Inquirer (c) during the late \'80s (d). No error (e).',
    choices: [
      { id: 'a', text: 'Pugad Baboy' },
      { id: 'b', text: 'first appear' },
      { id: 'c', text: 'in the Philippine Daily Inquirer' },
      { id: 'd', text: "during the late '80s" },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'The event happened in the past. Change "appear" → "appeared." The time marker "during the late \'80s" requires simple past tense.',
    explanation_fil: 'Ang pangyayari ay naganap na sa nakaraan. Palitan ang "appear" → "appeared." Ang time marker na "during the late \'80s" ay nangangailangan ng simple past tense.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nNeither Pol Medina (a) nor his friends (b) he will become successful (c) thinks (d). No error (e).',
    choices: [
      { id: 'a', text: 'Neither Pol Medina' },
      { id: 'b', text: 'nor his friends' },
      { id: 'c', text: 'thinks' },
      { id: 'd', text: 'he will become successful' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'With "neither...nor," the verb agrees with the subject closer to it. "His friends" is plural, so change "thinks" → "think."',
    explanation_fil: 'Sa "neither...nor," ang pandiwa ay nakaayon sa paksang pinakamalapit dito. Ang "his friends" ay maramihan, kaya palitan ang "thinks" → "think."',
  },
  // ── Part 4: More Agreement & Verb Forms ─────────────────────────────────
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nSome believes (a) that Mr. Medina\'s works (b) satirize the socio-economic condition (c) of the people in our country (d). No error (e).',
    choices: [
      { id: 'a', text: 'Some believes' },
      { id: 'b', text: "Mr. Medina's works" },
      { id: 'c', text: 'satirize the socio-economic condition' },
      { id: 'd', text: 'of the people in our country' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: '"Some" as a subject (referring to people) is plural. Change "believes" → "believe." Correct: "Some believe that..."',
    explanation_fil: 'Ang "Some" bilang paksa (tumutukoy sa mga tao) ay maramihan. Palitan ang "believes" → "believe." Tama: "Some believe that..."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe youth delegates (a) have been (b) sang (c) the National Anthem (d). No error (e).',
    choices: [
      { id: 'a', text: 'The youth delegates' },
      { id: 'b', text: 'have been' },
      { id: 'c', text: 'sang' },
      { id: 'd', text: 'the National Anthem' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'The past participle is required after "have been." "Sang" is simple past; change "sang" → "singing" (active) or "sung" in a passive construction.',
    explanation_fil: 'Ang past participle ay kailangan pagkatapos ng "have been." Ang "sang" ay simple past; palitan ang "sang" → "singing" (aktibo) o "sung" sa passive construction.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThat house and lot (a) in the corner (b) are (c) government-owned (d). No error (e).',
    choices: [
      { id: 'a', text: 'That house and lot' },
      { id: 'b', text: 'in the corner' },
      { id: 'c', text: 'are' },
      { id: 'd', text: 'government-owned' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 2,
    explanation_en: 'The sentence is correct. "House and lot" as a compound subject takes the plural verb "are," which is grammatically proper.',
    explanation_fil: 'Ang pangungusap ay tama. Ang "house and lot" bilang compound na paksa ay gumagamit ng maramihang pandiwa na "are," na tama sa gramatika.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe number of socialized housing units (a) sponsored by the government (b) increases (c) each year (d). No error (e).',
    choices: [
      { id: 'a', text: 'The number of socialized housing units' },
      { id: 'b', text: 'sponsored by the government' },
      { id: 'c', text: 'increases' },
      { id: 'd', text: 'each year' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 2,
    explanation_en: 'The sentence is correct. "The number" is the singular subject; "increases" is the correct singular verb form.',
    explanation_fil: 'Ang pangungusap ay tama. Ang "The number" ang isahang paksa; ang "increases" ay tamang isahang anyo ng pandiwa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nA quarter of the government tax collections (a) goes (b) to infrastructure (c) projects (d). No error (e).',
    choices: [
      { id: 'a', text: 'A quarter of the government tax collections' },
      { id: 'b', text: 'goes' },
      { id: 'c', text: 'to infrastructure' },
      { id: 'd', text: 'projects' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'When a fractional expression ("a quarter of") precedes a plural noun ("collections"), the verb should be plural. Change "goes" → "go."',
    explanation_fil: 'Kapag ang fractional expression ("a quarter of") ay nasa harapan ng maramihang pangngalan ("collections"), ang pandiwa ay dapat maramihan. Palitan ang "goes" → "go."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe beneficiaries (a) of the study grant given by the government (b) will be (c) them (d). No error (e).',
    choices: [
      { id: 'a', text: 'The beneficiaries' },
      { id: 'b', text: 'of the study grant given by the government' },
      { id: 'c', text: 'will be' },
      { id: 'd', text: 'them' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'After a linking verb ("will be"), use the nominative (subject) case. Change "them" → "they." Correct: "The beneficiaries will be they."',
    explanation_fil: 'Pagkatapos ng linking verb ("will be"), gamitin ang nominative (subject) case. Palitan ang "them" → "they." Tama: "The beneficiaries will be they."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nStudies (a) suggests (b) that exposure to too much violence on television (c) makes one equally violent (d). No error (e).',
    choices: [
      { id: 'a', text: 'Studies' },
      { id: 'b', text: 'suggests' },
      { id: 'c', text: 'exposure to too much violence on television' },
      { id: 'd', text: 'makes one equally violent' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Studies" is plural. Change "suggests" → "suggest."',
    explanation_fil: 'Ang "Studies" ay maramihan. Palitan ang "suggests" → "suggest."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe possible effects (a) of television viewing (b) needs (c) to be explored further (d). No error (e).',
    choices: [
      { id: 'a', text: 'The possible effects' },
      { id: 'b', text: 'of television viewing' },
      { id: 'c', text: 'needs' },
      { id: 'd', text: 'to be explored further' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: '"The possible effects" is plural. Change "needs" → "need."',
    explanation_fil: 'Ang "The possible effects" ay maramihan. Palitan ang "needs" → "need."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nEvery weekdays (a), Chel and Charm (b) goes (c) to school together (d). No error (e).',
    choices: [
      { id: 'a', text: 'Every weekdays' },
      { id: 'b', text: 'Chel and Charm' },
      { id: 'c', text: 'goes' },
      { id: 'd', text: 'to school together' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: '"Chel and Charm" is a compound plural subject. Change "goes" → "go." (Note: "Every weekdays" is also nonstandard; it should be "Every weekday.")',
    explanation_fil: 'Ang "Chel and Charm" ay compound na maramihang paksa. Palitan ang "goes" → "go." (Tandaan: Ang "Every weekdays" ay di-wasto rin; dapat ay "Every weekday.")',
  },
  // ── Part 5: Literature & Grammar ────────────────────────────────────────
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe Scent of Apples, a story about a Filipino who immigrated to the United States (a), a story (b) are written (c) by Bienvenido Santos (d). No error (e).',
    choices: [
      { id: 'a', text: 'The Scent of Apples' },
      { id: 'b', text: 'a story about a Filipino who immigrated to the United States' },
      { id: 'c', text: 'are written' },
      { id: 'd', text: 'by Bienvenido Santos' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: '"The Scent of Apples" is a singular title (one story). Change "are written" → "is written." Literary titles are always treated as singular.',
    explanation_fil: 'Ang "The Scent of Apples" ay isahang pamagat (isang kwento). Palitan ang "are written" → "is written." Ang mga pamagat ng akda ay palaging itinuturing na isahan.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nNick Joaquin (a), one of the exceptional Filipino writers (b), is also known for (c) Quijano de Manila (d). No error (e).',
    choices: [
      { id: 'a', text: 'Nick Joaquin' },
      { id: 'b', text: 'one of the exceptional Filipino writers' },
      { id: 'c', text: 'is also known for' },
      { id: 'd', text: 'Quijano de Manila' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 1,
    explanation_en: 'The sentence is correct. Nick Joaquin is indeed known by the pen name "Quijano de Manila," and the grammar is proper.',
    explanation_fil: 'Ang pangungusap ay tama. Si Nick Joaquin ay kilala nga sa pseudonym na "Quijano de Manila," at tama ang gramatika ng pangungusap.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nSome people (a) believes (b) that one could see his future mate (c) by looking into a mirror on May day eve (d). No error (e).',
    choices: [
      { id: 'a', text: 'Some people' },
      { id: 'b', text: 'believes' },
      { id: 'c', text: 'one could see his future mate' },
      { id: 'd', text: 'by looking into a mirror on May day eve' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Some people" is plural. Change "believes" → "believe."',
    explanation_fil: 'Ang "Some people" ay maramihan. Palitan ang "believes" → "believe."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nJose Garcia Villa was a recipient of numerous awards (a), between them (b), the (c) "National Artist Award for Literature" (d). No error (e).',
    choices: [
      { id: 'a', text: 'was a recipient of numerous awards' },
      { id: 'b', text: 'between them' },
      { id: 'c', text: 'the' },
      { id: 'd', text: '"National Artist Award for Literature"' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"Between" is used for two items; "among" is used for more than two. Since there are numerous awards, use "among them."',
    explanation_fil: 'Ang "between" ay ginagamit para sa dalawang bagay; ang "among" ay ginagamit para sa mahigit dalawa. Dahil maraming parangal, gamitin ang "among them."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe Far Eastern University (a) also gave he (b) a Doctor of Literature honoris causa in 1959 (c), aside from asking him to be a visiting professor (d). No error (e).',
    choices: [
      { id: 'a', text: 'The Far Eastern University' },
      { id: 'b', text: 'gave he' },
      { id: 'c', text: 'a Doctor of Literature honoris causa in 1959' },
      { id: 'd', text: 'aside from asking him to be a visiting professor' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"He" is the nominative (subject) form; the objective (object) form is "him." As the indirect object of "gave," use "him." Change "gave he" → "gave him."',
    explanation_fil: 'Ang "he" ay nominative (subject) form; ang objective (object) form ay "him." Bilang indirect object ng "gave," gamitin ang "him." Palitan ang "gave he" → "gave him."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nBetween (a) the numerous prose writers (b), I think Nick Joaquin (c) is the best (d). No error (e).',
    choices: [
      { id: 'a', text: 'Between' },
      { id: 'b', text: 'the numerous prose writers' },
      { id: 'c', text: 'I think Nick Joaquin' },
      { id: 'd', text: 'is the best' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: '"Between" is used for two items; "among" is used for three or more. Change "Between" → "Among" since there are numerous prose writers.',
    explanation_fil: 'Ang "Between" ay ginagamit para sa dalawa; ang "Among" ay ginagamit para sa tatlo o higit pa. Palitan ang "Between" → "Among" dahil maraming manunulat ng prosa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThose are (a) work (b) of famous (c) authors (d). No error (e).',
    choices: [
      { id: 'a', text: 'Those are' },
      { id: 'b', text: 'work' },
      { id: 'c', text: 'of famous' },
      { id: 'd', text: 'authors' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Those" (plural pronoun) requires a plural noun. Change "work" → "works." When referring to multiple literary pieces, the plural "works" is needed.',
    explanation_fil: 'Ang "Those" (maramihang pronoun) ay nangangailangan ng maramihang pangngalan. Palitan ang "work" → "works." Kapag tumutukoy sa maraming akda, kailangan ang "works."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe professor (a) asked her (b) a question about (c) they (d). No error (e).',
    choices: [
      { id: 'a', text: 'The professor' },
      { id: 'b', text: 'asked her' },
      { id: 'c', text: 'a question about' },
      { id: 'd', text: 'they' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'After a preposition ("about"), use the objective (accusative) case. Change "they" → "them." Correct: "...a question about them."',
    explanation_fil: 'Pagkatapos ng preposisyon ("about"), gamitin ang objective (accusative) case. Palitan ang "they" → "them." Tama: "...a question about them."',
  },
  // ── Part 6: Technology & Computing ──────────────────────────────────────
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nLiterature (a) seem (b) elusive to people (c) who profess indifference to it (d). No error (e).',
    choices: [
      { id: 'a', text: 'Literature' },
      { id: 'b', text: 'seem elusive' },
      { id: 'c', text: 'to people' },
      { id: 'd', text: 'who profess indifference to it' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Literature" is singular. Change "seem" → "seems." Correct: "Literature seems elusive..."',
    explanation_fil: 'Ang "Literature" ay isahan. Palitan ang "seem" → "seems." Tama: "Literature seems elusive..."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nIt appeals (a) both to (b) the readers intellect (c) and passion (d). No error (e).',
    choices: [
      { id: 'a', text: 'It appeals' },
      { id: 'b', text: 'both to' },
      { id: 'c', text: "the readers intellect" },
      { id: 'd', text: 'and passion' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'A possessive apostrophe is missing. Change "readers" → "reader\'s" (singular possessive) or "readers\'" (plural possessive). The intellect belongs to the reader(s).',
    explanation_fil: 'Nawala ang possessive apostrophe. Palitan ang "readers" → "reader\'s" (isahang possessive) o "readers\'" (maramihang possessive). Ang talino ay pag-aari ng mambabasa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nRobert Frost (a), an American poet (b), defines literature (c) as "performance in words" (d). No error (e).',
    choices: [
      { id: 'a', text: 'Robert Frost' },
      { id: 'b', text: 'an American poet' },
      { id: 'c', text: 'defines literature' },
      { id: 'd', text: 'as "performance in words"' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 1,
    explanation_en: 'The sentence is correct. The present tense "defines" is used for stating accepted definitions or known views; the appositive "an American poet" is properly punctuated.',
    explanation_fil: 'Ang pangungusap ay tama. Ang present tense na "defines" ay ginagamit para sa mga tinatanggap na kahulugan o kilalang pananaw; ang appositive na "an American poet" ay may tamang bantas.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nEither of the authors (a) have (b) received citations (c) for their remarkable works (d). No error (e).',
    choices: [
      { id: 'a', text: 'Either of the authors' },
      { id: 'b', text: 'have' },
      { id: 'c', text: 'received citations' },
      { id: 'd', text: 'for their remarkable works' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"Either" is singular. Change "have" → "has." Rule: "either/neither" as subjects always take singular verbs regardless of what follows "of."',
    explanation_fil: 'Ang "Either" ay isahan. Palitan ang "have" → "has." Panuntunan: Ang "either/neither" bilang paksa ay laging gumagamit ng isahang pandiwa anuman ang sumusunod sa "of."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nJust like Edgar Allan Poe (a), it is believed that Nick Joaquin starts getting ideas (b) after he (c) has drank alcoholic beverages (d). No error (e).',
    choices: [
      { id: 'a', text: 'Just like Edgar Allan Poe' },
      { id: 'b', text: 'Nick Joaquin starts getting ideas' },
      { id: 'c', text: 'after he' },
      { id: 'd', text: 'has drank alcoholic beverages' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'In the perfect tense, use the past participle. "Drank" is simple past; change "has drank" → "has drunk." The three forms of drink: drink – drank – drunk.',
    explanation_fil: 'Sa perfect tense, gamitin ang past participle. Ang "drank" ay simple past; palitan ang "has drank" → "has drunk." Ang tatlong anyo ng drink: drink – drank – drunk.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nComputers (a) are widely (b) use (c) nowadays even in preschools (d). No error (e).',
    choices: [
      { id: 'a', text: 'Computers' },
      { id: 'b', text: 'are widely' },
      { id: 'c', text: 'use' },
      { id: 'd', text: 'nowadays even in preschools' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'In passive voice, the past participle is required. Change "use" → "used." Correct: "Computers are widely used nowadays..."',
    explanation_fil: 'Sa passive voice, ang past participle ay kailangan. Palitan ang "use" → "used." Tama: "Computers are widely used nowadays..."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nThe number of Computer Science students (a) steadily (b) increases (c) each year (d). No error (e).',
    choices: [
      { id: 'a', text: 'The number of Computer Science students' },
      { id: 'b', text: 'steadily' },
      { id: 'c', text: 'increases' },
      { id: 'd', text: 'each year' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 2,
    explanation_en: 'The sentence is correct. "The number" is singular → "increases" is correct. Do not confuse with "A number of," which takes a plural verb.',
    explanation_fil: 'Ang pangungusap ay tama. Ang "The number" ay isahan → "increases" ay tama. Huwag ipagkamali sa "A number of," na gumagamit ng maramihang pandiwa.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nAMA (a), in addition to STI (b), train (c) students to be proficient in computer use (d). No error (e).',
    choices: [
      { id: 'a', text: 'AMA' },
      { id: 'b', text: 'in addition to STI' },
      { id: 'c', text: 'train' },
      { id: 'd', text: 'students to be proficient in computer use' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"AMA" is the singular subject ("in addition to STI" is parenthetical). Change "train" → "trains."',
    explanation_fil: 'Ang "AMA" ang isahang paksa ("in addition to STI" ay parenthetical). Palitan ang "train" → "trains."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nKnowledge (a) should always (b) be put (c) to good use (d). No error (e).',
    choices: [
      { id: 'a', text: 'Knowledge' },
      { id: 'b', text: 'should always' },
      { id: 'c', text: 'be put' },
      { id: 'd', text: 'to good use' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'e', difficulty: 1,
    explanation_en: 'The sentence is correct. "Knowledge should always be put to good use" is grammatically proper with correct modal verb usage.',
    explanation_fil: 'Ang pangungusap ay tama. Ang "Knowledge should always be put to good use" ay tama sa gramatika at may tamang paggamit ng modal verb.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nOne of the viruses (a) has (b) infect (c) my brother\'s brand new laptop computer (d). No error (e).',
    choices: [
      { id: 'a', text: 'One of the viruses' },
      { id: 'b', text: 'has' },
      { id: 'c', text: 'infect' },
      { id: 'd', text: "my brother's brand new laptop computer" },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'In the present perfect, the past participle is required. Change "infect" → "infected." Three forms: infect – infected – infected.',
    explanation_fil: 'Sa present perfect, ang past participle ay kailangan. Palitan ang "infect" → "infected." Tatlong anyo: infect – infected – infected.',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nInternet access (a) allow (b) us to communicate (c) with other people anywhere in the world (d). No error (e).',
    choices: [
      { id: 'a', text: 'Internet access' },
      { id: 'b', text: 'allow' },
      { id: 'c', text: 'us to communicate' },
      { id: 'd', text: 'with other people anywhere in the world' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Internet access" is singular. Change "allow" → "allows."',
    explanation_fil: 'Ang "Internet access" ay isahan. Palitan ang "allow" → "allows."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nAll of the pens (a) are (b) no (c) spent yesterday (d). No error (e).',
    choices: [
      { id: 'a', text: 'All of the pens' },
      { id: 'b', text: 'are' },
      { id: 'c', text: 'no spent' },
      { id: 'd', text: 'yesterday' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"No" is not standard English for negation in this context. Change "no" → "not." Also, the tense should be past: "were not spent yesterday."',
    explanation_fil: 'Ang "no" ay hindi pamantayang Ingles para sa negasyon sa kontekstong ito. Palitan ang "no" → "not." Gayundin, dapat past ang tense: "were not spent yesterday."',
  },
  {
    stem: 'Identify the error (choose a–d) or choose e if there is no error.\n\nEach computer (a) come (b) with either (c) a compact disk player or a DVD player (d). No error (e).',
    choices: [
      { id: 'a', text: 'Each computer' },
      { id: 'b', text: 'come' },
      { id: 'c', text: 'with either' },
      { id: 'd', text: 'a compact disk player or a DVD player' },
      { id: 'e', text: 'No error' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Each" is singular. Change "come" → "comes." Rule: "Each," "every," and "each one" always take singular verbs.',
    explanation_fil: 'Ang "Each" ay isahan. Palitan ang "come" → "comes." Panuntunan: Ang "Each," "every," at "each one" ay laging gumagamit ng isahang pandiwa.',
  },
];

async function main() {
  console.log(`📖 Inserting Identifying Errors (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const SOURCE = 'CSE Reviewer 2026 | English: Identifying Errors | Level: both | flashcard:no | tutor-ready:yes';

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: SOURCE,
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
    source_note: SOURCE,
    status: 'published',
    is_verified: true,
  }));

  await insertBatch(proRows);
  console.log(`  Pro grammar: ${proRows.length} questions inserted.`);

  await insertBatch(subRows);
  console.log(`  Sub grammar: ${subRows.length} questions inserted.`);

  const { count } = await sb.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published');
  console.log(`\n✅ Done! Total published questions in DB: ${count}`);
  console.log(`   (+${proRows.length + subRows.length} new questions across Pro + Sub)\n`);
}

main().catch(console.error);
