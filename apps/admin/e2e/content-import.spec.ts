import { expect, test } from '@playwright/test';

const badPreview = {
  rows: [{ rowNumber: 2 }],
  valid: [],
  errors: [{ rowNumber: 2, field: 'explanation_en', message: 'Content QA failed: explanation_en must be at least 24 characters' }],
  errorCsv: 'row_number,field,message\n2,"explanation_en","Content QA failed: explanation_en must be at least 24 characters"',
  errorSummary: [{ field: 'explanation_en', count: 1 }],
  preview: [],
};

const cleanPreview = {
  rows: [{ rowNumber: 2 }],
  valid: [
    {
      exam_type_slug: 'cse-professional',
      subject_slug: 'verbal',
      topic_slug: 'grammar',
      stem: 'Which sentence uses the correct verb?',
      correct_choice: 'a',
      difficultyNum: 2,
    },
  ],
  errors: [],
  errorCsv: 'row_number,field,message',
  errorSummary: [],
  preview: [
    {
      exam_type_slug: 'cse-professional',
      subject_slug: 'verbal',
      topic_slug: 'grammar',
      stem: 'Which sentence uses the correct verb?',
      correct_choice: 'a',
      difficultyNum: 2,
    },
  ],
};

function isImportAction(postData: string): boolean {
  return postData.includes('name="action"') && postData.includes('import');
}

test('admin import page gates import behind clean preview and exposes error CSV', async ({ page }) => {
  let previewCount = 0;

  await page.route('**/api/content/import', async (route) => {
    const postData = route.request().postData() ?? '';

    if (isImportAction(postData)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ imported: 1, status: 'draft', batchId: 'batch-e2e' }),
      });
      return;
    }

    previewCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(previewCount === 1 ? badPreview : cleanPreview),
    });
  });

  await page.goto('/content/import');
  await expect(page.getByRole('heading', { name: 'CSV question import' })).toBeVisible();

  const confirmImport = page.getByRole('button', { name: 'Confirm import' });
  await expect(confirmImport).toBeDisabled();

  await page.setInputFiles('input[type="file"]', {
    name: 'bad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('exam_type_slug,subject_slug,topic_slug\ncse-professional,verbal,grammar\n'),
  });

  await page.getByRole('button', { name: 'Preview & validate' }).click();
  await expect(page.getByText('Blocked', { exact: true })).toBeVisible();
  await expect(page.getByText('explanation_en: 1')).toBeVisible();
  await expect(page.getByText('Import is blocked until these rows are corrected')).toBeVisible();
  await expect(confirmImport).toBeDisabled();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .errors.csv' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('bad.errors.csv');

  await page.getByRole('button', { name: 'Preview & validate' }).click();
  await expect(page.getByText('Ready as draft')).toBeVisible();
  await expect(confirmImport).toBeEnabled();

  await confirmImport.click();
  await expect(page.getByText('Imported 1 question(s) as draft. Batch: batch-e2e')).toBeVisible();
});
