import { expect, test } from '../fixtures/browser-quality-test';
import { RegistryReviewPage } from '../pages/registry-review.page';
import { ShellPage } from '../pages/shell.page';

test('sample registry connects asset selection, directed structure, mappings, and browser history', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1680, height: 940 });
  const registry = new RegistryReviewPage(page);
  await registry.openSample();

  await expect(registry.heading).toBeVisible();
  for (const panel of [
    registry.catalogue,
    registry.structure,
    registry.mapping,
    registry.provenance,
    registry.unresolved,
  ]) {
    await expect(panel).toBeVisible();
  }
  await expect(page.getByRole('banner')).toContainText('Sample data');
  await expect(registry.effectiveAt).toHaveValue(/^2026-10-06T10:00(?::00)?$/u);
  await expect(registry.knownAt).toHaveValue(/^2026-10-06T10:00(?::00)?$/u);
  await registry.applyTimes.click();
  await expect(page).toHaveURL(/effective_at_ms=1791280800000/u);
  await expect(page).toHaveURL(/known_at_ms=1791280800000/u);

  await registry.selectAsset('Electric locomotive 417');
  await expect(page).toHaveURL(/asset=asset-004/u);
  await expect(registry.structure).toContainText('Traction motor A');
  await expect(registry.structure).toContainText('Traction motor B');
  const directedEdge = registry.structure
    .getByRole('listitem')
    .filter({ hasText: 'sample-relationship-traction-417' });
  await expect(directedEdge).toContainText(
    'Electric locomotive 417 → Traction system',
  );
  await expect(directedEdge).toContainText('physical.contains v1');
  await registry.selectNode('Traction motor A');
  await expect(page).toHaveURL(/node=sample-motor-417/u);
  await expect(registry.mapping).toContainText('traction.motor.temperature');
  const motorBinding = registry.mapping
    .getByRole('row')
    .filter({ hasText: 'sample-binding-motor-temperature' });
  await expect(motorBinding).toContainText('Traction motor A');
  await expect(motorBinding).toContainText('revision 2');
  await registry.selectSource('traction.motor.temperature');
  await expect(page).toHaveURL(/source=sample-gateway-417/u);
  await expect(registry.provenance).toContainText(
    'sample-binding-motor-temperature',
  );
  await expect(registry.unresolved).toContainText('can.unknown.027');
  await expect(registry.unresolved).toContainText('can.aux.current');
  await expect(registry.unresolved).toContainText(/unassigned/i);
  await expect(registry.unresolved).toContainText(/ambiguous/i);
  await registry.unresolved
    .getByRole('button', { name: /can.aux.current.*Ambiguous/u })
    .click();
  await expect(registry.provenance).toContainText(
    'sample-binding-aux-traction',
  );
  await expect(registry.provenance).toContainText('sample-binding-aux-energy');
  await expect(registry.provenance).toContainText('does not choose a target');

  await registry.selectAsset('Refrigerated trailer 11');
  await expect(page).toHaveURL(/asset=asset-008/u);
  await expect(registry.structure).toContainText('Refrigeration unit');
  await expect(registry.mapping).toContainText(/freezer/i);
  await registry.selectSource('freezer.air.temperature');
  await expect(registry.provenance).toContainText(
    'Not observed at this review time',
  );
  await expect(registry.provenance).toContainText(
    'sample-binding-freezer-air revision 1',
  );

  await page.goBack();
  await expect(page).toHaveURL(/asset=asset-008/u);
  await page.goBack();
  await expect(page).toHaveURL(/asset=asset-004/u);
  await expect(registry.structure).toContainText('Traction motor A');
  await expect(motorBinding).toContainText('Traction motor A');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('sample registry shows known-time corrections and half-open effective boundaries', async ({
  page,
}) => {
  const registry = new RegistryReviewPage(page);
  await registry.openSample('&asset=asset-004');
  const motorBinding = registry.mapping
    .getByRole('row')
    .filter({ hasText: 'sample-binding-motor-temperature' });
  const unknownSource = registry.mapping
    .getByRole('row')
    .filter({ hasText: 'can.unknown.027' });

  await expect(motorBinding).toContainText('Traction motor A');
  await registry.effectiveAt.fill('2026-10-06T10:00');
  await registry.knownAt.fill('2026-09-04T08:30');
  await expect(page).toHaveURL(/known_at_ms=1791280800000/u);
  await registry.applyTimes.click();
  await expect(page).toHaveURL(/known_at_ms=1788510600000/u);
  await expect(page).toHaveURL(/effective_at_ms=1791280800000/u);
  await expect(motorBinding).toContainText('Traction motor B');
  await expect(motorBinding).toContainText('revision 1');

  await page.goBack();
  await expect(registry.knownAt).toHaveValue(/^2026-10-06T10:00(?::00)?$/u);
  await expect(motorBinding).toContainText('Traction motor A');
  await page.goForward();
  await expect(registry.knownAt).toHaveValue(/^2026-09-04T08:30(?::00)?$/u);
  await expect(motorBinding).toContainText('Traction motor B');

  await registry.applyReviewTimes('2026-10-06T09:55', '2026-10-06T10:00');
  await expect(unknownSource).toContainText(/mapped/i);
  await registry.applyReviewTimes('2026-10-06T09:56', '2026-10-06T10:00');
  await expect(page).toHaveURL(/effective_at_ms=1791280560000/u);
  await expect(unknownSource).toContainText(/unassigned/i);
  await expect(unknownSource).not.toContainText(
    'sample-binding-unknown-retired',
  );
});

test('sample registry keeps search, time recovery, and dark narrow layout usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const shell = new ShellPage(page);
  const registry = new RegistryReviewPage(page);
  await registry.openSample();

  await registry.searchAssets.fill('Refrigerated trailer');
  await expect(page).toHaveURL(/q=Refrigerated/u);
  await expect(registry.asset('Refrigerated trailer 11')).toBeVisible();
  await expect(registry.asset('Electric locomotive 417')).toHaveCount(0);
  await registry.searchAssets.fill('');
  await registry.typeFilter.selectOption('road.refrigerated-trailer');
  await expect(page).toHaveURL(/type=road.refrigerated-trailer/u);
  await expect(registry.asset('Electric locomotive 417')).toHaveCount(0);
  await registry.selectAsset('Refrigerated trailer 11');
  await expect(registry.structure).toBeVisible();
  await expect(registry.mapping).toBeVisible();
  const freezerCard = registry.mapping
    .getByRole('list', { name: 'Signal mapping cards' })
    .getByRole('article', { name: 'Mapping for freezer.air.temperature' });
  await expect(freezerCard).toBeVisible();
  await expect(freezerCard).toContainText('Refrigeration unit');
  await expect(freezerCard).toContainText(
    'sample-binding-freezer-air revision 1',
  );
  expect(
    await freezerCard.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);

  await shell.themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await registry.typeFilter.selectOption('');
  await registry.selectAsset('Primary machine');
  await expect(page).toHaveURL(/asset=asset-001/u);
  await expect(registry.structure).toContainText(
    'No structure is modeled for this sample identity.',
  );
  await expect(registry.mapping).toContainText(
    'No sample structure or signal mapping is modeled',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await registry.openSample(
    '&asset=asset-004&effective_at_ms=1791280800000&known_at_ms=invalid',
  );
  await expect(registry.resetTimes).toBeVisible();
  await registry.resetTimes.click();
  await expect(registry.effectiveAt).toHaveValue(/^2026-10-06T10:00(?::00)?$/u);
  await expect(registry.knownAt).toHaveValue(/^2026-10-06T10:00(?::00)?$/u);
});
