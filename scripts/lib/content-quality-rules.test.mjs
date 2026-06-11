import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  auditFlashcard,
  auditQuestion,
  auditReviewMaterial,
  hasIssueAtOrAbove,
  normalizeText,
  summarizeIssues,
} from './content-quality-rules.mjs';

describe('content quality rules', () => {
  it('normalizes text for duplicate detection', () => {
    assert.equal(normalizeText('  Hello\n\nWorld  '), 'hello world');
  });

  it('flags invalid question choices and answer keys', () => {
    const issues = auditQuestion({
      stem: 'Pick the correct answer.',
      choices: [
        { id: 'a', text: 'Same' },
        { id: 'b', text: 'Same' },
      ],
      correct_choice_id: 'c',
      explanation_en: '',
      topic_slug: 'grammar',
      topic_name: 'Grammar and Correct Usage',
    });

    assert.ok(issues.some((issue) => issue.code === 'duplicate_choices'));
    assert.ok(issues.some((issue) => issue.code === 'invalid_correct_choice'));
    assert.ok(issues.some((issue) => issue.code === 'missing_explanation'));
  });

  it('flags thin flashcards', () => {
    const issues = auditFlashcard({
      front: 'Term',
      back: 'Term',
      topic_slug: 'vocabulary',
      topic_name: 'Vocabulary',
    });

    assert.ok(issues.some((issue) => issue.code === 'short_front'));
    assert.ok(issues.some((issue) => issue.code === 'thin_back'));
    assert.ok(issues.some((issue) => issue.code === 'front_matches_back'));
  });

  it('flags thin review materials and unknown types', () => {
    const issues = auditReviewMaterial({
      title: 'Tip',
      body: 'Short note.',
      material_type: 'memo',
      topic_slug: 'reading-comprehension',
      topic_name: 'Reading Comprehension',
    });

    assert.ok(issues.some((issue) => issue.code === 'short_title'));
    assert.ok(issues.some((issue) => issue.code === 'thin_body'));
    assert.ok(issues.some((issue) => issue.code === 'unknown_material_type'));
  });

  it('summarizes issue severity and supports fail thresholds', () => {
    const summary = summarizeIssues([
      { issues: [{ code: 'invalid_correct_choice', severity: 'critical', message: 'bad' }] },
      { issues: [{ code: 'thin_explanation', severity: 'medium', message: 'thin' }] },
      { issues: [] },
    ]);

    assert.equal(summary.totalItems, 3);
    assert.equal(summary.itemsWithIssues, 2);
    assert.equal(summary.critical, 1);
    assert.equal(summary.medium, 1);
    assert.equal(hasIssueAtOrAbove(summary, 'high'), true);
    assert.equal(hasIssueAtOrAbove(summary, 'low'), true);
  });
});
