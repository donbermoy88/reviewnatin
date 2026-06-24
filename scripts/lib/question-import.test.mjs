import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildImportErrorCsv,
  parseQuestionImportCsv,
  summarizeImportErrors,
  validateQuestionImportRows,
} from './question-import.mjs';

function catalog() {
  return new Map([
    [
      'cse-professional',
      new Map([
        [
          'verbal',
          new Map([
            ['grammar', { topicId: 'topic-grammar', examActive: true }],
          ]),
        ],
      ]),
    ],
    [
      'let-secondary',
      new Map([
        [
          'major',
          new Map([
            ['science', { topicId: 'topic-science-legacy', examActive: true }],
            ['general-science', { topicId: 'topic-general-science', examActive: true }],
            ['biological-science', { topicId: 'topic-biological-science', examActive: true }],
          ]),
        ],
      ]),
    ],
  ]);
}

function row(overrides = {}) {
  return {
    rowNumber: 2,
    exam_type_slug: 'cse-professional',
    subject_slug: 'verbal',
    topic_slug: 'grammar',
    stem: 'Which sentence uses the correct verb?',
    choice_a: 'She walks to school.',
    choice_b: 'She walk to school.',
    choice_c: 'She walking to school.',
    choice_d: 'She walked tomorrow.',
    correct_choice: 'a',
    difficulty: '2',
    explanation_en: 'The subject is singular, so the verb needs the singular present form.',
    explanation_fil: '',
    source_note: 'unit test',
    tags: 'grammar',
    ...overrides,
  };
}

describe('question import validation', () => {
  it('parses the expected CSV header', () => {
    const csv = [
      'exam_type_slug,subject_slug,topic_slug,stem,choice_a,choice_b,choice_c,choice_d,correct_choice,difficulty,explanation_en,explanation_fil,source_note,tags',
      'cse-professional,verbal,grammar,"Which sentence is correct?",A,B,C,D,a,2,"Because the subject agrees with the verb.",,,grammar',
    ].join('\n');

    const rows = parseQuestionImportCsv(csv);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].stem, 'Which sentence is correct?');
  });

  it('accepts a valid import row', () => {
    const result = validateQuestionImportRows([row()], catalog());
    assert.equal(result.errors.length, 0);
    assert.equal(result.valid.length, 1);
    assert.equal(result.valid[0].topicId, 'topic-grammar');
  });

  it('rejects duplicate choices', () => {
    const result = validateQuestionImportRows([
      row({ choice_b: 'She walks to school.' }),
    ], catalog());

    assert.ok(result.errors.some((error) => error.field === 'choices'));
  });

  it('rejects thin explanations', () => {
    const result = validateQuestionImportRows([
      row({ explanation_en: 'Too short.' }),
    ], catalog());

    assert.ok(result.errors.some((error) => error.field === 'explanation_en'));
  });

  it('rejects malformed quoted or parenthesized stems', () => {
    const result = validateQuestionImportRows([
      row({ stem: 'Which sentence has “unbalanced quote?' }),
      row({ rowNumber: 3, stem: 'Which sentence has (unbalanced parentheses?' }),
    ], catalog());

    assert.ok(result.errors.some((error) => error.message.includes('quotation marks')));
    assert.ok(result.errors.some((error) => error.message.includes('parentheses')));
  });

  it('rejects legacy LET Secondary major topics', () => {
    const result = validateQuestionImportRows([
      row({
        exam_type_slug: 'let-secondary',
        subject_slug: 'major',
        topic_slug: 'science',
      }),
      row({
        rowNumber: 3,
        exam_type_slug: 'let-secondary',
        subject_slug: 'major',
        topic_slug: 'general-science',
      }),
      row({
        rowNumber: 4,
        exam_type_slug: 'let-secondary',
        subject_slug: 'major',
        topic_slug: 'biological-science',
      }),
    ], catalog());

    assert.ok(result.errors.some((error) => error.field === 'topic_slug' && error.message.includes('approved 2026 major slugs')));
    assert.equal(result.valid.length, 2);
    assert.equal(result.valid[0].topicId, 'topic-general-science');
    assert.equal(result.valid[1].topicId, 'topic-biological-science');
  });

  it('builds admin import error reports for author correction', () => {
    const result = validateQuestionImportRows([
      row({ explanation_en: 'Too short.' }),
      row({ rowNumber: 3, stem: 'Which option duplicates a choice?', choice_b: 'She walks to school.' }),
      row({ rowNumber: 4, stem: 'Which sentence has (unbalanced parentheses?' }),
    ], catalog());

    const csv = buildImportErrorCsv(result.errors);
    const summary = summarizeImportErrors(result.errors);

    assert.ok(csv.startsWith('row_number,field,message\n'));
    assert.match(csv, /2,"explanation_en","Content QA failed: explanation_en must be at least 24 characters"/);
    assert.match(csv, /3,"choices","Content QA failed: choices must not contain duplicate text"/);
    assert.deepEqual(summary.map((item) => item.field), ['choices', 'explanation_en', 'stem']);
    assert.ok(summary.every((item) => item.count === 1));
  });
});
