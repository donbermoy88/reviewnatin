import {
  EXAM_CATALOG,
  getExamCatalogItem,
  type ExamCatalogItem,
} from '@reviewnatin/shared';
import { fetchExamTypes } from './catalog';
import { isSupabaseConfigured } from '../supabase';

/** Active exams from Supabase merged with shared display metadata */
export async function fetchExamCatalog(): Promise<ExamCatalogItem[]> {
  if (!isSupabaseConfigured) {
    return [...EXAM_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  try {
    const types = await fetchExamTypes();
    if (!types.length) {
      return [...EXAM_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return types
      .map((row) => {
        const meta = getExamCatalogItem(row.slug);
        if (!meta) return null;
        return { ...meta, name: row.name };
      })
      .filter((row): row is ExamCatalogItem => row !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return [...EXAM_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
