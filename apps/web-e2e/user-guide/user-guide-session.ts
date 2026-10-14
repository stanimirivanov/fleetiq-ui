import { rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  Browser,
  BrowserContext,
  Locator,
  Page,
  Video,
} from '@playwright/test';
import { requireNoPageErrors } from '../../../tools/quality/policy.mjs';
import {
  captureOrigin,
  captureRequest,
} from '../../../tools/user-guide/capture-policy.mjs';
import {
  discardChapter,
  ownedPath,
  resetChapter,
} from '../../../tools/user-guide/owned-output.mjs';
import { browserScenarioMode } from './guide-mode';
import type { GuideNarrator, GuideStepDefinition } from './guide-narrator';

const guideDataModes = [
  'production-shell',
  'connected-contract',
  'development-sample',
] as const;
export type GuideDataMode = (typeof guideDataModes)[number];

interface GuideDefinition {
  readonly dataMode: GuideDataMode;
  readonly order: number;
  readonly slug: string;
  readonly summary: string;
  readonly title: string;
}

export interface StartGuideOptions extends GuideDefinition {
  readonly baseURL: string;
}

interface RecordedStep extends GuideStepDefinition {
  readonly image: string;
}

const guideOutputRoot = fileURLToPath(
  new URL('../../../dist/user-guide/', import.meta.url),
);
const guideViewport = { width: 1440, height: 900 } as const;
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Owns one browser journey and its optional recording. Test-only mode uses the
 * same page objects and assertions without writing guide output or adding delays.
 */
export class UserGuideSession implements GuideNarrator {
  readonly page: Page;

  private readonly context: BrowserContext;
  private readonly definition: GuideDefinition;
  private readonly recordsGuide: boolean;
  private readonly origin: string | undefined;
  private readonly video: Video | null;
  private readonly steps: RecordedStep[] = [];
  private closed = false;
  private pageErrors = 0;

  private constructor(
    context: BrowserContext,
    page: Page,
    definition: GuideDefinition,
    recordsGuide: boolean,
    origin: string | undefined,
  ) {
    this.context = context;
    this.page = page;
    this.definition = definition;
    this.recordsGuide = recordsGuide;
    this.origin = origin;
    this.video = page.video();
    // Guide-owned contexts are distinct from the ordinary test fixture's page.
    // Observe categories only; exception messages and payloads are never retained.
    const observe = (owned: Page) => {
      owned.on('pageerror', () => {
        this.pageErrors += 1;
      });
    };
    observe(page);
    context.on('page', observe);
  }

  static async start(
    browser: Browser,
    options: StartGuideOptions,
  ): Promise<UserGuideSession> {
    if (!guideDataModes.includes(options.dataMode)) {
      throw new Error('Unsupported guide data mode.');
    }
    // Validate before joining or deleting any filesystem path supplied by a test.
    if (!safeSlug.test(options.slug)) {
      throw new Error(
        'Guide slug must use lowercase words separated by hyphens.',
      );
    }
    if (!Number.isSafeInteger(options.order) || options.order < 0) {
      throw new Error('Guide order must be a non-negative integer.');
    }
    if (!options.title.trim() || !options.summary.trim()) {
      throw new Error('Guide title and summary must be non-empty.');
    }

    const recordsGuide = browserScenarioMode() === 'user-guide';
    const directory = path.join(guideOutputRoot, options.slug);
    if (recordsGuide) {
      captureOrigin(options.baseURL);
      resetChapter(guideOutputRoot, options.slug);
    }

    const context = await browser.newContext({
      baseURL: options.baseURL,
      colorScheme: 'light',
      locale: 'en-US',
      reducedMotion: 'reduce',
      timezoneId: 'UTC',
      viewport: guideViewport,
      serviceWorkers: 'block',
      ...(recordsGuide
        ? {
            recordVideo: {
              dir: path.join(directory, 'assets'),
              size: guideViewport,
            },
          }
        : {}),
    });
    if (recordsGuide) {
      const origin = captureOrigin(options.baseURL);
      // Page-level contract fixtures may override this context-level API denial.
      await context.route('**/*', async (route) => {
        const decision = captureRequest(route.request().url(), origin);
        if (decision === 'blocked') return route.abort('blockedbyclient');
        if (decision === 'mock-api')
          return route.fulfill({
            status: 404,
            contentType: 'application/problem+json',
            body: JSON.stringify({
              type: 'about:blank',
              title: 'Synthetic guide: API unavailable',
              status: 404,
            }),
          });
        return route.continue();
      });
      // No live stream, provider, service-worker, or persisted browser session is recorded.
      await context.routeWebSocket('**/*', (route) => route.close());
    }
    const page = await context.newPage();
    return new UserGuideSession(
      context,
      page,
      {
        dataMode: options.dataMode,
        order: options.order,
        slug: options.slug,
        summary: options.summary,
        title: options.title,
      },
      recordsGuide,
      recordsGuide ? captureOrigin(options.baseURL) : undefined,
    );
  }

