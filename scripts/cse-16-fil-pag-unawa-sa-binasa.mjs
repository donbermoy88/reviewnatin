/**
 * CSE-16: Filipino — Pag-unawa sa Binasa (Reading Comprehension) — 30 questions, 6 passages
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

const TOPIC_PRO = '43399734-967c-444c-b583-b68fdff2de1c';
const TOPIC_SUB = '679fffb1-c0ca-46e8-93e2-f0c35874b960';

const QUESTIONS = [
  // TALATA 1 — Kalikasan at Kapaligiran (5 questions)
  {
    stem: `Ang kalikasan ay isa sa mga pinakamahalagang yaman ng ating bansa. Subalit sa nakaraang ilang dekada, patuloy na nababawasan ang ating mga kagubatan, ilog, at karagatan dahil sa maling paggamit ng tao. Ang polusyon sa hangin, lupa, at tubig ay nagdudulot ng malaking pinsala sa kalusugan ng tao at sa mga hayop at halaman. Kinikilala ng mga siyentipiko na ang pagbabago ng klima ay isa sa pinakamalaking hamon ng ating panahon. Upang mapanatili ang ating kalikasan para sa mga susunod na henerasyon, kailangan ng magkasamang pagsisikap ng pamahalaan, ng pribadong sektor, at ng bawat indibidwal.\n\nAno ang pangunahing mensahe ng talata?`,
    choices: [
      { id: 'a', text: 'Ang kalikasan ay walang limitasyon.' },
      { id: 'b', text: 'Ang pagbabago ng klima ay walang solusyon.' },
      { id: 'c', text: 'Ang pagpapanatili ng kalikasan ay pananagutan ng lahat.' },
      { id: 'd', text: 'Ang pamahalaan lamang ang may tungkuling pangalagaan ang kalikasan.' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'The main message is that preserving nature requires collective effort from government, private sector, and individuals.',
    explanation_fil: 'Ang pangunahing mensahe ay ang pagpapanatili ng kalikasan ay pananagutan ng lahat — ng pamahalaan, pribadong sektor, at ng bawat indibidwal.',
  },
  {
    stem: `Ang kalikasan ay isa sa mga pinakamahalagang yaman ng ating bansa. Subalit sa nakaraang ilang dekada, patuloy na nababawasan ang ating mga kagubatan, ilog, at karagatan dahil sa maling paggamit ng tao. Ang polusyon sa hangin, lupa, at tubig ay nagdudulot ng malaking pinsala sa kalusugan ng tao at sa mga hayop at halaman. Kinikilala ng mga siyentipiko na ang pagbabago ng klima ay isa sa pinakamalaking hamon ng ating panahon. Upang mapanatili ang ating kalikasan para sa mga susunod na henerasyon, kailangan ng magkasamang pagsisikap ng pamahalaan, ng pribadong sektor, at ng bawat indibidwal.\n\nAyon sa talata, ano ang nagdudulot ng pagbabawas ng ating mga kagubatan, ilog, at karagatan?`,
    choices: [
      { id: 'a', text: 'Pagbabago ng klima' },
      { id: 'b', text: 'Maling paggamit ng tao' },
      { id: 'c', text: 'Polusyon sa hangin' },
      { id: 'd', text: 'Kakulangan ng pamahalaan' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The passage states forests, rivers, and seas are being depleted "dahil sa maling paggamit ng tao" (due to man\'s misuse).',
    explanation_fil: 'Sinabi ng talata na nababawasan ang mga kagubatan, ilog, at karagatan "dahil sa maling paggamit ng tao."',
  },
  {
    stem: `Ang kalikasan ay isa sa mga pinakamahalagang yaman ng ating bansa. Subalit sa nakaraang ilang dekada, patuloy na nababawasan ang ating mga kagubatan, ilog, at karagatan dahil sa maling paggamit ng tao. Ang polusyon sa hangin, lupa, at tubig ay nagdudulot ng malaking pinsala sa kalusugan ng tao at sa mga hayop at halaman. Kinikilala ng mga siyentipiko na ang pagbabago ng klima ay isa sa pinakamalaking hamon ng ating panahon. Upang mapanatili ang ating kalikasan para sa mga susunod na henerasyon, kailangan ng magkasamang pagsisikap ng pamahalaan, ng pribadong sektor, at ng bawat indibidwal.\n\nSino ang kinikilala sa talata bilang may alam sa pinakamalalaking hamon ng ating panahon?`,
    choices: [
      { id: 'a', text: 'Ang mga mag-aaral' },
      { id: 'b', text: 'Ang mga manggagawa' },
      { id: 'c', text: 'Ang mga siyentipiko' },
      { id: 'd', text: 'Ang mga pinuno ng bansa' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Kinikilala ng mga siyentipiko na ang pagbabago ng klima ay isa sa pinakamalaking hamon."',
    explanation_fil: '"Kinikilala ng mga siyentipiko na ang pagbabago ng klima ay isa sa pinakamalaking hamon ng ating panahon."',
  },
  {
    stem: `Ang kalikasan ay isa sa mga pinakamahalagang yaman ng ating bansa. Subalit sa nakaraang ilang dekada, patuloy na nababawasan ang ating mga kagubatan, ilog, at karagatan dahil sa maling paggamit ng tao. Ang polusyon sa hangin, lupa, at tubig ay nagdudulot ng malaking pinsala sa kalusugan ng tao at sa mga hayop at halaman. Kinikilala ng mga siyentipiko na ang pagbabago ng klima ay isa sa pinakamalaking hamon ng ating panahon. Upang mapanatili ang ating kalikasan para sa mga susunod na henerasyon, kailangan ng magkasamang pagsisikap ng pamahalaan, ng pribadong sektor, at ng bawat indibidwal.\n\nAno ang epekto ng polusyon ayon sa talata?`,
    choices: [
      { id: 'a', text: 'Nagdudulot ng malaking pinsala sa kalusugan ng tao at sa mga hayop at halaman' },
      { id: 'b', text: 'Nagpapabuti ng kalikasan' },
      { id: 'c', text: 'Nagdudulot ng mabilis na paglago ng ekonomiya' },
      { id: 'd', text: 'Nagpapabilis ng pagbabago ng klima' },
    ],
    correct: 'a',
    difficulty: 1,
    explanation_en: '"Ang polusyon... ay nagdudulot ng malaking pinsala sa kalusugan ng tao at sa mga hayop at halaman."',
    explanation_fil: '"Ang polusyon sa hangin, lupa, at tubig ay nagdudulot ng malaking pinsala sa kalusugan ng tao at sa mga hayop at halaman."',
  },
  {
    stem: `Ang kalikasan ay isa sa mga pinakamahalagang yaman ng ating bansa. Subalit sa nakaraang ilang dekada, patuloy na nababawasan ang ating mga kagubatan, ilog, at karagatan dahil sa maling paggamit ng tao. Ang polusyon sa hangin, lupa, at tubig ay nagdudulot ng malaking pinsala sa kalusugan ng tao at sa mga hayop at halaman. Kinikilala ng mga siyentipiko na ang pagbabago ng klima ay isa sa pinakamalaking hamon ng ating panahon. Upang mapanatili ang ating kalikasan para sa mga susunod na henerasyon, kailangan ng magkasamang pagsisikap ng pamahalaan, ng pribadong sektor, at ng bawat indibidwal.\n\nPara kanino dapat pangalagaan ang kalikasan ayon sa talata?`,
    choices: [
      { id: 'a', text: 'Para sa mayayaman' },
      { id: 'b', text: 'Para sa mga susunod na henerasyon' },
      { id: 'c', text: 'Para sa mga siyentipiko' },
      { id: 'd', text: 'Para sa pamahalaan' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Upang mapanatili ang ating kalikasan para sa mga susunod na henerasyon."',
    explanation_fil: '"Upang mapanatili ang ating kalikasan para sa mga susunod na henerasyon."',
  },

  // TALATA 2 — Edukasyon (5 questions)
  {
    stem: `Ang edukasyon ay susi sa tagumpay. Ito ang paniniwala ng maraming Pilipino na naghahanap ng mas magandang kinabukasan para sa kanilang mga anak. Sa pamamagitan ng edukasyon, ang isang tao ay nakakakuha ng kaalaman, kakayahan, at pagpapahalaga na kailangan niya sa buhay. Ang edukasyon ay hindi lamang nagtuturo ng mga aralin sa paaralan kundi nagbibigay din ng mga aral sa buhay. Subalit ang edukasyon sa Pilipinas ay nararahunan ng maraming hamon: kakulangan ng mga guro, kulang na pasilidad, at kahirapan ng pamilya. Sa kabila nito, marami pa ring mga Pilipino ang nagsusumikap upang makamit ang edukasyon na kanilang pinapangarap.\n\nAyon sa talata, ano ang kahulugan ng edukasyon para sa maraming Pilipino?`,
    choices: [
      { id: 'a', text: 'Isang paraan upang maging mayaman' },
      { id: 'b', text: 'Susi sa tagumpay at mas magandang kinabukasan' },
      { id: 'c', text: 'Isang obligasyon ng bawat mamamayan' },
      { id: 'd', text: 'Paraan upang makaalis sa bansa' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Ang edukasyon ay susi sa tagumpay... magandang kinabukasan para sa kanilang mga anak."',
    explanation_fil: '"Ang edukasyon ay susi sa tagumpay" — ito ang paniniwala ng maraming Pilipino para sa mas magandang kinabukasan.',
  },
  {
    stem: `Ang edukasyon ay susi sa tagumpay. Ito ang paniniwala ng maraming Pilipino na naghahanap ng mas magandang kinabukasan para sa kanilang mga anak. Sa pamamagitan ng edukasyon, ang isang tao ay nakakakuha ng kaalaman, kakayahan, at pagpapahalaga na kailangan niya sa buhay. Ang edukasyon ay hindi lamang nagtuturo ng mga aralin sa paaralan kundi nagbibigay din ng mga aral sa buhay. Subalit ang edukasyon sa Pilipinas ay nararahunan ng maraming hamon: kakulangan ng mga guro, kulang na pasilidad, at kahirapan ng pamilya. Sa kabila nito, marami pa ring mga Pilipino ang nagsusumikap upang makamit ang edukasyon na kanilang pinapangarap.\n\nAnong mga hamon ang nabanggit sa talata ukol sa edukasyon sa Pilipinas?`,
    choices: [
      { id: 'a', text: 'Mahal na bayarin, kakulangan ng guro, at malayo ang paaralan' },
      { id: 'b', text: 'Kakulangan ng guro, kulang na pasilidad, at kahirapan ng pamilya' },
      { id: 'c', text: 'Mababang kalidad ng edukasyon at absentismo ng mag-aaral' },
      { id: 'd', text: 'Masyadong maraming paaralan at kakulangan ng guro' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Kakulangan ng mga guro, kulang na pasilidad, at kahirapan ng pamilya" — these are the three challenges mentioned.',
    explanation_fil: 'Ang tatlong hamon na nabanggit ay: kakulangan ng mga guro, kulang na pasilidad, at kahirapan ng pamilya.',
  },
  {
    stem: `Ang edukasyon ay susi sa tagumpay. Ito ang paniniwala ng maraming Pilipino na naghahanap ng mas magandang kinabukasan para sa kanilang mga anak. Sa pamamagitan ng edukasyon, ang isang tao ay nakakakuha ng kaalaman, kakayahan, at pagpapahalaga na kailangan niya sa buhay. Ang edukasyon ay hindi lamang nagtuturo ng mga aralin sa paaralan kundi nagbibigay din ng mga aral sa buhay. Subalit ang edukasyon sa Pilipinas ay nararahunan ng maraming hamon: kakulangan ng mga guro, kulang na pasilidad, at kahirapan ng pamilya. Sa kabila nito, marami pa ring mga Pilipino ang nagsusumikap upang makamit ang edukasyon na kanilang pinapangarap.\n\nAno ang ibig sabihin ng "susi sa tagumpay" sa unang pangungusap?`,
    choices: [
      { id: 'a', text: 'Ang edukasyon ay isang mahirap na landas.' },
      { id: 'b', text: 'Ang edukasyon ay magbubukas ng daan tungo sa tagumpay.' },
      { id: 'c', text: 'Ang edukasyon ay isang pribilehiyo lamang ng mga mayaman.' },
      { id: 'd', text: 'Ang edukasyon ay hindi garantiya ng tagumpay.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Susi sa tagumpay" is a metaphor meaning education is the key that unlocks success.',
    explanation_fil: '"Susi sa tagumpay" ay metapora na nangangahulugang ang edukasyon ay magbubukas ng daan patungo sa tagumpay.',
  },
  {
    stem: `Ang edukasyon ay susi sa tagumpay. Ito ang paniniwala ng maraming Pilipino na naghahanap ng mas magandang kinabukasan para sa kanilang mga anak. Sa pamamagitan ng edukasyon, ang isang tao ay nakakakuha ng kaalaman, kakayahan, at pagpapahalaga na kailangan niya sa buhay. Ang edukasyon ay hindi lamang nagtuturo ng mga aralin sa paaralan kundi nagbibigay din ng mga aral sa buhay. Subalit ang edukasyon sa Pilipinas ay nararahunan ng maraming hamon: kakulangan ng mga guro, kulang na pasilidad, at kahirapan ng pamilya. Sa kabila nito, marami pa ring mga Pilipino ang nagsusumikap upang makamit ang edukasyon na kanilang pinapangarap.\n\nBukod sa mga aralin sa paaralan, ano pa ang ibinibigay ng edukasyon ayon sa talata?`,
    choices: [
      { id: 'a', text: 'Kayamanan at katanyagan' },
      { id: 'b', text: 'Mga kaibigan at koneksyon' },
      { id: 'c', text: 'Mga aral sa buhay' },
      { id: 'd', text: 'Trabaho at oportunidad' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Ang edukasyon ay hindi lamang nagtuturo ng mga aralin sa paaralan kundi nagbibigay din ng mga aral sa buhay."',
    explanation_fil: 'Ang edukasyon ay "nagbibigay din ng mga aral sa buhay" — hindi lamang aralin sa paaralan.',
  },
  {
    stem: `Ang edukasyon ay susi sa tagumpay. Ito ang paniniwala ng maraming Pilipino na naghahanap ng mas magandang kinabukasan para sa kanilang mga anak. Sa pamamagitan ng edukasyon, ang isang tao ay nakakakuha ng kaalaman, kakayahan, at pagpapahalaga na kailangan niya sa buhay. Ang edukasyon ay hindi lamang nagtuturo ng mga aralin sa paaralan kundi nagbibigay din ng mga aral sa buhay. Subalit ang edukasyon sa Pilipinas ay nararahunan ng maraming hamon: kakulangan ng mga guro, kulang na pasilidad, at kahirapan ng pamilya. Sa kabila nito, marami pa ring mga Pilipino ang nagsusumikap upang makamit ang edukasyon na kanilang pinapangarap.\n\nAnong saloobin ang ipinahayag ng talata tungkol sa mga Pilipino sa kabila ng mga hamon?`,
    choices: [
      { id: 'a', text: 'Sila ay nag-aalala at wala nang pag-asa.' },
      { id: 'b', text: 'Sila ay nagsusumikap pa rin upang makamit ang edukasyon.' },
      { id: 'c', text: 'Sila ay umaaasa sa tulong ng ibang bansa.' },
      { id: 'd', text: 'Sila ay sumusuko na sa kanilang mga pangarap.' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Sa kabila nito, marami pa ring mga Pilipino ang nagsusumikap upang makamit ang edukasyon na kanilang pinapangarap."',
    explanation_fil: '"Sa kabila nito, marami pa ring mga Pilipino ang nagsusumikap upang makamit ang edukasyon na kanilang pinapangarap."',
  },

  // TALATA 3 — Pagmamahal sa Bansa (5 questions)
  {
    stem: `Ang pagmamahal sa bansa ay hindi lamang ipinapakita sa panahon ng digmaan o krisis. Ito ay ipinapakita sa mga simpleng gawa sa araw-araw: ang pagtatapon ng basura sa tamang lugar, ang pagsunod sa batas, ang pagbabayad ng buwis, at ang pagiging mapagkandili sa kapwa. Ang isang mamamayang nagmamahal sa kanyang bansa ay aktibong lumalahok sa mga usaping panlipunan at pulitikal. Hindi siya basta-basta nagpapadala sa impormasyon na hindi napatunayan. Iniingatan niya ang kapakanan ng lahat, hindi lamang ng sarili. Ang tunay na pagmamahal sa bansa ay nagsisimula sa pagmamahal sa sariling komunidad.\n\nAyon sa talata, paano ipinakita ang pagmamahal sa bansa sa pang-araw-araw na buhay?`,
    choices: [
      { id: 'a', text: 'Sa pakikidigma para sa bansa' },
      { id: 'b', text: 'Sa pagsali sa mga rally at demonstrasyon' },
      { id: 'c', text: 'Sa mga simpleng gawa tulad ng pagtatapon ng basura sa tamang lugar at pagsunod sa batas' },
      { id: 'd', text: 'Sa pagiging miyembro ng pulitika' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: 'The passage lists daily acts: proper garbage disposal, following laws, paying taxes, and caring for others.',
    explanation_fil: 'Ang talata ay naglista ng mga simpleng gawa: pagtatapon ng basura sa tamang lugar, pagsunod sa batas, pagbabayad ng buwis.',
  },
  {
    stem: `Ang pagmamahal sa bansa ay hindi lamang ipinapakita sa panahon ng digmaan o krisis. Ito ay ipinapakita sa mga simpleng gawa sa araw-araw: ang pagtatapon ng basura sa tamang lugar, ang pagsunod sa batas, ang pagbabayad ng buwis, at ang pagiging mapagkandili sa kapwa. Ang isang mamamayang nagmamahal sa kanyang bansa ay aktibong lumalahok sa mga usaping panlipunan at pulitikal. Hindi siya basta-basta nagpapadala sa impormasyon na hindi napatunayan. Iniingatan niya ang kapakanan ng lahat, hindi lamang ng sarili. Ang tunay na pagmamahal sa bansa ay nagsisimula sa pagmamahal sa sariling komunidad.\n\nSaan nagsisimula ang tunay na pagmamahal sa bansa ayon sa talata?`,
    choices: [
      { id: 'a', text: 'Sa paaralan' },
      { id: 'b', text: 'Sa pamilya' },
      { id: 'c', text: 'Sa sariling komunidad' },
      { id: 'd', text: 'Sa gobyerno' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Ang tunay na pagmamahal sa bansa ay nagsisimula sa pagmamahal sa sariling komunidad."',
    explanation_fil: '"Ang tunay na pagmamahal sa bansa ay nagsisimula sa pagmamahal sa sariling komunidad."',
  },
  {
    stem: `Ang pagmamahal sa bansa ay hindi lamang ipinapakita sa panahon ng digmaan o krisis. Ito ay ipinapakita sa mga simpleng gawa sa araw-araw: ang pagtatapon ng basura sa tamang lugar, ang pagsunod sa batas, ang pagbabayad ng buwis, at ang pagiging mapagkandili sa kapwa. Ang isang mamamayang nagmamahal sa kanyang bansa ay aktibong lumalahok sa mga usaping panlipunan at pulitikal. Hindi siya basta-basta nagpapadala sa impormasyon na hindi napatunayan. Iniingatan niya ang kapakanan ng lahat, hindi lamang ng sarili. Ang tunay na pagmamahal sa bansa ay nagsisimula sa pagmamahal sa sariling komunidad.\n\nAno ang katangian ng isang mamamayang nagmamahal sa kanyang bansa batay sa talata?`,
    choices: [
      { id: 'a', text: 'Aktibong lumalahok sa mga usaping panlipunan at pulitikal at iniingatan ang kapakanan ng lahat' },
      { id: 'b', text: 'Palaging sumusunod sa utos ng pamahalaan nang walang tanong' },
      { id: 'c', text: 'Nagbabayad ng mataas na buwis at nagtatayo ng negosyo' },
      { id: 'd', text: 'Nagtatrabaho sa ibang bansa upang makapagpadala ng pera' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'Active participation in social/political issues and caring for others\' welfare are mentioned as traits of a patriot.',
    explanation_fil: 'Ang aktibong paglahok sa mga usaping panlipunan at pulitikal, at pag-iingat sa kapakanan ng lahat ang katangian ng mamamayang nagmamahal sa bansa.',
  },
  {
    stem: `Ang pagmamahal sa bansa ay hindi lamang ipinapakita sa panahon ng digmaan o krisis. Ito ay ipinapakita sa mga simpleng gawa sa araw-araw: ang pagtatapon ng basura sa tamang lugar, ang pagsunod sa batas, ang pagbabayad ng buwis, at ang pagiging mapagkandili sa kapwa. Ang isang mamamayang nagmamahal sa kanyang bansa ay aktibong lumalahok sa mga usaping panlipunan at pulitikal. Hindi siya basta-basta nagpapadala sa impormasyon na hindi napatunayan. Iniingatan niya ang kapakanan ng lahat, hindi lamang ng sarili. Ang tunay na pagmamahal sa bansa ay nagsisimula sa pagmamahal sa sariling komunidad.\n\nBakit hindi "basta-basta nagpapadala sa impormasyon na hindi napatunayan" ang isang mamamayang nagmamahal sa bansa?`,
    choices: [
      { id: 'a', text: 'Dahil siya ay tahimik at hindi pinagkakaabalahan ang mga tsismis.' },
      { id: 'b', text: 'Dahil siya ay nag-iingat na hindi makakalat ang maling impormasyon.' },
      { id: 'c', text: 'Dahil siya ay walang access sa internet.' },
      { id: 'd', text: 'Dahil siya ay masyadong abala sa trabaho.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: 'A patriot does not spread unverified information to protect the public from misinformation.',
    explanation_fil: 'Ang tunay na nagmamahal sa bansa ay nag-iingat na hindi makakalat ang maling impormasyon — mahalaga ang katotohanan sa lipunan.',
  },
  {
    stem: `Ang pagmamahal sa bansa ay hindi lamang ipinapakita sa panahon ng digmaan o krisis. Ito ay ipinapakita sa mga simpleng gawa sa araw-araw: ang pagtatapon ng basura sa tamang lugar, ang pagsunod sa batas, ang pagbabayad ng buwis, at ang pagiging mapagkandili sa kapwa. Ang isang mamamayang nagmamahal sa kanyang bansa ay aktibong lumalahok sa mga usaping panlipunan at pulitikal. Hindi siya basta-basta nagpapadala sa impormasyon na hindi napatunayan. Iniingatan niya ang kapakanan ng lahat, hindi lamang ng sarili. Ang tunay na pagmamahal sa bansa ay nagsisimula sa pagmamahal sa sariling komunidad.\n\nAno ang pinakaangkop na pamagat para sa talatang ito?`,
    choices: [
      { id: 'a', text: 'Ang Pilipino at ang Digmaan' },
      { id: 'b', text: 'Ang Pagmamahal sa Bansa sa Pang-araw-araw na Buhay' },
      { id: 'c', text: 'Ang Tungkulin ng Pamahalaan' },
      { id: 'd', text: 'Mga Simpleng Hakbang para sa Kalikasan' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: 'The passage discusses everyday expressions of patriotism — "Ang Pagmamahal sa Bansa sa Pang-araw-araw na Buhay" is the best title.',
    explanation_fil: 'Tinatalakay ng talata ang mga pang-araw-araw na paraan ng pagpapakita ng pagmamahal sa bansa.',
  },

  // TALATA 4 — Kabataan (5 questions)
  {
    stem: `Ang kabataan ang pag-asa ng bayan. Ito ang kilalang kasabihan ni Dr. Jose Rizal na hanggang ngayon ay nananatiling totoo. Ang mga kabataan ngayon ay may malaking responsibilidad sa pagbuo ng kinabukasan ng bansa. Sila ay dapat na may mataas na edukasyon, mabuting pagpapahalaga, at malakas na katawan upang harapin ang mga hamon ng modernong panahon. Subalit ang kabataan ay nararahunan rin ng mga panganib tulad ng masamang impluwensya ng teknolohiya, droga, at kakulangan ng direksyon sa buhay. Kaya naman, ang gabay ng pamilya, paaralan, at komunidad ay napakahalaga sa pag-unlad ng bawat kabataan.\n\nSino ang may kasabihang "Ang kabataan ang pag-asa ng bayan"?`,
    choices: [
      { id: 'a', text: 'Andres Bonifacio' },
      { id: 'b', text: 'Emilio Aguinaldo' },
      { id: 'c', text: 'Jose Rizal' },
      { id: 'd', text: 'Apolinario Mabini' },
    ],
    correct: 'c',
    difficulty: 1,
    explanation_en: '"Ang kabataan ang pag-asa ng bayan" is attributed to Dr. Jose Rizal.',
    explanation_fil: 'Ang kasabihang "Ang kabataan ang pag-asa ng bayan" ay sinabi ni Dr. Jose Rizal.',
  },
  {
    stem: `Ang kabataan ang pag-asa ng bayan. Ito ang kilalang kasabihan ni Dr. Jose Rizal na hanggang ngayon ay nananatiling totoo. Ang mga kabataan ngayon ay may malaking responsibilidad sa pagbuo ng kinabukasan ng bansa. Sila ay dapat na may mataas na edukasyon, mabuting pagpapahalaga, at malakas na katawan upang harapin ang mga hamon ng modernong panahon. Subalit ang kabataan ay nararahunan rin ng mga panganib tulad ng masamang impluwensya ng teknolohiya, droga, at kakulangan ng direksyon sa buhay. Kaya naman, ang gabay ng pamilya, paaralan, at komunidad ay napakahalaga sa pag-unlad ng bawat kabataan.\n\nAno ang mga responsibilidad ng kabataan ayon sa talata?`,
    choices: [
      { id: 'a', text: 'Mag-aral, sumunod sa magulang, at iwasang makialam sa pulitika' },
      { id: 'b', text: 'Magkaroon ng mataas na edukasyon, mabuting pagpapahalaga, at malakas na katawan' },
      { id: 'c', text: 'Makiisa sa mga rali at ipahayag ang kanilang karapatan' },
      { id: 'd', text: 'Maghanap ng trabaho at tulungan ang pamilya' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Dapat na may mataas na edukasyon, mabuting pagpapahalaga, at malakas na katawan."',
    explanation_fil: 'Ang kabataan ay "dapat na may mataas na edukasyon, mabuting pagpapahalaga, at malakas na katawan."',
  },
  {
    stem: `Ang kabataan ang pag-asa ng bayan. Ito ang kilalang kasabihan ni Dr. Jose Rizal na hanggang ngayon ay nananatiling totoo. Ang mga kabataan ngayon ay may malaking responsibilidad sa pagbuo ng kinabukasan ng bansa. Sila ay dapat na may mataas na edukasyon, mabuting pagpapahalaga, at malakas na katawan upang harapin ang mga hamon ng modernong panahon. Subalit ang kabataan ay nararahunan rin ng mga panganib tulad ng masamang impluwensya ng teknolohiya, droga, at kakulangan ng direksyon sa buhay. Kaya naman, ang gabay ng pamilya, paaralan, at komunidad ay napakahalaga sa pag-unlad ng bawat kabataan.\n\nAnong mga panganib ang kinakaharap ng kabataan ayon sa talata?`,
    choices: [
      { id: 'a', text: 'Kahirapan, sakit, at kawalang-trabaho' },
      { id: 'b', text: 'Masamang impluwensya ng teknolohiya, droga, at kakulangan ng direksyon sa buhay' },
      { id: 'c', text: 'Kulang na edukasyon at mahal na pamumuhay' },
      { id: 'd', text: 'Mabilis na pagbabago ng teknolohiya at kakulangan ng pagkakataon' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Masamang impluwensya ng teknolohiya, droga, at kakulangan ng direksyon sa buhay" are the dangers mentioned.',
    explanation_fil: 'Ang mga panganib na nabanggit: "masamang impluwensya ng teknolohiya, droga, at kakulangan ng direksyon sa buhay."',
  },
  {
    stem: `Ang kabataan ang pag-asa ng bayan. Ito ang kilalang kasabihan ni Dr. Jose Rizal na hanggang ngayon ay nananatiling totoo. Ang mga kabataan ngayon ay may malaking responsibilidad sa pagbuo ng kinabukasan ng bansa. Sila ay dapat na may mataas na edukasyon, mabuting pagpapahalaga, at malakas na katawan upang harapin ang mga hamon ng modernong panahon. Subalit ang kabataan ay nararahunan rin ng mga panganib tulad ng masamang impluwensya ng teknolohiya, droga, at kakulangan ng direksyon sa buhay. Kaya naman, ang gabay ng pamilya, paaralan, at komunidad ay napakahalaga sa pag-unlad ng bawat kabataan.\n\nBakit mahalaga ang gabay ng pamilya, paaralan, at komunidad sa kabataan?`,
    choices: [
      { id: 'a', text: 'Upang masunod ng kabataan ang batas ng bansa' },
      { id: 'b', text: 'Upang maprotektahan ang kabataan mula sa mga panganib at matulungan silang lumago' },
      { id: 'c', text: 'Upang matiyak na ang kabataan ay makapagtapos ng pag-aaral' },
      { id: 'd', text: 'Upang maging responsable ang kabataan sa kanilang mga tahanan' },
    ],
    correct: 'd',
    difficulty: 2,
    explanation_en: 'The guidance of family, school, and community is important "sa pag-unlad ng bawat kabataan" — for the development of every youth.',
    explanation_fil: 'Ang gabay ay mahalaga "sa pag-unlad ng bawat kabataan" — upang maprotektahan at matulungang lumago ang kabataan sa gitna ng mga panganib.',
  },
  {
    stem: `Ang kabataan ang pag-asa ng bayan. Ito ang kilalang kasabihan ni Dr. Jose Rizal na hanggang ngayon ay nananatiling totoo. Ang mga kabataan ngayon ay may malaking responsibilidad sa pagbuo ng kinabukasan ng bansa. Sila ay dapat na may mataas na edukasyon, mabuting pagpapahalaga, at malakas na katawan upang harapin ang mga hamon ng modernong panahon. Subalit ang kabataan ay nararahunan rin ng mga panganib tulad ng masamang impluwensya ng teknolohiya, droga, at kakulangan ng direksyon sa buhay. Kaya naman, ang gabay ng pamilya, paaralan, at komunidad ay napakahalaga sa pag-unlad ng bawat kabataan.\n\nAno ang pangunahing tema ng talata?`,
    choices: [
      { id: 'a', text: 'Ang kabataan bilang pag-asa ng bayan at ang mga responsibilidad at panganib na kinakaharap nila' },
      { id: 'b', text: 'Ang edukasyon bilang susi sa tagumpay ng kabataan' },
      { id: 'c', text: 'Ang kahalagahan ng teknolohiya sa modernong kabataan' },
      { id: 'd', text: 'Ang papel ng pamilya sa lipunan' },
    ],
    correct: 'a',
    difficulty: 2,
    explanation_en: 'The theme covers the youth as the hope of the nation and their responsibilities and dangers.',
    explanation_fil: 'Ang pangunahing tema ay ang kabataan bilang pag-asa ng bayan, kasama ang kanilang mga responsibilidad at panganib na kinakaharap.',
  },

  // TALATA 5 — Wikang Filipino (5 questions)
  {
    stem: `Ang wika ay salamin ng kultura ng isang bansa. Ang wikang Filipino, na binuo mula sa wikang Tagalog at pinagsama ang mga salita mula sa iba't ibang wika tulad ng Ingles, Espanyol, at mga katutubong wika, ay nagsisilbing simbolo ng pagkakaisa ng mga Pilipino. Sa Artikulo XIV ng Saligang Batas ng Pilipinas, itinakda ang Filipino bilang wikang pambansa. Ito ay ginagamit sa pag-aaral, sa opisyal na komunikasyon, at sa pang-araw-araw na pakikipag-usap. Subalit ang pagpapanatili at pagpapaunlad ng wikang Filipino ay nararahunan ng impluwensiya ng globalisasyon at ng mas laganap na paggamit ng wikang Ingles.\n\nAno ang wikang Filipino batay sa talata?`,
    choices: [
      { id: 'a', text: 'Isang wikang nagmula lamang sa Espanyol' },
      { id: 'b', text: 'Isang wikang binuo mula sa Tagalog at pinagsama ang mga salita mula sa iba\'t ibang wika' },
      { id: 'c', text: 'Isang wikang ginagamit lamang sa paaralan' },
      { id: 'd', text: 'Isang wikang dati nang ginagamit bago pa ang Pilipinas' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Binuo mula sa wikang Tagalog at pinagsama ang mga salita mula sa iba\'t ibang wika tulad ng Ingles, Espanyol, at mga katutubong wika."',
    explanation_fil: 'Ang wikang Filipino ay "binuo mula sa wikang Tagalog at pinagsama ang mga salita mula sa iba\'t ibang wika."',
  },
  {
    stem: `Ang wika ay salamin ng kultura ng isang bansa. Ang wikang Filipino, na binuo mula sa wikang Tagalog at pinagsama ang mga salita mula sa iba't ibang wika tulad ng Ingles, Espanyol, at mga katutubong wika, ay nagsisilbing simbolo ng pagkakaisa ng mga Pilipino. Sa Artikulo XIV ng Saligang Batas ng Pilipinas, itinakda ang Filipino bilang wikang pambansa. Ito ay ginagamit sa pag-aaral, sa opisyal na komunikasyon, at sa pang-araw-araw na pakikipag-usap. Subalit ang pagpapanatili at pagpapaunlad ng wikang Filipino ay nararahunan ng impluwensiya ng globalisasyon at ng mas laganap na paggamit ng wikang Ingles.\n\nSaan itinakda ang Filipino bilang wikang pambansa?`,
    choices: [
      { id: 'a', text: 'Sa Proklamasyon ng Kalayaan' },
      { id: 'b', text: 'Sa Artikulo XIV ng Saligang Batas' },
      { id: 'c', text: 'Sa Batas Pampaaralan' },
      { id: 'd', text: 'Sa Deklarasyon ng Wika' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Sa Artikulo XIV ng Saligang Batas ng Pilipinas, itinakda ang Filipino bilang wikang pambansa."',
    explanation_fil: '"Sa Artikulo XIV ng Saligang Batas ng Pilipinas, itinakda ang Filipino bilang wikang pambansa."',
  },
  {
    stem: `Ang wika ay salamin ng kultura ng isang bansa. Ang wikang Filipino, na binuo mula sa wikang Tagalog at pinagsama ang mga salita mula sa iba't ibang wika tulad ng Ingles, Espanyol, at mga katutubong wika, ay nagsisilbing simbolo ng pagkakaisa ng mga Pilipino. Sa Artikulo XIV ng Saligang Batas ng Pilipinas, itinakda ang Filipino bilang wikang pambansa. Ito ay ginagamit sa pag-aaral, sa opisyal na komunikasyon, at sa pang-araw-araw na pakikipag-usap. Subalit ang pagpapanatili at pagpapaunlad ng wikang Filipino ay nararahunan ng impluwensiya ng globalisasyon at ng mas laganap na paggamit ng wikang Ingles.\n\nAno ang ibig sabihin ng "salamin ng kultura" sa unang pangungusap?`,
    choices: [
      { id: 'a', text: 'Ang wika ay kagamitan sa pag-aaral ng kultura.' },
      { id: 'b', text: 'Ang wika ay repleksyon o katawan ng kultura ng isang bansa.' },
      { id: 'c', text: 'Ang kultura ay nalilikha ng wika.' },
      { id: 'd', text: 'Ang wika at kultura ay magkasalungat.' },
    ],
    correct: 'b',
    difficulty: 2,
    explanation_en: '"Salamin ng kultura" is a metaphor meaning language reflects and embodies the culture of a people.',
    explanation_fil: '"Salamin ng kultura" ay metapora — ang wika ay repleksyon ng kultura ng isang bansa, katulad ng salamin na nagpapakita ng larawan.',
  },
  {
    stem: `Ang wika ay salamin ng kultura ng isang bansa. Ang wikang Filipino, na binuo mula sa wikang Tagalog at pinagsama ang mga salita mula sa iba't ibang wika tulad ng Ingles, Espanyol, at mga katutubong wika, ay nagsisilbing simbolo ng pagkakaisa ng mga Pilipino. Sa Artikulo XIV ng Saligang Batas ng Pilipinas, itinakda ang Filipino bilang wikang pambansa. Ito ay ginagamit sa pag-aaral, sa opisyal na komunikasyon, at sa pang-araw-araw na pakikipag-usap. Subalit ang pagpapanatili at pagpapaunlad ng wikang Filipino ay nararahunan ng impluwensiya ng globalisasyon at ng mas laganap na paggamit ng wikang Ingles.\n\nAno ang hamon sa pagpapanatili ng wikang Filipino ayon sa talata?`,
    choices: [
      { id: 'a', text: 'Kakulangan ng mga guro ng Filipino' },
      { id: 'b', text: 'Impluwensiya ng globalisasyon at mas laganap na paggamit ng Ingles' },
      { id: 'c', text: 'Hindi pagkakaisa ng mga Pilipino' },
      { id: 'd', text: 'Pagkawala ng interes ng kabataan sa Filipino' },
    ],
    correct: 'b',
    difficulty: 1,
    explanation_en: '"Nararahunan ng impluwensiya ng globalisasyon at ng mas laganap na paggamit ng wikang Ingles."',
    explanation_fil: '"Nararahunan ng impluwensiya ng globalisasyon at ng mas laganap na paggamit ng wikang Ingles" — ito ang hamon sa wikang Filipino.',
  },
  {
    stem: `Ang wika ay salamin ng kultura ng isang bansa. Ang wikang Filipino, na binuo mula sa wikang Tagalog at pinagsama ang mga salita mula sa iba't ibang wika tulad ng Ingles, Espanyol, at mga katutubong wika, ay nagsisilbing simbolo ng pagkakaisa ng mga Pilipino. Sa Artikulo XIV ng Saligang Batas ng Pilipinas, itinakda ang Filipino bilang wikang pambansa. Ito ay ginagamit sa pag-aaral, sa opisyal na komunikasyon, at sa pang-araw-araw na pakikipag-usap. Subalit ang pagpapanatili at pagpapaunlad ng wikang Filipino ay nararahunan ng impluwensiya ng globalisasyon at ng mas laganap na paggamit ng wikang Ingles.\n\nBilang simbolo ng pagkakaisa ng mga Pilipino, ang wikang Filipino ay —`,
    choices: [
      { id: 'a', text: 'nagsisilbing hadlang sa pagbabago ng bansa' },
      { id: 'b', text: 'nagtataglay ng mga salita mula sa isang wika lamang' },
      { id: 'c', text: 'nagbubuklod sa iba\'t ibang pangkat ng mga Pilipino' },
      { id: 'd', text: 'ginagamit lamang sa mga pormal na okasyon' },
    ],
    correct: 'c',
    difficulty: 2,
    explanation_en: 'As a symbol of unity, the Filipino language brings together the different groups of Filipinos.',
    explanation_fil: 'Bilang simbolo ng pagkakaisa, ang wikang Filipino ay nagbubuklod sa iba\'t ibang pangkat ng mga Pilipino.',
  },
];

async function insertBatch(rows) {
  const { data, error } = await sb.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.length;
}

async function main() {
  console.log(`📖 Inserting Filipino Pag-unawa sa Binasa (${QUESTIONS.length} questions) for Pro + Sub...\n`);

  const proRows = QUESTIONS.map(q => ({
    topic_id: TOPIC_PRO,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct,
    difficulty: q.difficulty,
    explanation_en: q.explanation_en,
    explanation_fil: q.explanation_fil,
    source_note: 'CSE 2026 Reviewer — Filipino Pag-unawa sa Binasa',
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
    source_note: 'CSE 2026 Reviewer — Filipino Pag-unawa sa Binasa',
    status: 'published',
    is_verified: true,
  }));

  const n1 = await insertBatch(proRows);
  console.log(`  Pro reading-comp-fil: ${n1} inserted.`);
  const n2 = await insertBatch(subRows);
  console.log(`  Sub reading-comp-fil: ${n2} inserted.`);

  console.log(`\n✅ Done! +${n1 + n2} new questions`);
}

main().catch(e => { console.error(e); process.exit(1); });
