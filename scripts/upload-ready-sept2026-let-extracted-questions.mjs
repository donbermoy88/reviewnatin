#!/usr/bin/env node
import { dirname, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sourceFileArg = process.argv.find((arg) => arg.startsWith('--source-file='));
const sourceFile = sourceFileArg ? sourceFileArg.slice('--source-file='.length) : 'output/pdf/sept2026_let_extracted_questions.json';
const dryRun = process.argv.includes('--dry-run');
const sourcePrefixArg = process.argv.find((arg) => arg.startsWith('--source-prefix='));
const sourcePrefix = sourcePrefixArg ? sourcePrefixArg.slice('--source-prefix='.length) : '';
const reportFile = sourcePrefix
  ? `output/pdf/${sourceFile.replace(/^output\/pdf\//, '').replace(/\.json$/, '')}_upload_report_filtered.json`
  : `output/pdf/${sourceFile.replace(/^output\/pdf\//, '').replace(/\.json$/, '')}_upload_report.json`;

function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(root, file), 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const i = line.indexOf('=');
          return [line.slice(0, i), line.slice(i + 1).replace(/^["']|["']$/g, '')];
        }),
    );
  } catch {
    return {};
  }
}

function normalizeText(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeChoiceText(value) {
  return normalizeText(value);
}

function cleanForDb(value) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function existingContentKey(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const choiceKey = choices
    .map((choice) => `${choice.id ?? ''}:${normalizeChoiceText(choice.text)}`)
    .join('|');
  return `${normalizeText(question.stem)}::${choiceKey}::${question.correct_choice_id ?? ''}`;
}

function candidateContentKey(candidate) {
  const choiceKey = candidate.choices
    .map((choice) => `${choice.id}:${normalizeChoiceText(choice.text)}`)
    .join('|');
  return `${normalizeText(cleanForDb(candidate.row.Question))}::${choiceKey}::${candidate.letter}`;
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function correctLetter(value) {
  const match = String(value ?? '').match(/^\s*([A-E])(?:\s*[\.)]|\s*$)/i);
  return match?.[1]?.toLowerCase() ?? '';
}

function difficultyValue(value) {
  const num = Number(value);
  if (Number.isInteger(num) && num >= 1 && num <= 5) return num;
  return 3;
}

function sourceSlug(file) {
  return file
    .replace(/^output\/pdf\//, '')
    .replace(/_extracted_questions\.json$/, '');
}

function targetExams(row) {
  const type = normalizeText(row['LET Exam Type']);
  if (type === 'both') return ['elementary', 'secondary'];
  if (type === 'let elementary') return ['elementary'];
  if (type === 'let secondary') return ['secondary'];
  return [];
}

function buildChoices(row) {
  const choices = [];
  for (const letter of ['a', 'b', 'c', 'd', 'e']) {
    const text = cleanForDb(row[`Choice ${letter.toUpperCase()}`]);
    if (text) choices.push({ id: letter, text });
  }
  return choices;
}

function generalEducationTopic(row) {
  const text = `${row.Question ?? ''} ${row['Choice A'] ?? ''} ${row['Choice B'] ?? ''} ${row['Choice C'] ?? ''} ${row['Choice D'] ?? ''}`.toLowerCase();
  const topic = row.Topic ?? '';

  if (/filipino/i.test(topic) || hasAny(text, [/\b(ano|alin|sino|ang|mga|salitang|wika|pandiwa|pangungusap|tula|panitikan|tagalog|filipino|pilipino)\b/i])) {
    return ['gen-ed', 'filipino'];
  }
  if (/ict/i.test(topic) || hasAny(text, [/\b(computer|cpu|ram|keyboard|internet|email|software|hardware|printer|scanner|spreadsheet|network)\b/i])) {
    return ['gen-ed', 'ict-current-trends'];
  }
  if (/biology|chemistry|physics|earth science/i.test(topic) || hasAny(text, [/\b(ecosystem|organism|cell|atom|electron|chemical|photosynthesis|biology|physics|force|energy|volcano|weather|climate|matter|element|compound)\b/i])) {
    return ['gen-ed', 'science'];
  }
  if (/algebra|geometry|statistics/i.test(topic) || hasAny(text, [/\b(mean|median|fraction|percent|ratio|triangle|perimeter|area|interest|rate|solve|number|sequence|probability|algebra|equation)\b/i, /\d+\s*[%/]/])) {
    return ['gen-ed', 'mathematics'];
  }
  if (/history|government|economics/i.test(topic) || hasAny(text, [/\b(constitution|government|president|congress|law|republic act|history|philippine|economy|geography|democracy|human rights|rizal|bonifacio)\b/i])) {
    return ['gen-ed', 'social-science'];
  }
  if (/ethics/i.test(topic) || hasAny(text, [/\b(value|ethics|moral|art|humanities|artist|cultural|culture|religion|philosophy)\b/i])) {
    return ['gen-ed', 'values-humanities'];
  }
  return ['gen-ed', 'english'];
}

function professionalEducationTopic(row) {
  const text = `${row.Question ?? ''} ${row['Choice A'] ?? ''} ${row['Choice B'] ?? ''} ${row['Choice C'] ?? ''} ${row['Choice D'] ?? ''}`.toLowerCase();
  const topic = row.Topic ?? '';

  if (/child development|child and adolescent/i.test(`${row['Subject Area']} ${topic}`) || hasAny(text, [/\b(child|children|adolescent|adolescence|development|growth|maturation|piaget|erikson|freud|puberty)\b/i])) {
    return ['prof-ed', 'child-development'];
  }
  if (/learning theories|facilitating learning/i.test(`${row['Subject Area']} ${topic}`) || hasAny(text, [/\b(vygotsky|bandura|bruner|learning theory|motivation|constructivist|behaviorism|cognitive|scaffold|zpd|conditioning)\b/i])) {
    return ['prof-ed', 'facilitating-learning'];
  }
  if (/assessment/i.test(`${row['Subject Area']} ${topic}`) || hasAny(text, [/\b(assessment|test|testing|evaluation|validity|reliability|tos|table of specification|scoring|rubric|quiz|item analysis)\b/i])) {
    return ['prof-ed', 'assessment-of-learning'];
  }
  if (/curriculum/i.test(`${row['Subject Area']} ${topic}`) || hasAny(text, [/\b(curriculum|k-12|k to 12|spiral|lesson objective|syllabus|tyler|ubd)\b/i])) {
    return ['prof-ed', 'curriculum-development'];
  }
  if (/ict in education|educational technology/i.test(`${row['Subject Area']} ${topic}`) || hasAny(text, [/\b(media|technology|instructional material|audiovisual|cone of experience|edgar dale|computer-assisted|educational technology)\b/i])) {
    return ['prof-ed', 'educational-technology'];
  }
  if (/classroom management/i.test(topic) || hasAny(text, [/\b(classroom management|discipline|punishment|misbehavior|routine|rules|behavior problem)\b/i])) {
    return ['prof-ed', 'classroom-management'];
  }
  if (/ethics/i.test(topic) || hasAny(text, [/\b(let passer|licensure|professional oath|teacher profession|code of ethics|ra 7836|board for professional teachers|prc|license)\b/i])) {
    return ['prof-ed', 'teaching-profession'];
  }
  if (hasAny(text, [/\b(social dimension|community|society|social justice|human rights|peace education|multicultural|school-community)\b/i])) {
    return ['prof-ed', 'social-dimensions'];
  }
  if (hasAny(text, [/\b(special education|inclusive|disability|disabled|indigenous|exceptional learner|mainstream)\b/i])) {
    return ['prof-ed', 'inclusive-education'];
  }
  return ['prof-ed', 'principles-of-teaching'];
}

function slugify(value) {
  return String(value ?? '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function majorLabel(slug) {
  if (slug === 'social-studies-araling-panlipunan') return 'Social Studies / Araling Panlipunan';
  if (slug === 'biological-science') return 'Biological Science';
  if (slug === 'physical-science') return 'Physical Science';
  if (slug === 'values-education') return 'Values Education';
  if (slug === 'early-childhood-education') return 'Early Childhood Education';
  if (slug === 'special-needs-education') return 'Special Needs Education';
  if (slug === 'mapeh') return 'MAPEH';
  if (slug === 'tle') return 'Technology and Livelihood Education (TLE)';
  return slug.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

function classifySecondaryScience(row) {
  const text = `${row.Question ?? ''} ${row['Choice A'] ?? ''} ${row['Choice B'] ?? ''} ${row['Choice C'] ?? ''} ${row['Choice D'] ?? ''} ${row['Source Path'] ?? ''} ${row['Source PDF'] ?? ''}`.toLowerCase();
  if (/biological science|biology|botany|zoology|cell|gene|genetic|dna|rna|plant|animal|ecology|ecosystem|photosynthesis|anatomy|physiology|microbiology/.test(text)) {
    return 'biological-science';
  }
  if (/physical science|chemistry|physics|atom|molecule|electron|chemical|periodic|bond|acid|base|solution|force|motion|energy|electric|magnet|wave|light|earth science|astronomy|weather|climate|volcano|rock|planet/.test(text)) {
    return 'physical-science';
  }
  return null;
}

function mapehSubTag(row) {
  const text = `${row['Subject Area'] ?? ''} ${row.Question ?? ''} ${row['Source Path'] ?? ''} ${row['Source PDF'] ?? ''}`.toLowerCase();
  if (/music|song|rhythm|melody|instrument/.test(text)) return 'Music';
  if (/health|nutrition|disease|wellness|first aid|hygiene/.test(text)) return 'Health';
  if (/physical education|physical ed|\bpe\b|sport|fitness|exercise|dance/.test(text)) return 'Physical Education';
  if (/culture and arts|caed/.test(text)) return 'CAE';
  if (/arts?|painting|drawing|sculpture|artist|design/.test(text)) return 'Arts';
  return 'MAPEH General';
}

function tleSubTag(row) {
  const text = `${row['Subject Area'] ?? ''} ${row.Question ?? ''} ${row['Source Path'] ?? ''} ${row['Source PDF'] ?? ''}`.toLowerCase();
  if (/home economics|\bhe\b|cook|baking|food|garment|sewing|housekeeping/.test(text)) return 'Home Economics';
  if (/industrial arts|\bia\b|woodwork|carpentry|welding|electrical installation|plumbing|drafting/.test(text)) return 'Industrial Arts';
  if (/agriculture|fishery|afa|farming|crop|livestock|aquaculture|poultry/.test(text)) return 'Agriculture and Fishery Arts';
  if (/\bict\b|information and communication|computer|software|hardware|programming|network|internet/.test(text)) return 'ICT';
  if (/entrepreneur|business|marketing|profit|capital|enterprise/.test(text)) return 'Entrepreneurship';
  return 'TLE General';
}

function secondaryMajorTopic(row) {
  const subject = row['Subject Area'] ?? '';
  if (subject === 'English') return ['major', 'english', null];
  if (subject === 'Filipino') return ['major', 'filipino', null];
  if (subject === 'Mathematics') return ['major', 'mathematics', null];
  if (subject === 'Biological Science') return ['major', 'biological-science', null];
  if (subject === 'Physical Science') return ['major', 'physical-science', null];
  if (subject === 'Science') {
    const scienceSlug = classifySecondaryScience(row);
    return scienceSlug ? ['major', scienceSlug, null] : null;
  }
  if (subject === 'Social Studies') return ['major', 'social-studies-araling-panlipunan', null];
  if (subject === 'Values Education') return ['major', 'values-education', null];
  if (['Music', 'Arts', 'Physical Education', 'Health'].includes(subject)) return ['major', 'mapeh', mapehSubTag(row)];
  if (subject === 'Agriculture and Fishery Arts') return ['major', 'tle', 'Agriculture and Fishery Arts'];
  if (subject === 'Information and Communication Technology') return ['major', 'tle', 'ICT'];
  if (subject === 'Technology and Livelihood Education') {
    return ['major', 'tle', tleSubTag(row)];
  }
  return null;
}

function mappedTopic(row, examKind) {
  const subject = row['Subject Area'] ?? '';
  const sourcePath = `${row['Source Path'] ?? ''} ${row['Source PDF'] ?? ''}`.toLowerCase();
  const isGeneralEducationSource = /(?:^|[/\\])a\.\s*general education(?:[/\\]|$)|gen\.?\s*ed|gened|general education/.test(sourcePath);
  const isEnglishMajorSource =
    /(?:^|[/\\])a\.\s*english(?:[/\\]|$)|english booster drill|english q\s*&\s*a drills|english major|english specialization/.test(sourcePath);
  const isFilipinoMajorSource =
    /(?:^|[/\\])b\.\s*filipino(?:[/\\]|$)|filipino major|filipino part|filipino mock test|pagtuturo ng filipino/.test(sourcePath);
  const isCultureArtsMajorSource =
    /\bcaed\b|culture\s*&\s*arts|culture and arts|culture arts education/.test(sourcePath);
  const isMapehMajorSource =
    /(?:^|[/\\])c\.\s*bped\s*&\s*mapeh(?:[/\\]|$)|\bbped\b|\bmapeh\b|physical education|gymnastics|athletics/.test(sourcePath);
  const isMathematicsMajorSource =
    /(?:^|[/\\])d\.\s*mathematics(?:[/\\]|$)|math(?:ematics)?\s+specialization|mathematics\s+q\s*&\s*a|mathematics\s+part|mathematics-all-in-specialization/.test(sourcePath);
  const isBiologicalScienceSource =
    /biological science|biology|botany|zoology|anatomy|physiology|ecology|genetics|microbiology|reproductive|nervous|bone/.test(sourcePath);
  const isPhysicalScienceSource =
    /physical science|chemistry|\bchem\b|physics|matter|periodic table|earth science|astronomy/.test(sourcePath);
  const isGeneralScienceSource =
    /(?:^|[/\\])e\.\s*science(?:[/\\]|$)|general science|science major/.test(sourcePath);
  const isSocialStudiesMajorSource =
    /(?:^|[/\\])f\.\s*social science\s*-\s*social studies(?:[/\\]|$)|social science|social studies|soc sci|philippine history|philippine constitution|rizal|government|economics|human rights|current events/.test(sourcePath);
  if (
    isGeneralEducationSource &&
    ['General Education', 'English', 'Filipino', 'Mathematics', 'Science', 'Social Studies', 'Values Education', 'Information and Communication Technology'].includes(subject)
  ) {
    return generalEducationTopic(row);
  }
  if (examKind === 'secondary' && isEnglishMajorSource) return ['major', 'english', null];
  if (examKind === 'secondary' && isFilipinoMajorSource) return ['major', 'filipino', null];
  if (examKind === 'secondary' && isCultureArtsMajorSource) return ['major', 'culture-and-arts-education', null];
  if (examKind === 'secondary' && isMapehMajorSource) return ['major', 'mapeh', mapehSubTag(row)];
  if (examKind === 'secondary' && isMathematicsMajorSource) return ['major', 'mathematics', null];
  if (examKind === 'secondary' && isBiologicalScienceSource) return ['major', 'biological-science', null];
  if (examKind === 'secondary' && isPhysicalScienceSource) return ['major', 'physical-science', null];
  if (examKind === 'secondary' && isGeneralScienceSource) return ['major', classifySecondaryScience(row) ?? 'general-science', null];
  if (examKind === 'secondary' && isSocialStudiesMajorSource) return ['major', 'social-studies-araling-panlipunan', null];
  if (subject === 'Early Childhood Education') return ['major', 'early-childhood-education', null];
  if (subject === 'Special Needs Education') return ['major', 'special-needs-education', null];
  if (subject === 'General Education') return generalEducationTopic(row);
  if (['Professional Education', 'Child and Adolescent Development', 'Facilitating Learning', 'Curriculum Development', 'Assessment of Learning', 'Educational Technology'].includes(subject)) {
    return professionalEducationTopic(row);
  }
  if (examKind === 'elementary' && ['English', 'Filipino', 'Mathematics', 'Science', 'Social Studies', 'Values Education', 'Information and Communication Technology'].includes(subject)) {
    return generalEducationTopic(row);
  }
  if (examKind === 'secondary') return secondaryMajorTopic(row);
  return null;
}

const env = { ...loadEnv('.env.supabase'), ...loadEnv('apps/mobile/.env'), ...process.env };
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.supabase');
  process.exit(1);
}

if (!existsSync(resolve(root, sourceFile))) {
  console.error(`Missing source file: ${sourceFile}`);
  process.exit(1);
}

const sb = createClient(url, key);

const { data: catalogRows, error: catalogErr } = await sb
  .from('exam_types')
  .select('slug, subject_areas(slug, topics(id, slug))')
  .in('slug', ['let-elementary', 'let-secondary']);
if (catalogErr) throw catalogErr;

const topicByKey = new Map();
const topicIds = [];
for (const exam of catalogRows ?? []) {
  const examKind = exam.slug === 'let-elementary' ? 'elementary' : 'secondary';
  for (const subject of exam.subject_areas ?? []) {
    for (const topic of subject.topics ?? []) {
      topicByKey.set(`${examKind}:${subject.slug}:${topic.slug}`, topic.id);
      topicIds.push(topic.id);
    }
  }
}

async function fetchAllExistingQuestions() {
  const all = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from('questions')
      .select('id, topic_id, stem, choices, correct_choice_id, image_url')
      .in('topic_id', topicIds.length ? topicIds : ['00000000-0000-0000-0000-000000000000'])
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

const existingByTopic = new Map();
for (const question of await fetchAllExistingQuestions()) {
  const map = existingByTopic.get(question.topic_id) ?? new Map();
  map.set(existingContentKey(question), question);
  existingByTopic.set(question.topic_id, map);
}

const allRows = JSON.parse(readFileSync(resolve(root, sourceFile), 'utf8'));
const rows = sourcePrefix
  ? allRows.filter((row) => String(row['Source Path'] ?? '').startsWith(sourcePrefix))
  : allRows;
const candidates = [];
const skipped = [];
const sourceStats = { [sourceFile]: { readyRows: 0, candidateTargets: 0, skipped: 0 } };

for (const row of rows) {
  if (row.Status !== 'Ready for Upload') continue;
  sourceStats[sourceFile].readyRows += 1;

  const exams = targetExams(row);
  if (!exams.length) {
    skipped.push({ row: row['No.'], page: row.Page, subject: row['Subject Area'], reason: 'exam_type_unmapped' });
    sourceStats[sourceFile].skipped += 1;
    continue;
  }

  const letter = correctLetter(row['Correct Answer']);
  const choices = buildChoices(row);
  if (!letter || !choices.some((choice) => choice.id === letter)) {
    skipped.push({ row: row['No.'], page: row.Page, reason: 'invalid_correct_answer_or_choice' });
    sourceStats[sourceFile].skipped += 1;
    continue;
  }
  if (choices.filter((choice) => ['a', 'b', 'c', 'd'].includes(choice.id)).length < 4) {
    skipped.push({ row: row['No.'], page: row.Page, reason: 'missing_required_choice_a_to_d' });
    sourceStats[sourceFile].skipped += 1;
    continue;
  }
  if ((row.Question ?? '').trim().length < 10) {
    skipped.push({ row: row['No.'], page: row.Page, reason: 'question_too_short' });
    sourceStats[sourceFile].skipped += 1;
    continue;
  }

  for (const examKind of exams) {
    const mapped = mappedTopic(row, examKind);
    if (!mapped) {
      skipped.push({ row: row['No.'], page: row.Page, exam: examKind, subject: row['Subject Area'], reason: 'topic_mapping_missing' });
      sourceStats[sourceFile].skipped += 1;
      continue;
    }

    const [subjectSlug, topicSlug, subTag] = mapped;
    const topicId = topicByKey.get(`${examKind}:${subjectSlug}:${topicSlug}`);
    if (!topicId) {
      skipped.push({
        row: row['No.'],
        page: row.Page,
        exam: examKind,
        subject: row['Subject Area'],
        target: `${subjectSlug}/${topicSlug}`,
        reason: 'topic_not_in_catalog',
      });
      sourceStats[sourceFile].skipped += 1;
      continue;
    }

    candidates.push({ row, examKind, topicId, subjectSlug, topicSlug, subTag, choices, letter });
    sourceStats[sourceFile].candidateTargets += 1;
  }
}

const inserts = [];
const duplicates = [];
for (const candidate of candidates) {
  const keyStem = candidateContentKey(candidate);
  const map = existingByTopic.get(candidate.topicId) ?? new Map();
  const existing = map.get(keyStem);
  const isSpecialization = candidate.subjectSlug === 'major';
  const subTagSlug = candidate.subTag ? slugify(candidate.subTag) : null;
  if (existing) {
    duplicates.push({
      source: sourceFile,
      row: candidate.row['No.'],
      page: candidate.row.Page,
      exam: candidate.examKind,
      topic: `${candidate.subjectSlug}/${candidate.topicSlug}`,
      reason: 'duplicate_existing_content',
      existing_id: existing.id,
    });
    continue;
  }

  inserts.push({
    topic_id: candidate.topicId,
    stem: cleanForDb(candidate.row.Question),
    choices: candidate.choices,
    correct_choice_id: candidate.letter,
    explanation_en:
      cleanForDb(candidate.row.Explanation) ||
      `Answer key from extracted Sept2026 LET source: ${cleanForDb(candidate.row['Correct Answer'])}.`,
    explanation_fil: null,
    difficulty: difficultyValue(candidate.row.Difficulty),
    status: 'published',
    image_url: null,
    source: 'pdf_extraction',
    source_note: [
      `${sourceSlug(sourceFile)} row ${candidate.row['No.']}`,
      `page ${candidate.row.Page}`,
      candidate.row['Source PDF'] ?? '',
      candidate.row['Original No.'] ? `original no. ${candidate.row['Original No.']}` : '',
      candidate.row.Notes ?? '',
    ].filter(Boolean).map(cleanForDb).join('; ').slice(0, 1000),
    is_verified: true,
    tags: [
      'let',
      'pdf-extraction',
      'sept2026',
      candidate.examKind === 'elementary' ? 'let-elementary' : 'let-secondary',
      sourceSlug(sourceFile),
      candidate.row['Subject Area']?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      isSpecialization ? `major:${candidate.topicSlug}` : '',
      subTagSlug ? `subtag:${subTagSlug}` : '',
    ].filter(Boolean),
    needs_review: false,
    review_reason: null,
    ...(isSpecialization
      ? {
          major: majorLabel(candidate.topicSlug),
          major_slug: candidate.topicSlug,
          sub_tag: candidate.subTag ?? null,
          sub_tag_slug: subTagSlug,
          exam_level: candidate.examKind === 'elementary' ? 'LET Elementary' : 'LET Secondary',
          exam_area: 'Area of Specialization',
          taxonomy_version: candidate.examKind === 'elementary'
            ? 'LET_ELEMENTARY_SPECIALIZATION_TAXONOMY_2026'
            : 'LET_SECONDARY_MAJOR_TAXONOMY_2026',
        }
      : {}),
  });
  map.set(keyStem, { id: null, topic_id: candidate.topicId, stem: cleanForDb(candidate.row.Question), image_url: null });
  existingByTopic.set(candidate.topicId, map);
}

const insertedIds = [];
if (!dryRun) {
  const batchSize = 250;
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize);
    const { data, error } = await sb.from('questions').insert(batch).select('id');
    if (error) throw error;
    insertedIds.push(...(data ?? []).map((row) => row.id));
  }
}

const batchId = crypto.randomUUID();
if (!dryRun) {
  const { data: adminUser } = await sb.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
  if (adminUser?.id && insertedIds.length) {
    await sb.from('admin_logs').insert({
      admin_id: adminUser.id,
      action: 'ready_sept2026_let_pdf_import',
      entity_type: 'questions',
      metadata: {
        batch_id: batchId,
        inserted: insertedIds.length,
        skipped: skipped.length,
        duplicates: duplicates.length,
        sources: sourceStats,
      },
    });
  }
}

const report = {
  batch_id: batchId,
  dry_run: dryRun,
  source: sourceFile,
  source_prefix: sourcePrefix || null,
  source_rows: rows.length,
  ready_rows: sourceStats[sourceFile].readyRows,
  candidate_targets: candidates.length,
  insertable: inserts.length,
  inserted: insertedIds.length,
  skipped: skipped.length,
  duplicates: duplicates.length,
  source_stats: sourceStats,
  skipped_by_reason: skipped.reduce((acc, row) => ({ ...acc, [row.reason]: (acc[row.reason] ?? 0) + 1 }), {}),
  duplicate_samples: duplicates.slice(0, 50),
  skipped_samples: skipped.slice(0, 100),
};

writeFileSync(resolve(root, reportFile), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, report_path: resolve(root, reportFile) }, null, 2));
