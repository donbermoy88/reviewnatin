import {
  buildImportErrorCsv,
  parseQuestionImportCsv,
  summarizeImportErrors,
  validateQuestionImportRows,
  type QuestionImportCatalog,
  type QuestionImportError,
  type ValidatedQuestionImportRow,
} from '@reviewnatin/shared';
import { getAdminSupabase } from '@/lib/supabase/admin';

export type ImportPreviewResult = {
  rows: ReturnType<typeof parseQuestionImportCsv>;
  valid: ValidatedQuestionImportRow[];
  errors: QuestionImportError[];
  errorCsv: string;
  errorSummary: { field: string; count: number }[];
  preview: ValidatedQuestionImportRow[];
};

export async function loadQuestionImportCatalog(): Promise<QuestionImportCatalog> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from('exam_types')
    .select(`
      slug,
      is_active,
      subject_areas (
        slug,
        topics ( id, slug )
      )
    `)
    .eq('is_active', true);

  if (error) throw error;

  const catalog: QuestionImportCatalog = new Map();

  for (const exam of data ?? []) {
    const subjectMap = new Map<string, Map<string, { topicId: string; examActive: boolean }>>();
    for (const subject of exam.subject_areas ?? []) {
      const topicMap = new Map<string, { topicId: string; examActive: boolean }>();
      for (const topic of subject.topics ?? []) {
        topicMap.set(topic.slug, { topicId: topic.id, examActive: exam.is_active });
      }
      subjectMap.set(subject.slug, topicMap);
    }
    catalog.set(exam.slug, subjectMap);
  }

  return catalog;
}

async function loadExistingStemKeys(topicIds: string[]): Promise<Map<string, Set<string>>> {
  const sb = getAdminSupabase();
  const map = new Map<string, Set<string>>();

  if (!topicIds.length) return map;

  const { data, error } = await sb.from('questions').select('topic_id, stem').in('topic_id', topicIds);
  if (error) throw error;

  for (const row of data ?? []) {
    const key = row.stem.toLowerCase().replace(/\s+/g, ' ').trim();
    const set = map.get(row.topic_id) ?? new Set<string>();
    set.add(key);
    map.set(row.topic_id, set);
  }

  return map;
}

export async function previewQuestionImport(csvText: string): Promise<ImportPreviewResult> {
  const rows = parseQuestionImportCsv(csvText);
  const catalog = await loadQuestionImportCatalog();
  const topicIds = [...catalog.values()]
    .flatMap((subjects) => [...subjects.values()].flatMap((topics) => [...topics.values()].map((t) => t.topicId)));
  const existingStemKeys = await loadExistingStemKeys(topicIds);
  const { valid, errors } = validateQuestionImportRows(rows, catalog, existingStemKeys);

  return {
    rows,
    valid,
    errors,
    errorCsv: buildImportErrorCsv(errors),
    errorSummary: summarizeImportErrors(errors),
    preview: valid.slice(0, 10),
  };
}

export async function importQuestionsFromCsv(
  csvText: string,
  options: { publish?: boolean } = {}
): Promise<{ imported: number; batchId: string; status: 'draft' | 'published' }> {
  const { valid, errors } = await previewQuestionImport(csvText);
  if (errors.length) {
    throw new Error(`Validation failed with ${errors.length} error(s).`);
  }
  if (!valid.length) {
    throw new Error('No valid rows to import.');
  }

  const sb = getAdminSupabase();
  const publish = options.publish ?? false;
  const batchId = crypto.randomUUID();

  const inserts = valid.map((row) => ({
    topic_id: row.topicId,
    stem: row.stem,
    choices: [
      { id: 'a', text: row.choice_a },
      { id: 'b', text: row.choice_b },
      { id: 'c', text: row.choice_c },
      { id: 'd', text: row.choice_d },
    ],
    correct_choice_id: row.correct_choice.toLowerCase(),
    explanation_en: row.explanation_en,
    explanation_fil: row.explanation_fil || null,
    difficulty: row.difficultyNum,
    status: publish ? 'published' : 'draft',
    source: 'csv_import',
    source_note: row.source_note || 'CSV import — ReviewNatin Admin',
    is_verified: publish,
    tags: row.tagsList,
  }));

  const { data: inserted, error: insertErr } = await sb.from('questions').insert(inserts).select('id');
  if (insertErr) throw insertErr;

  const { data: adminUser } = await sb.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
  if (adminUser?.id) {
    await sb.from('admin_logs').insert({
      admin_id: adminUser.id,
      action: 'csv_import',
      entity_type: 'questions',
      metadata: {
        batch_id: batchId,
        row_count: inserted?.length ?? 0,
        status: publish ? 'published' : 'draft',
        source: 'admin_ui',
      },
    });
  }

  return {
    imported: inserted?.length ?? 0,
    batchId,
    status: publish ? 'published' : 'draft',
  };
}