  async action(
    target: Locator,
    step: GuideStepDefinition,
    perform: () => Promise<void>,
  ): Promise<void> {
    if (!this.recordsGuide) {
      await perform();
      return;
    }

    await this.showAnnotation(target, step.body);
    // This dwell is narration time in the recording, never test synchronization.
    await this.page.waitForTimeout(700);
    await this.captureStep(step);
    await perform();
    await this.page.mouse.move(
      guideViewport.width / 2,
      guideViewport.height / 2,
    );
    await this.page.waitForTimeout(1_200);
    await this.clearAnnotation();
  }

  async result(target: Locator, step: GuideStepDefinition): Promise<void> {
    if (!this.recordsGuide) {
      return;
    }

    await this.showAnnotation(target, step.body);
    await this.captureStep(step);
    await this.page.waitForTimeout(1_500);
    await this.clearAnnotation();
  }

  async finish(): Promise<void> {
    await this.closeContext();
    requireNoPageErrors(this.pageErrors);
    if (!this.recordsGuide) {
      return;
    }
    if (this.steps.length === 0 || this.video === null) {
      throw new Error(
        'A recorded guide needs at least one step and a Playwright video.',
      );
    }

    const videoName = `${this.definition.slug}.webm`;
    const recordedVideo = await this.video.path();
    ownedPath(guideOutputRoot, path.relative(guideOutputRoot, recordedVideo));
    await rename(
      recordedVideo,
      ownedPath(
        guideOutputRoot,
        `${this.definition.slug}/assets/${videoName}`,
        { missing: true },
      ),
    );
    await writeFile(
      ownedPath(guideOutputRoot, `${this.definition.slug}/guide.json`, {
        missing: true,
      }),
      `${JSON.stringify(
        {
          schemaVersion: 2,
          ...this.definition,
          steps: this.steps,
          video: `assets/${videoName}`,
        },
        undefined,
        2,
      )}\n`,
      'utf8',
    );
  }

  async abort(): Promise<void> {
    await this.closeContext();
    if (this.recordsGuide) {
      discardChapter(guideOutputRoot, this.definition.slug);
    }
  }

  private async captureStep(step: GuideStepDefinition): Promise<void> {
    if (
      this.origin &&
      captureRequest(this.page.url(), this.origin) === 'blocked'
    )
      throw new Error('Guide capture cannot record an unqualified location.');
    const image = `assets/step-${String(this.steps.length + 1).padStart(2, '0')}.png`;
    await this.page.screenshot({
      animations: 'disabled',
      path: ownedPath(guideOutputRoot, `${this.definition.slug}/${image}`, {
        missing: true,
      }),
    });
    this.steps.push({ ...step, image });
  }

  private async showAnnotation(target: Locator, body: string): Promise<void> {
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (box === null) {
      throw new Error('Cannot annotate a guide target that is not visible.');
    }
    await this.clearAnnotation();
    await this.page.evaluate(
      ({ targetBox, text }) => {
        const layer = document.createElement('div');
        layer.dataset.fleetiqGuideAnnotation = 'true';
        layer.style.cssText =
          'position:fixed;inset:0;pointer-events:none;z-index:2147483647';

        const highlight = document.createElement('div');
        highlight.style.cssText =
          'position:fixed;border:3px solid #d4a72c;border-radius:8px;box-shadow:0 0 0 4px rgba(212,167,44,.24)';
        highlight.style.left = `${Math.max(4, targetBox.x - 4)}px`;
        highlight.style.top = `${Math.max(4, targetBox.y - 4)}px`;
        highlight.style.width = `${targetBox.width + 8}px`;
        highlight.style.height = `${targetBox.height + 8}px`;

        const note = document.createElement('div');
        note.setAttribute('role', 'note');
        note.textContent = text;
        note.style.cssText =
          'position:fixed;max-width:360px;padding:14px 16px;background:#241a2e;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.32);font:600 16px/1.45 system-ui,sans-serif';
        // Measure the actual wrapped caption so bottom-edge and narrow captures fit.
        note.style.boxSizing = 'border-box';
        note.style.maxWidth = `${Math.min(360, window.innerWidth - 24)}px`;
        note.style.left = '12px';
        note.style.top = '12px';
        layer.append(highlight, note);
        document.body.append(layer);
        const caption = note.getBoundingClientRect();
        note.style.left = `${Math.max(12, Math.min(targetBox.x, window.innerWidth - caption.width - 12))}px`;
        // Keep burned-in narration clear of native video playback controls.
        const bottomLimit = window.innerHeight - caption.height - 96;
        const below = targetBox.y + targetBox.height + 16;
        const above = targetBox.y - caption.height - 16;
        const preferred = below > bottomLimit && above >= 12 ? above : below;
        note.style.top = `${Math.max(12, Math.min(preferred, bottomLimit))}px`;
      },
      { targetBox: box, text: body },
    );
  }

  private async clearAnnotation(): Promise<void> {
    if (this.page.isClosed()) {
      return;
    }
    await this.page
      .locator('[data-fleetiq-guide-annotation="true"]')
      .evaluateAll((annotations) => {
        for (const annotation of annotations) annotation.remove();
      });
  }

  private async closeContext(): Promise<void> {
    if (this.closed) {
      return;
    }
    await this.clearAnnotation();
    await this.context.close();
    this.closed = true;
  }
}
