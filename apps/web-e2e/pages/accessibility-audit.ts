import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** Retain rule categories/counts, never Axe DOM snippets, in quality evidence. */
export async function auditAccessibility(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return result.violations.map((rule) => ({
    id: rule.id,
    count: rule.nodes.length,
  }));
}
