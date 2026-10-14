import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectMedia } from './media.mjs';
import { inspectTree, ownedPath } from './owned-output.mjs';

const defaultOutputRoot = fileURLToPath(
  new URL('../../dist/user-guide/', import.meta.url),
);
const stylesheet = fileURLToPath(
  new URL('./assets/guide.css', import.meta.url),
);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const assetPattern = /^assets\/[a-z0-9][a-z0-9.-]*\.(?:png|webm)$/;

const modes = {
  'production-shell': {
    label: 'Production shell',
    heading: 'Production console orientation',
    description:
      'Verified shell behavior in a deployment without configured operator sign-in. Connected metadata procedures appear in the separate contract-demonstration section.',
    note: 'This chapter covers the production shell. It does not imply that fleet assets or telemetry are connected.',
  },
  'connected-contract': {
    label: 'Connected contract demonstration',
    heading: 'Use connected semantic metadata',
    description:
      'These production-UI journeys use synthetic responses validated against the pinned backend contract. They teach connected workflows without recording a real provider or customer data.',
    note: 'The UI uses its production HTTP adapter, but all operator and metadata responses here are controlled contract fixtures. Provider sign-in return is simulated; these recordings do not qualify a deployed provider, permissions or live telemetry.',
  },
  'development-sample': {
    label: 'Development sample',
    heading: 'Explore sample workflows',
    description:
      'These journeys use synthetic development-only data to preview the intended operator experience.',
    note: 'The assets, telemetry, positions, registry records, and alerts shown here are synthetic. These screens do not demonstrate live fleet operations.',
  },
};

export const requiredChapters = new Map([
  ['console-orientation', 'production-shell'],
  ['connected-operator-session', 'connected-contract'],
  ['connected-asset-discovery', 'connected-contract'],
  ['connected-registry-review', 'connected-contract'],
  ['connected-recovery', 'connected-contract'],
  ['fleet-overview', 'development-sample'],
  ['map-workbench', 'development-sample'],
  ['asset-inspector', 'development-sample'],
  ['registry-review', 'development-sample'],
  ['alert-triage', 'development-sample'],
]);

const fail = (manifest, reason) => {
  throw new Error(`Invalid guide manifest ${manifest}: ${reason}`);
};

const requiredText = (value, field, manifest) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(manifest, `${field} must be non-empty text`);
  }
  return value.trim();
};

const asset = async (value, field, manifest) => {
  const relative = requiredText(value, field, manifest);
  if (
    !assetPattern.test(relative) ||
    !relative.endsWith(field === 'video' ? '.webm' : '.png')
  ) {
    fail(manifest, `${field} must be an assets/ PNG or WebM path`);
  }
  const file = ownedPath(path.dirname(manifest), relative);
  inspectMedia(file, path.extname(file));
  return relative;
};

const parseManifest = async (outputRoot, directory) => {
  const manifest = ownedPath(outputRoot, `${directory}/guide.json`);
  if (!slugPattern.test(directory)) {
    fail(manifest, 'directory must be a safe guide slug');
  }
  const value = JSON.parse(await readFile(manifest, 'utf8'));
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    value.schemaVersion !== 2
  ) {
    fail(manifest, 'expected schemaVersion 2 object');
  }
  if (!Number.isSafeInteger(value.order) || value.order < 0) {
    fail(manifest, 'order must be a non-negative integer');
  }
  const slug = requiredText(value.slug, 'slug', manifest);
  if (slug !== directory) {
    fail(manifest, 'slug must match its safe directory name');
  }
  if (!Object.hasOwn(modes, value.dataMode)) {
    fail(
      manifest,
      'dataMode must be a registered production-shell, connected-contract or development-sample mode',
    );
  }
  if (!Array.isArray(value.steps) || value.steps.length < 5) {
    fail(manifest, 'a useful guide must have at least five documented steps');
  }

  const steps = await Promise.all(
    value.steps.map(async (step, index) => {
      if (step === null || typeof step !== 'object' || Array.isArray(step)) {
        fail(manifest, `steps[${index}] must be an object`);
      }
      return {
        title: requiredText(step.title, `steps[${index}].title`, manifest),
        body: requiredText(step.body, `steps[${index}].body`, manifest),
        image: await asset(step.image, `steps[${index}].image`, manifest),
      };
    }),
  );
  return {
    slug,
    order: value.order,
    dataMode: value.dataMode,
    title: requiredText(value.title, 'title', manifest),
    summary: requiredText(value.summary, 'summary', manifest),
    video: await asset(value.video, 'video', manifest),
    steps,
  };
};

