import { installOperationsApi } from '../fixtures/operations-api';
import { expect, test } from '../fixtures/production-test';
import { auditAccessibility } from '../pages/accessibility-audit';
import { ShellPage } from '../pages/shell.page';

for (const width of [1365, 390]) {
  test(`operations keyboard review and accessibility at ${width}px`, async ({
    page,
  }) => {
    const api = await installOperationsApi(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/operations?tenant=tenant-a');
    if (width === 390) await new ShellPage(page).cycleTheme();
    const pause = page.getByRole('button', { name: 'Review pause' });
    await pause.focus();
    await page.keyboard.press('Enter');
    const form = page.getByRole('form', { name: 'Review recovery command' });
    await expect(form).toBeFocused();
    expect(await auditAccessibility(page)).toEqual([]);
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Confirm pause' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(
      page.getByText('Scheduling paused · generation 1'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Review resume' }).click();
    await page.getByRole('button', { name: 'Confirm resume' }).click();
    await expect(
      page.getByText('Scheduling enabled · generation 2'),
    ).toBeVisible();
    expect(api.requests.map((request) => request.body)).toEqual([
      { operation: 'pause', target: {}, expected_generation: '0' },
      { operation: 'resume', target: {}, expected_generation: '1' },
    ]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
