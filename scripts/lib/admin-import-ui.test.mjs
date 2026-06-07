import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const PAGE_PATH = new URL('../../apps/admin/app/content/import/page.tsx', import.meta.url);
const IMPORT_LIB_PATH = new URL('../../apps/admin/lib/content-import.ts', import.meta.url);

describe('admin content import UI regression guard', () => {
  it('keeps import blocked until preview validation passes', () => {
    const source = readFileSync(PAGE_PATH, 'utf8');

    assert.match(source, /const canImport = Boolean\(/);
    assert.match(source, /preview\.errors\.length === 0/);
    assert.match(source, /preview\.valid\.length > 0/);
    assert.match(source, /disabled=\{!canImport\}/);
    assert.match(source, /Preview validation must pass before importing/);
  });

  it('keeps author-facing error summary and downloadable error CSV', () => {
    const pageSource = readFileSync(PAGE_PATH, 'utf8');
    const importSource = readFileSync(IMPORT_LIB_PATH, 'utf8');

    assert.match(importSource, /buildImportErrorCsv/);
    assert.match(importSource, /summarizeImportErrors/);
    assert.match(pageSource, /Download \.errors\.csv/);
    assert.match(pageSource, /preview\.errorSummary\.map/);
    assert.match(pageSource, /preview\.errorCsv/);
  });
});
