/**
 * CSE Question Bank — Step 6: Single-Word & Double-Word Analogies
 * Topic: word-association (CSE Professional Analytical only — Pro exam)
 * Source: CSE Reviewer 2026, pages 48–62
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// CSE Professional Analytical → word-association
const TOPIC_PRO = '93402385-8ef0-4369-ba42-5883dcd52fbf';

async function insert(rows) {
  const { error } = await sb.from('questions').insert(rows);
  if (error) { console.error('Insert error:', error.message); process.exit(1); }
}

// ── Single-Word Analogy (40 questions — Pro only) ─────────────────────────
const singleWordAnalogies = [
  {
    stem: 'Moby Dick : Herman Melville || The Old Man and the Sea : ___',
    choices: [
      { id: 'a', text: 'Charles Dickens' },
      { id: 'b', text: 'Ernest Hemingway' },
      { id: 'c', text: 'Charles Perrault' },
      { id: 'd', text: 'Robert Frost' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'The analogy is WORK:AUTHOR. "The Old Man and the Sea" was written by Ernest Hemingway, just as "Moby Dick" was written by Herman Melville.',
    explanation_fil: 'Ang analohiya ay OBRA:MAY-AKDA. Ang "The Old Man and the Sea" ay isinulat ni Ernest Hemingway, tulad ng "Moby Dick" na isinulat ni Herman Melville.',
  },
  {
    stem: 'Confucius : China || Mahatma Gandhi : ___',
    choices: [
      { id: 'a', text: 'India' },
      { id: 'b', text: 'Japan' },
      { id: 'c', text: 'Africa' },
      { id: 'd', text: 'Philippines' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'The analogy is FAMOUS PERSON:COUNTRY OF ORIGIN. Confucius is from China; Mahatma Gandhi is from India.',
    explanation_fil: 'Ang analohiya ay BANTOG NA TAO:BANSANG PINAGMULAN. Si Confucius ay mula sa Tsina; si Mahatma Gandhi naman ay mula sa India.',
  },
  {
    stem: 'BIR : Taxes || DPWH : ___',
    choices: [
      { id: 'a', text: 'Public Roads' },
      { id: 'b', text: 'Houses' },
      { id: 'c', text: 'Traffic' },
      { id: 'd', text: 'Churches' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'AGENCY:JURISDICTION. The Bureau of Internal Revenue (BIR) handles taxes; the Department of Public Works and Highways (DPWH) handles public roads and infrastructure.',
    explanation_fil: 'AHENSYA:NASASAKUPAN. Ang BIR (Bureau of Internal Revenue) ay nangangasiwa ng buwis; ang DPWH (Department of Public Works and Highways) naman ay nangangasiwa ng mga pampublikong kalsada.',
  },
  {
    stem: 'Barangay : Captain || Provincial Government : ___',
    choices: [
      { id: 'a', text: 'Congressmen' },
      { id: 'b', text: 'Mayor' },
      { id: 'c', text: 'Senator' },
      { id: 'd', text: 'Governor' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'GOVERNMENT UNIT:CHIEF OFFICIAL. A Barangay is headed by a Captain (Barangay Captain); a Province is headed by a Governor.',
    explanation_fil: 'YUNIT NG PAMAHALAAN:PINUNO. Ang Barangay ay pinamumunuan ng isang Kapitan (Barangay Captain); ang Lalawigan (Province) naman ay pinamumunuan ng Gobernador.',
  },
  {
    stem: 'USA : Washington D.C. || Philippines : ___',
    choices: [
      { id: 'a', text: 'Prime Minister' },
      { id: 'b', text: 'King' },
      { id: 'c', text: 'Manila' },
      { id: 'd', text: 'Cebu' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'COUNTRY:CAPITAL CITY. Washington D.C. is the capital of the USA; Manila is the capital of the Philippines.',
    explanation_fil: 'BANSA:KABISERA. Ang Washington D.C. ang kabisera ng USA; ang Maynila naman ang kabisera ng Pilipinas.',
  },
  {
    stem: 'Presidential System : President || Parliamentary System : ___',
    choices: [
      { id: 'a', text: 'Prime Minister' },
      { id: 'b', text: 'King' },
      { id: 'c', text: 'House Speaker' },
      { id: 'd', text: 'Cardinal' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'GOVERNMENT SYSTEM:CHIEF EXECUTIVE. In a Presidential system, the head of government is the President; in a Parliamentary system, the head of government is the Prime Minister.',
    explanation_fil: 'SISTEMA NG PAMAHALAAN:PUNONG EHEKUTIBO. Sa Presidential system, ang Presidente ang pinuno ng pamahalaan; sa Parliamentary system naman, ang Prime Minister ang pinuno.',
  },
  {
    stem: 'Tagbanua : Palawan || Kankanaey : ___',
    choices: [
      { id: 'a', text: 'Ilocos' },
      { id: 'b', text: 'Cavite' },
      { id: 'c', text: 'Benguet' },
      { id: 'd', text: 'Cebu' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'INDIGENOUS PEOPLE:REGION OF ORIGIN. The Tagbanua are indigenous to Palawan; the Kankanaey are indigenous to the Cordillera region, particularly Benguet.',
    explanation_fil: 'KATUTUBONG PANGKAT:LUGAR NG PINAGMULAN. Ang mga Tagbanua ay katutubong taga-Palawan; ang mga Kankanaey naman ay mula sa Cordillera, lalo na sa Benguet.',
  },
  {
    stem: 'Pyramid : Egypt || Taj Mahal : ___',
    choices: [
      { id: 'a', text: 'China' },
      { id: 'b', text: 'Japan' },
      { id: 'c', text: 'India' },
      { id: 'd', text: 'Malaysia' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'WORLD WONDER/LANDMARK:COUNTRY. The Pyramids are in Egypt; the Taj Mahal is in India (Agra).',
    explanation_fil: 'BANTAYOG/LANDMARK:BANSA. Ang mga Pyramid ay nasa Ehipto; ang Taj Mahal naman ay nasa India (Agra).',
  },
  {
    stem: 'Tigris-Euphrates : Mesopotamia || Nile River : ___',
    choices: [
      { id: 'a', text: 'Egypt' },
      { id: 'b', text: 'Greece' },
      { id: 'c', text: 'Italy' },
      { id: 'd', text: 'Spain' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'RIVER:ANCIENT CIVILIZATION. The Tigris-Euphrates rivers flow through Mesopotamia (modern Iraq); the Nile River flows through Egypt.',
    explanation_fil: 'ILOG:SINAUNANG SIBILISASYON. Ang mga ilog na Tigris-Euphrates ay dumadaan sa Mesopotamia (modernong Iraq); ang Ilog Nile naman ay dumadaan sa Ehipto.',
  },
  {
    stem: 'Mahabharata : India || Gilgamesh : ___',
    choices: [
      { id: 'a', text: 'Assyria' },
      { id: 'b', text: 'Sumer' },
      { id: 'c', text: 'Chaldea' },
      { id: 'd', text: 'Babylon' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'EPIC:CULTURE OF ORIGIN. The Mahabharata is an epic from ancient India; the Epic of Gilgamesh originated in ancient Sumer (Sumerian civilization).',
    explanation_fil: 'EPIKO:SIBILISASYONG PINAGMULAN. Ang Mahabharata ay isang epiko mula sa sinaunang India; ang Epiko ni Gilgamesh naman ay nagmula sa sinaunang Sumer (Sumerian civilization).',
  },
  {
    stem: 'Italy : Latin || Greece : ___',
    choices: [
      { id: 'a', text: 'Grecian' },
      { id: 'b', text: 'French' },
      { id: 'c', text: 'Greek' },
      { id: 'd', text: 'Greece' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'COUNTRY:CLASSICAL LANGUAGE. The classical language of Italy is Latin; the classical language of Greece is Greek.',
    explanation_fil: 'BANSA:KLASIKAL NA WIKA. Ang klasikal na wika ng Italy ay Latin; ang klasikal na wika ng Greece naman ay Greek.',
  },
  {
    stem: 'Sistine Madonna : Raphael || Last Supper : ___',
    choices: [
      { id: 'a', text: 'Michelangelo' },
      { id: 'b', text: 'Leonardo da Vinci' },
      { id: 'c', text: 'Rembrandt' },
      { id: 'd', text: 'Van Gogh' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'PAINTING:ARTIST. The "Sistine Madonna" was painted by Raphael; "The Last Supper" was painted by Leonardo da Vinci.',
    explanation_fil: 'OBRA-MAESTRA:PINTOR. Ang "Sistine Madonna" ay ipininta ni Raphael; ang "The Last Supper" naman ay ipininta ni Leonardo da Vinci.',
  },
  {
    stem: 'Stalagmite : Floor || Stalactite : ___',
    choices: [
      { id: 'a', text: 'Wall' },
      { id: 'b', text: 'Ceiling' },
      { id: 'c', text: 'Mouth' },
      { id: 'd', text: 'Window' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'CAVE FORMATION:WHERE IT GROWS FROM. Stalagmites grow upward from the floor of a cave; stalactites hang downward from the ceiling. Mnemonic: stalagTITE holds TIGHT to the ceiling.',
    explanation_fil: 'PORMASYON SA YUNGIB:PINAGSILANGAN. Ang stalagmite ay tumutubo pataas mula sa sahig ng yungib; ang stalactite naman ay nakabitin pababa mula sa kisame. Tandaan: stalagTITE ay nakabitin sa ceiling.',
  },
  {
    stem: 'Catholic : Priest || Moslem : ___',
    choices: [
      { id: 'a', text: 'Rajah' },
      { id: 'b', text: 'Hajji' },
      { id: 'c', text: 'Koran' },
      { id: 'd', text: 'Imam' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'RELIGION:RELIGIOUS LEADER. In the Catholic faith, the religious leader is a Priest; in Islam, the leader of prayer is an Imam.',
    explanation_fil: 'RELIHIYON:LIDER PANRELIHIYON. Sa Katolisismo, ang lider panrelihiyon ay Pari (Priest); sa Islam naman, ang lider ng panalangin ay ang Imam.',
  },
  {
    stem: 'Giovanni Boccaccio : Decameron || Niccolò Machiavelli : ___',
    choices: [
      { id: 'a', text: 'The Little Prince' },
      { id: 'b', text: 'Utopia' },
      { id: 'c', text: 'The Prince' },
      { id: 'd', text: 'Wealth of Nations' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'AUTHOR:FAMOUS WORK. Giovanni Boccaccio wrote the "Decameron"; Niccolò Machiavelli wrote "The Prince" (Il Principe), a landmark work in political philosophy.',
    explanation_fil: 'AWTOR:BANTOG NA OBRA. Si Giovanni Boccaccio ay sumulat ng "Decameron"; si Niccolò Machiavelli naman ay sumulat ng "The Prince" (Il Principe), isang makasaysayang aklat sa pilosopiyang pampolitika.',
  },
  {
    stem: 'Samuel Morse : Telegraph || Alexander Graham Bell : ___',
    choices: [
      { id: 'a', text: 'Telescope' },
      { id: 'b', text: 'Telephone' },
      { id: 'c', text: 'Teleportation' },
      { id: 'd', text: 'Door bell' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'INVENTOR:INVENTION. Samuel Morse invented the Telegraph; Alexander Graham Bell invented the Telephone.',
    explanation_fil: 'IMBENTOR:IMBENSIYON. Si Samuel Morse ay nag-imbento ng Telegrapo; si Alexander Graham Bell naman ay nag-imbento ng Telepono.',
  },
  {
    stem: 'Parachute : André Jacques Garnerin || Television : ___',
    choices: [
      { id: 'a', text: 'John Logie Baird' },
      { id: 'b', text: 'William Sony' },
      { id: 'c', text: 'John Vincent Crowe' },
      { id: 'd', text: 'Howard Aiken' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'INVENTION:INVENTOR. André Jacques Garnerin invented/demonstrated the parachute; John Logie Baird invented the Television.',
    explanation_fil: 'IMBENSIYON:IMBENTOR. Si André Jacques Garnerin ang nag-imbento ng parachute; si John Logie Baird naman ang nag-imbento ng Telebisyon.',
  },
  {
    stem: 'Earth is the center (geocentric) : Ptolemy || Sun is the center (heliocentric) : ___',
    choices: [
      { id: 'a', text: 'Albert Einstein' },
      { id: 'b', text: 'Aristotle' },
      { id: 'c', text: 'Galileo' },
      { id: 'd', text: 'Copernicus' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'ASTRONOMICAL THEORY:PROPONENT. Ptolemy proposed the geocentric (Earth-centered) model; Nicolaus Copernicus proposed the heliocentric (Sun-centered) model.',
    explanation_fil: 'TEORYANG ASTRONOMIKO:TAGAPAGTAGUYOD. Si Ptolemy ang nagmungkahi ng geocentric model (Lupa ang sentro); si Nicolaus Copernicus naman ang nagmungkahi ng heliocentric model (Araw ang sentro).',
  },
  {
    stem: 'Pythagorean Theorem : Pythagoras || Cubic Equation Solution : ___',
    choices: [
      { id: 'a', text: 'Alfred Nobel' },
      { id: 'b', text: 'Isaac Newton' },
      { id: 'c', text: 'Tartaglia' },
      { id: 'd', text: 'René Descartes' },
    ],
    correct: 'c', difficulty: 3,
    explanation_en: 'MATHEMATICAL CONCEPT:MATHEMATICIAN WHO FORMULATED IT. The Pythagorean Theorem is attributed to Pythagoras; the general solution to cubic equations is credited to Niccolò Tartaglia (Italian mathematician).',
    explanation_fil: 'KONSEPTO SA MATEMATIKA:MATEMATIKONG NAGPAUNLAD NITO. Ang Pythagorean Theorem ay iniuugnay kay Pythagoras; ang pangkalahatang solusyon sa cubic equations naman ay iniuugnay kay Niccolò Tartaglia.',
  },
  {
    stem: 'Henry Cavendish : Hydrogen || Joseph Priestley : ___',
    choices: [
      { id: 'a', text: 'Carbonic acid' },
      { id: 'b', text: 'Oxygen' },
      { id: 'c', text: 'Radium' },
      { id: 'd', text: 'Potassium' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'SCIENTIST:ELEMENT DISCOVERED. Henry Cavendish discovered Hydrogen; Joseph Priestley discovered Oxygen (independently of Carl Wilhelm Scheele).',
    explanation_fil: 'SIYENTIPIKO:ELEMENTONG NATUKLASAN. Si Henry Cavendish ang natuklasan ang Hydrogen; si Joseph Priestley naman ang natuklasan ang Oxygen.',
  },
  {
    stem: 'Allied Powers : Russia || Central Powers : ___',
    choices: [
      { id: 'a', text: 'France' },
      { id: 'b', text: 'Britain' },
      { id: 'c', text: 'Italy' },
      { id: 'd', text: 'Austria' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'ALLIANCE:MEMBER COUNTRY (WWI). Russia was a member of the Allied Powers (Entente); Austria-Hungary was a member of the Central Powers.',
    explanation_fil: 'ALYANSA:MIYEMBRO (WWI). Ang Russia ay miyembro ng Allied Powers; ang Austria-Hungary naman ay miyembro ng Central Powers.',
  },
  {
    stem: 'Entourage : Attendants || Cortege : ___',
    choices: [
      { id: 'a', text: 'Procession for a Saint' },
      { id: 'b', text: 'Procession in court' },
      { id: 'c', text: 'Funeral Procession' },
      { id: 'd', text: 'Floral Procession' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'WORD:DEFINITION. An "entourage" is a group of attendants accompanying an important person; a "cortege" is a solemn funeral procession.',
    explanation_fil: 'SALITA:KAHULUGAN. Ang "entourage" ay isang grupo ng mga taong sumasaklaw sa isang mahalagang tao; ang "cortege" naman ay isang malupit/solemne na prusisyon para sa libing.',
  },
  {
    stem: 'Islet : Small Island || Rivulet : ___',
    choices: [
      { id: 'a', text: 'Small River' },
      { id: 'b', text: 'Small Land' },
      { id: 'c', text: 'Small Review' },
      { id: 'd', text: 'Small Rebel' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'WORD:DEFINITION. An "islet" is a small island; a "rivulet" is a small river or stream. The suffix "-let" or "-ulet" often denotes something smaller.',
    explanation_fil: 'SALITA:KAHULUGAN. Ang "islet" ay isang maliit na isla; ang "rivulet" naman ay isang maliit na ilog o sapa. Ang panlapi na "-let" o "-ulet" ay kadalasang nagpapahiwatig ng isang bagay na mas maliit.',
  },
  {
    stem: 'Conspicuous : Obvious || Hideous : ___',
    choices: [
      { id: 'a', text: 'Hidden' },
      { id: 'b', text: 'Ugly' },
      { id: 'c', text: 'Expert in hiding' },
      { id: 'd', text: 'Very bad' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'WORD:SYNONYM/DEFINITION. "Conspicuous" means obvious/easily noticed; "Hideous" means extremely bad, awful, or horrifying (not just ugly, but intensely bad).',
    explanation_fil: 'SALITA:KASINGKAHULUGAN/KAHULUGAN. Ang "conspicuous" ay nangangahulugang halatang-halata; ang "hideous" naman ay nangangahulugang napaka-sama, kahindik-hindik, o kakila-kilabot.',
  },
  {
    stem: 'Nose : Nasal || Abdomen : ___',
    choices: [
      { id: 'a', text: 'Abnormal' },
      { id: 'b', text: 'Abdominal' },
      { id: 'c', text: 'Abominate' },
      { id: 'd', text: 'Adenoma' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'BODY PART:ADJECTIVE FORM. The adjective for "nose" is "nasal"; the adjective for "abdomen" is "abdominal."',
    explanation_fil: 'BAHAGI NG KATAWAN:PANG-URI NA ANYO. Ang pang-uri para sa "nose" (ilong) ay "nasal"; ang pang-uri para sa "abdomen" (tiyan) naman ay "abdominal."',
  },
  {
    stem: 'Agnostic : Doubts God\'s existence || Atheist : ___',
    choices: [
      { id: 'a', text: 'Denies God\'s existence' },
      { id: 'b', text: 'Denies God as creator' },
      { id: 'c', text: 'Affirms God\'s existence' },
      { id: 'd', text: 'Affirms God as creator' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'TERM:BELIEF. An agnostic doubts or is uncertain about God\'s existence; an atheist denies or disbelieves in God\'s existence.',
    explanation_fil: 'TERMINO:PANINIWALA. Ang isang agnostic ay may pag-aalinlangan tungkol sa pag-iral ng Diyos; ang isang ateista (atheist) naman ay tumatanggi sa pag-iral ng Diyos.',
  },
  {
    stem: 'Infanticide : Killing of infants || Genocide : ___',
    choices: [
      { id: 'a', text: 'Killing of genies' },
      { id: 'b', text: 'Killing of geniuses' },
      { id: 'c', text: 'Killing of a race or social group' },
      { id: 'd', text: 'Killing of Geno' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'TERM:DEFINITION. "Infanticide" is the killing of infants; "genocide" is the deliberate killing of a large group of people from a particular nation or ethnic group.',
    explanation_fil: 'TERMINO:KAHULUGAN. Ang "infanticide" ay ang pagpatay ng mga sanggol; ang "genocide" naman ay ang sadyang pagpatay ng malaking bilang ng tao mula sa isang partikular na bansa o pangkat-etniko.',
  },
  {
    stem: 'Latrine : Toilet || Lavatory : ___',
    choices: [
      { id: 'a', text: 'Basin' },
      { id: 'b', text: 'Tub' },
      { id: 'c', text: 'Sink' },
      { id: 'd', text: 'Bathroom' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'SYNONYMS. A "latrine" is another word for a toilet (especially an outdoor facility); a "lavatory" is another word for a bathroom or washroom.',
    explanation_fil: 'MAGKASINGKAHULUGAN. Ang "latrine" ay isa pang salita para sa palikuran (lalo na sa labas); ang "lavatory" naman ay isa pang salita para sa banyo.',
  },
  {
    stem: 'Masticate : Chew || Eradicate : ___',
    choices: [
      { id: 'a', text: 'Collect' },
      { id: 'b', text: 'Count' },
      { id: 'c', text: 'Complete' },
      { id: 'd', text: 'Throw' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'WORD:SIMPLIFIED MEANING. "Masticate" means to chew; "eradicate" literally means to uproot or throw out (from Latin "eradicare" = e- out + radix root), i.e., to throw out completely.',
    explanation_fil: 'SALITA:SIMPLENG KAHULUGAN. Ang "masticate" ay nangangahulugang ngumuya; ang "eradicate" naman ay literal na nangangahulugang bunutin o itapon (mula sa Latin "eradicare" = e- labas + radix ugat), ibig sabihin, alisin nang tuluyan.',
  },
  {
    stem: 'Sadism : Delight in cruelty to others || Masochism : ___',
    choices: [
      { id: 'a', text: 'Delight in building houses' },
      { id: 'b', text: 'Delight in hurting masons' },
      { id: 'c', text: 'Delight in being abused' },
      { id: 'd', text: 'Delight in going to Masses' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'TERM:DEFINITION. "Sadism" is the tendency to derive pleasure from inflicting pain on others; "masochism" is the tendency to derive pleasure from one\'s own pain or humiliation.',
    explanation_fil: 'TERMINO:KAHULUGAN. Ang "sadism" ay ang pagkuha ng kasiyahan sa pagdurusa ng iba; ang "masochism" naman ay ang pagkuha ng kasiyahan sa sariling pagdurusa o kahihiyan.',
  },
  {
    stem: 'Mazurka : Polish || Fandango : ___',
    choices: [
      { id: 'a', text: 'Russian' },
      { id: 'b', text: 'Spanish' },
      { id: 'c', text: 'German' },
      { id: 'd', text: 'Polish' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'DANCE:COUNTRY OF ORIGIN. The Mazurka is a traditional Polish dance; the Fandango is a lively Spanish dance.',
    explanation_fil: 'SAYAW:BANSANG PINAGMULAN. Ang Mazurka ay isang tradisyonal na sayaw ng Poland; ang Fandango naman ay isang masayang sayaw ng Espanya.',
  },
  {
    stem: 'Nearsighted : Myopia || Farsighted : ___',
    choices: [
      { id: 'a', text: 'Hyperopia' },
      { id: 'b', text: 'Squint' },
      { id: 'c', text: 'Double-vision' },
      { id: 'd', text: 'Blink' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'COMMON TERM:MEDICAL TERM. "Nearsighted" (difficulty seeing far) is medically called "myopia"; "farsighted" (difficulty seeing near) is medically called "hyperopia."',
    explanation_fil: 'KARANIWANG TERMINO:MEDIKAL NA TERMINO. Ang "nearsighted" (mahirap makita ang malayo) ay tinatawag na "myopia" sa medikal; ang "farsighted" (mahirap makita ang malapit) naman ay tinatawag na "hyperopia."',
  },
  {
    stem: 'Dyslexia : Reading || Aphasia : ___',
    choices: [
      { id: 'a', text: 'Muscle coordination' },
      { id: 'b', text: 'Speech' },
      { id: 'c', text: 'Eye movement' },
      { id: 'd', text: 'Memory' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'DISORDER:AFFECTED FUNCTION. "Dyslexia" is a disorder affecting reading ability; "aphasia" is a disorder affecting speech and language ability, usually caused by brain damage.',
    explanation_fil: 'KARAMDAMAN:APEKTADONG KAKAYAHAN. Ang "dyslexia" ay isang karamdamang nakakaapekto sa kakayahang magbasa; ang "aphasia" naman ay isang karamdamang nakakaapekto sa kakayahang magsalita at gamitin ang wika.',
  },
  {
    stem: 'Maître d\' : Head of a restaurant || Busboy : ___',
    choices: [
      { id: 'a', text: 'Bus conductor' },
      { id: 'b', text: 'Bus cleaner' },
      { id: 'c', text: 'Waiter\'s helper' },
      { id: 'd', text: 'Head waiter' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'TERM:DEFINITION. A "maître d\'" (maître d\'hôtel) is the head of a restaurant or the person overseeing waitstaff; a "busboy" is a restaurant worker who assists waiters by clearing tables.',
    explanation_fil: 'TERMINO:KAHULUGAN. Ang "maître d\'" (maître d\'hôtel) ay ang pinuno ng isang restawran o ang nangangasiwa sa mga waiter; ang "busboy" naman ay isang manggagawa sa restawran na tumutulong sa mga waiter sa pag-aayos ng mesa.',
  },
  {
    stem: 'Figurine : Small figure || Heroine : ___',
    choices: [
      { id: 'a', text: 'Small hero' },
      { id: 'b', text: 'Female hero' },
      { id: 'c', text: 'Small drug' },
      { id: 'd', text: 'Female drug' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'WORD:DEFINITION. A "figurine" is a small figure or statuette; a "heroine" is a female hero.',
    explanation_fil: 'SALITA:KAHULUGAN. Ang "figurine" ay isang maliit na rebulto; ang "heroine" naman ay isang babaeng bayani.',
  },
  {
    stem: 'Xerox : Photocopier || Adidas : ___',
    choices: [
      { id: 'a', text: 'Athlete\'s shoes' },
      { id: 'b', text: 'Dress shoes' },
      { id: 'c', text: 'Formal wear' },
      { id: 'd', text: 'Handsome' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'BRAND NAME:PRODUCT CATEGORY. "Xerox" is a brand name used generically for a photocopier; "Adidas" is a brand name known for athlete\'s shoes and sportswear.',
    explanation_fil: 'PANGALAN NG BRAND:KATEGORYA NG PRODUKTO. Ang "Xerox" ay isang pangalan ng brand na ginagamit para sa photocopier; ang "Adidas" naman ay isang pangalan ng brand na kilala para sa sapatos ng mga atleta at sportswear.',
  },
  {
    stem: 'Sayonara : Goodbye || Bonjour : ___',
    choices: [
      { id: 'a', text: 'Good luck' },
      { id: 'b', text: 'Good day' },
      { id: 'c', text: 'Good night' },
      { id: 'd', text: 'Good evening' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'FOREIGN WORD:ENGLISH TRANSLATION. "Sayonara" (Japanese) means Goodbye; "Bonjour" (French) means Good day/Hello.',
    explanation_fil: 'DAYUHANG SALITA:SALIN SA INGLES. Ang "Sayonara" (Hapon) ay nangangahulugang Paalam; ang "Bonjour" (Pranses) naman ay nangangahulugang Magandang araw/Kumusta.',
  },
  {
    stem: 'Superfluous : Excessive || Supersede : ___',
    choices: [
      { id: 'a', text: 'Watch over' },
      { id: 'b', text: 'Full of seeds' },
      { id: 'c', text: 'Great seed' },
      { id: 'd', text: 'Take the place of' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'WORD:DEFINITION. "Superfluous" means more than is needed or excessive; "supersede" means to take the place of (a person or thing previously in authority).',
    explanation_fil: 'SALITA:KAHULUGAN. Ang "superfluous" ay nangangahulugang labis o higit sa kailangan; ang "supersede" naman ay nangangahulugang palitan o kumuha ng lugar ng (isang tao o bagay na dati ay may awtoridad).',
  },
  {
    stem: 'Nativity : Christmas || Senakulo : ___',
    choices: [
      { id: 'a', text: 'Advent' },
      { id: 'b', text: 'Lent' },
      { id: 'c', text: 'Pentecost' },
      { id: 'd', text: 'Passover' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'RELIGIOUS DRAMA:LITURGICAL SEASON. The Nativity play commemorates the birth of Jesus during Christmas; the Senakulo is a Philippine Passion play depicting the life, suffering, and death of Jesus, performed during Lent (Holy Week).',
    explanation_fil: 'RELIHIYOSONG DULA:LITURGIKAL NA PANAHON. Ang Nativity play ay nagdiriwang ng kapanganakan ni Hesus tuwing Pasko; ang Senakulo naman ay isang Pilipinong dula tungkol sa buhay, pagdurusa, at kamatayan ni Hesus, na isinasagawa tuwing Kuwaresma (Mahal na Araw).',
  },
  {
    stem: 'Theme : Main idea || Moral : ___',
    choices: [
      { id: 'a', text: 'A value' },
      { id: 'b', text: 'A desire' },
      { id: 'c', text: 'A piece of advice' },
      { id: 'd', text: 'A standard' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'LITERARY TERM:DEFINITION. The "theme" of a story is its main idea or central topic; the "moral" of a story is the lesson or piece of advice that can be derived from it.',
    explanation_fil: 'TERMINONG PAMPANITIKAN:KAHULUGAN. Ang "theme" ng isang kwento ay ang pangunahing ideya o sentral na paksa nito; ang "moral" naman ng isang kwento ay ang aral o payo na maaaring makuha mula rito.',
  },
];

// ── Double-Word Analogy (40 questions — Pro only) ─────────────────────────
const doubleWordAnalogies = [
  {
    stem: 'blend : mix || ___ : ___',
    choices: [
      { id: 'a', text: 'blare : whisper' },
      { id: 'b', text: 'bleach : whiten' },
      { id: 'c', text: 'blink : blink' },
      { id: 'd', text: 'bloom : flower' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'SYNONYMS. "Blend" and "mix" are synonyms (to combine); "bleach" and "whiten" are synonyms (to make white/lighter).',
    explanation_fil: 'MAGKASINGKAHULUGAN. Ang "blend" at "mix" ay magkasingkahulugan (pagsasama); ang "bleach" at "whiten" naman ay magkasingkahulugan (gawing puti/mas maliwanag).',
  },
  {
    stem: 'abattoir : slaughterhouse || ___ : ___',
    choices: [
      { id: 'a', text: 'quay : wharf' },
      { id: 'b', text: 'quack : duck' },
      { id: 'c', text: 'snail : slow' },
      { id: 'd', text: 'clown : fun' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'SYNONYMS. An "abattoir" and a "slaughterhouse" are the same thing (a place where animals are killed for food); a "quay" and a "wharf" are both a platform alongside water for loading/unloading ships.',
    explanation_fil: 'MAGKASINGKAHULUGAN. Ang "abattoir" at "slaughterhouse" ay iisa ang kahulugan (lugar kung saan pinapatay ang mga hayop para sa pagkain); ang "quay" at "wharf" naman ay parehong plataporma sa tabi ng tubig para sa pagkarga/pagdiskarga ng mga barko.',
  },
  {
    stem: 'marriageable : nubile || ___ : ___',
    choices: [
      { id: 'a', text: 'single : group' },
      { id: 'b', text: 'music : mobile' },
      { id: 'c', text: 'puzzle : answer' },
      { id: 'd', text: 'decipherable : comprehensible' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'SYNONYMS. "Marriageable" and "nubile" are synonyms (of an age suitable for marriage); "decipherable" and "comprehensible" are synonyms (able to be understood).',
    explanation_fil: 'MAGKASINGKAHULUGAN. Ang "marriageable" at "nubile" ay magkasingkahulugan (nasa wastong gulang para ikasal); ang "decipherable" at "comprehensible" naman ay magkasingkahulugan (maaaring maunawaan).',
  },
  {
    stem: 'numismatist : money || ___ : ___',
    choices: [
      { id: 'a', text: 'aesthetics : beauty' },
      { id: 'b', text: 'fetish : obsession' },
      { id: 'c', text: 'linguist : language' },
      { id: 'd', text: 'scientist : sense' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'SPECIALIST:FIELD OF STUDY. A "numismatist" is someone who studies/collects coins and money; a "linguist" is someone who studies language.',
    explanation_fil: 'DALUBHASA:LARANGAN NG PAG-AARAL. Ang "numismatist" ay isang tao na nag-aaral/nagkolekta ng mga barya at pera; ang "linguist" naman ay isang tao na nag-aaral ng wika.',
  },
  {
    stem: 'anxious : uneasy || ___ : ___',
    choices: [
      { id: 'a', text: 'egocentric : self-centered' },
      { id: 'b', text: 'wary : placid' },
      { id: 'c', text: 'feeble : strong' },
      { id: 'd', text: 'scornful : admirable' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'SYNONYMS. "Anxious" and "uneasy" are synonyms (worried/nervous); "egocentric" and "self-centered" are synonyms (focused on oneself).',
    explanation_fil: 'MAGKASINGKAHULUGAN. Ang "anxious" at "uneasy" ay magkasingkahulugan (nag-aalala/kinakabahan); ang "egocentric" at "self-centered" naman ay magkasingkahulugan (nakatuon sa sarili).',
  },
  {
    stem: 'goat : kid || ___ : ___',
    choices: [
      { id: 'a', text: 'bear : cub' },
      { id: 'b', text: 'chicken : hen' },
      { id: 'c', text: 'dog : Dalmatian' },
      { id: 'd', text: 'tiger : tigress' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'ADULT ANIMAL:YOUNG (OFFSPRING). A young goat is called a "kid"; a young bear is called a "cub."',
    explanation_fil: 'HAYOP (MATANDA):ANAK. Ang batang kambing ay tinatawag na "kid"; ang batang oso naman ay tinatawag na "cub."',
  },
  {
    stem: 'key : lock || ___ : ___',
    choices: [
      { id: 'a', text: 'litter : trash' },
      { id: 'b', text: 'pestle : pound' },
      { id: 'c', text: 'table : desk' },
      { id: 'd', text: 'sword : scabbard' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'OBJECT:ITS CASE/HOLDER. A key fits into and opens a lock; a sword fits into a scabbard (its protective sheath).',
    explanation_fil: 'BAGAY:LALAGYAN NITO. Ang susi ay ipinasok sa kandado; ang espada naman ay ipinasok sa scabbard (balutan nito).',
  },
  {
    stem: 'dog : kennel || ___ : ___',
    choices: [
      { id: 'a', text: 'whale : pond' },
      { id: 'b', text: 'socks : feet' },
      { id: 'c', text: 'pig : sty' },
      { id: 'd', text: 'eagle : barn' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'ANIMAL:ITS HOME. A dog lives in a kennel; a pig lives in a sty (pigsty).',
    explanation_fil: 'HAYOP:TAHANAN NITO. Ang aso ay nakatira sa kennel; ang baboy naman ay nakatira sa kulungan ng baboy (pigsty/sty).',
  },
  {
    stem: 'book : leaves || ___ : ___',
    choices: [
      { id: 'a', text: 'house : kitchen' },
      { id: 'b', text: 'chimney : roof' },
      { id: 'c', text: 'fan : electricity' },
      { id: 'd', text: 'chair : sitting' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'WHOLE:PART. A book contains leaves (pages); a house contains a kitchen.',
    explanation_fil: 'KABUUAN:BAHAGI. Ang isang libro ay may mga dahon (pahina/leaves); ang isang bahay naman ay may kusina.',
  },
  {
    stem: 'panda : China || ___ : ___',
    choices: [
      { id: 'a', text: 'grizzly : Africa' },
      { id: 'b', text: 'polar bear : America' },
      { id: 'c', text: 'Pooh : Disneyland' },
      { id: 'd', text: 'koala : Australia' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'ANIMAL:COUNTRY OF ORIGIN. The giant panda is native to China; the koala is native to Australia.',
    explanation_fil: 'HAYOP:BANSANG PINANGGALINGAN. Ang panda ay katutubong hayop ng Tsina; ang koala naman ay katutubong hayop ng Australia.',
  },
  {
    stem: 'jubilant : morose || ___ : ___',
    choices: [
      { id: 'a', text: 'humble : modest' },
      { id: 'b', text: 'joyous : happy' },
      { id: 'c', text: 'simple : lavish' },
      { id: 'd', text: 'pompous : pretentious' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'ANTONYMS. "Jubilant" (extremely joyful) and "morose" (sullen, gloomy) are antonyms; "simple" (plain, unassuming) and "lavish" (extravagant, elaborate) are antonyms.',
    explanation_fil: 'MAGKASALUNGAT. Ang "jubilant" (lubos na masaya) at "morose" (malungkot, mapanglaw) ay magkasalungat; ang "simple" (payak) at "lavish" (maluho, ekstra) naman ay magkasalungat.',
  },
  {
    stem: 'tiny : microscopic || ___ : ___',
    choices: [
      { id: 'a', text: 'uproar : laughter' },
      { id: 'b', text: 'large : mammoth' },
      { id: 'c', text: 'argument : meeting' },
      { id: 'd', text: 'storm : weather' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'DEGREE/INTENSITY. "Tiny" and "microscopic" are synonyms with "microscopic" being more extreme (incredibly small); "large" and "mammoth" are synonyms with "mammoth" being more extreme (extremely large).',
    explanation_fil: 'ANTAS/INTENSIDAD. Ang "tiny" at "microscopic" ay magkasingkahulugan, na ang "microscopic" ay mas matindi (napakaliit); ang "large" at "mammoth" naman ay magkasingkahulugan, na ang "mammoth" ay mas matindi (napakalaki).',
  },
  {
    stem: 'to smile : to guffaw || ___ : ___',
    choices: [
      { id: 'a', text: 'to walk : to stroll' },
      { id: 'b', text: 'to frown : to weep' },
      { id: 'c', text: 'to munch : to eat' },
      { id: 'd', text: 'to lift : to carry' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'MILD EXPRESSION:INTENSE EXPRESSION. To "smile" is a mild expression of happiness; to "guffaw" is an intense burst of laughter. Similarly, to "frown" is a mild expression of sadness/displeasure; to "weep" is an intense expression of grief.',
    explanation_fil: 'MAHINANG PAGPAPAHAYAG:MALAKAS NA PAGPAPAHAYAG. Ang "smile" ay mahinang pagpapahayag ng kaligayahan; ang "guffaw" naman ay matinding pagtawa. Gayundin, ang "frown" ay mahinang pagpapahayag ng kalungkutan/hindi kasiyahan; ang "weep" naman ay matinding pagluha.',
  },
  {
    stem: 'hand : arm || ___ : ___',
    choices: [
      { id: 'a', text: 'foot : leg' },
      { id: 'b', text: 'hips : sway' },
      { id: 'c', text: 'waist : belt' },
      { id: 'd', text: 'shoulder : neck' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'PART:LARGER BODY PART. The hand is the terminal part of the arm; the foot is the terminal part of the leg.',
    explanation_fil: 'BAHAGI:MAS MALAKING BAHAGI NG KATAWAN. Ang kamay ay ang dulo ng braso; ang paa naman ay ang dulo ng binti.',
  },
  {
    stem: 'pre : post || ___ : ___',
    choices: [
      { id: 'a', text: 'anti : pro' },
      { id: 'b', text: 'semi : equi' },
      { id: 'c', text: 'able : can' },
      { id: 'd', text: 'demi : half' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'OPPOSITE PREFIXES. "Pre-" (before) and "post-" (after) are opposite prefixes; "anti-" (against) and "pro-" (in favor of) are also opposite prefixes.',
    explanation_fil: 'MAGKASALUNGAT NA MGA PANLAPI. Ang "pre-" (bago) at "post-" (pagkatapos) ay magkasalungat na mga panlapi; ang "anti-" (laban sa) at "pro-" (pabor sa) naman ay magkasalungat na mga panlapi.',
  },
  {
    stem: 'auditorium : audience || ___ : ___',
    choices: [
      { id: 'a', text: 'hall : pictures' },
      { id: 'b', text: 'movie house : cinema' },
      { id: 'c', text: 'coliseum : spectators' },
      { id: 'd', text: 'commuters : transportation' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'PLACE:PEOPLE WHO GO THERE. An auditorium is a venue for an audience; a coliseum is a venue for spectators.',
    explanation_fil: 'LUGAR:MGA TAONG PUMUPUNTA DOON. Ang auditorium ay lugar para sa mga manonood (audience); ang coliseum naman ay lugar para sa mga manunuod (spectators).',
  },
  {
    stem: 'Edgar Allan Poe : Annabel Lee || ___ : ___',
    choices: [
      { id: 'a', text: 'Robert Frost : Medea' },
      { id: 'b', text: 'Pygmalion : Galatea' },
      { id: 'c', text: 'Chaucer : Antigone' },
      { id: 'd', text: 'Shakespeare : Romeo and Juliet' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'AUTHOR:FAMOUS LITERARY WORK. Edgar Allan Poe wrote "Annabel Lee"; William Shakespeare wrote "Romeo and Juliet."',
    explanation_fil: 'AWTOR:BANTOG NA AKDA. Si Edgar Allan Poe ay sumulat ng "Annabel Lee"; si William Shakespeare naman ay sumulat ng "Romeo and Juliet."',
  },
  {
    stem: 'advise : counsel || ___ : ___',
    choices: [
      { id: 'a', text: 'lead : direct' },
      { id: 'b', text: 'loss : lost' },
      { id: 'c', text: 'peace : piece' },
      { id: 'd', text: 'want : quality' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'SYNONYMS (VERBS). "Advise" and "counsel" are synonyms meaning to give guidance; "lead" and "direct" are synonyms meaning to guide or be in charge.',
    explanation_fil: 'MAGKASINGKAHULUGAN (PANDIWA). Ang "advise" at "counsel" ay magkasingkahulugang pandiwa (magbigay ng gabay); ang "lead" at "direct" naman ay magkasingkahulugang pandiwa (manguna o mangasiwa).',
  },
  {
    stem: 'perspire : sweat || ___ : ___',
    choices: [
      { id: 'a', text: 'clouds : rain' },
      { id: 'b', text: 'cry : tears' },
      { id: 'c', text: 'fan : wind' },
      { id: 'd', text: 'sad : lonely' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'ACTION:PRODUCT. "Perspire" (to sweat) produces "sweat"; "cry" (to weep) produces "tears."',
    explanation_fil: 'KILOS:PRODUKTO. Ang "perspire" (pawisan) ay gumagawa ng "sweat" (pawis); ang "cry" (umiyak) naman ay gumagawa ng "tears" (luha).',
  },
  {
    stem: 'extricate : set free || ___ : ___',
    choices: [
      { id: 'a', text: 'journey : far' },
      { id: 'b', text: 'liquidate : liquefy' },
      { id: 'c', text: 'implicate : involve' },
      { id: 'd', text: 'migrate : stay' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'WORD:DEFINITION. "Extricate" means to set free (from a constraint); "implicate" means to involve or show involvement (in something, usually negative).',
    explanation_fil: 'SALITA:KAHULUGAN. Ang "extricate" ay nangangahulugang palayain (mula sa isang hadlang); ang "implicate" naman ay nangangahulugang sangkutin o ipakita ang kaugnayan (sa isang bagay, kadalasang negatibo).',
  },
  {
    stem: 'maggot : fly || ___ : ___',
    choices: [
      { id: 'a', text: 'caterpillar : leaves' },
      { id: 'b', text: 'bees : wasp' },
      { id: 'c', text: 'butterfly : moth' },
      { id: 'd', text: 'tadpole : frog' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'LARVAL STAGE:ADULT FORM. A maggot is the larva of a fly; a tadpole is the larva (young) of a frog.',
    explanation_fil: 'LARVA:ANYONG MATANDA. Ang maggot ay larva ng langaw (fly); ang tadpole naman ay larva (batang anyo) ng palaka (frog).',
  },
  {
    stem: 'he : him || ___ : ___',
    choices: [
      { id: 'a', text: 'me : I' },
      { id: 'b', text: 'they : them' },
      { id: 'c', text: 'you : yours' },
      { id: 'd', text: 'her : she' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: 'NOMINATIVE:OBJECTIVE PRONOUN CASE. "He" (nominative) becomes "him" (objective); "they" (nominative) becomes "them" (objective).',
    explanation_fil: 'NOMINATIBO:OBHEKTIBONG PANGHALIP. Ang "he" (nominative/paksa) ay nagiging "him" (objective/layon); ang "they" (nominative) naman ay nagiging "them" (objective).',
  },
  {
    stem: 'lie (to recline) : to recline || ___ : ___',
    choices: [
      { id: 'a', text: 'lay : put down' },
      { id: 'b', text: 'macabre : beauty' },
      { id: 'c', text: 'nab : release' },
      { id: 'd', text: 'quench : to thirst' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'WORD:DEFINITION (VERB). "Lie" (when used to mean recline) is defined as "to recline"; "lay" is defined as "to put down" (to place something).',
    explanation_fil: 'SALITA:KAHULUGAN (PANDIWA). Ang "lie" (sa kahulugang humiga) ay kahulugang "to recline" (humiga); ang "lay" naman ay kahulugang "put down" (ilagay ang isang bagay).',
  },
  {
    stem: 'igloo : Eskimo || ___ : ___',
    choices: [
      { id: 'a', text: 'cavemen : cave' },
      { id: 'b', text: 'palace : kings' },
      { id: 'c', text: 'destitute : shanty' },
      { id: 'd', text: 'bees : beehive' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'DWELLING:INHABITANT. An igloo is the traditional dwelling of the Eskimo (Inuit); a palace is the dwelling of kings.',
    explanation_fil: 'TIRAHAN:NANINIRAHAN. Ang igloo ay tradisyonal na tirahan ng mga Eskimo (Inuit); ang palasyo naman ay tirahan ng mga hari.',
  },
  {
    stem: 'dictionary : word meanings || ___ : ___',
    choices: [
      { id: 'a', text: 'almanac : synonyms' },
      { id: 'b', text: 'encyclopedia : word origin' },
      { id: 'c', text: 'atlas : maps' },
      { id: 'd', text: 'thesaurus : dinosaurs' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: 'REFERENCE BOOK:WHAT IT CONTAINS. A dictionary contains word meanings/definitions; an atlas contains maps.',
    explanation_fil: 'SANGGUNIANG AKLAT:NILALAMAN. Ang diksyunaryo ay naglalaman ng kahulugan ng mga salita; ang atlas naman ay naglalaman ng mga mapa.',
  },
  {
    stem: 'extemporaneous : rehearsed || ___ : ___',
    choices: [
      { id: 'a', text: 'live : taped' },
      { id: 'b', text: 'momentous : important' },
      { id: 'c', text: 'nefarious : wicked' },
      { id: 'd', text: 'salubrious : healthful' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'ANTONYMS. "Extemporaneous" (spontaneous, unrehearsed) and "rehearsed" (prepared) are antonyms; "live" (happening in real time) and "taped" (pre-recorded) are antonyms.',
    explanation_fil: 'MAGKASALUNGAT. Ang "extemporaneous" (spontaneous, hindi inensayo) at "rehearsed" (inihanda/inensayo) ay magkasalungat; ang "live" (live/totoong oras) at "taped" (naitalang muna) naman ay magkasalungat.',
  },
  {
    stem: 'tavern : bar || ___ : ___',
    choices: [
      { id: 'a', text: 'inn : hotel' },
      { id: 'b', text: 'apartment : loft' },
      { id: 'c', text: 'condominium : office' },
      { id: 'd', text: 'attic : chimney' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: 'SYNONYMS. A "tavern" and "bar" are synonyms (establishments where drinks are served); an "inn" and "hotel" are synonyms (establishments providing lodging).',
    explanation_fil: 'MAGKASINGKAHULUGAN. Ang "tavern" at "bar" ay magkasingkahulugan (establisyamento kung saan inihahain ang inumin); ang "inn" at "hotel" naman ay magkasingkahulugan (establisyamento na nagbibigay ng tirahan).',
  },
  {
    stem: 'duchess : duke || ___ : ___',
    choices: [
      { id: 'a', text: 'count : countess' },
      { id: 'b', text: 'ewe : ram' },
      { id: 'c', text: 'gentleman : lady' },
      { id: 'd', text: 'wizard : witch' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'FEMALE:MALE. A "duchess" is the female counterpart of a "duke"; an "ewe" is the female counterpart of a "ram" (male sheep).',
    explanation_fil: 'BABAE:LALAKI. Ang "duchess" ay ang babaeng katapat ng "duke"; ang "ewe" (babaeng tupa) naman ay ang babaeng katapat ng "ram" (lalaking tupa).',
  },
  {
    stem: 'dwindle : decrease || ___ : ___',
    choices: [
      { id: 'a', text: 'defer : act promptly' },
      { id: 'b', text: 'deny : grant' },
      { id: 'c', text: 'forge : stop' },
      { id: 'd', text: 'multiply : increase' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'SYNONYMS. "Dwindle" and "decrease" are synonyms (to become smaller/less); "multiply" and "increase" are synonyms (to become greater/more).',
    explanation_fil: 'MAGKASINGKAHULUGAN. Ang "dwindle" at "decrease" ay magkasingkahulugan (bumaba/lumit); ang "multiply" at "increase" naman ay magkasingkahulugan (dumami/lumaki).',
  },
  {
    stem: 'prowess : cowardice || ___ : ___',
    choices: [
      { id: 'a', text: 'adept : skilled' },
      { id: 'b', text: 'adroit : uncoordinated' },
      { id: 'c', text: 'garrulous : talkative' },
      { id: 'd', text: 'hubris : pride' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'ANTONYMS. "Prowess" (great skill, bravery) and "cowardice" (lack of courage) are antonyms; "adroit" (skillful, agile) and "uncoordinated" (clumsy, lacking skill) are antonyms.',
    explanation_fil: 'MAGKASALUNGAT. Ang "prowess" (kahusayan, katapangan) at "cowardice" (kawalan ng tapang) ay magkasalungat; ang "adroit" (mahusay, maliksi) at "uncoordinated" (awkward, walang kakayahan) naman ay magkasalungat.',
  },
  {
    stem: 'charisma : charismata || ___ : ___',
    choices: [
      { id: 'a', text: 'deer : deers' },
      { id: 'b', text: 'bacterium : bacteriums' },
      { id: 'c', text: 'basis : bases' },
      { id: 'd', text: 'eight : eighty\'s' },
    ],
    correct: 'c', difficulty: 3,
    explanation_en: 'SINGULAR:IRREGULAR PLURAL (Greek origin). "Charisma" → "charismata" is an irregular plural (Greek origin); "basis" → "bases" is also an irregular plural (Greek/Latin origin).',
    explanation_fil: 'ISAHAN:IREGULANG MARAMIHAN (pinagmulan sa Griyego). Ang "charisma" → "charismata" ay iregulang plural (mula sa Griyego); ang "basis" → "bases" naman ay iregulang plural din (mula sa Griyego/Latin).',
  },
  {
    stem: 'quintuplet : five || ___ : ___',
    choices: [
      { id: 'a', text: 'triplet : three' },
      { id: 'b', text: 'quartuplet : four' },
      { id: 'c', text: 'doublet : two' },
      { id: 'd', text: 'sexton : six' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'MULTIPLE BIRTH TERM:NUMBER. A "quintuplet" refers to one of five babies born at one birth; a "triplet" refers to one of three babies born at one birth.',
    explanation_fil: 'TERMINO SA MARAMING KAPANGANAKAN:BILANG. Ang "quintuplet" ay isang sanggol na isa sa limang ipinanganak nang sabay-sabay; ang "triplet" naman ay isang sanggol na isa sa tatlong ipinanganak nang sabay-sabay.',
  },
  {
    stem: 'attention : attn || ___ : ___',
    choices: [
      { id: 'a', text: 'approximate : appro' },
      { id: 'b', text: 'bal : balance' },
      { id: 'c', text: 'building : bldng' },
      { id: 'd', text: 'manager : mgr' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: 'WORD:ABBREVIATION. "Attention" is abbreviated as "attn"; "manager" is abbreviated as "mgr."',
    explanation_fil: 'SALITA:PAGDADAGLAT. Ang "attention" ay dinadaglat bilang "attn"; ang "manager" naman ay dinadaglat bilang "mgr."',
  },
  {
    stem: 'arachnophobia : fear of spiders || ___ : ___',
    choices: [
      { id: 'a', text: 'hydrophobia : fear of wet objects' },
      { id: 'b', text: 'claustrophobia : fear of clauses' },
      { id: 'c', text: 'photophobia : fear of light' },
      { id: 'd', text: 'xenophobia : fear of sin' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'PHOBIA TERM:DEFINITION. "Arachnophobia" is the fear of spiders; "photophobia" is the fear of or extreme sensitivity to light.',
    explanation_fil: 'TERMINO NG PHOBIA:KAHULUGAN. Ang "arachnophobia" ay takot sa mga gagamba; ang "photophobia" naman ay takot sa o matinding pagiging sensitibo sa liwanag.',
  },
  {
    stem: 'unscrew : tighten || ___ : ___',
    choices: [
      { id: 'a', text: 'remove : restore' },
      { id: 'b', text: 'relinquish : give up' },
      { id: 'c', text: 'sensitive : make sensitive' },
      { id: 'd', text: 'stupefy : make insensible' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'ANTONYMS. "Unscrew" (to loosen/remove by turning) and "tighten" (to fasten firmly) are antonyms; "remove" (to take away) and "restore" (to put back) are antonyms.',
    explanation_fil: 'MAGKASALUNGAT. Ang "unscrew" (alisan ng turnilyo/luwagan) at "tighten" (higpiting/ayusin) ay magkasalungat; ang "remove" (alisin) at "restore" (ibalik) naman ay magkasalungat.',
  },
  {
    stem: 'verbose : speechless || ___ : ___',
    choices: [
      { id: 'a', text: 'voracious : greedy' },
      { id: 'b', text: 'vicious : kind' },
      { id: 'c', text: 'wanton : lewd' },
      { id: 'd', text: 'waspish : irritable' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: 'ANTONYMS. "Verbose" (using too many words) and "speechless" (unable to speak) are antonyms; "vicious" (cruel, violent) and "kind" (gentle, compassionate) are antonyms.',
    explanation_fil: 'MAGKASALUNGAT. Ang "verbose" (paggamit ng napakaraming salita) at "speechless" (walang masabi) ay magkasalungat; ang "vicious" (malupit) at "kind" (mabait) naman ay magkasalungat.',
  },
  {
    stem: 'COD : cash on delivery || ___ : ___',
    choices: [
      { id: 'a', text: 'DST : daylight saving time' },
      { id: 'b', text: 'PO : public office' },
      { id: 'c', text: 'NA : not appointed' },
      { id: 'd', text: 'RSVP : please approve' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'ABBREVIATION:EXPANSION. "COD" stands for "cash on delivery"; "DST" stands for "daylight saving time."',
    explanation_fil: 'PAGDADAGLAT:BUONG SALITA. Ang "COD" ay kumakatawan sa "cash on delivery" (bayad sa paghahatid); ang "DST" naman ay kumakatawan sa "daylight saving time."',
  },
  {
    stem: 'adjacent : near || ___ : ___',
    choices: [
      { id: 'a', text: 'congruent : dissimilar' },
      { id: 'b', text: 'converge : separate' },
      { id: 'c', text: 'deliberate : intentional' },
      { id: 'd', text: 'delude : guide' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: 'SYNONYMS. "Adjacent" and "near" are synonyms (close to); "deliberate" and "intentional" are synonyms (done on purpose).',
    explanation_fil: 'MAGKASINGKAHULUGAN. Ang "adjacent" at "near" ay magkasingkahulugan (malapit); ang "deliberate" at "intentional" naman ay magkasingkahulugan (sadya/nagawa nang sinasadya).',
  },
  {
    stem: 'firmament : sky || ___ : ___',
    choices: [
      { id: 'a', text: 'clouds : air' },
      { id: 'b', text: 'moon : planet' },
      { id: 'c', text: 'star : gas' },
      { id: 'd', text: 'soil : ground' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: 'FORMAL WORD:COMMON SYNONYM. "Firmament" is a literary/formal word for "sky"; "soil" is often used as a synonym for "ground" (earth underfoot).',
    explanation_fil: 'PORMAL NA SALITA:KARANIWANG KASINGKAHULUGAN. Ang "firmament" ay isang makulay/pormal na salita para sa "sky" (langit); ang "soil" naman ay kadalasang ginagamit bilang kasingkahulugan ng "ground" (lupa sa ilalim ng paa).',
  },
  {
    stem: 'languid : strong || ___ : ___',
    choices: [
      { id: 'a', text: 'feeble : active' },
      { id: 'b', text: 'innocuous : harmless' },
      { id: 'c', text: 'opportune : timely' },
      { id: 'd', text: 'truculent : restless' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: 'ANTONYMS. "Languid" (weak, sluggish) and "strong" (powerful, vigorous) are antonyms; "feeble" (weak, lacking energy) and "active" (energetic, busy) are antonyms.',
    explanation_fil: 'MAGKASALUNGAT. Ang "languid" (mahina, mabagal) at "strong" (malakas) ay magkasalungat; ang "feeble" (mahina, walang lakas) at "active" (masigla, abala) naman ay magkasalungat.',
  },
];

async function main() {
  console.log('📖 Inserting Single-Word Analogy (40) + Double-Word Analogy (40) for Pro only...\n');

  const SOURCE_S = 'CSE Reviewer 2026 | English: Single-Word Analogy | Level: pro | flashcard:yes | tutor-ready:yes';
  const SOURCE_D = 'CSE Reviewer 2026 | English: Double-Word Analogy | Level: pro | flashcard:yes | tutor-ready:yes';

  // Single-Word Analogies → Pro only (word-association)
  const sRows = singleWordAnalogies.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: SOURCE_S,
    status: 'published',
    is_verified: true,
  }));
  await insert(sRows);
  console.log(`  Single-Word Analogy: ${sRows.length} questions inserted.`);

  // Double-Word Analogies → Pro only (word-association)
  const dRows = doubleWordAnalogies.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: SOURCE_D,
    status: 'published',
    is_verified: true,
  }));
  await insert(dRows);
  console.log(`  Double-Word Analogy: ${dRows.length} questions inserted.`);

  // Count totals
  const { count } = await sb.from('questions').select('*', { count: 'exact', head: true })
    .eq('status', 'published');
  console.log(`\n✅ Done! Total published questions in DB: ${count}`);
  console.log(`   (+${sRows.length + dRows.length} new questions for Pro only)\n`);
}

main().catch(console.error);
