/**
 * CSE Question Bank — English Synonyms (40) + Antonyms (40) = 80 questions
 * Source: CSE Reviewer 2026, pages 31–47
 * Level: Both Professional and Sub-Professional (Verbal Ability — Vocabulary)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TOPICS = {
  proVocab: '1cd5d867-5041-4810-bad0-a911323ced1f',  // CSE Pro: vocabulary
  subVocab: 'd32d7e74-2958-4e1e-9049-2901156a0a06',  // CSE Sub: vocabulary
};

const SOURCE_SYN = 'CSE Reviewer 2026 | Verbal: Synonyms | Level: both | flashcard:yes | tutor-ready:yes';
const SOURCE_ANT = 'CSE Reviewer 2026 | Verbal: Antonyms | Level: both | flashcard:yes | tutor-ready:yes';

// ─── SYNONYMS (40) ───────────────────────────────────────────────────────────
const SYNONYMS = [
  {
    stem: 'We should never be **apathetic** towards other people, for we have a social responsibility to fulfill.',
    choices: [{ id: 'a', text: 'indifferent' }, { id: 'b', text: 'concerned' }, { id: 'c', text: 'generous' }, { id: 'd', text: 'worried' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Apathetic" means showing no interest or emotion. Its closest synonym is "indifferent" — showing no particular concern or interest.',
    explanation_fil: '"Apathetic" ay walang interes o emosyon. Kasingkahulugan nito: "indifferent" (walang pakialam).',
  },
  {
    stem: 'A good leader should be **cognizant** of the numerous issues that affect his constituents.',
    choices: [{ id: 'a', text: 'aware' }, { id: 'b', text: 'uninformed' }, { id: 'c', text: 'confused' }, { id: 'd', text: 'idealistic' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Cognizant" means having knowledge or awareness. Synonym: "aware."',
    explanation_fil: '"Cognizant" = may kaalaman o kamalayan. Kasingkahulugan: "aware" (mulat/alam).',
  },
  {
    stem: 'Always be careful not to issue any **disparaging** remarks against other people.',
    choices: [{ id: 'a', text: 'praising' }, { id: 'b', text: 'confusing' }, { id: 'c', text: 'damaging' }, { id: 'd', text: 'discouraging' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Disparaging" means expressing a low opinion; demeaning. Closest synonym: "damaging" (to one\'s reputation).',
    explanation_fil: '"Disparaging" = paghamak o pagmamaliit sa iba. Kasingkahulugan: "damaging."',
  },
  {
    stem: 'Flowers are **ephemeral**; they bloom yet wither in a week or so.',
    choices: [{ id: 'a', text: 'shrivel' }, { id: 'b', text: 'long lasting' }, { id: 'c', text: 'beautiful' }, { id: 'd', text: 'short lived' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Ephemeral" means lasting for a very short time. Synonym: "short-lived."',
    explanation_fil: '"Ephemeral" = panandalian lang. Kasingkahulugan: "short-lived."',
  },
  {
    stem: 'A **fastidious** person will never find true happiness.',
    choices: [{ id: 'a', text: 'simple' }, { id: 'b', text: 'choosy' }, { id: 'c', text: 'greedy' }, { id: 'd', text: 'contented' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Fastidious" means very attentive to accuracy and detail; hard to please. Synonym: "choosy."',
    explanation_fil: '"Fastidious" = mapanuri at mahirap pagbigyan. Kasingkahulugan: "choosy" (mapili).',
  },
  {
    stem: 'The Ortigas Center is filled with **gargantuan** buildings, some having up to 50 floors.',
    choices: [{ id: 'a', text: 'crowded' }, { id: 'b', text: 'old and weak' }, { id: 'c', text: 'first class' }, { id: 'd', text: 'gigantic' }],
    correct: 'd', difficulty: 1,
    explanation_en: '"Gargantuan" means enormous. Synonym: "gigantic."',
    explanation_fil: '"Gargantuan" = napakalaki. Kasingkahulugan: "gigantic."',
  },
  {
    stem: 'Nobody likes **haughty** Monty, who kept bragging about his riches.',
    choices: [{ id: 'a', text: 'arrogant' }, { id: 'b', text: 'foolish' }, { id: 'c', text: 'respectable' }, { id: 'd', text: 'dependable' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Haughty" means arrogantly superior. Synonym: "arrogant."',
    explanation_fil: '"Haughty" = palalo, mataas ang tingin sa sarili. Kasingkahulugan: "arrogant."',
  },
  {
    stem: 'The corrupt policeman was discharged for his **ignominious** act of accepting bribes.',
    choices: [{ id: 'a', text: 'honorable' }, { id: 'b', text: 'disrespectable' }, { id: 'c', text: 'unwanted' }, { id: 'd', text: 'remarkable' }],
    correct: 'b', difficulty: 3,
    explanation_en: '"Ignominious" means deserving or causing public disgrace. Closest synonym: "disrespectable" (shameful, dishonorable).',
    explanation_fil: '"Ignominious" = kahiya-hiya, nakakadiskwalipikar. Kasingkahulugan: "disrespectable."',
  },
  {
    stem: 'The **impudent** child was scolded for answering back to older people.',
    choices: [{ id: 'a', text: 'respectful' }, { id: 'b', text: 'honorable' }, { id: 'c', text: 'clever' }, { id: 'd', text: 'rude' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Impudent" means not showing due respect; insolent. Synonym: "rude."',
    explanation_fil: '"Impudent" = walang galang. Kasingkahulugan: "rude."',
  },
  {
    stem: 'Spores are **infinitesimal** reproductive units of fungi and lower plants.',
    choices: [{ id: 'a', text: 'invisible' }, { id: 'b', text: 'interesting' }, { id: 'c', text: 'microscopic' }, { id: 'd', text: 'large' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Infinitesimal" means extremely small. Synonym: "microscopic."',
    explanation_fil: '"Infinitesimal" = napakaliit. Kasingkahulugan: "microscopic."',
  },
  {
    stem: 'Never trust an **insidious** person because you\'ll never know what goes on in his mind.',
    choices: [{ id: 'a', text: 'honest' }, { id: 'b', text: 'treacherous' }, { id: 'c', text: 'loyal' }, { id: 'd', text: 'trustworthy' }],
    correct: 'b', difficulty: 3,
    explanation_en: '"Insidious" means proceeding in a gradual, subtle, harmful way; deceitful. Synonym: "treacherous."',
    explanation_fil: '"Insidious" = mapagtaksil, mapaglinlang. Kasingkahulugan: "treacherous."',
  },
  {
    stem: 'Jessa is an **irascible** girl who frequently has tantrums.',
    choices: [{ id: 'a', text: 'impatient' }, { id: 'b', text: 'cheerful' }, { id: 'c', text: 'hot-tempered' }, { id: 'd', text: 'jolly' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Irascible" means having or showing a tendency to be easily angered. Synonym: "hot-tempered."',
    explanation_fil: '"Irascible" = madaling magalit. Kasingkahulugan: "hot-tempered."',
  },
  {
    stem: 'Surgeons should be **meticulous** especially when performing operations.',
    choices: [{ id: 'a', text: 'careful' }, { id: 'b', text: 'careless' }, { id: 'c', text: 'strict' }, { id: 'd', text: 'lenient' }],
    correct: 'a', difficulty: 1,
    explanation_en: '"Meticulous" means very careful and precise. Synonym: "careful."',
    explanation_fil: '"Meticulous" = maingat at tumpak. Kasingkahulugan: "careful."',
  },
  {
    stem: 'Christ teaches us not to be obsessed with **mundane** things.',
    choices: [{ id: 'a', text: 'temporary' }, { id: 'b', text: 'worldly' }, { id: 'c', text: 'insignificant' }, { id: 'd', text: 'important' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Mundane" means of this earthly world, not spiritual. Synonym: "worldly."',
    explanation_fil: '"Mundane" = pang-mundo, hindi espirituwal. Kasingkahulugan: "worldly."',
  },
  {
    stem: 'Rochelle has difficulty seeing things from afar because she is **myopic**.',
    choices: [{ id: 'a', text: 'cross-eyed' }, { id: 'b', text: 'eagle-eyed' }, { id: 'c', text: 'farsighted' }, { id: 'd', text: 'nearsighted' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Myopic" means nearsighted — able to see near objects clearly, but not far ones. Synonym: "nearsighted."',
    explanation_fil: '"Myopic" = maiksi ang paningin (hindi makaakita ng malayo). Kasingkahulugan: "nearsighted."',
  },
  {
    stem: 'Regina, being a child of three, is **oblivious** to the world around her.',
    choices: [{ id: 'a', text: 'careful' }, { id: 'b', text: 'carefree' }, { id: 'c', text: 'aware' }, { id: 'd', text: 'unmindful' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Oblivious" means not aware of what is happening. Synonym: "unmindful."',
    explanation_fil: '"Oblivious" = hindi nakakamulat sa paligid. Kasingkahulugan: "unmindful."',
  },
  {
    stem: 'Man can never be **omniscient** like God.',
    choices: [{ id: 'a', text: 'all-knowing' }, { id: 'b', text: 'logical' }, { id: 'c', text: 'immortal' }, { id: 'd', text: 'miraculous' }],
    correct: 'a', difficulty: 1,
    explanation_en: '"Omniscient" means knowing everything. Synonym: "all-knowing."',
    explanation_fil: '"Omniscient" = lahat-alam. Kasingkahulugan: "all-knowing."',
  },
  {
    stem: 'The **piqued** mouse was able to find its way out of the maze in a short while.',
    choices: [{ id: 'a', text: 'dumb' }, { id: 'b', text: 'clever' }, { id: 'c', text: 'small' }, { id: 'd', text: 'unusual' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Piqued" here likely refers to a mouse with aroused curiosity/interest, showing cleverness. Synonym: "clever." (Note: the original word may be "piquant" or the context implies alert behavior.)',
    explanation_fil: '"Piqued" (napukaw ang interes) ay nagpapakita ng katalinuhan. Kasingkahulugan: "clever."',
  },
  {
    stem: 'It is now **plausible** to say that someday, interplanetary travel will no longer be impossible.',
    choices: [{ id: 'a', text: 'reasonable' }, { id: 'b', text: 'unusual' }, { id: 'c', text: 'illogical' }, { id: 'd', text: 'extraordinary' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Plausible" means seeming reasonable or probable. Synonym: "reasonable."',
    explanation_fil: '"Plausible" = mukhang makatotohanan. Kasingkahulugan: "reasonable."',
  },
  {
    stem: 'A **prudent** person is not easily deceived.',
    choices: [{ id: 'a', text: 'loyal' }, { id: 'b', text: 'careless' }, { id: 'c', text: 'wise' }, { id: 'd', text: 'foolish' }],
    correct: 'c', difficulty: 1,
    explanation_en: '"Prudent" means acting with care and thought for the future. Synonym: "wise."',
    explanation_fil: '"Prudent" = matalino at maingat. Kasingkahulugan: "wise."',
  },
  {
    stem: '"Spare the rod and spoil the child" is a common **aphorism**.',
    choices: [{ id: 'a', text: 'slogan' }, { id: 'b', text: 'battle cry' }, { id: 'c', text: 'proverb' }, { id: 'd', text: 'motto' }],
    correct: 'c', difficulty: 2,
    explanation_en: 'An "aphorism" is a short, witty statement expressing a general truth. Synonym: "proverb."',
    explanation_fil: '"Aphorism" = maikling kasabihang nagpapahayag ng katotohanan. Kasingkahulugan: "proverb" (salawikain).',
  },
  {
    stem: "Charlie's **deportment** is highly commendable.",
    choices: [{ id: 'a', text: 'belief' }, { id: 'b', text: 'behavior' }, { id: 'c', text: 'intelligence' }, { id: 'd', text: 'competence' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Deportment" means a person\'s behavior or manners. Synonym: "behavior."',
    explanation_fil: '"Deportment" = kilos o ugali ng isang tao. Kasingkahulugan: "behavior."',
  },
  {
    stem: 'Enmity and hate are contrary to friendship and **concord**.',
    choices: [{ id: 'a', text: 'agreement' }, { id: 'b', text: 'mutual hatred' }, { id: 'c', text: 'confusion' }, { id: 'd', text: 'division' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Concord" means agreement or harmony. Synonym: "agreement."',
    explanation_fil: '"Concord" = pagkakasundo. Kasingkahulugan: "agreement."',
  },
  {
    stem: "The Filipino's **fortitude** is the reason why he seldom complains.",
    choices: [{ id: 'a', text: 'endurance' }, { id: 'b', text: 'peace-loving' }, { id: 'c', text: 'discontent' }, { id: 'd', text: 'satisfaction' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Fortitude" means courage and strength in facing difficulty. Synonym: "endurance."',
    explanation_fil: '"Fortitude" = lakas ng loob at tibay. Kasingkahulugan: "endurance."',
  },
  {
    stem: 'Poverty should never be viewed as an **impediment** towards attaining good education.',
    choices: [{ id: 'a', text: 'reason' }, { id: 'b', text: 'way' }, { id: 'c', text: 'link' }, { id: 'd', text: 'obstruction' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Impediment" means a hindrance or obstacle. Synonym: "obstruction."',
    explanation_fil: '"Impediment" = hadlang. Kasingkahulugan: "obstruction."',
  },
  {
    stem: 'The students were **upbraided** for misbehaving during the assembly.',
    choices: [{ id: 'a', text: 'praised' }, { id: 'b', text: 'honored' }, { id: 'c', text: 'scolded' }, { id: 'd', text: 'stopped' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Upbraided" means scolded or criticized angrily. Synonym: "scolded."',
    explanation_fil: '"Upbraided" = pinagalitan. Kasingkahulugan: "scolded."',
  },
  {
    stem: '**Urbane** people are appalled by rude behavior.',
    choices: [{ id: 'a', text: 'well-mannered' }, { id: 'b', text: 'ill-mannered' }, { id: 'c', text: 'modern' }, { id: 'd', text: 'rich' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Urbane" means suave, courteous, and refined in manner. Synonym: "well-mannered."',
    explanation_fil: '"Urbane" = may magandang ugali at sopistikado. Kasingkahulugan: "well-mannered."',
  },
  {
    stem: 'Clowns are never **vapid**, but the sick usually are.',
    choices: [{ id: 'a', text: 'lively and energetic' }, { id: 'b', text: 'lacking spirit and liveliness' }, { id: 'c', text: 'clumsy' }, { id: 'd', text: 'funny' }],
    correct: 'b', difficulty: 3,
    explanation_en: '"Vapid" means offering nothing that is stimulating or challenging; dull. Synonym: "lacking spirit and liveliness."',
    explanation_fil: '"Vapid" = walang saya o sigla. Kasingkahulugan: "lacking spirit and liveliness."',
  },
  {
    stem: 'The client was asked to verify the **veracity** of the statement of accounts.',
    choices: [{ id: 'a', text: 'accuracy' }, { id: 'b', text: 'discrepancy' }, { id: 'c', text: 'redundancy' }, { id: 'd', text: 'mistake' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Veracity" means truthfulness and accuracy. Synonym: "accuracy."',
    explanation_fil: '"Veracity" = katotohanan at katumpakan. Kasingkahulugan: "accuracy."',
  },
  {
    stem: 'Dentists believe babies should be **weaned** from feeding bottles as soon as possible.',
    choices: [{ id: 'a', text: 'get used to' }, { id: 'b', text: 'develop hatred for' }, { id: 'c', text: 'free from dependence' }, { id: 'd', text: 'make more dependent' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Weaned" means gradually withdrawn from dependence on something. Synonym: "free from dependence."',
    explanation_fil: '"Weaned" = unti-unting inalis ang pag-asa sa isang bagay. Kasingkahulugan: "free from dependence."',
  },
  {
    stem: 'Some people believe that Balete Drive is haunted because a **wraith** of a woman appears there.',
    choices: [{ id: 'a', text: 'shadow' }, { id: 'b', text: 'statue' }, { id: 'c', text: 'reflection' }, { id: 'd', text: 'ghost' }],
    correct: 'd', difficulty: 2,
    explanation_en: 'A "wraith" is a ghost or spirit of a dead person. Synonym: "ghost."',
    explanation_fil: '"Wraith" = espiritu ng patay. Kasingkahulugan: "ghost."',
  },
  {
    stem: 'She looks **unkempt** with her wavy coarse hair falling freely behind her back.',
    choices: [{ id: 'a', text: 'pretty' }, { id: 'b', text: 'neat' }, { id: 'c', text: 'prim and proper' }, { id: 'd', text: 'untidy' }],
    correct: 'd', difficulty: 1,
    explanation_en: '"Unkempt" means untidy or disheveled. Synonym: "untidy."',
    explanation_fil: '"Unkempt" = magulo at hindi maayos. Kasingkahulugan: "untidy."',
  },
  {
    stem: 'The room is **topsy-turvy**, as if a hurricane just passed through.',
    choices: [{ id: 'a', text: 'disorderly' }, { id: 'b', text: 'destroyed' }, { id: 'c', text: 'orderly' }, { id: 'd', text: 'clean' }],
    correct: 'a', difficulty: 1,
    explanation_en: '"Topsy-turvy" means in a state of confusion or disorder. Synonym: "disorderly."',
    explanation_fil: '"Topsy-turvy" = magulo at walang ayos. Kasingkahulugan: "disorderly."',
  },
  {
    stem: 'Sherlock Holmes is a famous **sleuth**.',
    choices: [{ id: 'a', text: 'adventurer' }, { id: 'b', text: 'scientist' }, { id: 'c', text: 'detective' }, { id: 'd', text: 'criminal' }],
    correct: 'c', difficulty: 1,
    explanation_en: 'A "sleuth" is a detective or investigator. Synonym: "detective."',
    explanation_fil: '"Sleuth" = detective o imbestigador. Kasingkahulugan: "detective."',
  },
  {
    stem: 'Mindy **rummaged** through the chest of old clothes for something usable to donate.',
    choices: [{ id: 'a', text: 'searched through' }, { id: 'b', text: 'wandered through' }, { id: 'c', text: 'passed through' }, { id: 'd', text: 'scattered' }],
    correct: 'a', difficulty: 1,
    explanation_en: '"Rummaged" means searched unsystematically and untidily. Synonym: "searched through."',
    explanation_fil: '"Rummaged" = naghanap nang walang ayos. Kasingkahulugan: "searched through."',
  },
  {
    stem: 'Only a **ruffian** could do such a heinous act of killing a helpless child.',
    choices: [{ id: 'a', text: 'an insane person' }, { id: 'b', text: 'a brutal person' }, { id: 'c', text: 'a lovable person' }, { id: 'd', text: 'a confused person' }],
    correct: 'b', difficulty: 2,
    explanation_en: 'A "ruffian" is a violent, lawless person. Closest synonym: "a brutal person."',
    explanation_fil: '"Ruffian" = marahas at masamang tao. Kasingkahulugan: "a brutal person."',
  },
  {
    stem: 'To **augment** the policemen\'s income, the government allowed them to take part-time jobs.',
    choices: [{ id: 'a', text: 'increase' }, { id: 'b', text: 'contribute' }, { id: 'c', text: 'limit' }, { id: 'd', text: 'remove' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Augment" means to make something greater by adding to it. Synonym: "increase."',
    explanation_fil: '"Augment" = palakihin o dagdagan. Kasingkahulugan: "increase."',
  },
  {
    stem: 'A person\'s reputation is very important, so be very careful not to **calumniate** anybody.',
    choices: [{ id: 'a', text: 'embarrass' }, { id: 'b', text: 'abuse' }, { id: 'c', text: 'tease' }, { id: 'd', text: 'slander' }],
    correct: 'd', difficulty: 3,
    explanation_en: '"Calumniate" means to make false and defamatory statements about someone. Synonym: "slander."',
    explanation_fil: '"Calumniate" = magsabi ng kasinungalingang pinsala sa reputasyon. Kasingkahulugan: "slander."',
  },
  {
    stem: 'The footprints were **effaced** when the floor was mopped.',
    choices: [{ id: 'a', text: 'printed' }, { id: 'b', text: 'erased' }, { id: 'c', text: 'deformed' }, { id: 'd', text: 'developed' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Effaced" means erased or wiped out. Synonym: "erased."',
    explanation_fil: '"Effaced" = pinawi o binura. Kasingkahulugan: "erased."',
  },
  {
    stem: 'The plane **overshot** the runway and landed in a ditch.',
    choices: [{ id: 'a', text: 'passed through' }, { id: 'b', text: 'passed by' }, { id: 'c', text: 'went beyond' }, { id: 'd', text: 'did not reach' }],
    correct: 'c', difficulty: 1,
    explanation_en: '"Overshot" means went beyond or past the intended target. Synonym: "went beyond."',
    explanation_fil: '"Overshot" = lumampas sa nilalayong lugar. Kasingkahulugan: "went beyond."',
  },
];

// ─── ANTONYMS (40) ───────────────────────────────────────────────────────────
const ANTONYMS = [
  {
    stem: 'Hanna **accompanied** her sister to the drugstore.',
    choices: [{ id: 'a', text: 'followed' }, { id: 'b', text: 'let go on one\'s own' }, { id: 'c', text: 'left behind' }, { id: 'd', text: 'stopped' }],
    correct: 'c', difficulty: 1,
    explanation_en: '"Accompanied" means went with someone. Its antonym is "left behind" — went without the person.',
    explanation_fil: '"Accompanied" = sinamahan. Kasalungat: "left behind" (iniwan).',
  },
  {
    stem: 'Beside the **boulevard** are gigantic buildings.',
    choices: [{ id: 'a', text: 'alley' }, { id: 'b', text: 'street' }, { id: 'c', text: 'avenue' }, { id: 'd', text: 'road' }],
    correct: 'a', difficulty: 2,
    explanation_en: 'A "boulevard" is a wide, grand road. Its antonym in relative size and prestige is "alley" — a narrow passage.',
    explanation_fil: '"Boulevard" = malawak na daan. Kasalungat: "alley" (makipot na daanan).',
  },
  {
    stem: 'He often got into trouble because he was **brusque**.',
    choices: [{ id: 'a', text: 'blunt' }, { id: 'b', text: 'rude' }, { id: 'c', text: 'refined' }, { id: 'd', text: 'curt' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Brusque" means abrupt or offhand in manner. Its antonym: "refined" — polite and sophisticated.',
    explanation_fil: '"Brusque" = mabilis at walang galang na pagsasalita. Kasalungat: "refined."',
  },
  {
    stem: "The reporter's **candid** remarks caught the mayoralty candidate off-guard.",
    choices: [{ id: 'a', text: 'secret' }, { id: 'b', text: 'frank' }, { id: 'c', text: 'well-thought' }, { id: 'd', text: 'reserved' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Candid" means truthful and frank. Its antonym: "reserved" — restrained, not forthcoming.',
    explanation_fil: '"Candid" = tapat at walang takip. Kasalungat: "reserved."',
  },
  {
    stem: 'The mean boys **derided** the sickly boy.',
    choices: [{ id: 'a', text: 'made fun of' }, { id: 'b', text: 'ridiculed' }, { id: 'c', text: 'praised' }, { id: 'd', text: 'abandoned' }],
    correct: 'c', difficulty: 1,
    explanation_en: '"Derided" means mocked or ridiculed. Its antonym: "praised."',
    explanation_fil: '"Derided" = pinagtatawanan at ininsulto. Kasalungat: "praised" (pinuri).',
  },
  {
    stem: 'Charm was **ecstatic** when she won first prize in the short story writing contest.',
    choices: [{ id: 'a', text: 'melancholic' }, { id: 'b', text: 'overjoyed' }, { id: 'c', text: 'worried' }, { id: 'd', text: 'energetic' }],
    correct: 'a', difficulty: 1,
    explanation_en: '"Ecstatic" means overwhelmingly happy. Its antonym: "melancholic" — deeply sad.',
    explanation_fil: '"Ecstatic" = labis na masaya. Kasalungat: "melancholic" (malungkutin).',
  },
  {
    stem: 'Migraine headaches are **excruciating**.',
    choices: [{ id: 'a', text: 'extremely painful' }, { id: 'b', text: 'mild pain' }, { id: 'c', text: 'painless' }, { id: 'd', text: 'healing' }],
    correct: 'c', difficulty: 1,
    explanation_en: '"Excruciating" means intensely painful. Its antonym: "painless."',
    explanation_fil: '"Excruciating" = matinding sakit. Kasalungat: "painless" (walang sakit).',
  },
  {
    stem: 'The quiz proved to be **facile** so the students got high scores.',
    choices: [{ id: 'a', text: 'difficult' }, { id: 'b', text: 'easy' }, { id: 'c', text: 'average' }, { id: 'd', text: 'answerable' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Facile" means achieved easily. Its antonym: "difficult."',
    explanation_fil: '"Facile" = madali. Kasalungat: "difficult."',
  },
  {
    stem: 'The **garrulous** girls were distanced from each other.',
    choices: [{ id: 'a', text: 'mute' }, { id: 'b', text: 'talkative' }, { id: 'c', text: 'behaved' }, { id: 'd', text: 'quiet' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Garrulous" means excessively talkative. Its strongest antonym: "mute" — unable or unwilling to speak.',
    explanation_fil: '"Garrulous" = masalita. Kasalungat: "mute" (tahimik/walang salita).',
  },
  {
    stem: 'The heathens used to practice cannibalism.',
    choices: [{ id: 'a', text: 'uncivilized people' }, { id: 'b', text: 'barbaric people' }, { id: 'c', text: 'old people' }, { id: 'd', text: 'cultured people' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Heathens" are considered uncivilized or irreligious. The antonym: "cultured people" — civilized, refined.',
    explanation_fil: '"Heathens" = mga barbariko. Kasalungat: "cultured people" (mga sibilisado).',
  },
  {
    stem: 'Keep on believing that physical disability is not a **hindrance** to success.',
    choices: [{ id: 'a', text: 'block' }, { id: 'b', text: 'stepping stone' }, { id: 'c', text: 'opportunity' }, { id: 'd', text: 'difficulty' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Hindrance" means an obstacle. Its antonym in context: "stepping stone" — something that helps you advance.',
    explanation_fil: '"Hindrance" = hadlang. Kasalungat: "stepping stone" (tulong sa pag-unlad).',
  },
  {
    stem: 'Never operate a machine once you are **inebriated**.',
    choices: [{ id: 'a', text: 'sober' }, { id: 'b', text: 'drunk' }, { id: 'c', text: 'sleepy' }, { id: 'd', text: 'active' }],
    correct: 'a', difficulty: 1,
    explanation_en: '"Inebriated" means drunk. Its antonym: "sober."',
    explanation_fil: '"Inebriated" = lasing. Kasalungat: "sober" (hindi lasing).',
  },
  {
    stem: 'The people **inveighed** against the sharp increase in oil prices.',
    choices: [{ id: 'a', text: 'admitted' }, { id: 'b', text: 'amended' }, { id: 'c', text: 'accepted' }, { id: 'd', text: 'deliberated' }],
    correct: 'c', difficulty: 3,
    explanation_en: '"Inveighed" means protested strongly. Its antonym: "accepted" — agreed without protest.',
    explanation_fil: '"Inveighed" = nagprotesta nang matindi. Kasalungat: "accepted" (tinanggap).',
  },
  {
    stem: 'Some people believe that breaking a mirror is a **jinx**.',
    choices: [{ id: 'a', text: 'bad luck' }, { id: 'b', text: 'evil' }, { id: 'c', text: 'expensive' }, { id: 'd', text: 'good luck' }],
    correct: 'd', difficulty: 1,
    explanation_en: '"Jinx" means bad luck or a curse. Its antonym: "good luck."',
    explanation_fil: '"Jinx" = malas. Kasalungat: "good luck" (swerte).',
  },
  {
    stem: 'The players were confused when the **kibitzers** suddenly butted in during the team\'s huddle.',
    choices: [{ id: 'a', text: 'advisers' }, { id: 'b', text: 'spectators' }, { id: 'c', text: 'onlookers' }, { id: 'd', text: 'crowd' }],
    correct: 'a', difficulty: 3,
    explanation_en: '"Kibitzers" are uninvited commentators who meddle. The antonym in context: "advisers" — officially recognized, invited guidance.',
    explanation_fil: '"Kibitzers" = mga walang imbitasyong nakikialam. Kasalungat: "advisers" (opisyal na tagapayo).',
  },
  {
    stem: 'The **lanky** lad stood out among the average-sized students.',
    choices: [{ id: 'a', text: 'fierce-looking' }, { id: 'b', text: 'gigantic' }, { id: 'c', text: 'short and stout' }, { id: 'd', text: 'tall and thin' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Lanky" means ungracefully thin and tall. Its antonym: "short and stout."',
    explanation_fil: '"Lanky" = matangkad at payat. Kasalungat: "short and stout" (maiksi at mataba).',
  },
  {
    stem: 'The sickly dog was given a **lethal** dose of morphine tablets.',
    choices: [{ id: 'a', text: 'fatal' }, { id: 'b', text: 'safe' }, { id: 'c', text: 'deadly' }, { id: 'd', text: 'nasty' }],
    correct: 'b', difficulty: 1,
    explanation_en: '"Lethal" means causing death. Its antonym: "safe."',
    explanation_fil: '"Lethal" = nakamamatay. Kasalungat: "safe" (ligtas).',
  },
  {
    stem: 'Heinous criminals are truly **loathsome**.',
    choices: [{ id: 'a', text: 'repugnant' }, { id: 'b', text: 'foul' }, { id: 'c', text: 'adorable' }, { id: 'd', text: 'nasty' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Loathsome" means disgusting or revolting. Its antonym: "adorable" — delightful, charming.',
    explanation_fil: '"Loathsome" = kasuklamsuklam. Kasalungat: "adorable" (kaibig-ibig).',
  },
  {
    stem: 'We listened attentively to the **mellifluous** sound produced by the Philippine Philharmonic Orchestra.',
    choices: [{ id: 'a', text: 'harsh' }, { id: 'b', text: 'resonant' }, { id: 'c', text: 'melodious' }, { id: 'd', text: 'mellow' }],
    correct: 'a', difficulty: 3,
    explanation_en: '"Mellifluous" means sweet and musical; pleasant to hear. Its antonym: "harsh" — unpleasant, grating.',
    explanation_fil: '"Mellifluous" = matamis at masayang marinig. Kasalungat: "harsh" (maingay at hindi kasiya-siya).',
  },
  {
    stem: 'The free medical checkup conducted by the AFP is proof of their **munificence**.',
    choices: [{ id: 'a', text: 'commitment' }, { id: 'b', text: 'generosity' }, { id: 'c', text: 'extravagance' }, { id: 'd', text: 'stinginess' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Munificence" means great generosity. Its antonym: "stinginess" — unwillingness to give.',
    explanation_fil: '"Munificence" = kagandahang-loob at kabunga-bugangan. Kasalungat: "stinginess."',
  },
  {
    stem: 'Justice calls for penalizing **nefarious** acts.',
    choices: [{ id: 'a', text: 'honorable' }, { id: 'b', text: 'detestable' }, { id: 'c', text: 'infamous' }, { id: 'd', text: 'vile' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Nefarious" means wicked or criminal. Its antonym: "honorable."',
    explanation_fil: '"Nefarious" = masama at kriminal. Kasalungat: "honorable" (karapat-dapat igalang).',
  },
  {
    stem: 'The Avanti Reviewer Books are **noteworthy** materials.',
    choices: [{ id: 'a', text: 'remarkable' }, { id: 'b', text: 'substantial' }, { id: 'c', text: 'trivial' }, { id: 'd', text: 'significant' }],
    correct: 'c', difficulty: 1,
    explanation_en: '"Noteworthy" means deserving attention. Its antonym: "trivial" — of little importance.',
    explanation_fil: '"Noteworthy" = kapansin-pansin. Kasalungat: "trivial" (walang kahalagahan).',
  },
  {
    stem: 'You will never get sufficient nourishment if you are **obdurate** in refusing to eat vegetables.',
    choices: [{ id: 'a', text: 'stubborn' }, { id: 'b', text: 'snoopy' }, { id: 'c', text: 'nosey' }, { id: 'd', text: 'interfering' }],
    correct: 'a', difficulty: 2,
    explanation_en: 'Note: "Obdurate" means stubbornly refusing to change. In this context, this question tests synonym recognition — "stubborn" is the closest match (the choices do not contain a clear antonym like "yielding," so this effectively tests vocabulary recognition of the word).',
    explanation_fil: '"Obdurate" = matiggas ang ulo. Sa pagitan ng mga pagpipilian, "stubborn" ang pinaka-katulad na kahulugan.',
  },
  {
    stem: 'Don\'t be so **obtrusive** but instead, mind your own business.',
    choices: [{ id: 'a', text: 'reserved' }, { id: 'b', text: 'snoopy' }, { id: 'c', text: 'nosey' }, { id: 'd', text: 'interfering' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Obtrusive" means noticeable or intrusive. Its antonym: "reserved" — unobtrusive, keeping to oneself.',
    explanation_fil: '"Obtrusive" = mapanghimasok. Kasalungat: "reserved" (mapigilan, hindi nakikialam).',
  },
  {
    stem: 'I admire people who are modest despite their **opulence**.',
    choices: [{ id: 'a', text: 'great wealth' }, { id: 'b', text: 'poverty' }, { id: 'c', text: 'affluence' }, { id: 'd', text: 'lavishness' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Opulence" means great wealth. Its antonym: "poverty."',
    explanation_fil: '"Opulence" = kayamanan. Kasalungat: "poverty" (kahirapan).',
  },
  {
    stem: 'Do you always try to be a **paragon** of virtue?',
    choices: [{ id: 'a', text: 'model' }, { id: 'b', text: 'example' }, { id: 'c', text: 'yardstick' }, { id: 'd', text: 'anomaly' }],
    correct: 'd', difficulty: 3,
    explanation_en: '"Paragon" means a person or thing regarded as a perfect example. Its antonym: "anomaly" — something that deviates from the standard.',
    explanation_fil: '"Paragon" = perpektong halimbawa. Kasalungat: "anomaly" (hindi karaniwan, pagbubukod).',
  },
  {
    stem: 'Tragic stories have so much **pathos** that they left me feeling down.',
    choices: [{ id: 'a', text: 'anguish' }, { id: 'b', text: 'woe' }, { id: 'c', text: 'intrigue' }, { id: 'd', text: 'humor' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Pathos" is a quality that evokes sadness or pity. Its antonym: "humor" — quality that evokes amusement.',
    explanation_fil: '"Pathos" = nagdudulot ng kalungkutan. Kasalungat: "humor" (nagdudulot ng tawa).',
  },
  {
    stem: 'Myrna is such a **precocious** girl who can already read at age three.',
    choices: [{ id: 'a', text: 'slow learner' }, { id: 'b', text: 'bright' }, { id: 'c', text: 'inquisitive' }, { id: 'd', text: 'advanced' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Precocious" means having developed abilities at an early age. Its antonym: "slow learner."',
    explanation_fil: '"Precocious" = maaga ang pag-unlad. Kasalungat: "slow learner" (mahina ang pag-aaral).',
  },
  {
    stem: 'She had the **quixotic** idea that she was a reincarnation of a British princess.',
    choices: [{ id: 'a', text: 'wild' }, { id: 'b', text: 'fantastic' }, { id: 'c', text: 'realistic' }, { id: 'd', text: 'dreamy' }],
    correct: 'c', difficulty: 3,
    explanation_en: '"Quixotic" means extremely idealistic and impractical. Its antonym: "realistic" — sensible and practical.',
    explanation_fil: '"Quixotic" = napaka-idealista at hindi praktikal. Kasalungat: "realistic."',
  },
  {
    stem: 'The **ramshackle** building collapsed easily.',
    choices: [{ id: 'a', text: 'new' }, { id: 'b', text: 'old' }, { id: 'c', text: 'outdated' }, { id: 'd', text: 'shabby' }],
    correct: 'a', difficulty: 1,
    explanation_en: '"Ramshackle" means in a very bad state of repair. Its antonym: "new" — newly built and sturdy.',
    explanation_fil: '"Ramshackle" = gumuguho na gusali. Kasalungat: "new."',
  },
  {
    stem: 'An A-rating represents the **ultimate** honor a film will ever have.',
    choices: [{ id: 'a', text: 'greatest' }, { id: 'b', text: 'pinnacle' }, { id: 'c', text: 'least' }, { id: 'd', text: 'supreme' }],
    correct: 'c', difficulty: 1,
    explanation_en: '"Ultimate" means the best or highest. Its antonym: "least."',
    explanation_fil: '"Ultimate" = pinakamataas. Kasalungat: "least" (pinakamababa).',
  },
  {
    stem: 'Juan Luna\'s painting abilities are **uncanny**.',
    choices: [{ id: 'a', text: 'remarkable' }, { id: 'b', text: 'ordinary' }, { id: 'c', text: 'astonishing' }, { id: 'd', text: 'unbelievable' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Uncanny" means strange or remarkable. Its antonym: "ordinary" — nothing exceptional.',
    explanation_fil: '"Uncanny" = kahanga-hanga at kakaiba. Kasalungat: "ordinary" (karaniwan).',
  },
  {
    stem: 'Lea Salonga\'s performance was **utterly** delightful.',
    choices: [{ id: 'a', text: 'somewhat' }, { id: 'b', text: 'entirely' }, { id: 'c', text: 'thoroughly' }, { id: 'd', text: 'absolutely' }],
    correct: 'a', difficulty: 2,
    explanation_en: '"Utterly" means completely and without qualification. Its antonym: "somewhat" — to a moderate extent.',
    explanation_fil: '"Utterly" = ganap na. Kasalungat: "somewhat" (medyo lamang).',
  },
  {
    stem: 'The strong current of the floodwaters caused the wooden bridge to **vacillate**.',
    choices: [{ id: 'a', text: 'collapse' }, { id: 'b', text: 'sway' }, { id: 'c', text: 'vibrate' }, { id: 'd', text: 'be firm' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Vacillate" means to waver or sway indecisively. Its antonym: "be firm" — solid and unwavering.',
    explanation_fil: '"Vacillate" = mangurog o matitisod. Kasalungat: "be firm" (matatag).',
  },
  {
    stem: 'The **vindictive** politician spread rumors about his opponent.',
    choices: [{ id: 'a', text: 'revengeful' }, { id: 'b', text: 'forgiving' }, { id: 'c', text: 'spiteful' }, { id: 'd', text: 'malicious' }],
    correct: 'b', difficulty: 2,
    explanation_en: '"Vindictive" means seeking revenge. Its antonym: "forgiving."',
    explanation_fil: '"Vindictive" = galit at naghahanap ng paghihiganti. Kasalungat: "forgiving" (mapagpatawad).',
  },
  {
    stem: 'If words were swords, then her **vitriolic** remarks could really kill.',
    choices: [{ id: 'a', text: 'scathing' }, { id: 'b', text: 'sarcastic' }, { id: 'c', text: 'satirical' }, { id: 'd', text: 'kind' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Vitriolic" means filled with bitter criticism or malice. Its antonym: "kind."',
    explanation_fil: '"Vitriolic" = masakit na mga salita. Kasalungat: "kind" (mabait).',
  },
  {
    stem: 'Many students **vouch** for the effectiveness of the review classes.',
    choices: [{ id: 'a', text: 'guarantee' }, { id: 'b', text: 'endorse' }, { id: 'c', text: 'affirm' }, { id: 'd', text: 'refute' }],
    correct: 'd', difficulty: 2,
    explanation_en: '"Vouch" means to confirm or guarantee. Its antonym: "refute" — to disprove or deny.',
    explanation_fil: '"Vouch" = magpatunay. Kasalungat: "refute" (ipapawalang-bisa).',
  },
  {
    stem: 'That **yonder** youth is more studious than the nearer one.',
    choices: [{ id: 'a', text: 'lonesome' }, { id: 'b', text: 'farther' }, { id: 'c', text: 'closer' }, { id: 'd', text: 'thither' }],
    correct: 'c', difficulty: 2,
    explanation_en: '"Yonder" means at a distance, over there. Its antonym: "closer" — nearer in position.',
    explanation_fil: '"Yonder" = doon sa malayo. Kasalungat: "closer" (mas malapit).',
  },
  {
    stem: 'Avanti Tutors are all **zealous** tutors who nourish eager minds.',
    choices: [{ id: 'a', text: 'vigorous' }, { id: 'b', text: 'earnest' }, { id: 'c', text: 'indifferent' }, { id: 'd', text: 'enthusiastic' }],
    correct: 'c', difficulty: 1,
    explanation_en: '"Zealous" means having great energy or enthusiasm. Its antonym: "indifferent" — without interest or enthusiasm.',
    explanation_fil: '"Zealous" = masigasig. Kasalungat: "indifferent" (walang interes).',
  },
  {
    stem: 'Don\'t let **trivial** things upset you.',
    choices: [{ id: 'a', text: 'important' }, { id: 'b', text: 'trifling' }, { id: 'c', text: 'ordinary' }, { id: 'd', text: 'inconsequential' }],
    correct: 'a', difficulty: 1,
    explanation_en: '"Trivial" means of little value or importance. Its antonym: "important."',
    explanation_fil: '"Trivial" = walang kahalagahan. Kasalungat: "important" (mahalaga).',
  },
];

async function insertBatch(questions, subtype, sourceNote) {
  let count = 0;
  for (const q of questions) {
    // Insert for CSE Professional
    let { error } = await sb.from('questions').insert({
      topic_id: TOPICS.proVocab,
      stem: q.stem,
      choices: q.choices,
      correct_choice_id: q.correct,
      explanation_en: q.explanation_en,
      explanation_fil: q.explanation_fil,
      difficulty: q.difficulty,
      status: 'published',
      is_verified: true,
      source_note: sourceNote,
    });
    if (error) { console.error(`  ✗ Pro ${subtype} "${q.stem.slice(0,30)}":`, error.message); continue; }

    // Insert for CSE Sub-Professional
    ({ error } = await sb.from('questions').insert({
      topic_id: TOPICS.subVocab,
      stem: q.stem,
      choices: q.choices,
      correct_choice_id: q.correct,
      explanation_en: q.explanation_en,
      explanation_fil: q.explanation_fil,
      difficulty: q.difficulty,
      status: 'published',
      is_verified: true,
      source_note: sourceNote,
    }));
    if (error) { console.error(`  ✗ Sub ${subtype} "${q.stem.slice(0,30)}":`, error.message); continue; }

    count++;
  }
  return count;
}

async function main() {
  console.log('\n📖 Inserting Synonyms (40) + Antonyms (40) for both Pro and Sub...\n');

  const synCount = await insertBatch(SYNONYMS, 'Synonym', SOURCE_SYN);
  console.log(`  Synonyms: ${synCount}/${SYNONYMS.length} pairs inserted per exam level.`);

  const antCount = await insertBatch(ANTONYMS, 'Antonym', SOURCE_ANT);
  console.log(`  Antonyms: ${antCount}/${ANTONYMS.length} pairs inserted per exam level.`);

  const { count: total } = await sb.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published');
  console.log(`\n✅ Done! Total published questions in DB: ${total}`);
  console.log(`   (+${synCount * 2 + antCount * 2} new questions across Pro + Sub)`);
}

main().catch(console.error);