const verifyCoverage = (guides) => {
  const bySlug = new Map(guides.map((guide) => [guide.slug, guide]));
  for (const [slug, expectedMode] of requiredChapters) {
    const guide = bySlug.get(slug);
    if (guide === undefined) {
      throw new Error(`Required user-guide chapter is missing: ${slug}`);
    }
    if (guide.dataMode !== expectedMode) {
      throw new Error(
        `User-guide chapter ${slug} must use dataMode ${expectedMode}`,
      );
    }
  }
  if (guides.length !== requiredChapters.size)
    throw new Error('User-guide contains an unregistered chapter.');
  const orders = new Set();
  for (const guide of guides) {
    if (orders.has(guide.order)) {
      throw new Error(`Duplicate user-guide order: ${guide.order}`);
    }
    orders.add(guide.order);
  }
};

const escapeHtml = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const grouped = (guides) =>
  Object.entries(modes).map(([mode, details]) => ({
    mode,
    details,
    guides: guides.filter((guide) => guide.dataMode === mode),
  }));

const htmlDocument = (
  title,
  description,
  home,
  navigation,
  content,
  css,
) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)} · FleetIQ User Guide</title>
  <link rel="stylesheet" href="${css}">
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header><a class="brand" href="${home}"><span class="mark">FI</span> FleetIQ User Guide</a></header>
  <div class="layout">
    <nav aria-label="Guide chapters">${navigation}</nav>
    <main id="content">${content}</main>
  </div>
  <footer>Generated from verified Playwright journeys. Connected demonstrations and development samples use synthetic data.</footer>
</body>
</html>
`;

const navigation = (guides, current, nested) =>
  grouped(guides)
    .map(({ mode, details, guides: chapters }) => {
      const links = chapters
        .map((guide) => {
          const href = nested ? `../${guide.slug}/` : `./${guide.slug}/`;
          const selected = guide.slug === current ? ' aria-current="page"' : '';
          return `<li><a href="${href}"${selected}>${escapeHtml(guide.title)}</a></li>`;
        })
        .join('\n');
      return `<section class="nav-group"><p class="nav-label">${escapeHtml(details.label)}</p><ol data-guide-mode="${mode}">${links}</ol></section>`;
    })
    .join('\n');

const modeNotice = (guide) => {
  const details = modes[guide.dataMode];
  return `<aside class="mode-note mode-note--${guide.dataMode}" role="note"><strong>${escapeHtml(details.label)}</strong><p>${escapeHtml(details.note)}</p></aside>`;
};

const markdownPage = (guide) => {
  const details = modes[guide.dataMode];
  return `# ${guide.title}

> **${details.label}.** ${details.note}

${guide.summary}

<video controls poster="./${guide.steps[0].image}" src="./${guide.video}">Your browser does not support video.</video>

${guide.steps
  .map(
    (step, index) => `## ${index + 1}. ${step.title}

${step.body}

![${step.title}](./${step.image})`,
  )
  .join('\n\n')}
`;
};

const chapterPage = (guide, guides) => {
  const steps = guide.steps
    .map(
      (step, index) => `<section class="step" id="step-${index + 1}">
  <p class="step-number">Step ${index + 1}</p>
  <h2>${escapeHtml(step.title)}</h2>
  <p>${escapeHtml(step.body)}</p>
  <img src="./${step.image}" alt="${escapeHtml(step.title)}" loading="lazy">
