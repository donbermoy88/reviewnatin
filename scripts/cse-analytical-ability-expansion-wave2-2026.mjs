/**
 * CSE Professional Analytical Ability expansion, wave 2.
 *
 * Adds original published practice questions for:
 * - Word Association
 * - Assumptions and Conclusions
 * - Logic and Reasoning
 * - Data Interpretation
 *
 * Run:
 *   node scripts/cse-analytical-ability-expansion-wave2-2026.mjs --dry-run
 *   node scripts/cse-analytical-ability-expansion-wave2-2026.mjs
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
    'Word association: BLUEPRINT is to BUILDING as RECIPE is to:',
    ['Kitchen', 'Meal', 'Chef', 'Ingredient'],
    'b',
    'A blueprint guides the creation of a building. A recipe guides the preparation of a meal. The relationship is plan or instruction to final product.',
    'Ang blueprint ay gabay sa paggawa ng building. Ang recipe ay gabay sa paggawa ng meal. Ang relasyon ay plano o instruction sa final product.',
    1
  ),
  q(
    'word-association',
    'Word association: PASSPORT is to TRAVELER as LICENSE is to:',
    ['Applicant', 'Driver', 'Passenger', 'Inspector'],
    'b',
    'A passport is an identifying document commonly required of a traveler. A license is an authorization document commonly required of a driver.',
    'Ang passport ay dokumentong kailangan ng traveler. Ang license ay dokumentong nagbibigay pahintulot sa driver.',
    1
  ),
  q(
    'word-association',
    'Word association: COURT is to JUSTICE as SCHOOL is to:',
    ['Education', 'Hospital', 'Security', 'Transport'],
    'a',
    'A court is institutionally associated with justice. A school is institutionally associated with education.',
    'Ang court ay kaugnay ng justice. Ang school ay kaugnay ng education.',
    1
  ),
  q(
    'word-association',
    'Word association: INDEX is to BOOK as DIRECTORY is to:',
    ['Telephone', 'Office', 'Building', 'List'],
    'a',
    'An index helps locate information in a book. A directory helps locate telephone numbers, offices, or entries; among the choices, telephone best fits the standard pair.',
    'Ang index ay tumutulong maghanap sa book. Ang directory ay tumutulong maghanap ng telephone numbers o entries; sa choices, telephone ang pinakamalapit.',
    2
  ),
  q(
    'word-association',
    'Word association: ODOMETER is to DISTANCE as CLOCK is to:',
    ['Weight', 'Time', 'Pressure', 'Direction'],
    'b',
    'An odometer records distance traveled. A clock measures or shows time.',
    'Ang odometer ay nagtatala ng distance. Ang clock ay sumusukat o nagpapakita ng time.',
    1
  ),
  q(
    'word-association',
    'Word association: JUDGE is to VERDICT as ARBITRATOR is to:',
    ['Award', 'Complaint', 'Evidence', 'Witness'],
    'a',
    'A judge issues a verdict. An arbitrator issues an award or decision in arbitration.',
    'Ang judge ay nagbibigay ng verdict. Ang arbitrator ay nagbibigay ng award o decision sa arbitration.',
    2
  ),
  q(
    'word-association',
    'Word association: SEED is to GERMINATE as EGG is to:',
    ['Hatch', 'Boil', 'Nest', 'Feather'],
    'a',
    'A seed germinates as part of development. An egg hatches as part of development.',
    'Ang seed ay nagge-germinate bilang bahagi ng paglaki. Ang egg ay napipisa o hatches bilang bahagi ng development.',
    1
  ),
  q(
    'word-association',
    'Word association: MICROSCOPE is to SMALL as TELESCOPE is to:',
    ['Distant', 'Heavy', 'Noisy', 'Bright'],
    'a',
    'A microscope is used to view very small things. A telescope is used to view distant things.',
    'Ang microscope ay ginagamit upang makita ang maliliit na bagay. Ang telescope ay ginagamit upang makita ang malalayong bagay.',
    1
  ),
  q(
    'word-association',
    'Word association: Which word does NOT belong: BRIEF, CONCISE, SUCCINCT, ELABORATE?',
    ['Brief', 'Concise', 'Succinct', 'Elaborate'],
    'd',
    'Brief, concise, and succinct all mean short and direct. Elaborate means detailed or developed, so it is the opposite idea.',
    'Ang brief, concise, at succinct ay nangangahulugang maikli at direkta. Ang elaborate ay detalyado kaya ito ang naiiba.',
    1
  ),
  q(
    'word-association',
    'Word association: Which pair has the same relationship as HEAT : EXPAND?',
    ['Cold : Contract', 'Rain : Dry', 'Light : Darken', 'Noise : Silence'],
    'a',
    'Heat can cause materials to expand. Cold can cause materials to contract. The relationship is cause to common physical effect.',
    'Ang heat ay maaaring magpalawak ng materyal. Ang cold ay maaaring magpa-contract. Ang relasyon ay sanhi sa karaniwang epekto.',
    2
  ),
  q(
    'word-association',
    'Word association: MAP is to NAVIGATION as CALENDAR is to:',
    ['Scheduling', 'Painting', 'Accounting', 'Repair'],
    'a',
    'A map is a tool for navigation. A calendar is a tool for scheduling dates and activities.',
    'Ang map ay gamit sa navigation. Ang calendar ay gamit sa scheduling ng petsa at gawain.',
    1
  ),
  q(
    'word-association',
    'Word association: ANTIBIOTIC is to BACTERIA as ANTIVIRAL is to:',
    ['Virus', 'Vitamin', 'Allergy', 'Fracture'],
    'a',
    'An antibiotic targets bacteria. An antiviral targets viruses.',
    'Ang antibiotic ay tumutugon sa bacteria. Ang antiviral ay tumutugon sa virus.',
    1
  ),

  q(
    'assumptions-conclusions',
    'Assumption question: "The office should add a document checklist beside the application window to reduce rejected applications." Which assumption is required?',
    ['Some applications are rejected because applicants miss required documents.', 'Rejected applications are always fraudulent.', 'The office wants fewer applicants.', 'All documents are optional.'],
    'a',
    'A checklist can reduce rejections only if missing documents are one cause of rejection. The other choices are not needed for the proposal.',
    'Makababawas lang ng rejection ang checklist kung ang kulang na dokumento ay isa sa sanhi ng rejection.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: Every certified copy has an official seal. This document has no official seal. Which conclusion follows?',
    ['The document is a certified copy.', 'The document is not a certified copy.', 'All sealed documents are certified copies.', 'The document was printed yesterday.'],
    'b',
    'This is the contrapositive: if certified copy then official seal; if no official seal, then not a certified copy.',
    'Ito ay contrapositive: kung certified copy ay may official seal; kung walang official seal, hindi certified copy.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "Training staff on plain-language writing will improve public notices." Which assumption best supports the claim?',
    ['Some current public notices are difficult to understand because of writing style.', 'Public notices should be removed.', 'Only lawyers read public notices.', 'Training always eliminates all mistakes.'],
    'a',
    'The claim depends on writing style being part of the problem. If notices are already clear, plain-language training would not clearly improve them.',
    'Nakasalalay ang claim sa writing style bilang bahagi ng problema. Kung malinaw na ang notices, hindi malinaw ang improvement.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: No late submission receives full credit. Liza received full credit. Which conclusion follows?',
    ['Liza submitted late.', 'Liza did not submit late.', 'Liza submitted nothing.', 'All early submissions receive full credit.'],
    'b',
    'If late submissions cannot receive full credit, then someone who received full credit was not late.',
    'Kung hindi maaaring full credit ang late submission, ang nakatanggap ng full credit ay hindi late.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "A reminder text message will increase attendance at the seminar." Which assumption is necessary?',
    ['Some absences are caused by participants forgetting the schedule.', 'All participants dislike seminars.', 'The seminar has no venue.', 'Text messages are never read.'],
    'a',
    'Reminder messages help attendance only if forgetting the schedule contributes to absences.',
    'Makakatulong ang reminder messages kung ang pagkalimot sa schedule ay sanhi ng ilang absences.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: All shortlisted applicants passed the screening test. Ramon did not pass the screening test. Which conclusion follows?',
    ['Ramon was shortlisted.', 'Ramon was not shortlisted.', 'All who passed were shortlisted.', 'Ramon took no test.'],
    'b',
    'The rule says shortlisted applicants are within the group that passed. If Ramon did not pass, he cannot be in the shortlisted group.',
    'Ang shortlisted ay kabilang sa pumasa. Kung hindi pumasa si Ramon, hindi siya shortlisted.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "Installing clearer directional signs will reduce the number of clients asking guards for directions." Which assumption is needed?',
    ['Some direction questions happen because clients cannot find rooms easily.', 'Guards refuse to answer questions.', 'All clients can already memorize the building.', 'Directional signs are decorative only.'],
    'a',
    'Clear signs reduce direction questions only if confusion about locations is causing some of those questions.',
    'Makababawas lang ng tanong ang malinaw na signs kung kalituhan sa lokasyon ang sanhi ng ilang tanong.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: Some auditors are lawyers. All lawyers in the team completed ethics training. Which conclusion follows?',
    ['Some auditors completed ethics training.', 'All auditors completed ethics training.', 'No auditor completed ethics training.', 'All lawyers are auditors.'],
    'a',
    'The auditors who are lawyers are included in the group that completed ethics training, so at least some auditors completed it.',
    'Ang auditors na lawyers ay kabilang sa group na nakatapos ng ethics training, kaya may ilang auditors na nakatapos nito.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "Allowing appointment rescheduling online will reduce phone inquiries." Which assumption is required?',
    ['Some phone inquiries are about rescheduling appointments.', 'All phone calls are emergencies.', 'Online rescheduling increases paper forms.', 'Appointments are no longer used.'],
    'a',
    'Online rescheduling can reduce phone inquiries only if some calls are currently made for rescheduling.',
    'Makababawas lang ng phone inquiries ang online rescheduling kung may calls na tungkol sa rescheduling.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: If a file is archived, it is not editable. File M is editable. Which conclusion follows?',
    ['File M is archived.', 'File M is not archived.', 'All editable files are archived.', 'File M is deleted.'],
    'b',
    'By contrapositive, if archived files are not editable, then an editable file is not archived.',
    'Sa contrapositive, kung ang archived file ay hindi editable, ang editable file ay hindi archived.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "Adding sample answers to the reviewer will improve learner confidence." Which assumption is most central?',
    ['Learners can compare their reasoning with sample answers.', 'Learners never read explanations.', 'Confidence is unrelated to practice.', 'Sample answers must replace questions.'],
    'a',
    'Sample answers build confidence by giving learners a way to compare and correct their reasoning.',
    'Nakakatulong ang sample answers sa confidence dahil may basehan ang learners para ikumpara at itama ang reasoning.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: All reports approved by the director have a tracking number. This report has a tracking number. Which conclusion is valid?',
    ['It was approved by the director.', 'It may or may not have been approved by the director.', 'It was rejected by the director.', 'It has no record.'],
    'b',
    'Having a tracking number is necessary for director-approved reports, but it may also belong to other reports. The approval cannot be concluded.',
    'Ang tracking number ay kailangan sa director-approved reports, pero maaari ring mayroon ang ibang reports. Hindi tiyak ang approval.',
    3
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "More practice with tables will improve data interpretation scores." Which assumption supports the statement?',
    ['Table-reading skill affects data interpretation performance.', 'Tables should be avoided in exams.', 'Scores cannot change through practice.', 'Only graphs require analysis.'],
    'a',
    'The statement assumes table-reading skill is part of data interpretation and can affect scores.',
    'Ipinapalagay ng statement na ang table-reading skill ay bahagi ng data interpretation at nakaaapekto sa scores.',
    1
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: No applicant without payment confirmation may claim a permit. Mara claimed a permit. Which conclusion follows?',
    ['Mara had payment confirmation.', 'Mara had no payment confirmation.', 'Mara paid twice.', 'All applicants claimed permits.'],
    'a',
    'If applicants without payment confirmation may not claim a permit, a person who claimed one must have payment confirmation, assuming the rule was followed.',
    'Kung bawal mag-claim ang walang payment confirmation, ang nakapag-claim ay may payment confirmation, kung nasunod ang rule.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Assumption question: "Separating express transactions from regular transactions will shorten the regular queue." Which assumption is needed?',
    ['Express transactions currently add volume to the regular queue.', 'Regular transactions should stop permanently.', 'Express transactions require no staff.', 'All clients have the same transaction type.'],
    'a',
    'Separating express transactions helps only if those transactions are currently mixed into the regular queue.',
    'Makakatulong lang ang paghihiwalay kung kasalukuyang kasama sa regular queue ang express transactions.',
    2
  ),
  q(
    'assumptions-conclusions',
    'Conclusion question: Every secure password has at least twelve characters. This password has eight characters. Which conclusion follows?',
    ['The password is secure.', 'The password is not secure.', 'All long passwords are secure.', 'The password was never used.'],
    'b',
    'If secure passwords must have at least twelve characters, an eight-character password fails that necessary condition.',
    'Kung ang secure password ay kailangang may at least twelve characters, ang eight-character password ay hindi pumasa sa condition.',
    1
  ),

  q(
    'logic',
    'Logic question: If all analysts are employees and no employees are visitors, which statement must be true?',
    ['No analysts are visitors.', 'Some visitors are analysts.', 'All visitors are employees.', 'Some employees are not analysts.'],
    'a',
    'Analysts are inside the employee group, and the employee group does not overlap with visitors. Therefore, analysts cannot be visitors.',
    'Ang analysts ay nasa employee group, at walang overlap ang employees sa visitors. Kaya walang analysts na visitors.',
    2
  ),
  q(
    'logic',
    'Logic question: The code changes LAMP to MBNQ by moving each letter one step forward. How is DESK coded?',
    ['EFTL', 'CDRJ', 'EFTK', 'FETL'],
    'a',
    'D becomes E, E becomes F, S becomes T, and K becomes L. Therefore DESK becomes EFTL.',
    'D ay E, E ay F, S ay T, at K ay L. Kaya ang DESK ay EFTL.',
    1
  ),
  q(
    'logic',
    'Logic question: Complete the series: 4, 9, 19, 39, 79, __',
    ['119', '139', '159', '169'],
    'c',
    'Each term is doubled and then increased by 1: 4 x 2 + 1 = 9, 9 x 2 + 1 = 19, and so on. 79 x 2 + 1 = 159.',
    'Dinodoble ang bawat term at dinadagdagan ng 1. Kaya 79 x 2 + 1 = 159.',
    2
  ),
  q(
    'logic',
    'Logic question: Nia is older than Omar. Omar is older than Pia. Pia is older than Quin. Who is the youngest?',
    ['Nia', 'Omar', 'Pia', 'Quin'],
    'd',
    'The order from oldest to youngest is Nia, Omar, Pia, Quin. Quin is the youngest.',
    'Ang ayos mula pinakamatanda hanggang pinakabata ay Nia, Omar, Pia, Quin. Si Quin ang pinakabata.',
    1
  ),
  q(
    'logic',
    'Logic question: If the application is incomplete, it is returned. The application was not returned. What follows?',
    ['It is incomplete.', 'It is complete.', 'It was lost.', 'It was returned late.'],
    'b',
    'This uses contrapositive reasoning: if incomplete then returned; if not returned, then not incomplete, meaning complete for this rule.',
    'Ito ay contrapositive: kung incomplete ay returned; kung hindi returned, hindi incomplete, kaya complete ayon sa rule.',
    2
  ),
  q(
    'logic',
    'Logic question: In a line, Cara is immediately before Dindo. Belen is before Cara. Arman is after Dindo. What is the order?',
    ['Belen, Cara, Dindo, Arman', 'Cara, Dindo, Belen, Arman', 'Arman, Belen, Cara, Dindo', 'Belen, Dindo, Cara, Arman'],
    'a',
    'Cara must be immediately before Dindo. Belen must be before Cara, and Arman must be after Dindo. Only the first order satisfies all conditions.',
    'Dapat magkasunod ang Cara-Dindo. Si Belen ay bago kay Cara, at si Arman ay pagkatapos ni Dindo. Unang order lang ang tama.',
    2
  ),
  q(
    'logic',
    'Logic question: Which statement is the contrapositive of "If a request is approved, it is recorded"?',
    ['If a request is recorded, it is approved.', 'If a request is not recorded, it is not approved.', 'If a request is not approved, it is recorded.', 'If a request is approved, it is not recorded.'],
    'b',
    'The contrapositive of if P then Q is if not Q then not P. Here: if not recorded, then not approved.',
    'Ang contrapositive ng if P then Q ay if not Q then not P. Dito: kung hindi recorded, hindi approved.',
    2
  ),
  q(
    'logic',
    'Logic question: If exactly two of the three boxes are sealed, and Box A is unsealed, what must be true?',
    ['Boxes B and C are sealed.', 'Box B is unsealed.', 'Box C is unsealed.', 'No box is sealed.'],
    'a',
    'There are three boxes and exactly two are sealed. If A is unsealed, the two sealed boxes must be B and C.',
    'May tatlong boxes at eksaktong dalawa ang sealed. Kung unsealed ang A, ang sealed ay B at C.',
    1
  ),
  q(
    'logic',
    'Logic question: Complete the letter pattern: Z, W, T, Q, __',
    ['N', 'O', 'P', 'M'],
    'a',
    'The letters move backward by three positions: Z to W, W to T, T to Q, Q to N.',
    'Umatras ng tatlong letra bawat hakbang: Z to W, W to T, T to Q, Q to N.',
    2
  ),
  q(
    'logic',
    'Logic question: All blue tags are urgent. Some urgent tags are red. Which statement must be true?',
    ['All blue tags are red.', 'Some red tags are blue.', 'All blue tags are urgent.', 'No urgent tags are blue.'],
    'c',
    'The first premise directly states all blue tags are urgent. The statements about red tags do not force any relation with blue tags.',
    'Direktang sinasabi ng unang premise na lahat ng blue tags ay urgent. Walang tiyak na relation ang red tags sa blue tags.',
    2
  ),
  q(
    'logic',
    'Logic question: If today is Tuesday, what day will it be 45 days from today?',
    ['Thursday', 'Friday', 'Saturday', 'Sunday'],
    'b',
    '45 days has a remainder of 3 when divided by 7. Three days after Tuesday is Friday: Wednesday is 1, Thursday is 2, Friday is 3.',
    'Ang 45 days ay may remainder na 3. Mula Tuesday: Wednesday 1, Thursday 2, Friday 3. Kaya Friday.',
    2
  ),
  q(
    'logic',
    'Logic question: If today is Saturday, what day will it be 16 days from today?',
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    'a',
    '16 days is two full weeks plus two days. Two days after Saturday is Monday? Count: Sunday is 1 and Monday is 2. The correct day is Monday.',
    'Ang 16 days ay dalawang buong linggo at dalawang araw. Mula Saturday: Sunday 1, Monday 2. Kaya Monday.',
    2
  ),
  q(
    'logic',
    'Logic question: Which option strengthens this argument: "The new intake form reduced processing time because it asks only essential questions"?',
    ['Average processing time fell after the form was introduced and staffing levels did not change.', 'The office changed its wall color.', 'Clients prefer long forms.', 'The old form had fewer pages than the new form.'],
    'a',
    'A reduction after the form change, with staffing unchanged, supports the idea that the form contributed to faster processing.',
    'Ang pagbaba ng processing time pagkatapos ng form change, habang hindi nagbago ang staffing, ay sumusuporta sa claim.',
    2
  ),
  q(
    'logic',
    'Logic question: If A is north of B, and C is east of B, which statement is definitely true?',
    ['A is east of C.', 'C is south of A.', 'B is south of A.', 'A is west of B.'],
    'c',
    'If A is north of B, then B is south of A. The east-west relation of A and C cannot be determined.',
    'Kung north si A ng B, si B ay south ng A. Hindi tiyak ang east-west relation ng A at C.',
    1
  ),
  q(
    'logic',
    'Logic question: Complete the number pattern: 2, 5, 11, 23, 47, __',
    ['94', '95', '96', '97'],
    'b',
    'Each term is doubled and increased by 1: 2 x 2 + 1 = 5, 5 x 2 + 1 = 11, and 47 x 2 + 1 = 95.',
    'Dinodoble ang bawat term at dinadagdagan ng 1. Kaya 47 x 2 + 1 = 95.',
    2
  ),
  q(
    'logic',
    'Logic question: A statement says, "Only employees with IDs may enter." Toni entered. What follows if the rule was followed?',
    ['Toni had an ID.', 'Toni had no ID.', 'Toni is a visitor.', 'Toni wrote the rule.'],
    'a',
    'If only employees with IDs may enter, a person who entered under the rule must have an ID.',
    'Kung tanging employees na may ID ang maaaring pumasok, ang taong pumasok ayon sa rule ay may ID.',
    1
  ),

  q(
    'data-interpretation',
    'Data interpretation table: A branch served 35 clients on Monday, 42 on Tuesday, 38 on Wednesday, and 45 on Thursday. What is the total number served?',
    ['150', '155', '160', '165'],
    'c',
    'Total clients served = 35 + 42 + 38 + 45 = 160.',
    'Kabuuang clients = 35 + 42 + 38 + 45 = 160.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: Out of 250 applicants, 175 passed the initial screening. What percent passed?',
    ['60%', '65%', '70%', '75%'],
    'c',
    'Passing percent = 175 / 250 x 100 = 70%.',
    'Passing percent = 175 / 250 x 100 = 70%.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation chart: A fund of PHP 1,200,000 is divided as Operations 50%, Training 20%, Supplies 15%, and Other 15%. How much is allocated to Supplies?',
    ['PHP 150,000', 'PHP 180,000', 'PHP 200,000', 'PHP 240,000'],
    'b',
    'Supplies receive 15% of PHP 1,200,000. 0.15 x 1,200,000 = PHP 180,000.',
    'Ang Supplies ay 15% ng PHP 1,200,000. 0.15 x 1,200,000 = PHP 180,000.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: Monthly requests were 80 in January, 100 in February, and 120 in March. What is the average monthly request count?',
    ['90', '95', '100', '105'],
    'c',
    'Average = (80 + 100 + 120) / 3 = 300 / 3 = 100.',
    'Average = (80 + 100 + 120) / 3 = 100.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A report shows 48 resolved cases and 12 unresolved cases. What is the resolution rate?',
    ['70%', '75%', '80%', '85%'],
    'c',
    'Total cases = 48 + 12 = 60. Resolution rate = 48 / 60 x 100 = 80%.',
    'Kabuuang cases = 60. Resolution rate = 48 / 60 x 100 = 80%.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation chart: If attendance increased from 160 to 200, what was the percent increase?',
    ['20%', '25%', '30%', '40%'],
    'b',
    'Increase = 200 - 160 = 40. Percent increase = 40 / 160 x 100 = 25%.',
    'Increase = 200 - 160 = 40. Percent increase = 40 / 160 x 100 = 25%.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: The ratio of approved to denied requests is 9:4. If 117 requests were approved, how many were denied?',
    ['39', '48', '52', '60'],
    'c',
    'Nine parts correspond to 117, so one part is 13. Denied requests are four parts: 4 x 13 = 52.',
    'Ang 9 parts ay 117, kaya 1 part ay 13. Ang denied ay 4 parts: 4 x 13 = 52.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A unit completed 3/5 of 450 records. How many records remain incomplete?',
    ['90', '150', '180', '270'],
    'c',
    'If 3/5 are completed, 2/5 remain incomplete. 2/5 x 450 = 180.',
    'Kung 3/5 ang completed, 2/5 ang incomplete. 2/5 x 450 = 180.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: Four offices processed 95, 105, 110, and 90 applications. Which value is the median?',
    ['95', '100', '105', '110'],
    'b',
    'Order the values: 90, 95, 105, 110. The median is the average of the two middle values: (95 + 105) / 2 = 100.',
    'Ayusin: 90, 95, 105, 110. Median = (95 + 105) / 2 = 100.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation chart: A pie chart has Health 30%, Education 25%, Infrastructure 20%, Agriculture 15%, Other 10%. Which sector has the second largest share?',
    ['Education', 'Infrastructure', 'Agriculture', 'Other'],
    'a',
    'Health is largest at 30%. Education is second largest at 25%.',
    'Health ang pinakamalaki sa 30%. Education ang pangalawa sa 25%.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: If 64 of 80 survey respondents prefer online filing, what fraction prefer online filing?',
    ['3/4', '4/5', '5/6', '7/8'],
    'b',
    'The fraction is 64/80, which simplifies by dividing both numbers by 16: 4/5.',
    'Ang fraction ay 64/80, na masisimplify sa 4/5.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A counter served 18 clients per hour for 7 hours. How many clients were served in total?',
    ['108', '116', '126', '136'],
    'c',
    'Total clients = 18 clients per hour x 7 hours = 126.',
    'Kabuuang clients = 18 bawat oras x 7 oras = 126.',
    1
  ),
  q(
    'data-interpretation',
    'Data interpretation chart: Defective forms dropped from 50 to 35. What was the percent decrease?',
    ['20%', '25%', '30%', '35%'],
    'c',
    'Decrease = 50 - 35 = 15. Percent decrease = 15 / 50 x 100 = 30%.',
    'Decrease = 50 - 35 = 15. Percent decrease = 15 / 50 x 100 = 30%.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: A unit used 72% of a PHP 900,000 fund. How much was used?',
    ['PHP 648,000', 'PHP 672,000', 'PHP 702,000', 'PHP 720,000'],
    'a',
    'Used fund = 72% of PHP 900,000 = 0.72 x 900,000 = PHP 648,000.',
    'Nagamit na pondo = 72% ng PHP 900,000 = 0.72 x 900,000 = PHP 648,000.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: The number of pending requests went from 120 to 90. By what fraction did it decrease?',
    ['1/6', '1/5', '1/4', '1/3'],
    'c',
    'Decrease = 120 - 90 = 30. Fraction decrease = 30/120 = 1/4.',
    'Decrease = 120 - 90 = 30. Fraction decrease = 30/120 = 1/4.',
    2
  ),
  q(
    'data-interpretation',
    'Data interpretation table: In a batch of 150 forms, 12% needed correction. How many forms did not need correction?',
    ['18', '120', '132', '138'],
    'c',
    'Forms needing correction = 12% of 150 = 18. Forms not needing correction = 150 - 18 = 132.',
    'Forms na kailangan ng correction = 12% ng 150 = 18. Hindi kailangan ng correction = 150 - 18 = 132.',
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
      source_note: 'ReviewNatin original | CSE Professional Analytical Ability expansion wave 2 2026 | independent practice questions',
      tags: ['cse-professional', 'analytical-ability', row.topic, 'original', 'wave-2'],
    }));

  const skipped = QUESTIONS.length - inserts.length;
  const byTopic = inserts.reduce((acc, row) => {
    const slug = Object.entries(TOPICS).find(([, topic]) => topic.id === row.topic_id)?.[0] ?? 'unknown';
    acc[slug] = (acc[slug] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Analytical Ability wave 2: ${QUESTIONS.length} audited candidate questions.`);
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
  console.log(`Inserted ${inserts.length} published Analytical Ability wave 2 questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
