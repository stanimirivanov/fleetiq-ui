export function ownedPath(
  root: string,
  relative: string,
  options?: { missing?: boolean },
): string;
export function inspectTree(root: string): string[];
export function resetGuideOutput(repositoryRoot: string): string;
export function discardGuideOutput(repositoryRoot: string): void;
export function resetChapter(outputRoot: string, slug: string): string;
export function discardChapter(outputRoot: string, slug: string): void;
