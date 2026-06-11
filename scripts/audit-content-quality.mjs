#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  auditFlashcard,
  auditQuestion,
  auditReviewMaterial,
  hasIssueAtOrAbove,
  normalizeText,
  summarizeIssues,
} from './lib/content-quality-rules.mjs';

const DEFAULT_ENV_FILE = '.env.supabase';
const DEFAULT_OUT_DIR = 'audit';
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

function parseArgs(argv) {
  const args = {
    envFile: DEFAULT_ENV_FILE,
    outDir: DEFAULT_OUT_DIR,
    statuses: ['draft', 'in_review', 'published'],
    exam: null,
    failOn: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--env-file' && next) {
      args.envFile = next;
      i++;
    } else if (arg === '--out-dir' && next) {
      args.outDir = next;
      i++;
    } else if (arg === '--exam' && next) {
      args.exam = next;
      i++;
    } else if (arg === '--status' && next) {
      args.statuses = next.split(',').map((value) => value.trim()).filter(Boolean);
      i++;
    } else if (arg === '--fail-on' && next) {
      if (!VALID_SEVERITIES.has(next)) throw new Error(`Invalid --fail-on severity: ${next}`);
      args.failOn = next;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/audit-content-quality.mjs [options]

Options:
  --exam <slug>              Audit one exam slug, e.g. cse-professional
  --status <csv>             Question statuses to audit. Default: draft,in_review,published
  --fail-on <severity>       Exit 1 when issues at or above severity exist: low|medium|high|critical
  --env-file <path>          Supabase env file. Default: .env.supabase
  --out-dir <path>           Report output directory. Default: audit
`);
}

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

function createSupabaseClient(env) {
  const url = process.env.SUPABASE_URL ?? env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.supabase or environment.');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchAll(supabase, table, select, options = {}) {
  const pageSize = 1000;
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (options.statuses?.length && table === 'questions') query = query.in('status', options.statuses);
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function countBy(items, selector) {
  const counts = new Map();
  for (const item of items) {
    const key = selector(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function scopedContentKey(item, text) {
  return `${item.exam_slug ?? 'unknown'}:${item.topic_id}:${normalizeText(text)}`;
}

function scopedCountMap(counts, item, text) {
  const normalized = normalizeText(text);
  return new Map([[normalized, counts.get(scopedContentKey(item, text)) ?? 0]]);
}

function buildCatalog(topics, subjectAreas, examTypes) {
  const subjectById = new Map(subjectAreas.map((subject) => [subject.id, subject]));
  const examById = new Map(examTypes.map((exam) => [exam.id, exam]));
  const topicById = new Map();

  for (const topic of topics) {
    const subject = subjectById.get(topic.subject_area_id);
    const exam = subject ? examById.get(subject.exam_type_id) : null;
    topicById.set(topic.id, {
      topic_slug: topic.slug,
      topic_name: topic.name,
      subject_slug: subject?.slug ?? null,
      subject_name: subject?.name ?? null,
      exam_slug: exam?.slug ?? null,
      exam_name: exam?.name ?? null,
    });
  }

  return topicById;
}

function enrichItem(item, topicById) {
  return { ...item, ...(topicById.get(item.topic_id) ?? {}) };
}

function normalizeResult(kind, item, issues) {
  return {
    kind,
    id: item.id,
    exam: item.exam_slug ?? null,
    subject: item.subject_name ?? null,
    topic: item.topic_name ?? null,
    title: item.stem ?? item.front ?? item.title ?? '',
    status: item.status ?? null,
    materialType: item.material_type ?? null,
    issues,
  };
}

function applyExamFilter(items, exam) {
  if (!exam) return items;
  return items.filter((item) => item.exam_slug === exam);
}

function topIssues(results) {
  return results
    .filter((result) => result.issues.length > 0)
    .slice(0, 75)
    .map((result) => ({
      kind: result.kind,
      id: result.id,
      exam: result.exam,
      topic: result.topic,
      title: String(result.title).replace(/\s+/g, ' ').slice(0, 140),
      issues: result.issues,
    }));
}

function markdownReport(report) {
  const lines = [
    '# ReviewNatin Content Quality Audit',
    '',
    `Generated: ${report.generatedAt}`,
    `Scope: ${report.scope.exam ? `exam=${report.scope.exam}` : 'all exams'}; question_status=${report.scope.statuses.join(',')}`,
    '',
    '## Summary',
    '',
    `- Total audited items: ${report.summary.totalItems}`,
    `- Items with issues: ${report.summary.itemsWithIssues}`,
    `- Critical: ${report.summary.critical}`,
    `- High: ${report.summary.high}`,
    `- Medium: ${report.summary.medium}`,
    `- Low: ${report.summary.low}`,
    '',
    '## By Content Type',
    '',
  ];

  for (const [kind, summary] of Object.entries(report.byKind)) {
    lines.push(`- ${kind}: ${summary.itemsWithIssues}/${summary.totalItems} with issues; critical=${summary.critical}, high=${summary.high}, medium=${summary.medium}, low=${summary.low}`);
  }

  lines.push('', '## Top Issue Codes', '');
  for (const [code, count] of Object.entries(report.summary.byCode).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    lines.push(`- ${code}: ${count}`);
  }

  lines.push('', '## Review Queue', '');
  if (report.reviewQueue.length === 0) {
    lines.push('No issues found for this scope.');
  } else {
    for (const item of report.reviewQueue) {
      lines.push(`- [${item.kind}] ${item.title || item.id}`);
      lines.push(`  id=${item.id}; exam=${item.exam ?? 'unknown'}; topic=${item.topic ?? 'unknown'}`);
      lines.push(`  issues=${item.issues.map((issue) => `${issue.severity}:${issue.code}`).join(', ')}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = parseEnvFile(resolve(process.cwd(), args.envFile));
  const supabase = createSupabaseClient(env);

  const [topics, subjectAreas, examTypes, rawQuestions, rawFlashcards, rawMaterials] = await Promise.all([
    fetchAll(supabase, 'topics', 'id, slug, name, subject_area_id'),
    fetchAll(supabase, 'subject_areas', 'id, slug, name, exam_type_id'),
    fetchAll(supabase, 'exam_types', 'id, slug, name'),
    fetchAll(supabase, 'questions', 'id, topic_id, stem, choices, correct_choice_id, explanation_en, explanation_fil, difficulty, status, source', { statuses: args.statuses }),
    fetchAll(supabase, 'flashcards', 'id, topic_id, front, back, is_premium'),
    fetchAll(supabase, 'review_materials', 'id, topic_id, title, body, material_type, is_premium'),
  ]);

  const topicById = buildCatalog(topics, subjectAreas, examTypes);
  const questions = applyExamFilter(rawQuestions.map((item) => enrichItem(item, topicById)), args.exam);
  const flashcards = applyExamFilter(rawFlashcards.map((item) => enrichItem(item, topicById)), args.exam);
  const materials = applyExamFilter(rawMaterials.map((item) => enrichItem(item, topicById)), args.exam);

  const stemCounts = countBy(questions, (question) => scopedContentKey(question, question.stem));
  const frontCounts = countBy(flashcards, (card) => scopedContentKey(card, card.front));
  const titleCounts = countBy(materials, (material) => scopedContentKey(material, material.title));

  const questionResults = questions.map((question) => normalizeResult('question', question, auditQuestion(question, {
    stemCounts: scopedCountMap(stemCounts, question, question.stem),
  })));
  const flashcardResults = flashcards.map((card) => normalizeResult('flashcard', card, auditFlashcard(card, {
    frontCounts: scopedCountMap(frontCounts, card, card.front),
  })));
  const materialResults = materials.map((material) => normalizeResult('review_material', material, auditReviewMaterial(material, {
    titleCounts: scopedCountMap(titleCounts, material, material.title),
  })));
  const results = [...questionResults, ...flashcardResults, ...materialResults];

  const summary = summarizeIssues(results);
  const report = {
    generatedAt: new Date().toISOString(),
    scope: {
      exam: args.exam,
      statuses: args.statuses,
    },
    summary,
    byKind: {
      question: summarizeIssues(questionResults),
      flashcard: summarizeIssues(flashcardResults),
      review_material: summarizeIssues(materialResults),
    },
    reviewQueue: topIssues(results),
    results,
  };

  const outDir = resolve(process.cwd(), args.outDir);
  mkdirSync(outDir, { recursive: true });
  const jsonPath = resolve(outDir, 'content-quality-report.json');
  const mdPath = resolve(outDir, 'content-quality-report.md');
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(mdPath, markdownReport(report));

  console.log(`Audited ${summary.totalItems} content items; ${summary.itemsWithIssues} need review.`);
  console.log(`Critical=${summary.critical} High=${summary.high} Medium=${summary.medium} Low=${summary.low}`);
  console.log(`Reports: ${jsonPath} and ${mdPath}`);

  if (args.failOn && hasIssueAtOrAbove(summary, args.failOn)) {
    console.error(`Content audit failed because issues at or above "${args.failOn}" were found.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
