/** Qualification cannot turn the required acceptance job or publication green. */
export function verificationExitCode(
  group,
  candidateRequested,
  report,
  candidate,
) {
  if (report.completePass === true) return 0;
  return candidateRequested &&
    group !== 'acceptance' &&
    report.blocker === 'dependency-review-required' &&
    candidate?.kind === 'dependency-candidate' &&
    candidate.completePass === false &&
    candidate.qualificationPass === true
    ? 0
    : 1;
}
