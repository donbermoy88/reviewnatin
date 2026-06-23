#!/usr/bin/env node
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'output/taxonomy');
const migrationFile = resolve(root, 'supabase/migrations/20260624000000_normalize_let_secondary_major_taxonomy.sql');
const dryRunReportFile = resolve(outDir, 'let_secondary_major_taxonomy_2026_dry_run.json');
const manualReviewFile = resolve(outDir, 'let_secondary_major_taxonomy_2026_manual_review.csv');
const finalReportFile = resolve(outDir, 'let_secondary_major_taxonomy_2026_final_report.json');

const TAXONOMY_VERSION = 'LET_SECONDARY_MAJOR_TAXONOMY_2026';
const FINAL_MAJOR_SLUGS = [
  'english',
  'mathematics',
  'filipino',
  'social-studies-araling-panlipunan',
  'biological-science',
  'physical-science',
  'values-education',
  'mapeh',
  'tle',
];

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

function norm(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function uuidArray(ids) {
  if (!ids.length) return "ARRAY[]::uuid[]";
  return `ARRAY[${ids.map((id) => `${sqlLiteral(id)}::uuid`).join(', ')}]`;
}

function csvValue(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function choiceText(choices) {
  if (!Array.isArray(choices)) return '';
  return choices.map((choice) => `${choice.id ?? ''}. ${choice.text ?? ''}`).join(' ');
}

function questionText(row) {
  return [
    row.stem,
    choiceText(row.choices),
    row.explanation_en,
    row.explanation_fil,
    row.source_note,
    Array.isArray(row.tags) ? row.tags.join(' ') : '',
  ].join(' ');
}

function countPatterns(text, patterns) {
  let score = 0;
  const hits = [];
  for (const [pattern, weight] of patterns) {
    const match = text.match(pattern);
    if (match) {
      score += weight;
      hits.push(pattern.source);
    }
  }
  return { score, hits };
}

const BIO_PATTERNS = [
  [/\bbiological science\b/, 12],
  [/\bbiology\b|\bbiologist\b|\bbotany\b|\bzoology\b|\becology\b|\bgenetics?\b|\bevolution\b|\bmicrobiology\b|\bbiotechnology\b|\bbiochemistry\b/, 5],
  [/\bcell(?:ular)?\b|\bmitosis\b|\bmeiosis\b|\bdna\b|\brna\b|\bchromosome\b|\bgene\b|\bmutation\b|\bprotein synthesis\b/, 4],
  [/\borganism\b|\bspecies\b|\bpopulation\b|\bcommunity\b|\becosystem\b|\bfood chain\b|\bfood web\b|\bphotosynthesis\b|\brespiration\b/, 3],
  [/\bplant\b|\banimal\b|\bmammal\b|\bbird\b|\bflowering\b|\broots?\b|\bleaves\b|\bstem\b|\bxylem\b|\bphloem\b|\bseed\b/, 3],
  [/\bhuman anatomy\b|\banatomy\b|\bphysiology\b|\bheart\b|\bblood\b|\blung\b|\bbrain\b|\bdigestion\b|\breproductive\b|\bhormone\b|\bgland\b|\bimmune\b|\bnervous system\b/, 3],
  [/\bbacteria\b|\bvirus\b|\bfungi\b|\bprotist\b|\balgae\b|\bparasite\b/, 3],
  [/\bbiology pedagogy\b|\bscience teacher\b.*\b(living|organism|plant|animal|cell)\b/, 2],
  [/\bchromosomes?\b|\bhemophilia\b|\broyal disease\b|\bvaccine\b|\bimmuni[sz]ation\b|\bornithophily\b|\bguttation\b|\balga(?:e|l)\b|\bcholine\b|\bhereditary\b|\bendocrine\b|\bexocrine\b/, 4],
  [/\bfirst life\b|\borigin of life\b|\bindus valley.*animal\b|\bdomesticated animal\b/, 3],
  [/\bvaccination\b|\bred blood cells?\b|\bdecomposer\b|\bplants? receive\b|\bgrow taller\b|\bhydrocarbon production\b|\bosmosis\b/, 4],
];

const PHYSICAL_PATTERNS = [
  [/\bphysical science\b/, 12],
  [/\bchemistry\b|\bchemical\b|\batom(?:ic)?\b|\bmolecule\b|\belectron\b|\bproton\b|\bneutron\b|\bperiodic table\b|\bvalence\b|\bbond(?:ing)?\b|\bstoichiometry\b|\bacid\b|\bbase\b|\bsolution\b|\bsolute\b|\bsolvent\b|\boxidation\b|\breduction\b/, 5],
  [/\bphysics\b|\bforce\b|\bmotion\b|\bvelocity\b|\bacceleration\b|\bmechanics\b|\benergy\b|\bwork\b|\bpower\b|\bheat\b|\bthermodynamics\b|\belectric(?:ity| current)?\b|\bmagnet(?:ism|ic)?\b|\bvoltage\b|\bwave\b|\boptics\b|\blight\b|\bsound\b|\bgravity\b/, 5],
  [/\bearth science\b|\bgeology\b|\bmeteorology\b|\bastronomy\b|\bplanet\b|\bstar\b|\bsolar system\b|\bweather\b|\bclimate\b|\bvolcano\b|\bearthquake\b|\brock\b|\bmineral\b|\bfossil fuel\b|\bgreenhouse\b/, 4],
  [/\bevaporat(?:e|ion)\b|\bcondens(?:e|ation)\b|\bfreez(?:e|ing)\b|\bmelting\b|\bboiling\b|\bdensity\b|\bpressure\b|\btemperature\b|\bmixture\b|\bcompound\b|\belement\b/, 3],
  [/\bphysical science pedagogy\b|\bscience teacher\b.*\b(chemical|physics|force|energy|matter|evaporation|bunsen)\b/, 2],
  [/\bx-?rays?\b|\bgamma rays?\b|\bradioactive\b|\bwavelength\b|\bdry ice\b|\bcarbon dioxide\b|\bdiamond\b|\bcarat\b|\bantenna\b|\bcalorific\b|\bfuel\b|\belectromagnetic\b|\belectrical circuit\b|\bfuse\b|\bfriction\b|\boxygen\b|\bvoltage\b|\bcell phones?\b/, 4],
  [/\brain water\b|\btap water\b|\batmosphere\b|\bnights are cool\b|\bshortest wavelength\b|\blongest wavelength\b/, 3],
  [/\brocks? formed\b|\bmagma\b|\bone year on earth\b|\bcoriolis\b|\bhumidity\b|\bocean current\b|\btropical cyclone\b|\bnatural gas\b|\bshadow during an eclipse\b|\bmoon\b|\bsolar system\b|\bmilky way\b|\bplanet\b|\bgalaxy\b|\bsimple machine\b|\bmatter\b|\bsolar energy\b/, 4],
  [/\bsafety matches\b|\bphosphorus\b|\bvapou?r\b|\bcatalytic\b|\bvulcanization\b|\bmicron\b|\bchronometer\b|\blenses?\b|\bprisms?\b|\bpolyamide\b|\bnatural gas\b|\bdefinite shape and volume\b/, 4],
];

const MAPEH_PATTERNS = {
  'Music': [/\bmusic\b|\bsong\b|\brhythm\b|\bmelody\b|\bharmony\b|\btempo\b|\bcomposer\b|\binstrument\b/],
  'Arts': [/\bart\b|\bpainting\b|\bsculpture\b|\bdrawing\b|\bcolor\b|\bvisual\b|\bartist\b|\bdesign\b/],
  'Physical Education': [/\bphysical education\b|\bphysical ed\b|\bpe\b|\bsport\b|\bfitness\b|\bexercise\b|\bmovement\b|\bdance\b|\bgymnastics\b|\bathletic\b/],
  'Health': [/\bhealth\b|\bnutrition\b|\bdisease\b|\bwellness\b|\bfirst aid\b|\bsafety\b|\bhygiene\b|\bdrug\b|\bsubstance abuse\b/],
  'CAE': [/\bculture and arts\b|\bcaed\b|\bculture\b/],
};

const TLE_PATTERNS = {
  'Home Economics': [/\bhome economics\b|\bcook(?:ing|ery)?\b|\bbaking\b|\bfood\b|\bmeal\b|\bgarment\b|\bsewing\b|\btextile\b|\bhousekeeping\b|\bfamily resources\b/],
  'Industrial Arts': [/\bindustrial arts\b|\bwoodwork\b|\bcarpentry\b|\bwelding\b|\belectrical installation\b|\bplumbing\b|\bmechanical\b|\bdrafting\b/],
  'Agriculture and Fishery Arts': [/\bagriculture\b|\bfishery\b|\bfarming\b|\bcrop\b|\blivestock\b|\baquaculture\b|\bfish culture\b|\bpoultry\b/],
  'ICT': [/\bict\b|\binformation and communication\b|\bcomputer\b|\bsoftware\b|\bhardware\b|\bprogramming\b|\bnetwork\b|\binternet\b|\bdatabase\b/],
  'Entrepreneurship': [/\bentrepreneur(?:ship|ial)?\b|\bbusiness\b|\bmarketing\b|\bprofit\b|\bcapital\b|\benterprise\b/],
};

const SOCIAL_STUDIES_PATTERNS = [
  /\bsocial studies\b|\bsocial science\b|\baraling panlipunan\b|\bhistory\b|\bgeography\b|\beconomics\b|\bgovernment\b|\bcivics\b|\bconstitution\b|\bdemocracy\b/,
  /\bcapital of\b|\bcountry\b|\bnation\b|\bcontinent\b|\bregion\b|\bcity\b|\bprovince\b|\bmap\b|\blatitude\b|\blongitude\b/,
  /\brizal\b|\bbonifacio\b|\baguinaldo\b|\bkatipunan\b|\bphilippine revolution\b|\bworld war\b|\bunited nations\b/,
  /\bsupply\b|\bdemand\b|\binflation\b|\bmarket\b|\bgdp\b|\btariff\b|\btaxation\b/,
  /\bindus valley civilization\b/,
];

const MATHEMATICS_PATTERNS = [
  /\bdecimal\b|\bfraction\b|\bprobability\b|\bcoin(?:s)?\b|\btoss(?:ed)?\b|\bmode\b|\bmean\b|\bmedian\b|\bpercentage\b|\bratio\b/,
];

function firstMatchingSubTag(text, groups, fallback) {
  for (const [tag, patterns] of Object.entries(groups)) {
    if (patterns.some((pattern) => pattern.test(text))) return tag;
  }
  return fallback;
}

function slugifySubTag(value) {
  return norm(value).replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function classifyScience(row) {
  const text = norm(questionText(row));
  const tags = Array.isArray(row.tags) ? row.tags.map(norm) : [];
  const source = norm(row.source_note);

  if (MATHEMATICS_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      targetSlug: 'mathematics',
      subTag: null,
      confidence: 'medium',
      reason: 'science_topic_row_matches_mathematics_text',
    };
  }
  if (/bsed social studies-science/.test(source) || SOCIAL_STUDIES_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      targetSlug: 'social-studies-araling-panlipunan',
      subTag: null,
      confidence: /bsed social studies-science/.test(source) ? 'high' : 'medium',
      reason: 'science_topic_row_matches_social_studies_source_or_text',
    };
  }
  if (/bsed tled|technology and livelihood|home economics|industrial arts|agriculture|fishery|\bict\b/.test(source)) {
    const tleSlug = /home economics|\bhe\b/.test(source)
      ? 'home-economics'
      : /ict|information/.test(source)
        ? 'ict'
        : /industrial arts|\bia\b/.test(source)
          ? 'industrial-arts'
          : /agriculture|fishery|afa/.test(source)
            ? 'agriculture-fishery-arts'
            : 'tle';
    return classifyTle(row, tleSlug);
  }
  if (tags.includes('biological-science') || /bsed biological science|biological-science-review/.test(source)) {
    return { targetSlug: 'biological-science', subTag: null, confidence: 'high', reason: 'source_or_tag_biological_science' };
  }
  if (tags.includes('physical-science') || /bsed physical science/.test(source)) {
    return { targetSlug: 'physical-science', subTag: null, confidence: 'high', reason: 'source_or_tag_physical_science' };
  }

  const bio = countPatterns(text, BIO_PATTERNS);
  const physical = countPatterns(text, PHYSICAL_PATTERNS);
  if (bio.score >= physical.score + 2 && bio.score >= 3) {
    return { targetSlug: 'biological-science', subTag: null, confidence: bio.score >= 5 ? 'high' : 'medium', reason: `biology_score_${bio.score}_physical_score_${physical.score}` };
  }
  if (physical.score >= bio.score + 2 && physical.score >= 3) {
    return { targetSlug: 'physical-science', subTag: null, confidence: physical.score >= 5 ? 'high' : 'medium', reason: `physical_score_${physical.score}_biology_score_${bio.score}` };
  }

  return {
    targetSlug: 'science-review-needed',
    subTag: null,
    confidence: 'manual_review',
    reason: `ambiguous_science_biology_score_${bio.score}_physical_score_${physical.score}`,
  };
}

function classifyMapeh(row) {
  const text = norm(questionText(row));
  let subTag = firstMatchingSubTag(text, MAPEH_PATTERNS, 'MAPEH General');
  if (/physical ed|physical education|bsed physical ed/.test(text)) subTag = 'Physical Education';
  if (/culture and arts|caed/.test(text)) subTag = 'CAE';
  return { targetSlug: 'mapeh', subTag, confidence: subTag === 'MAPEH General' ? 'medium' : 'high', reason: `mapeh_subtag_${slugifySubTag(subTag)}` };
}

function classifyTle(row, currentSlug) {
  const text = norm(questionText(row));
  if (currentSlug === 'home-economics') {
    return { targetSlug: 'tle', subTag: 'Home Economics', confidence: 'high', reason: 'legacy_home_economics_topic' };
  }
  if (currentSlug === 'ict') {
    return { targetSlug: 'tle', subTag: 'ICT', confidence: 'high', reason: 'legacy_ict_topic' };
  }
  if (currentSlug === 'industrial-arts') {
    return { targetSlug: 'tle', subTag: 'Industrial Arts', confidence: 'high', reason: 'legacy_industrial_arts_topic' };
  }
  if (currentSlug === 'agriculture-fishery-arts') {
    return { targetSlug: 'tle', subTag: 'Agriculture and Fishery Arts', confidence: 'high', reason: 'legacy_agriculture_fishery_topic' };
  }
  const subTag = firstMatchingSubTag(text, TLE_PATTERNS, 'TLE General');
  return { targetSlug: 'tle', subTag, confidence: subTag === 'TLE General' ? 'medium' : 'high', reason: `tle_subtag_${slugifySubTag(subTag)}` };
}

function classify(row) {
  const slug = row.current_topic_slug;
  if (slug === 'english') return { targetSlug: 'english', subTag: null, confidence: 'high', reason: 'preserve_english' };
  if (slug === 'mathematics') return { targetSlug: 'mathematics', subTag: null, confidence: 'high', reason: 'preserve_mathematics' };
  if (slug === 'filipino') return { targetSlug: 'filipino', subTag: null, confidence: 'high', reason: 'preserve_filipino' };
  if (slug === 'values-education') return { targetSlug: 'values-education', subTag: null, confidence: 'high', reason: 'preserve_values_education' };
  if (slug === 'social-studies') return { targetSlug: 'social-studies-araling-panlipunan', subTag: null, confidence: 'high', reason: 'rename_social_studies' };
  if (slug === 'science') return classifyScience(row);
  if (slug === 'mapeh') return classifyMapeh(row);
  if (['tle', 'home-economics', 'ict', 'industrial-arts', 'agriculture-fishery-arts', 'tvted'].includes(slug)) return classifyTle(row, slug);
  return { targetSlug: 'manual-review', subTag: null, confidence: 'manual_review', reason: `unsupported_major_topic_${slug}` };
}

async function fetchAll(sb, table, select, build) {
  const all = [];
  for (let from = 0; ; from += 1000) {
    let query = sb.from(table).select(select).range(from, from + 999);
    query = build ? build(query) : query;
    const { data, error } = await query;
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return all;
}

function summarize(rows) {
  const counts = {
    byCurrentMajor: {},
    byTargetMajor: {},
    byStatus: {},
    bySource: {},
    bySubTag: {},
  };
  for (const row of rows) {
    counts.byCurrentMajor[row.current_topic_slug] = (counts.byCurrentMajor[row.current_topic_slug] ?? 0) + 1;
    counts.byTargetMajor[row.targetSlug] = (counts.byTargetMajor[row.targetSlug] ?? 0) + 1;
    counts.byStatus[row.status] = (counts.byStatus[row.status] ?? 0) + 1;
    const source = row.source_note?.split(';').find((part) => /\.pdf/i.test(part))?.trim() ?? row.source ?? 'unknown';
    counts.bySource[source] = (counts.bySource[source] ?? 0) + 1;
    if (row.subTag) counts.bySubTag[row.subTag] = (counts.bySubTag[row.subTag] ?? 0) + 1;
  }
  return counts;
}

function buildSql({ rows, topics }) {
  const byTarget = new Map();
  for (const row of rows) {
    const list = byTarget.get(row.targetSlug) ?? [];
    list.push(row.id);
    byTarget.set(row.targetSlug, list);
  }
  const bySubTag = new Map();
  for (const row of rows) {
    if (!row.subTag) continue;
    const key = `${row.targetSlug}::${row.subTag}`;
    const list = bySubTag.get(key) ?? [];
    list.push(row.id);
    bySubTag.set(key, list);
  }
  const manualRows = rows.filter((row) => row.needsReview);

  const lines = [];
  lines.push('-- Normalize LET Secondary Area of Specialization taxonomy.');
  lines.push('-- Generated by scripts/normalize-let-secondary-major-taxonomy.mjs.');
  lines.push('-- Rollback: restore question topic_id/status/content columns from public.let_secondary_major_taxonomy_2026_backup, then restore topic slugs/names from the same backup snapshots if needed.');
  lines.push('BEGIN;');
  lines.push('');
  lines.push('ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS major text;');
  lines.push('ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS major_slug text;');
  lines.push('ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS sub_tag text;');
  lines.push('ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS sub_tag_slug text;');
  lines.push('ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam_level text;');
  lines.push('ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam_area text;');
  lines.push('ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS taxonomy_version text;');
  lines.push('ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;');
  lines.push('ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS review_reason text;');
  lines.push('');
  lines.push('CREATE TABLE IF NOT EXISTS public.let_secondary_major_taxonomy_2026_backup (');
  lines.push('  question_id uuid PRIMARY KEY,');
  lines.push('  backup_created_at timestamptz NOT NULL DEFAULT now(),');
  lines.push('  old_topic_id uuid NOT NULL,');
  lines.push('  old_topic_slug text NOT NULL,');
  lines.push('  old_topic_name text NOT NULL,');
  lines.push('  old_status public.question_status NOT NULL,');
  lines.push('  question_snapshot jsonb NOT NULL');
  lines.push(');');
  lines.push('');
  lines.push('CREATE TABLE IF NOT EXISTS public.let_secondary_major_taxonomy_2026_manual_review (');
  lines.push('  question_id uuid PRIMARY KEY,');
  lines.push('  old_topic_slug text NOT NULL,');
  lines.push('  suggested_topic_slug text NOT NULL,');
  lines.push('  review_reason text NOT NULL,');
  lines.push('  stem text NOT NULL,');
  lines.push('  source_note text,');
  lines.push('  created_at timestamptz NOT NULL DEFAULT now()');
  lines.push(');');
  lines.push('');
  lines.push('WITH major_questions AS (');
  lines.push('  SELECT q.id, q.topic_id, t.slug AS old_topic_slug, t.name AS old_topic_name, q.status, to_jsonb(q) AS snapshot');
  lines.push('  FROM public.questions q');
  lines.push('  JOIN public.topics t ON t.id = q.topic_id');
  lines.push('  JOIN public.subject_areas sa ON sa.id = t.subject_area_id');
  lines.push("  JOIN public.exam_types et ON et.id = sa.exam_type_id AND et.slug = 'let-secondary'");
  lines.push("  WHERE sa.slug = 'major'");
  lines.push(')');
  lines.push('INSERT INTO public.let_secondary_major_taxonomy_2026_backup (question_id, old_topic_id, old_topic_slug, old_topic_name, old_status, question_snapshot)');
  lines.push('SELECT id, topic_id, old_topic_slug, old_topic_name, status, snapshot FROM major_questions');
  lines.push('ON CONFLICT (question_id) DO NOTHING;');
  lines.push('');
  lines.push('WITH major_sa AS (');
  lines.push('  SELECT sa.id');
  lines.push('  FROM public.subject_areas sa');
  lines.push('  JOIN public.exam_types et ON et.id = sa.exam_type_id');
  lines.push("  WHERE et.slug = 'let-secondary' AND sa.slug = 'major'");
  lines.push(')');
  lines.push('INSERT INTO public.topics (subject_area_id, slug, name, sort_order)');
  lines.push('SELECT major_sa.id, seed.slug, seed.name, seed.sort_order');
  lines.push('FROM major_sa');
  lines.push('CROSS JOIN (VALUES');
  lines.push("  ('biological-science', 'Biological Science', 5),");
  lines.push("  ('physical-science', 'Physical Science', 6),");
  lines.push("  ('science-review-needed', 'Science Review Needed', 100)");
  lines.push(') AS seed(slug, name, sort_order)');
  lines.push('ON CONFLICT (subject_area_id, slug) DO UPDATE SET');
  lines.push('  name = EXCLUDED.name,');
  lines.push('  sort_order = EXCLUDED.sort_order;');
  lines.push('');
  lines.push('WITH major_sa AS (');
  lines.push('  SELECT sa.id FROM public.subject_areas sa JOIN public.exam_types et ON et.id = sa.exam_type_id');
  lines.push("  WHERE et.slug = 'let-secondary' AND sa.slug = 'major'");
  lines.push(')');
  lines.push('UPDATE public.topics t');
  lines.push('SET slug = CASE t.slug');
  lines.push("    WHEN 'social-studies' THEN 'social-studies-araling-panlipunan'");
  lines.push("    ELSE t.slug");
  lines.push('  END,');
  lines.push('  name = CASE t.slug');
  lines.push("    WHEN 'social-studies' THEN 'Social Studies / Araling Panlipunan'");
  lines.push("    WHEN 'mapeh' THEN 'MAPEH'");
  lines.push("    WHEN 'tle' THEN 'Technology and Livelihood Education (TLE)'");
  lines.push("    ELSE t.name");
  lines.push('  END,');
  lines.push('  sort_order = CASE t.slug');
  lines.push("    WHEN 'english' THEN 1");
  lines.push("    WHEN 'mathematics' THEN 2");
  lines.push("    WHEN 'filipino' THEN 3");
  lines.push("    WHEN 'social-studies' THEN 4");
  lines.push("    WHEN 'values-education' THEN 7");
  lines.push("    WHEN 'mapeh' THEN 8");
  lines.push("    WHEN 'tle' THEN 9");
  lines.push('    ELSE t.sort_order');
  lines.push('  END');
  lines.push('FROM major_sa');
  lines.push('WHERE t.subject_area_id = major_sa.id;');
  lines.push('');
  lines.push('WITH major_sa AS (');
  lines.push('  SELECT sa.id FROM public.subject_areas sa JOIN public.exam_types et ON et.id = sa.exam_type_id');
  lines.push("  WHERE et.slug = 'let-secondary' AND sa.slug = 'major'");
  lines.push(')');
  lines.push('UPDATE public.topics t');
  lines.push('SET sort_order = CASE t.slug');
  lines.push("    WHEN 'home-economics' THEN 109");
  lines.push("    WHEN 'ict' THEN 110");
  lines.push("    WHEN 'industrial-arts' THEN 111");
  lines.push("    WHEN 'agriculture-fishery-arts' THEN 112");
  lines.push("    WHEN 'tvted' THEN 113");
  lines.push("    WHEN 'science' THEN 114");
  lines.push("    ELSE t.sort_order");
  lines.push('  END,');
  lines.push('  name = CASE t.slug');
  lines.push("    WHEN 'home-economics' THEN 'Home Economics (Legacy - use TLE)'");
  lines.push("    WHEN 'ict' THEN 'ICT (Legacy - use TLE)'");
  lines.push("    WHEN 'industrial-arts' THEN 'Industrial Arts (Legacy - use TLE)'");
  lines.push("    WHEN 'agriculture-fishery-arts' THEN 'Agriculture & Fishery Arts (Legacy - use TLE)'");
  lines.push("    WHEN 'tvted' THEN 'Technical-Vocational Education (Legacy - use TLE)'");
  lines.push("    WHEN 'science' THEN 'Science (Legacy - split into Biological/Physical)'");
  lines.push('    ELSE t.name');
  lines.push('  END');
  lines.push('FROM major_sa');
  lines.push('WHERE t.subject_area_id = major_sa.id');
  lines.push("  AND t.slug IN ('home-economics','ict','industrial-arts','agriculture-fishery-arts','tvted','science');");
  lines.push('');

  for (const slug of FINAL_MAJOR_SLUGS.concat(['science-review-needed'])) {
    const ids = byTarget.get(slug) ?? [];
    if (!ids.length) continue;
    const name = slug === 'social-studies-araling-panlipunan'
      ? 'Social Studies / Araling Panlipunan'
      : slug === 'tle'
        ? 'Technology and Livelihood Education (TLE)'
        : slug === 'mapeh'
          ? 'MAPEH'
          : slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
    lines.push(`-- Move ${ids.length} question(s) to ${slug}.`);
    lines.push('WITH target_topic AS (');
    lines.push('  SELECT t.id');
    lines.push('  FROM public.topics t');
    lines.push('  JOIN public.subject_areas sa ON sa.id = t.subject_area_id');
    lines.push('  JOIN public.exam_types et ON et.id = sa.exam_type_id');
    lines.push(`  WHERE et.slug = 'let-secondary' AND sa.slug = 'major' AND t.slug = ${sqlLiteral(slug)}`);
    lines.push(')');
    lines.push('UPDATE public.questions q');
    lines.push('SET topic_id = (SELECT id FROM target_topic),');
    lines.push(`    major = ${sqlLiteral(name)},`);
    lines.push(`    major_slug = ${sqlLiteral(slug)},`);
    lines.push("    exam_level = 'LET Secondary',");
    lines.push("    exam_area = 'Area of Specialization',");
    lines.push(`    taxonomy_version = ${sqlLiteral(TAXONOMY_VERSION)},`);
    lines.push(`    needs_review = ${slug === 'science-review-needed' ? 'true' : 'false'},`);
    lines.push(`    review_reason = ${slug === 'science-review-needed' ? sqlLiteral('Science major could not be confidently split into Biological Science or Physical Science.') : 'NULL'},`);
    lines.push("    tags = array(SELECT DISTINCT tag FROM unnest(coalesce(q.tags, '{}') || ARRAY['let-secondary-major-taxonomy-2026', 'major:" + slug + "']) AS tag),");
    lines.push('    updated_at = now()');
    lines.push(`WHERE q.id = ANY(${uuidArray(ids)});`);
    lines.push('');
  }

  for (const [key, ids] of bySubTag.entries()) {
    const [targetSlug, subTag] = key.split('::');
    lines.push(`-- Set ${targetSlug} sub_tag ${subTag} for ${ids.length} question(s).`);
    lines.push('UPDATE public.questions q');
    lines.push(`SET sub_tag = ${sqlLiteral(subTag)},`);
    lines.push(`    sub_tag_slug = ${sqlLiteral(slugifySubTag(subTag))},`);
    lines.push(`    tags = array(SELECT DISTINCT tag FROM unnest(coalesce(q.tags, '{}') || ARRAY[${sqlLiteral(`subtag:${slugifySubTag(subTag)}`)}]) AS tag),`);
    lines.push('    updated_at = now()');
    lines.push(`WHERE q.id = ANY(${uuidArray(ids)});`);
    lines.push('');
  }

  lines.push(`DELETE FROM public.let_secondary_major_taxonomy_2026_manual_review;`);
  if (manualRows.length) {
    lines.push('INSERT INTO public.let_secondary_major_taxonomy_2026_manual_review (question_id, old_topic_slug, suggested_topic_slug, review_reason, stem, source_note) VALUES');
    lines.push(manualRows.map((row) => `  (${sqlLiteral(row.id)}::uuid, ${sqlLiteral(row.current_topic_slug)}, ${sqlLiteral(row.targetSlug)}, ${sqlLiteral(row.reason)}, ${sqlLiteral(row.stem.slice(0, 1000))}, ${sqlLiteral(row.source_note ?? '')})`).join(',\n') + ';');
  }
  lines.push('');
  lines.push('-- Normalize saved goal slugs where the mapping is deterministic.');
  lines.push("UPDATE public.user_exam_goals SET major_slug = 'social-studies-araling-panlipunan' WHERE major_slug = 'social-studies';");
  lines.push("UPDATE public.user_exam_goals SET major_slug = 'tle' WHERE major_slug IN ('home-economics','ict','industrial-arts','agriculture-fishery-arts','tvted');");
  lines.push('');
  lines.push('-- Guardrails.');
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push('  v_total int;');
  lines.push('  v_published int;');
  lines.push('  v_deleted int;');
  lines.push('BEGIN');
  lines.push("  SELECT count(*), count(*) FILTER (WHERE q.status = 'published') INTO v_total, v_published");
  lines.push('  FROM public.questions q');
  lines.push('  JOIN public.topics t ON t.id = q.topic_id');
  lines.push('  JOIN public.subject_areas sa ON sa.id = t.subject_area_id');
  lines.push('  JOIN public.exam_types et ON et.id = sa.exam_type_id');
  lines.push("  WHERE et.slug = 'let-secondary' AND sa.slug = 'major';");
  lines.push("  IF v_total <> 3375 THEN RAISE EXCEPTION 'LET Secondary major total changed: %', v_total; END IF;");
  lines.push("  IF v_published <> 3375 THEN RAISE EXCEPTION 'LET Secondary major published count changed: %', v_published; END IF;");
  lines.push('  SELECT count(*) INTO v_deleted FROM public.let_secondary_major_taxonomy_2026_backup b LEFT JOIN public.questions q ON q.id = b.question_id WHERE q.id IS NULL;');
  lines.push("  IF v_deleted <> 0 THEN RAISE EXCEPTION 'Question IDs missing after migration: %', v_deleted; END IF;");
  lines.push('END $$;');
  lines.push('');
  lines.push('COMMIT;');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const env = { ...loadEnv('.env.supabase'), ...process.env };
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: catalog, error: catalogError } = await sb
    .from('exam_types')
    .select('slug, subject_areas(id, slug, name, topics(id, slug, name, sort_order))')
    .eq('slug', 'let-secondary')
    .single();
  if (catalogError) throw catalogError;

  const majorSubject = catalog.subject_areas.find((subject) => subject.slug === 'major');
  if (!majorSubject) throw new Error('Missing LET Secondary major subject area.');
  const majorTopicIds = majorSubject.topics.map((topic) => topic.id);
  const topicById = new Map(majorSubject.topics.map((topic) => [topic.id, topic]));

  const questions = await fetchAll(
    sb,
    'questions',
    'id, topic_id, stem, choices, correct_choice_id, explanation_en, explanation_fil, difficulty, status, source, source_note, tags, image_url',
    (query) => query.in('topic_id', majorTopicIds),
  );

  const classified = questions.map((row) => {
    const topic = topicById.get(row.topic_id);
    const currentSlug = topic?.slug ?? 'unknown';
    const result = classify({ ...row, current_topic_slug: currentSlug });
    return {
      ...row,
      current_topic_slug: currentSlug,
      current_topic_name: topic?.name ?? 'Unknown',
      targetSlug: result.targetSlug,
      subTag: result.subTag,
      subTagSlug: result.subTag ? slugifySubTag(result.subTag) : null,
      confidence: result.confidence,
      reason: result.reason,
      needsReview: result.confidence === 'manual_review' || result.targetSlug === 'science-review-needed' || result.targetSlug === 'manual-review',
    };
  });

  const counts = summarize(classified);
  const report = {
    generated_at: new Date().toISOString(),
    taxonomy_version: TAXONOMY_VERSION,
    schema_audit_summary: {
      canonical_taxonomy_tables: ['exam_types', 'subject_areas', 'topics'],
      question_table: 'questions',
      major_storage: 'topics rows under let-secondary / major subject_area; questions.topic_id points to the selected major.',
      added_question_columns: ['major', 'major_slug', 'sub_tag', 'sub_tag_slug', 'exam_level', 'exam_area', 'taxonomy_version', 'needs_review', 'review_reason'],
      backup_table: 'let_secondary_major_taxonomy_2026_backup',
      manual_review_table: 'let_secondary_major_taxonomy_2026_manual_review',
    },
    before: {
      total_specialization_questions: classified.length,
      published_specialization_questions: classified.filter((row) => row.status === 'published').length,
      current_major_counts: counts.byCurrentMajor,
      status_counts: counts.byStatus,
      source_counts: counts.bySource,
      missing_text: classified.filter((row) => !String(row.stem ?? '').trim()).length,
      missing_answer: classified.filter((row) => !String(row.correct_choice_id ?? '').trim()).length,
      with_images: classified.filter((row) => row.image_url).length,
      requiring_manual_review: classified.filter((row) => row.needsReview).length,
    },
    dry_run_after: {
      final_major_counts: counts.byTargetMajor,
      final_sub_tag_counts: counts.bySubTag,
      science_to_biological_science: classified.filter((row) => row.current_topic_slug === 'science' && row.targetSlug === 'biological-science').length,
      science_to_physical_science: classified.filter((row) => row.current_topic_slug === 'science' && row.targetSlug === 'physical-science').length,
      science_manual_review: classified.filter((row) => row.current_topic_slug === 'science' && row.needsReview).length,
      merged_into_tle: classified.filter((row) => row.targetSlug === 'tle' && row.current_topic_slug !== 'tle').length,
      renamed_to_mapeh: classified.filter((row) => row.current_topic_slug === 'mapeh' && row.targetSlug === 'mapeh').length,
      total_specialization_questions_after: classified.length,
      published_specialization_questions_after: classified.filter((row) => row.status === 'published').length,
    },
    topics_before: majorSubject.topics
      .map((topic) => ({ slug: topic.slug, name: topic.name, sort_order: topic.sort_order, count: counts.byCurrentMajor[topic.slug] ?? 0 }))
      .sort((a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug)),
  };

  writeFileSync(dryRunReportFile, JSON.stringify(report, null, 2));
  const manualRows = classified.filter((row) => row.needsReview);
  writeFileSync(
    manualReviewFile,
    ['question_id,current_major,target_major,reason,stem,source_note']
      .concat(manualRows.map((row) => [row.id, row.current_topic_slug, row.targetSlug, row.reason, row.stem, row.source_note].map(csvValue).join(',')))
      .join('\n') + '\n',
  );
  writeFileSync(migrationFile, buildSql({ rows: classified, topics: majorSubject.topics }));

  if (process.argv.includes('--final-report')) {
    writeFileSync(finalReportFile, JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify({
    dry_run_report: dryRunReportFile,
    manual_review_csv: manualReviewFile,
    migration_sql: migrationFile,
    total: report.before.total_specialization_questions,
    published: report.before.published_specialization_questions,
    final_major_counts: report.dry_run_after.final_major_counts,
    manual_review: report.before.requiring_manual_review,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
