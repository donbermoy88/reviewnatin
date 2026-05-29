/**
 * CSE Question Bank — Step 9: Correct Usage (40 questions)
 * Topic: grammar — both CSE Professional and Sub-Professional
 * Source: CSE Reviewer 2026, pages 73–80
 *
 * Tests: homophones, correct word choice, prepositions, phrasal verbs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TOPIC_PRO = '90ba4b46-caf1-41bc-9039-1cfbc2e0baf1';
const TOPIC_SUB = 'd5388143-2857-4f97-bb76-8dd02f42a982';

async function insertBatch(rows) {
  const { error } = await sb.from('questions').insert(rows);
  if (error) { console.error('Insert error:', error.message); process.exit(1); }
}

const QUESTIONS = [
  // ── Part 1: Homophones & Word Choice (1–20) ──────────────────────────────
  {
    stem: 'Lily ___ remarkable poems even at her young age.',
    choices: [
      { id: 'a', text: 'rites' },
      { id: 'b', text: 'rights' },
      { id: 'c', text: 'writes' },
      { id: 'd', text: 'write' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: '"Writes" (third-person singular of "write") is correct. The subject "Lily" is singular and the sentence is in the simple present tense. "Rites" = ceremonies; "rights" = entitlements — both are homophones that do not fit the context.',
    explanation_fil: 'Ang "writes" (ikatlong panaong isahan ng "write") ang tama. Ang paksa na "Lily" ay isahan at ang pangungusap ay nasa simple present tense. "Rites" = seremonya; "rights" = mga karapatan — parehong tunog-magkamukha ngunit hindi akma sa konteksto.',
  },
  {
    stem: 'Being too ___ will undoubtedly make other men hate you.',
    choices: [
      { id: 'a', text: 'vane' },
      { id: 'b', text: 'vain' },
      { id: 'c', text: 'vein' },
      { id: 'd', text: 'vanity' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Vain" (adjective meaning conceited or excessively proud) is correct. "Vane" = a weather vane; "vein" = a blood vessel or a stripe in rock; "vanity" is a noun, not an adjective.',
    explanation_fil: 'Ang "vain" (pang-uri na nangangahulugang mayabang o lubos na ipinagmamalaki ang sarili) ang tama. "Vane" = weather vane; "vein" = ugat ng dugo o guhit sa bato; "vanity" ay pangngalan, hindi pang-uri.',
  },
  {
    stem: 'Due to bad weather, the airline company decided ___ postpone the flight.',
    choices: [
      { id: 'a', text: 'two' },
      { id: 'b', text: 'to' },
      { id: 'c', text: 'too' },
      { id: 'd', text: 'then' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"To" (infinitive marker) is correct. "Decided to postpone" = the infinitive form after a verb. "Two" = the number 2; "too" = also or excessively.',
    explanation_fil: 'Ang "to" (infinitive marker) ang tama. "Decided to postpone" = infinitive form pagkatapos ng pandiwa. "Two" = bilang na 2; "too" = din o sobra.',
  },
  {
    stem: 'Drunk driving was the reason for ___ accident.',
    choices: [
      { id: 'a', text: 'their' },
      { id: 'b', text: "they're" },
      { id: 'c', text: 'there' },
      { id: 'd', text: 'there are' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: '"Their" (possessive pronoun) is correct — the accident belonged to them. "They\'re" = they are (contraction); "there" = in that place.',
    explanation_fil: 'Ang "their" (possessive pronoun) ang tama — ang aksidente ay pag-aari nila. "They\'re" = they are (pinaikling anyo); "there" = doon sa lugar na iyon.',
  },
  {
    stem: 'May I ___ your Titanic compact disk?',
    choices: [
      { id: 'a', text: 'borrow' },
      { id: 'b', text: 'lend' },
      { id: 'c', text: 'loan' },
      { id: 'd', text: 'credit' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: '"Borrow" is correct. You BORROW something FROM someone (you receive it). You LEND something TO someone (you give it). The speaker wants to receive the CD, so "borrow" is correct.',
    explanation_fil: 'Ang "borrow" ang tama. Nag-BORROW ka ng isang bagay MULA sa isang tao (tinatanggap mo ito). Nagpapahiram ka (LEND) ng isang bagay SA isang tao (ibinibigay mo ito). Ang nagsasalita ay nais tumanggap ng CD, kaya "borrow" ang tama.',
  },
  {
    stem: '___ the three girls, the eldest is the most diligent.',
    choices: [
      { id: 'a', text: 'Between' },
      { id: 'b', text: 'Among' },
      { id: 'c', text: 'In' },
      { id: 'd', text: 'By' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"Among" is used when referring to three or more people/things. "Between" is used for exactly two. Since there are three girls, use "Among."',
    explanation_fil: 'Ang "Among" ay ginagamit kapag tumutukoy sa tatlo o higit pang tao/bagay. Ang "Between" ay ginagamit para sa eksaktong dalawa. Dahil tatlong babae, gamitin ang "Among."',
  },
  {
    stem: 'Exposure to air pollution will ___ your asthma.',
    choices: [
      { id: 'a', text: 'cure' },
      { id: 'b', text: 'deteriorate' },
      { id: 'c', text: 'aggravate' },
      { id: 'd', text: 'annoy' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"Aggravate" means to make a condition worse or more severe. Air pollution worsens asthma. "Deteriorate" is intransitive (it cannot take a direct object like "your asthma").',
    explanation_fil: 'Ang "aggravate" ay nangangahulugang gawing mas malala ang isang kondisyon. Ang polusyon ay nagpapalala ng hika. "Deteriorate" ay intransitive (hindi maaaring magkaroon ng direktang object tulad ng "your asthma").',
  },
  {
    stem: 'His ___ to Mount Apo was carefully documented.',
    choices: [
      { id: 'a', text: 'assent' },
      { id: 'b', text: 'ascent' },
      { id: 'c', text: 'descent' },
      { id: 'd', text: 'decrease' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"Ascent" means the act of climbing or going up. He climbed Mount Apo — that is an ascent. "Assent" = agreement; "descent" = the act of going down.',
    explanation_fil: 'Ang "ascent" ay nangangahulugang pagsasampa o pagtaas. Umakyat siya sa Bundok Apo — iyon ay isang ascent. "Assent" = pagkakasundo; "descent" = pagbaba.',
  },
  {
    stem: 'The children ___ the ill effects of war.',
    choices: [
      { id: 'a', text: 'have borne' },
      { id: 'b', text: 'have born' },
      { id: 'c', text: 'has borne' },
      { id: 'd', text: 'had born' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: '"Have borne" is correct. "Children" is plural → use "have" (not "has"). "Borne" is the past participle of "bear" meaning to endure/carry. "Born" is used only for giving birth.',
    explanation_fil: 'Ang "have borne" ang tama. Ang "children" ay maramihan → gamitin ang "have" (hindi "has"). Ang "borne" ang past participle ng "bear" na nangangahulugang tiisin/dalhin. "Born" ay ginagamit lamang para sa panganganak.',
  },
  {
    stem: 'The teachers distributed different ___ outlines for the students to follow.',
    choices: [
      { id: 'a', text: 'coarse' },
      { id: 'b', text: 'corps' },
      { id: 'c', text: 'course' },
      { id: 'd', text: 'corpse' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: '"Course" (as in course outline — a plan of study) is correct. "Coarse" = rough; "corps" = a body of people; "corpse" = a dead body.',
    explanation_fil: 'Ang "course" (tulad ng course outline — plano ng pag-aaral) ang tama. "Coarse" = magaspang; "corps" = pangkat ng mga tao; "corpse" = bangkay.',
  },
  {
    stem: 'Carl juggles oranges, ___ you?',
    choices: [
      { id: 'a', text: 'why' },
      { id: 'b', text: 'may' },
      { id: 'c', text: 'should' },
      { id: 'd', text: 'can' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: '"Can" expresses ability. The question asks if you are able to juggle, like Carl. "May" expresses permission; "should" expresses duty; "why" is an adverb asking for reason.',
    explanation_fil: 'Ang "can" ay nagpapahayag ng kakayahan. Tinatanong kung kaya mo ring mag-juggle, tulad ni Carl. "May" = pahintulot; "should" = tungkulin; "why" ay pang-abay na nagtatanong ng dahilan.',
  },
  {
    stem: 'The refugees decided to ___ their homes because of the war.',
    choices: [
      { id: 'a', text: 'desert' },
      { id: 'b', text: 'dessert' },
      { id: 'c', text: 'deserve' },
      { id: 'd', text: 'reserve' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: '"Desert" (as a verb) means to abandon or leave. The refugees left their homes. "Dessert" is the sweet food eaten after a meal. Common confusion: the DESERT (noun, dry place) has one "s"; to deSERT (verb, abandon) has one "s" too.',
    explanation_fil: 'Ang "desert" (bilang pandiwa) ay nangangahulugang iwan o talikuran. Iniwan ng mga refugee ang kanilang mga tahanan. "Dessert" ay ang matamis na pagkaing kinakain pagkatapos ng kainan.',
  },
  {
    stem: 'My sister ___ to Zamboanga seven years ago.',
    choices: [
      { id: 'a', text: 'migrated' },
      { id: 'b', text: 'migrating' },
      { id: 'c', text: 'immigrated' },
      { id: 'd', text: 'immigrating' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: '"Migrated" (simple past) is correct. Moving within a country = migrate. Moving from one country to another to settle = immigrate. Since Zamboanga is in the Philippines, the sister moved within the country → "migrated."',
    explanation_fil: 'Ang "migrated" (simple past) ang tama. Ang paglipat sa loob ng isang bansa = migrate. Ang paglipat mula sa isang bansa patungo sa isa pa upang manirahan = immigrate. Dahil ang Zamboanga ay nasa Pilipinas, lumipat ang kapatid sa loob ng bansa → "migrated."',
  },
  {
    stem: 'We used ___ sauce for the spaghetti last Sunday.',
    choices: [
      { id: 'a', text: 'less' },
      { id: 'b', text: 'few' },
      { id: 'c', text: 'a number of' },
      { id: 'd', text: 'pieces of' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: '"Less" is used with uncountable/mass nouns (sauce, water, sugar). "Few" is used with countable nouns (plates, bottles). Since sauce is uncountable, "less" is correct.',
    explanation_fil: 'Ang "less" ay ginagamit sa mga hindi mabibilang na pangngalan (sauce, tubig, asukal). Ang "few" ay ginagamit sa mga mabibilang na pangngalan (plato, bote). Dahil ang sauce ay hindi mabibilang, "less" ang tama.',
  },
  {
    stem: 'If we work together, we could finish this ___ in a short time.',
    choices: [
      { id: 'a', text: 'piece' },
      { id: 'b', text: 'peace' },
      { id: 'c', text: 'please' },
      { id: 'd', text: 'peas' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: '"Piece" (a portion of work) is correct in this context ("finish this piece/task"). "Peace" = absence of conflict; "please" = to give pleasure / a polite request word; "peas" = the vegetable.',
    explanation_fil: 'Ang "piece" (isang bahagi ng trabaho) ang tama sa kontekstong ito ("finish this piece/task"). "Peace" = kawalan ng gulo; "please" = magbigay ng kasiyahan / salitang pampangitain; "peas" = ang gulay na gisantes.',
  },
  {
    stem: 'When the Apartheid Policy was still in effect, the Blacks were ___ by the Whites.',
    choices: [
      { id: 'a', text: 'praised' },
      { id: 'b', text: 'hailed' },
      { id: 'c', text: 'persecuted' },
      { id: 'd', text: 'prosecuted' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"Persecuted" means to subject a group to hostility and ill-treatment, especially due to race. Apartheid was the systematic racial segregation and persecution of Black people. "Prosecuted" = taken to court for a crime (a legal term).',
    explanation_fil: 'Ang "persecuted" ay nangangahulugang mapait at masamang pagtrato sa isang pangkat, lalo na dahil sa lahi. Ang Apartheid ay sistematikong pagtatanggal ng karapatan at pang-uusig sa mga Itim. "Prosecuted" = dinala sa hukuman dahil sa krimen (legal na termino).',
  },
  {
    stem: 'When we ___ the flag, we should all stand up.',
    choices: [
      { id: 'a', text: 'rice' },
      { id: 'b', text: 'rise' },
      { id: 'c', text: 'risen' },
      { id: 'd', text: 'raise' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: '"Raise" (transitive verb) = to lift something up. We raise the flag (we cause it to go up). "Rise" = to go up on its own (intransitive). Since the flag is being hoisted by people, "raise" is correct.',
    explanation_fil: 'Ang "raise" (transitive verb) = itaas ang isang bagay. Tinitaas natin ang watawat (ginagawa nating tumaas ito). "Rise" = tumaas nang kusa (intransitive). Dahil ang mga tao ang nagtatayo ng watawat, "raise" ang tama.',
  },
  {
    stem: 'The DPWH crew worked ___ the night to repair the damaged bridge.',
    choices: [
      { id: 'a', text: 'thre' },
      { id: 'b', text: 'through' },
      { id: 'c', text: 'trough' },
      { id: 'd', text: 'true' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Through" (preposition meaning from one end to the other) is correct in the idiom "worked through the night" = worked without stopping all night. "Trough" = a container for animal feed or water.',
    explanation_fil: 'Ang "through" (preposisyon na nangangahulugang mula sa isang dulo hanggang sa isa pa) ang tama sa idyomang "worked through the night" = nagtrabaho nang walang tigil sa buong gabi. "Trough" = lalagyan ng pagkain o tubig ng hayop.',
  },
  {
    stem: '___ the leader of your group?',
    choices: [
      { id: 'a', text: "Who's" },
      { id: 'b', text: 'Whose' },
      { id: 'c', text: 'Which' },
      { id: 'd', text: "Whom's" },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: '"Who\'s" = "Who is" (a contraction). The sentence means "Who is the leader of your group?" "Whose" is the possessive form of "who" (e.g., "Whose book is this?"). "Whom\'s" is not a word.',
    explanation_fil: 'Ang "Who\'s" = "Who is" (pinaikling anyo). Ang pangungusap ay nangangahulugang "Sino ang lider ng inyong grupo?" "Whose" ang possessive form ng "who" (hal., "Whose book is this?"). "Whom\'s" ay hindi isang salita.',
  },
  {
    stem: 'The village elder told many interesting ___.',
    choices: [
      { id: 'a', text: 'tale' },
      { id: 'b', text: 'tail' },
      { id: 'c', text: 'tails' },
      { id: 'd', text: 'tales' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: '"Tales" (plural of "tale" = story) is correct. The subject "many" requires a plural noun. "Tail" = the appendage at the rear of an animal; "tails" = plural of tail.',
    explanation_fil: 'Ang "tales" (maramihan ng "tale" = kwento) ang tama. Ang salitang "many" ay nangangailangan ng maramihang pangngalan. "Tail" = buntot ng hayop; "tails" = maramihan ng buntot.',
  },
  // ── Part 2: Phrasal Verbs (21–40) ────────────────────────────────────────
  {
    stem: 'Marty ___ Evelyn ___ to dinner.',
    choices: [
      { id: 'a', text: 'asked – out' },
      { id: 'b', text: 'asked – after' },
      { id: 'c', text: 'called – out' },
      { id: 'd', text: 'called – up' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: '"Asked out" = to invite someone on a date or for a social occasion. Marty asked Evelyn out to dinner. "Asked after" = to inquire about someone\'s health. "Called out" = to shout at/challenge.',
    explanation_fil: '"Asked out" = mag-imbita ng isang tao sa isang lakad o okasyon. Inimbitahan ni Marty si Evelyn para sa hapunan. "Asked after" = magtanong tungkol sa kalusugan ng isang tao. "Called out" = hamunin/sigawan.',
  },
  {
    stem: 'The celebrant ___ candles after we sang.',
    choices: [
      { id: 'a', text: 'blew off' },
      { id: 'b', text: 'blew up' },
      { id: 'c', text: 'blew out' },
      { id: 'd', text: 'blew over' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"Blew out" = to extinguish (a flame) by blowing. "Blew up" = to explode or inflate; "blew off" = to ignore/dismiss; "blew over" = to be knocked over by wind or for something to pass.',
    explanation_fil: '"Blew out" = patayin ang apoy sa pamamagitan ng pagsalabog ng hangin. "Blew up" = sumabog o palakihin; "blew off" = huwag pansinin; "blew over" = mabago ng hangin o lumipas.',
  },
  {
    stem: 'The secretary ___ due to stress.',
    choices: [
      { id: 'a', text: 'broke even' },
      { id: 'b', text: 'broke out' },
      { id: 'c', text: 'broke in' },
      { id: 'd', text: 'broke down' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: '"Broke down" = to suffer a physical or emotional collapse. "Broke even" = to make neither profit nor loss; "broke out" = to escape or suddenly begin; "broke in" = to enter by force.',
    explanation_fil: '"Broke down" = nagkaroon ng pisikal o emosyonal na pagbagsak. "Broke even" = walang kita o pagkawala; "broke out" = tumakas o biglang nagsimula; "broke in" = pumasok nang sapilitan.',
  },
  {
    stem: 'The EDSA People\'s Revolution ___ the Marcos regime.',
    choices: [
      { id: 'a', text: 'brought in' },
      { id: 'b', text: 'brought on' },
      { id: 'c', text: 'brought forth' },
      { id: 'd', text: 'brought down' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: '"Brought down" = to overthrow or cause the fall of a government/regime. "Brought in" = to introduce; "brought on" = to cause (a condition); "brought forth" = to produce or reveal.',
    explanation_fil: '"Brought down" = ibagsak o maging sanhi ng pagbagsak ng isang pamahalaan/rehimen. "Brought in" = ipakilala; "brought on" = maging sanhi ng isang kondisyon; "brought forth" = gumawa o magpakita.',
  },
  {
    stem: 'The unexpected ___ of vehicles along Marcos Highway caused heavy traffic.',
    choices: [
      { id: 'a', text: 'build up' },
      { id: 'b', text: 'build on' },
      { id: 'c', text: 'build in' },
      { id: 'd', text: 'build over' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: '"Build up" (noun form: build-up) = an accumulation of something over time. A build-up of vehicles = traffic congestion. "Build on" = to develop further; "build in" = to incorporate.',
    explanation_fil: '"Build up" (noun form: build-up) = pagtitipon ng isang bagay sa paglipas ng panahon. Ang build-up ng mga sasakyan = trapiko/kempon. "Build on" = paunlarin pa; "build in" = isama.',
  },
  {
    stem: 'After cleaning the entire house, I felt ___.',
    choices: [
      { id: 'a', text: 'burned in' },
      { id: 'b', text: 'burned out' },
      { id: 'c', text: 'burned up' },
      { id: 'd', text: 'burned over' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"Burned out" = to feel completely exhausted from overwork. "Burned up" = to be destroyed by fire or to be furious; "burned in" is not a standard phrasal verb in this context.',
    explanation_fil: '"Burned out" = pakiramdam na ganap na pagod mula sa labis na trabaho. "Burned up" = masunog nang tuluyan o galit na galit; "burned in" ay hindi karaniwang phrasal verb sa kontekstong ito.',
  },
  {
    stem: 'The drug pushers tried to ___ the arresting cops.',
    choices: [
      { id: 'a', text: 'buy in' },
      { id: 'b', text: 'buy off' },
      { id: 'c', text: 'buy out' },
      { id: 'd', text: 'buy up' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"Buy off" = to bribe someone. "Buy out" = to purchase all of someone\'s shares/interest; "buy up" = to purchase all available stock; "buy in" = to invest in or stock up.',
    explanation_fil: '"Buy off" = suhulan ang isang tao. "Buy out" = bilhin ang lahat ng bahagi/interes ng isang tao; "buy up" = bilhin ang lahat ng available na stock; "buy in" = mag-invest o mag-imbak.',
  },
  {
    stem: 'The Cabinet meeting was ___ on account of the President\'s ill health.',
    choices: [
      { id: 'a', text: 'called in' },
      { id: 'b', text: 'called up' },
      { id: 'c', text: 'called out' },
      { id: 'd', text: 'called off' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: '"Called off" = to cancel a planned event. "Called in" = to request someone to come; "called up" = to phone or to summon for military service; "called out" = to challenge or to announce loudly.',
    explanation_fil: '"Called off" = kanselahin ang isang planong kaganapan. "Called in" = humiling ng pagdating ng isang tao; "called up" = tumawag sa telepono o itawag para sa serbisyong-militar; "called out" = hamunin o iulat nang malakas.',
  },
  {
    stem: 'The tele-novela viewers cried helplessly when they got ___ by the tragedy that befell the main character.',
    choices: [
      { id: 'a', text: 'carried out' },
      { id: 'b', text: 'carried away' },
      { id: 'c', text: 'carried over' },
      { id: 'd', text: 'carried on' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"Carried away" = to be emotionally overwhelmed or to lose control of one\'s feelings. "Carried out" = to execute/complete a task; "carried over" = to transfer to the next period; "carried on" = to continue.',
    explanation_fil: '"Carried away" = emosyonal na nalunod o nawalan ng kontrol sa damdamin. "Carried out" = isagawa/tapusin ang isang gawain; "carried over" = ilipat sa susunod na panahon; "carried on" = magpatuloy.',
  },
  {
    stem: 'We should ___ on our expenditures and spend only on our needs.',
    choices: [
      { id: 'a', text: 'cut short' },
      { id: 'b', text: 'cut up' },
      { id: 'c', text: 'cut back' },
      { id: 'd', text: 'cut out' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"Cut back" = to reduce spending or consumption. "Cut short" = to end something earlier than planned; "cut up" = to cut into pieces; "cut out" = to stop doing something or to remove by cutting.',
    explanation_fil: '"Cut back" = bawasan ang paggastos o konsumo. "Cut short" = tapusin ang isang bagay nang mas maaga kaysa plano; "cut up" = gupitin sa mga piraso; "cut out" = huminto sa paggawa ng isang bagay o alisin sa pamamagitan ng paggupit.',
  },
  {
    stem: 'People of all races should try to ___ with each other.',
    choices: [
      { id: 'a', text: 'get around' },
      { id: 'b', text: 'get along' },
      { id: 'c', text: 'get at' },
      { id: 'd', text: 'get over' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Get along" = to have a harmonious relationship with someone. "Get around" = to find a way to avoid; "get at" = to imply or to reach; "get over" = to recover from.',
    explanation_fil: '"Get along" = magkaroon ng magandang relasyon sa isang tao. "Get around" = makahanap ng paraan para maiwasan; "get at" = ipahiwatig o maabot; "get over" = gumaling mula sa.',
  },
  {
    stem: 'We should grow wiser as time ___.',
    choices: [
      { id: 'a', text: 'goes along' },
      { id: 'b', text: 'goes by' },
      { id: 'c', text: 'goes down' },
      { id: 'd', text: 'goes through' },
    ],
    correct: 'b', difficulty: 1,
    explanation_en: '"Goes by" = as time passes. "Time goes by" is an idiomatic expression for the passage of time. "Goes down" = decreases/sets; "goes through" = to experience or to pass through.',
    explanation_fil: '"Goes by" = habang lumilipas ang oras. Ang "time goes by" ay isang idyomatikong parirala para sa paglipas ng oras. "Goes down" = bumababa/lumulubog; "goes through" = maranasan o dumaan.',
  },
  {
    stem: 'The partying teens were told to ___ the noise.',
    choices: [
      { id: 'a', text: 'hold down' },
      { id: 'b', text: 'hold forth' },
      { id: 'c', text: 'hold on' },
      { id: 'd', text: 'hold with' },
    ],
    correct: 'a', difficulty: 2,
    explanation_en: '"Hold down" = to reduce or suppress (e.g., the noise). "Hold forth" = to speak at length; "hold on" = to wait or to keep a grip; "hold with" = to agree with (old-fashioned).',
    explanation_fil: '"Hold down" = bawasan o sugpuin (hal., ang ingay). "Hold forth" = magsalita nang matagal; "hold on" = maghintay o hawakan; "hold with" = sumang-ayon sa (lumang anyo).',
  },
  {
    stem: 'A gust of strong wind ___ the old wooden swing.',
    choices: [
      { id: 'a', text: 'knocked around' },
      { id: 'b', text: 'knocked back' },
      { id: 'c', text: 'knocked down' },
      { id: 'd', text: 'knocked out' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"Knocked down" = to cause something to fall; to topple. "Knocked out" = to render unconscious; "knocked back" = to drink quickly or to reject; "knocked around" = to move something carelessly.',
    explanation_fil: '"Knocked down" = maging sanhi ng pagkabagsak ng isang bagay; ibuwal. "Knocked out" = ipatulog/palayuhin ng malay; "knocked back" = uminom nang mabilis o tanggihan; "knocked around" = igalaw ang isang bagay nang walang ingat.',
  },
  {
    stem: 'A number of factory workers were ___ due to retrenchment.',
    choices: [
      { id: 'a', text: 'laid aside' },
      { id: 'b', text: 'laid away' },
      { id: 'c', text: 'laid off' },
      { id: 'd', text: 'laid out' },
    ],
    correct: 'c', difficulty: 1,
    explanation_en: '"Laid off" = to dismiss workers from employment, usually for economic reasons. "Laid aside" = to set aside/postpone; "laid away" = to set aside for later use; "laid out" = to arrange/plan.',
    explanation_fil: '"Laid off" = paalisin ang mga manggagawa sa trabaho, kadalasang dahil sa ekonomiya. "Laid aside" = itabi/ipagpaliban; "laid away" = itabi para sa pagamit mamaya; "laid out" = ayusin/planuhin.',
  },
  {
    stem: 'We should never ___ people with disabilities for they also have the right to live.',
    choices: [
      { id: 'a', text: 'look down on' },
      { id: 'b', text: 'look forward to' },
      { id: 'c', text: 'look out to' },
      { id: 'd', text: 'look up to' },
    ],
    correct: 'a', difficulty: 1,
    explanation_en: '"Look down on" = to regard someone with contempt or as inferior. "Look up to" = to admire and respect; "look forward to" = to anticipate with pleasure.',
    explanation_fil: '"Look down on" = tumingin sa isang tao nang may paghamak o bilang mas mababa. "Look up to" = admirahin at igalang; "look forward to" = hinawakan ang isang bagay nang may kasabikan.',
  },
  {
    stem: 'Stop ___ your younger brother so he will stop crying.',
    choices: [
      { id: 'a', text: 'picking at' },
      { id: 'b', text: 'picking on' },
      { id: 'c', text: 'picking out' },
      { id: 'd', text: 'picking up' },
    ],
    correct: 'b', difficulty: 2,
    explanation_en: '"Picking on" = to bully, tease, or repeatedly target someone unfairly. "Picking at" = to eat small bites or to nag; "picking out" = to select; "picking up" = to collect or to learn.',
    explanation_fil: '"Picking on" = mag-bully, manukso, o paulit-ulit na galitin ang isang tao nang walang katuwiran. "Picking at" = kumain nang kaunti o magbangon; "picking out" = pumili; "picking up" = kolektahin o matuto.',
  },
  {
    stem: 'Always ___ your best effort in everything you do.',
    choices: [
      { id: 'a', text: 'put across' },
      { id: 'b', text: 'put down' },
      { id: 'c', text: 'put forth' },
      { id: 'd', text: 'put out' },
    ],
    correct: 'c', difficulty: 2,
    explanation_en: '"Put forth" = to exert or offer (effort, energy, ideas). "Put across" = to communicate an idea successfully; "put down" = to place down, to criticize, or to put to sleep; "put out" = to extinguish or to inconvenience.',
    explanation_fil: '"Put forth" = magsikap o mag-alok (ng pagsisikap, lakas, mga ideya). "Put across" = matagumpay na maihatid ang isang ideya; "put down" = ilagay sa ibaba, lokohin, o patayin nang mahinahon; "put out" = patayain o abalahin.',
  },
  {
    stem: 'Did you help in ___ the table?',
    choices: [
      { id: 'a', text: 'setting apart' },
      { id: 'b', text: 'setting back' },
      { id: 'c', text: 'setting down' },
      { id: 'd', text: 'setting up' },
    ],
    correct: 'd', difficulty: 1,
    explanation_en: '"Setting up" = to arrange, prepare, or organize (a table = to prepare it for a meal). "Setting apart" = to distinguish or separate; "setting back" = to delay or move further from; "setting down" = to put something down.',
    explanation_fil: '"Setting up" = mag-ayos, maghanda, o mag-organisa (ng mesa = ihanda ito para sa pagkain). "Setting apart" = pantukuyin o ihiwalay; "setting back" = antalahin o ilayo; "setting down" = ilagay ang isang bagay.',
  },
  {
    stem: 'She ___ the details of the program.',
    choices: [
      { id: 'a', text: 'wrote in' },
      { id: 'b', text: 'wrote off' },
      { id: 'c', text: 'wrote over' },
      { id: 'd', text: 'wrote up' },
    ],
    correct: 'd', difficulty: 2,
    explanation_en: '"Wrote up" = to prepare a written record, report, or account of something. "Wrote off" = to cancel a debt or to dismiss something as worthless; "wrote in" = to add by writing; "wrote over" = to write on top of something.',
    explanation_fil: '"Wrote up" = maghanda ng nakasulat na rekord, ulat, o talaan ng isang bagay. "Wrote off" = kanselahin ang utang o ituring na walang halaga; "wrote in" = dagdag sa pamamagitan ng pagsusulat; "wrote over" = sumulat sa ibabaw ng isang bagay.',
  },
];

async function main() {
  console.log(`📖 Inserting Correct Usage (${QUESTIONS.length} questions) for Pro + Sub...\n`);
  const SOURCE = 'CSE Reviewer 2026 | English: Correct Usage | Level: both | flashcard:yes | tutor-ready:yes';

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO, stem: q.stem, choices: q.choices,
    correct_choice_id: q.correct, difficulty: q.difficulty,
    explanation_en: q.explanation_en, explanation_fil: q.explanation_fil,
    source_note: SOURCE, status: 'published', is_verified: true,
  }));
  const subRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_SUB, stem: q.stem, choices: q.choices,
    correct_choice_id: q.correct, difficulty: q.difficulty,
    explanation_en: q.explanation_en, explanation_fil: q.explanation_fil,
    source_note: SOURCE, status: 'published', is_verified: true,
  }));

  await insertBatch(proRows);
  console.log(`  Pro grammar: ${proRows.length} inserted.`);
  await insertBatch(subRows);
  console.log(`  Sub grammar: ${subRows.length} inserted.`);

  const { count } = await sb.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published');
  console.log(`\n✅ Done! Total: ${count} (+${proRows.length + subRows.length} new)\n`);
}
main().catch(console.error);
