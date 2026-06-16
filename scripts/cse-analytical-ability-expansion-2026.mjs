/**
 * CSE Professional Analytical Ability expansion.
 *
 * Original ReviewNatin practice items aligned to common CSE Professional
 * Analytical Ability coverage: word association, assumptions/conclusions,
 * logic, and data interpretation.
 *
 * Run:
 *   node scripts/cse-analytical-ability-expansion-2026.mjs --dry-run
 *   node scripts/cse-analytical-ability-expansion-2026.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { auditQuestion, normalizeText } from './lib/content-quality-rules.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase', 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    })
);

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TOPICS = {
  'word-association': {
    id: '93402385-8ef0-4369-ba42-5883dcd52fbf',
    name: 'Word Association',
    subject: 'Analytical Ability',
  },
  'assumptions-conclusions': {
    id: '2c63e431-c2d8-4c52-9ed3-8155216bdb23',
    name: 'Identifying Assumptions and Conclusions',
    subject: 'Analytical Ability',
  },
  logic: {
    id: '42afbfbc-eb26-4470-8482-3139e2a888aa',
    name: 'Logic and Reasoning',
    subject: 'Analytical Ability',
  },
  'data-interpretation': {
    id: 'df65e506-4990-4575-b4c0-bade603612a8',
    name: 'Data Interpretation',
    subject: 'Analytical Ability',
  },
};

function q(topic, stem, choices, correct, explanationEn, explanationFil, difficulty = 2) {
  if (!TOPICS[topic]) throw new Error(`Unknown topic slug: ${topic}`);
  return {
    topic,
    stem,
    choices: choices.map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
    correct_choice_id: correct,
    explanation_en: explanationEn,
    explanation_fil: explanationFil,
    difficulty,
  };
}

const QUESTIONS = [
  q(
    'word-association',
    'Word association: THERMOMETER is to TEMPERATURE as BAROMETER is to:',
    ['Speed', 'Pressure', 'Distance', 'Humidity'],
    'b',
    'A thermometer measures temperature. A barometer measures atmospheric pressure. The relationship is instrument to what it measures.',
    'Ang thermometer ay sumusukat ng temperature. Ang barometer ay sumusukat ng atmospheric pressure. Ang relasyon ay instrumento sa sinusukat nito.',
    1
  ),
  q(
    'word-association',
    'Word association: MINUTES are to TIME as GRAMS are to:',
    ['Mass', 'Length', 'Volume', 'Speed'],
    'a',
    'Minutes are units used to measure time. Grams are units used to measure mass or weight in ordinary usage.',
    'Ang minuto ay yunit sa pagsukat ng oras. Ang gramo ay yunit sa pagsukat ng bigat o mass.',
    1
  ),
  q(
    'word-association',
    'Word association: EDITOR is to MANUSCRIPT as AUDITOR is to:',
    ['Blueprint', 'Accounts', 'Laboratory', 'Election'],
    'b',
    'An editor examines and corrects a manuscript. An auditor examines accounts or financial records.',
    'Sinusuri at itinatama ng editor ang manuscript. Sinusuri naman ng auditor ang accounts o financial records.',
    2
  ),
  q(
    'word-association',
    'Word association: PLOW is to FARMER as SCALPEL is to:',
    ['Surgeon', 'Teacher', 'Architect', 'Driver'],
    'a',
    'A plow is a tool commonly associated with a farmer. A scalpel is a tool commonly associated with a surgeon.',
    'Ang araro ay kasangkapang karaniwang kaugnay ng magsasaka. Ang scalpel ay kasangkapang karaniwang kaugnay ng surgeon.',
    1
  ),
  q(
    'word-association',
    'Word association: ARCHIVE is to RECORDS as WAREHOUSE is to:',
    ['Goods', 'Patients', 'Students', 'Votes'],
    'a',
    'An archive stores records. A warehouse stores goods. The relationship is storage place to stored item.',
    'Ang archive ay imbakan ng records. Ang warehouse ay imbakan ng goods. Ang relasyon ay lugar ng imbakan sa iniimbak.',
    2
  ),
  q(
    'word-association',
    'Word association: VACCINE is to PREVENTION as ANTIDOTE is to:',
    ['Diagnosis', 'Treatment', 'Infection', 'Exercise'],
    'b',
    'A vaccine is primarily used for prevention. An antidote is used for treatment after poisoning or harmful exposure.',
    'Ang vaccine ay pangunahing ginagamit para sa prevention. Ang antidote ay ginagamit sa treatment pagkatapos ng pagkalason o exposure.',
    2
  ),
  q(
    'word-association',
    'Word association: COMPASS is to DIRECTION as RULER is to:',
    ['Color', 'Length', 'Sound', 'Heat'],
    'b',
    'A compass helps determine direction. A ruler helps measure length.',
    'Ang compass ay tumutulong malaman ang direksyon. Ang ruler ay tumutulong sukatin ang haba.',
    1
  ),
  q(
    'word-association',
    'Word association: Which word does NOT belong with the group: CONTRACT, AGREEMENT, COVENANT, DISPUTE?',
    ['Contract', 'Agreement', 'Covenant', 'Dispute'],
    'd',
    'Contract, agreement, and covenant refer to forms of mutual commitment. Dispute means a disagreement, so it is opposite in relationship.',
    'Ang contract, agreement, at covenant ay tumutukoy sa uri ng kasunduan. Ang dispute ay hindi pagkakasundo kaya ito ang naiiba.',
    2
  ),

  q(
    'assumptions-conclusions',
    'Assumption question: A city office says, "Installing an online queue system will reduce waiting time." Which assumption is required?',
    ['Citizens will refuse to use online services.', 'The current waiting time is partly caused by inefficient queuing.', 'The office will hire fewer employees.', 'All transactions can be completed in one day.'],
    'b',
    'The recommendation assumes that inefficient queuing contributes to waiting time. If queuing has no effect, the online system would not support the claim.',
    'Ipinapalagay ng mungkahi na ang hindi maayos na pila ay sanhi ng paghihintay. Kung walang epekto ang pila, hindi susuporta ang online system sa claim.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: All employees who submitted complete documents were scheduled for orientation. Mina submitted complete documents. Which conclusion follows?',
    ['Mina was scheduled for orientation.', 'Mina already attended orientation.', 'Mina will be promoted.', 'Mina submitted the documents late.'],
    'a',
    'The rule applies to all employees with complete documents. Since Mina belongs to that group, she was scheduled for orientation.',
    'Nalalapat ang tuntunin sa lahat ng empleyadong may kumpletong dokumento. Dahil kabilang si Mina, naka-schedule siya sa orientation.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "The office should extend service hours because many clients arrive after 4:00 PM." Which assumption is most necessary?',
    ['Clients arriving after 4:00 PM still need services that day.', 'All clients prefer evening schedules.', 'Employees never work overtime.', 'The office has no online services.'],
    'a',
    'The proposal depends on the idea that late-arriving clients still need service. Without that, extending hours would not clearly solve a problem.',
    'Nakasalalay ang panukala sa ideya na kailangan pa ring mapagsilbihan ang mga kliyenteng dumating pagkatapos ng 4:00 PM.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: No confidential file may be emailed without encryption. The payroll report is confidential. Which conclusion follows?',
    ['The payroll report may be emailed without encryption.', 'The payroll report may not be emailed without encryption.', 'All encrypted files are payroll reports.', 'The payroll report is public information.'],
    'b',
    'The payroll report is within the set of confidential files. Therefore, it cannot be emailed without encryption.',
    'Ang payroll report ay kabilang sa confidential files. Kaya hindi ito maaaring i-email nang walang encryption.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "The agency should publish forms in Filipino and English to improve accessibility." Which assumption supports this?',
    ['All applicants understand both languages equally.', 'Language can be a barrier to understanding public forms.', 'Forms are no longer needed by applicants.', 'Only English forms are legally valid.'],
    'b',
    'The recommendation assumes that language affects accessibility. Publishing in two languages helps only if language can be a barrier.',
    'Ipinapalagay ng rekomendasyon na nakaaapekto ang wika sa accessibility. Makakatulong ang dalawang wika kung ang wika ay maaaring maging hadlang.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: Some trainees are engineers. All engineers in the seminar passed the safety module. Which conclusion is valid?',
    ['All trainees passed the safety module.', 'Some trainees passed the safety module.', 'No trainee passed the safety module.', 'All engineers are trainees.'],
    'b',
    'Because some trainees are engineers, and all engineers in the seminar passed, those trainee-engineers passed the safety module.',
    'Dahil may ilang trainee na engineer, at lahat ng engineer sa seminar ay pumasa, may ilang trainee na pumasa sa safety module.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "Replacing paper memos with electronic notices will cut office expenses." Which assumption is needed?',
    ['Electronic notices cost less than producing and distributing paper memos.', 'Employees dislike all paper documents.', 'The office has no computers.', 'Paper memos are illegal.'],
    'a',
    'The expense claim depends on electronic notices being cheaper than paper production and distribution.',
    'Nakasalalay ang claim sa gastos sa pagiging mas mura ng electronic notices kaysa paggawa at pamamahagi ng paper memos.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: If a request is urgent, it is marked red. This request is not marked red. What conclusion follows?',
    ['The request is urgent.', 'The request is not urgent.', 'All non-urgent requests are red.', 'The request was already approved.'],
    'b',
    'This is valid by contrapositive: if urgent then red; if not red, then not urgent.',
    'Ito ay valid sa contrapositive: kung urgent ay red; kung hindi red, hindi urgent.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "The reviewer should include more data interpretation items because examinees often lose points there." Which assumption is required?',
    ['Practice can improve performance in data interpretation.', 'Data interpretation items are always the easiest.', 'Examinees do not need explanations.', 'Only data interpretation appears in the exam.'],
    'a',
    'Adding practice items is useful only if practice can improve performance in that skill area.',
    'Magiging kapaki-pakinabang lamang ang dagdag na practice items kung nakakatulong ang practice sa performance sa bahaging iyon.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: Every applicant who lacks a valid ID is not admitted to the testing room. Niko lacks a valid ID. Which conclusion follows?',
    ['Niko is admitted to the testing room.', 'Niko is not admitted to the testing room.', 'Niko passed the examination.', 'Niko has two IDs.'],
    'b',
    'The rule says all applicants lacking a valid ID are not admitted. Niko satisfies that condition, so the result follows.',
    'Sinasabi ng tuntunin na hindi pinapapasok ang lahat ng walang valid ID. Dahil ganoon si Niko, sumusunod ang konklusyon.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "A mentoring program will reduce errors in new employees reports." Which assumption is most central?',
    ['New employees errors are partly due to lack of guidance.', 'Mentors will write all reports for new employees.', 'Reports are no longer required.', 'Only senior employees make mistakes.'],
    'a',
    'Mentoring targets guidance. The argument assumes lack of guidance is one cause of the reporting errors.',
    'Guidance ang target ng mentoring. Ipinapalagay ng argumento na kakulangan sa gabay ang isa sa sanhi ng reporting errors.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: No vehicle without a permit may enter the compound. The delivery van entered the compound. Which conclusion follows?',
    ['The delivery van had a permit.', 'The delivery van had no permit.', 'All vans may enter freely.', 'The compound has no gate.'],
    'a',
    'If vehicles without permits may not enter, then a vehicle that entered must have had a permit, assuming the rule was followed.',
    'Kung bawal pumasok ang sasakyang walang permit, ang sasakyang nakapasok ay may permit, kung nasunod ang tuntunin.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "Posting reminders near the counter will reduce incomplete applications." Which assumption supports the claim?',
    ['Some incomplete applications happen because applicants miss requirements.', 'Applicants never read signs.', 'Counters should stop accepting applications.', 'All applications are already complete.'],
    'a',
    'Reminders help only if missing requirements is one reason applications are incomplete.',
    'Makakatulong ang reminders kung ang nakakaligtaang requirements ay isa sa dahilan ng incomplete applications.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: All valid appeals are filed within 15 days. This appeal was filed after 20 days. Which conclusion follows?',
    ['The appeal is valid.', 'The appeal is not valid.', 'The appeal was approved.', 'All appeals take 20 days.'],
    'b',
    'If all valid appeals are within 15 days, then an appeal filed after 20 days is outside the condition for validity.',
    'Kung lahat ng valid appeals ay nasa loob ng 15 araw, ang appeal na inihain matapos ang 20 araw ay hindi valid.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "The agency should simplify its checklist to help first-time applicants." Which assumption is most relevant?',
    ['First-time applicants may have difficulty understanding the current checklist.', 'Experienced applicants never use checklists.', 'The checklist should remove legal requirements.', 'Applicants prefer longer instructions.'],
    'a',
    'The recommendation assumes the present checklist is difficult for first-time applicants, so simplification would help them.',
    'Ipinapalagay ng rekomendasyon na nahihirapan ang first-time applicants sa kasalukuyang checklist kaya makakatulong ang simplification.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: Some records are archived digitally. All digitally archived records are searchable. Which conclusion follows?',
    ['Some records are searchable.', 'All records are searchable.', 'No records are searchable.', 'All searchable records are digital.'],
    'a',
    'At least some records are digitally archived, and all such records are searchable. Therefore, some records are searchable.',
    'May ilang records na digitally archived, at lahat ng ganoong records ay searchable. Kaya may ilang records na searchable.',
    2
  ),

  q(
    'logic',
    'Logic question: If all inspectors are trained employees and some trained employees are supervisors, which statement must be true?',
    ['All inspectors are supervisors.', 'Some inspectors are supervisors.', 'All inspectors are trained employees.', 'No supervisor is trained.'],
    'c',
    'The first premise directly states that every inspector belongs to the group of trained employees. The other statements go beyond the given information.',
    'Direktang sinasabi ng unang premise na lahat ng inspectors ay trained employees. Ang ibang pahayag ay lampas sa ibinigay na impormasyon.',
    2
  ),
  q(
    'logic',
    'Logic question: If the server is down, online filing stops. Online filing did not stop. What follows?',
    ['The server is down.', 'The server is not down.', 'The filing deadline changed.', 'The server was replaced.'],
    'b',
    'This uses contrapositive reasoning. If server down implies filing stops, then filing not stopping implies the server is not down.',
    'Gamit ito ng contrapositive reasoning. Kung server down ay titigil ang filing, ang hindi pagtigil ng filing ay nangangahulugang hindi down ang server.',
    2
  ),
  q(
    'logic',
    'Logic question: Ana is taller than Ben. Ben is taller than Carlo. Carlo is taller than Dina. Who is the second tallest?',
    ['Ana', 'Ben', 'Carlo', 'Dina'],
    'b',
    'The order is Ana > Ben > Carlo > Dina. Therefore, Ben is the second tallest.',
    'Ang ayos ay Ana > Ben > Carlo > Dina. Kaya si Ben ang pangalawang pinakamataas.',
    1
  ),
  q(
    'logic',
    'Logic question: Four folders are arranged left to right. Blue is immediately left of Green. Red is right of Green. Yellow is left of Blue. Which folder is leftmost?',
    ['Blue', 'Green', 'Red', 'Yellow'],
    'd',
    'Blue is immediately left of Green, so they appear as Blue-Green. Yellow is left of Blue, and Red is right of Green. The order is Yellow-Blue-Green-Red.',
    'Ang Blue ay kaagad sa kaliwa ng Green, kaya Blue-Green. Ang Yellow ay nasa kaliwa ng Blue, at Red ay nasa kanan ng Green. Ayos: Yellow-Blue-Green-Red.',
    2
  ),
  q(
    'logic',
    'Logic question: A code changes CAT to DBU by moving each letter one step forward. How is DOG coded?',
    ['EPH', 'CNG', 'EQH', 'FPI'],
    'a',
    'C becomes D, A becomes B, and T becomes U. Applying the same rule: D becomes E, O becomes P, and G becomes H.',
    'C ay naging D, A ay naging B, at T ay naging U. Kaya D ay E, O ay P, at G ay H.',
    1
  ),
  q(
    'logic',
    'Logic question: If no clerks are managers and all managers are officers, which statement must be true?',
    ['Some clerks are officers.', 'No officers are clerks.', 'No managers are clerks.', 'All officers are managers.'],
    'c',
    'No clerks are managers means the two groups do not overlap. Therefore, no managers are clerks is the same relationship reversed.',
    'Ang "no clerks are managers" ay nangangahulugang walang overlap ang dalawang grupo. Kaya "no managers are clerks" din.',
    2
  ),
  q(
    'logic',
    'Logic question: In a meeting, Luis spoke before Mara. Tess spoke after Mara but before Neri. Who spoke third?',
    ['Luis', 'Mara', 'Tess', 'Neri'],
    'c',
    'The only order satisfying the conditions is Luis, Mara, Tess, Neri. Tess spoke third.',
    'Ang ayos na tumutupad sa kondisyon ay Luis, Mara, Tess, Neri. Pangatlo si Tess.',
    1
  ),
  q(
    'logic',
    'Logic question: Statement: Either the permit is renewed or the office cannot operate. The office can operate. What follows?',
    ['The permit is renewed.', 'The permit is expired.', 'The office is closed.', 'Nothing follows.'],
    'a',
    'If at least one of two alternatives must be true, and "office cannot operate" is false, then the remaining alternative must be true.',
    'Kung isa sa dalawang alternatibo ay dapat totoo, at false ang "hindi makakapag-operate ang office," ang natitirang alternatibo ay totoo.',
    3
  ),
  q(
    'logic',
    'Logic question: Which statement is logically equivalent to "If a document is confidential, it is restricted"?',
    ['If a document is restricted, it is confidential.', 'If a document is not restricted, it is not confidential.', 'If a document is not confidential, it is restricted.', 'A document is confidential only if it is public.'],
    'b',
    'The logically equivalent form is the contrapositive: If not restricted, then not confidential.',
    'Ang logically equivalent form ay contrapositive: kung hindi restricted, hindi confidential.',
    3
  ),
  q(
    'logic',
    'Logic question: Complete the pattern: A3, C6, E9, G12, __',
    ['H15', 'I15', 'I16', 'J15'],
    'b',
    'Letters skip one each time: A, C, E, G, I. Numbers increase by 3: 3, 6, 9, 12, 15.',
    'Lumalaktaw ng isang letra: A, C, E, G, I. Nadadagdagan ng 3 ang bilang: 3, 6, 9, 12, 15.',
    2
  ),
  q(
    'logic',
    'Logic question: If exactly one of these statements is true, which can be true? (1) The file is in Cabinet A. (2) The file is in Cabinet B. (3) The file is not in Cabinet A.',
    ['Only statement 1', 'Only statement 2', 'Only statement 3', 'Statements 1 and 3'],
    'c',
    'Statements 1 and 3 are opposites, so exactly one of them must be true. If statement 3 is the only true one, then the file is not in A and not in B.',
    'Magkasalungat ang statements 1 at 3, kaya isa lang sa kanila ang totoo. Kung statement 3 lang ang totoo, wala sa A at wala rin sa B ang file.',
    3
  ),
  q(
    'logic',
    'Logic question: All reports submitted after 5 PM are logged the next day. Report X was logged the same day. What follows?',
    ['Report X was submitted after 5 PM.', 'Report X was not submitted after 5 PM.', 'Report X was never submitted.', 'Report X was incomplete.'],
    'b',
    'This is contrapositive reasoning: if after 5 PM then next-day logging; if not next-day logging, then not after 5 PM.',
    'Ito ay contrapositive reasoning: kung after 5 PM ay next-day logging; kung same-day logging, hindi after 5 PM.',
    2
  ),
  q(
    'logic',
    'Logic question: Rina, Sol, and Tina have different scores. Rina scored higher than Sol but lower than Tina. Who has the highest score?',
    ['Rina', 'Sol', 'Tina', 'Cannot be determined'],
    'c',
    'The relation is Tina > Rina > Sol. Tina has the highest score.',
    'Ang relasyon ay Tina > Rina > Sol. Si Tina ang may pinakamataas na score.',
    1
  ),
  q(
    'logic',
    'Logic question: Which option weakens this argument: "The office printer broke because the new toner was installed yesterday"?',
    ['The printer had shown error messages for two weeks before the toner was installed.', 'The toner box was new and sealed.', 'The printer uses black toner.', 'The office prints reports daily.'],
    'a',
    'If the printer already had error messages before the new toner, the toner is less likely to be the cause.',
    'Kung may error messages na ang printer bago ikabit ang toner, mas mahina ang claim na toner ang sanhi.',
    2
  ),
  q(
    'logic',
    'Logic question: If Monday is coded as 1, Tuesday as 2, and so on until Sunday as 7, what is the code for the day 10 days after Thursday?',
    ['6', '7', '1', '2'],
    'b',
    'Thursday is 4. Ten days later is 10 mod 7 = 3 days after Thursday: Friday 5, Saturday 6, Sunday 7. Sunday is coded as 7, not 1. But counting "10 days after" from Thursday: day 1 Friday, day 2 Saturday, day 3 Sunday, day 4 Monday, day 5 Tuesday, day 6 Wednesday, day 7 Thursday, day 8 Friday, day 9 Saturday, day 10 Sunday. The correct code is 7.',
    'Ang Thursday ay 4. Sampung araw pagkatapos: Friday day 1 hanggang Sunday day 10. Kaya ang code ay 7.',
    2
  ),
  q(
    'logic',
    'Logic question: In the previous item, which choice is the correct code for Sunday?',
    ['6', '7', '1', '2'],
    'b',
    'With Monday coded as 1, the sequence is Monday 1, Tuesday 2, Wednesday 3, Thursday 4, Friday 5, Saturday 6, Sunday 7.',
    'Kung Monday ay 1, ang ayos ay Monday 1, Tuesday 2, Wednesday 3, Thursday 4, Friday 5, Saturday 6, Sunday 7.',
    1
  ),

  q(
    'data-interpretation',
    'Data interpretation table: Office A processed 120 permits in January, 150 in February, and 180 in March. What is the average number of permits processed per month?',
    ['140', '150', '160', '170'],
    'b',
    'Average = (120 + 150 + 180) / 3 = 450 / 3 = 150 permits per month.',
    'Average = (120 + 150 + 180) / 3 = 450 / 3 = 150 permits bawat buwan.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A survey has 80 yes responses, 50 no responses, and 20 undecided responses. What percent answered yes?',
    ['40%', '50%', '53.33%', '60%'],
    'c',
    'Total responses = 80 + 50 + 20 = 150. Yes percent = 80 / 150 x 100 = 53.33%.',
    'Kabuuang responses = 150. Yes percent = 80 / 150 x 100 = 53.33%.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation chart: A budget is allocated as Personnel 45%, Supplies 20%, Training 15%, Maintenance 10%, Other 10%. If the total budget is PHP 2,000,000, how much is for Training?',
    ['PHP 200,000', 'PHP 300,000', 'PHP 400,000', 'PHP 900,000'],
    'b',
    'Training is 15% of PHP 2,000,000. 0.15 x 2,000,000 = PHP 300,000.',
    'Ang Training ay 15% ng PHP 2,000,000. 0.15 x 2,000,000 = PHP 300,000.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: Complaints received were 24 on Monday, 18 on Tuesday, 30 on Wednesday, and 28 on Thursday. Which day had the highest number?',
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    'c',
    'The highest value in the table is 30, which occurred on Wednesday.',
    'Ang pinakamataas na bilang sa table ay 30, na nasa Wednesday.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A training batch has 32 participants from Luzon, 18 from Visayas, and 10 from Mindanao. What fraction of the batch is from Visayas?',
    ['1/6', '3/10', '3/5', '9/20'],
    'b',
    'Total participants = 32 + 18 + 10 = 60. Visayas fraction = 18/60 = 3/10.',
    'Kabuuan = 60. Bahagi mula Visayas = 18/60 = 3/10.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: Revenue was PHP 90,000 in Q1 and PHP 117,000 in Q2. What was the percent increase from Q1 to Q2?',
    ['20%', '25%', '30%', '35%'],
    'c',
    'Increase = 117,000 - 90,000 = 27,000. Percent increase = 27,000 / 90,000 x 100 = 30%.',
    'Increase = 117,000 - 90,000 = 27,000. Percent increase = 27,000 / 90,000 x 100 = 30%.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: Four branches served 210, 180, 240, and 170 clients. What is the total number of clients served?',
    ['700', '760', '800', '840'],
    'c',
    'Total clients = 210 + 180 + 240 + 170 = 800.',
    'Kabuuang clients = 210 + 180 + 240 + 170 = 800.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation chart: A line graph shows cases decreasing from 500 to 425. What is the percent decrease?',
    ['10%', '12.5%', '15%', '17.5%'],
    'c',
    'Decrease = 500 - 425 = 75. Percent decrease = 75 / 500 x 100 = 15%.',
    'Decrease = 500 - 425 = 75. Percent decrease = 75 / 500 x 100 = 15%.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A unit completed 40% of 350 records. How many records were completed?',
    ['120', '130', '140', '150'],
    'c',
    'Completed records = 40% of 350 = 0.40 x 350 = 140.',
    'Completed records = 40% ng 350 = 0.40 x 350 = 140.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: In a report, 72 out of 120 applications were approved. What was the approval rate?',
    ['50%', '55%', '60%', '65%'],
    'c',
    'Approval rate = 72 / 120 x 100 = 60%.',
    'Approval rate = 72 / 120 x 100 = 60%.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A counter served 96 clients in 8 hours. If the rate was constant, how many clients were served per hour?',
    ['10', '11', '12', '14'],
    'c',
    'Clients per hour = 96 / 8 = 12.',
    'Clients bawat oras = 96 / 8 = 12.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation chart: Supplies account for 18% of a PHP 750,000 budget. What is the supplies amount?',
    ['PHP 125,000', 'PHP 130,000', 'PHP 135,000', 'PHP 150,000'],
    'c',
    'Supplies amount = 18% of 750,000 = 0.18 x 750,000 = PHP 135,000.',
    'Supplies amount = 18% ng 750,000 = 0.18 x 750,000 = PHP 135,000.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: The number of completed requests was 45, 60, 75, and 90 over four weeks. What is the weekly increase if the pattern is constant?',
    ['10', '15', '20', '30'],
    'b',
    'The differences are 60 - 45 = 15, 75 - 60 = 15, and 90 - 75 = 15.',
    'Ang differences ay 60 - 45 = 15, 75 - 60 = 15, at 90 - 75 = 15.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A department had 25 absences in June and 15 in July. By what percent did absences decrease?',
    ['20%', '30%', '40%', '50%'],
    'c',
    'Decrease = 25 - 15 = 10. Percent decrease = 10 / 25 x 100 = 40%.',
    'Decrease = 25 - 15 = 10. Percent decrease = 10 / 25 x 100 = 40%.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation chart: If 3/8 of 240 examinees chose morning review sessions, how many chose morning sessions?',
    ['80', '90', '100', '120'],
    'b',
    'Morning examinees = 3/8 x 240 = 90.',
    'Morning examinees = 3/8 x 240 = 90.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: The ratio of male to female trainees is 7:5. If there are 84 male trainees, how many female trainees are there?',
    ['48', '55', '60', '72'],
    'c',
    'Seven parts correspond to 84 males, so one part is 12. Female trainees are five parts: 5 x 12 = 60.',
    'Ang 7 parts ay katumbas ng 84 male trainees, kaya 1 part ay 12. Ang female trainees ay 5 parts: 5 x 12 = 60.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A project used 65% of its PHP 480,000 fund. How much fund remains?',
    ['PHP 144,000', 'PHP 168,000', 'PHP 192,000', 'PHP 312,000'],
    'b',
    'If 65% was used, 35% remains. Remaining fund = 0.35 x 480,000 = PHP 168,000.',
    'Kung 65% ang nagamit, 35% ang natitira. Natitirang pondo = 0.35 x 480,000 = PHP 168,000.',
    2
  ),
];

function assertLocalQuality(rows) {
  const seen = new Map();
  for (const row of rows) {
    const key = `${row.topic}::${normalizeText(row.stem)}`;
    if (seen.has(key)) throw new Error(`Duplicate stem inside batch: ${row.stem}`);
    seen.set(key, true);

    const topic = TOPICS[row.topic];
    const issues = auditQuestion(
      {
        ...row,
        topic_slug: row.topic,
        topic_name: topic.name,
        subject_name: topic.subject,
      },
      { stemCounts: new Map([[normalizeText(row.stem), 1]]) }
    ).filter((issue) => issue.severity !== 'low');

    if (issues.length) {
      throw new Error(`Quality audit failed for "${row.stem}": ${issues.map((issue) => `${issue.severity}:${issue.code}`).join(', ')}`);
    }
  }
}

async function existingStemKeys() {
  const topicIds = Object.values(TOPICS).map((topic) => topic.id);
  const { data, error } = await sb
    .from('questions')
    .select('topic_id, stem')
    .in('topic_id', topicIds);

  if (error) throw error;
  return new Set((data ?? []).map((row) => `${row.topic_id}::${normalizeText(row.stem)}`));
}

async function main() {
  assertLocalQuality(QUESTIONS);
  const existing = await existingStemKeys();
  const inserts = QUESTIONS
    .filter((row) => !existing.has(`${TOPICS[row.topic].id}::${normalizeText(row.stem)}`))
    .map((row) => ({
      id: randomUUID(),
      topic_id: TOPICS[row.topic].id,
      stem: row.stem,
      choices: row.choices,
      correct_choice_id: row.correct_choice_id,
      explanation_en: row.explanation_en,
      explanation_fil: row.explanation_fil,
      difficulty: row.difficulty,
      status: 'published',
      is_verified: true,
      source: 'ReviewNatin',
      source_note: 'ReviewNatin original | CSE Professional Analytical Ability expansion 2026 | aligned to public coverage; not copied from CSC or reviewer sites',
      tags: ['cse-professional', 'analytical-ability', row.topic, 'original'],
    }));

  const skipped = QUESTIONS.length - inserts.length;
  const byTopic = inserts.reduce((acc, row) => {
    const slug = Object.entries(TOPICS).find(([, topic]) => topic.id === row.topic_id)?.[0] ?? 'unknown';
    acc[slug] = (acc[slug] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Analytical Ability expansion: ${QUESTIONS.length} audited candidate questions.`);
  console.log(`New questions: ${inserts.length}; skipped existing exact stems: ${skipped}.`);
  console.table(byTopic);

  if (dryRun) {
    console.log('Dry run complete. No rows inserted.');
    return;
  }

  if (!inserts.length) {
    console.log('No new rows to insert.');
    return;
  }

  const { error } = await sb.from('questions').insert(inserts);
  if (error) throw error;
  console.log(`Inserted ${inserts.length} published Analytical Ability questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