</section>`,
    )
    .join('\n');
  return htmlDocument(
    guide.title,
    guide.summary,
    '../',
    navigation(guides, guide.slug, true),
    `<article>
  <p class="eyebrow">${escapeHtml(modes[guide.dataMode].label)} journey</p>
  <h1>${escapeHtml(guide.title)}</h1>
  ${modeNotice(guide)}
  <p class="lead">${escapeHtml(guide.summary)}</p>
  <video controls preload="metadata" poster="./${guide.steps[0].image}"><source src="./${guide.video}" type="video/webm">Your browser does not support video.</video>
  ${steps}
</article>`,
    '../assets/guide.css',
  );
};

const homeSection = ({ mode, details, guides }) => {
  const cards = guides
    .map(
      (guide) =>
        `<li><a class="card" href="./${guide.slug}/"><strong>${escapeHtml(guide.title)}</strong><span>${escapeHtml(guide.summary)}</span></a></li>`,
    )
    .join('\n');
  return `<section class="guide-group" aria-labelledby="group-${mode}"><p class="eyebrow">${escapeHtml(details.label)}</p><h2 id="group-${mode}">${escapeHtml(details.heading)}</h2><p>${escapeHtml(details.description)}</p><ol class="cards">${cards}</ol></section>`;
};

/** Assemble only validated, fully covered journeys into a static guide book. */
export const assembleBook = async (outputRoot = defaultOutputRoot) => {
  inspectTree(outputRoot);
  const entries = await readdir(outputRoot, { withFileTypes: true });
  const guideDirectories = entries.filter(
    (entry) => entry.isDirectory() && entry.name !== 'assets',
  );
  const guides = await Promise.all(
    guideDirectories.map((entry) => parseManifest(outputRoot, entry.name)),
  );
  verifyCoverage(guides);
  guides.sort(
    (left, right) =>
      left.order - right.order || left.title.localeCompare(right.title),
  );

  for (const guide of guides) {
    await writeFile(
      ownedPath(outputRoot, `${guide.slug}/README.md`, { missing: true }),
      markdownPage(guide),
      'utf8',
    );
    await writeFile(
      ownedPath(outputRoot, `${guide.slug}/index.html`, { missing: true }),
      chapterPage(guide, guides),
      'utf8',
    );
  }

  const sections = grouped(guides);
  await writeFile(
    ownedPath(outputRoot, 'README.md', { missing: true }),
    `# FleetIQ User Guide

Generated from verified Playwright journeys. The production-shell chapter shows the available console without connected fleet data. Connected-contract chapters exercise the production UI with synthetic, contract-validated metadata and a simulated sign-in return. Development-sample chapters use synthetic data and do not represent live operations.

${sections
  .map(
    ({ details, guides: chapters }) => `## ${details.heading}

${details.description}

${chapters.map((guide) => `- [${guide.title}](./${guide.slug}/README.md)`).join('\n')}`,
  )
  .join('\n\n')}
`,
    'utf8',
  );
  await mkdir(ownedPath(outputRoot, 'assets', { missing: true }), {
    recursive: true,
  });
  await copyFile(
    stylesheet,
    ownedPath(outputRoot, 'assets/guide.css', { missing: true }),
  );
  await writeFile(
    ownedPath(outputRoot, 'index.html', { missing: true }),
    htmlDocument(
      'Home',
      'Verified shell, connected-contract metadata and development-sample journeys for FleetIQ.',
      './',
      navigation(guides, undefined, false),
      `<section><p class="eyebrow">FleetIQ documentation</p><h1>Learn through verified journeys</h1><p class="lead">Start with the console orientation, follow four connected metadata demonstrations using synthetic contract responses, then explore five explicitly separate development previews. Provider credentials and customer data are never recorded.</p>${sections.map(homeSection).join('\n')}</section>`,
      './assets/guide.css',
    ),
    'utf8',
  );

  console.log(
    `[ok] Assembled ${guides.length} verified guide chapters as Markdown and static HTML`,
  );
};

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await assembleBook();
}
