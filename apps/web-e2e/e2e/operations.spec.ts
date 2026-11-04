import { installOperationsApi } from '../fixtures/operations-api';
import { expect, test } from '../fixtures/production-test';

test('shows sampled lag independently of failure and resets recovery on tenant navigation', async ({
  page,
}) => {
  await installOperationsApi(page);
  await page.goto('/operations?tenant=tenant-a');
  await expect(
    page.getByRole('link', { name: 'Operations', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByRole('heading', { name: 'Work operations' }),
  ).toBeVisible();
  await expect(
    page.getByText('Oldest sampled eligible age: 60 s'),
  ).toBeVisible();
  await expect(
    page.getByText('0 failed', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Review retry for frame-1' }),
  ).toBeVisible();
  await page.getByLabel('Permitted tenant').selectOption('tenant-b');
  await expect(page).toHaveURL(/tenant=tenant-b/);
  await expect(
    page.getByText('Recovery requires operations.manage'),
  ).toBeVisible();
  await expect(page.getByText('Oldest sampled eligible age: 60 s')).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: 'Review retry for frame-1' }),
  ).toHaveCount(0);
  await page.goBack();
  await expect(
    page.getByRole('button', { name: 'Review retry for frame-1' }),
  ).toBeVisible();
});

test('reuses the exact command after ambiguity and a denied receipt lookup', async ({
  page,
}) => {
  const api = await installOperationsApi(page);
  api.setMode('lost');
  await page.goto('/operations?tenant=tenant-a');
  await page.getByRole('button', { name: 'Review retry for frame-1' }).click();
  await expect(
    page.getByText('Expected generation 9007199254740993'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Confirm retry' }).click();
  await expect(page.getByRole('alert')).toContainText('Outcome is unconfirmed');
  api.setMode('denied');
  await page.getByRole('button', { name: 'Retry exact command' }).click();
  await expect(page.getByRole('alert')).toContainText('Outcome is unconfirmed');
  api.setMode('ok');
  await page.getByRole('button', { name: 'Retry exact command' }).click();
  await expect(
    page.getByText('Recorded generation 9007199254740994 by operator-a'),
  ).toBeVisible();
  expect(api.requests).toHaveLength(3);
  expect(api.requests[0]).toEqual(api.requests[1]);
  expect(api.requests[0]).toEqual(api.requests[2]);
  expect(api.requests[0]).toMatchObject({
    csrf: '1',
    body: {
      operation: 'retry',
      target: { id: 'frame-1' },
      expected_generation: '9007199254740993',
    },
  });
  expect(api.requests[0]?.authorization).toBeUndefined();

  await expect(
    page.getByText('No eligible retry targets in this observation.'),
  ).toBeVisible();
});

test('a generation conflict refreshes the target before another review', async ({
  page,
}) => {
  const api = await installOperationsApi(page);
  api.setMode('conflict');
  await page.goto('/operations?tenant=tenant-a');
  await page.getByRole('button', { name: 'Review retry for frame-1' }).click();
  await page.getByRole('button', { name: 'Confirm retry' }).click();
  await expect(page.getByRole('alert')).toContainText('Work changed');
  await page.getByRole('button', { name: 'Review retry for frame-1' }).click();
  await expect(
    page.getByText('Expected generation 9007199254740995'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Retry exact command' }),
  ).toHaveCount(0);
});

test('reports a backend denial of a reviewed pause without recording success', async ({
  page,
}) => {
  const api = await installOperationsApi(page);
  api.setMode('denied');
  await page.goto('/operations?tenant=tenant-a');
  await page.getByRole('button', { name: 'Review pause' }).click();
  await page.getByRole('button', { name: 'Confirm pause' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Recovery access was denied',
  );
  expect(api.requests[0]?.body).toEqual({
    operation: 'pause',
    target: {},
    expected_generation: '0',
  });
  await expect(page.getByText(/Recorded generation/)).toHaveCount(0);
});

test('a delayed observation cannot replace the current tenant evidence', async ({
  page,
}) => {
  await installOperationsApi(page);
  const gate = () => {
    let resolve = () => {};
    const promise = new Promise<void>((open) => {
      resolve = open;
    });
    return { resolve, promise };
  };
  const held = gate();
  const release = gate();
  const finished = gate();
  await page.route('**/tenant-a/work-diagnostics', async (route) => {
    held.resolve();
    await release.promise;
    try {
      await route.fallback();
    } finally {
      finished.resolve();
    }
  });
  try {
    await page.goto('/operations?tenant=tenant-a');
    await held.promise;
    await page.getByLabel('Permitted tenant').selectOption('tenant-b');
    await expect(page.getByText('0 sampled', { exact: true })).toHaveCount(4);
  } finally {
    release.resolve();
  }
  await finished.promise;
  await expect(page.getByText('Oldest sampled eligible age: 60 s')).toHaveCount(
    0,
  );
  await expect(page.getByText('0 sampled', { exact: true })).toHaveCount(4);
});
