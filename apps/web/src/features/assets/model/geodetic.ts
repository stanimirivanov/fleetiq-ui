/** Exact normalized decimal comparison, including BigDecimal's scientific output.
 * Never exponentiate an untrusted exponent; comparison bounds all allocated powers.
 */
export function decimalParts(s: string): { n: bigint; scale: bigint } | null {
  if (s.length > 8192) return null;
  const m = /^(-?)([0-9]+)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]{1,20}))?$/.exec(s);
  if (!m) return null;
  const fraction = m[3] ?? '',
    digits = `${m[2]}${fraction}`.replace(/^0+/, '');
  if (!digits) return { n: 0n, scale: 0n };
  const significant = digits.replace(/0+$/, '');
  return {
    n: BigInt(`${m[1]}${significant}`),
    scale:
      BigInt(fraction.length) -
      BigInt(m[4] ?? '0') -
      BigInt(digits.length - significant.length),
  };
}
export function sameCoordinate(
  point: string,
  raw: string,
  encoding: 'degrees' | 'e7',
  bound: 90 | 180,
): boolean {
  const a = decimalParts(point),
    b = decimalParts(raw);
  if (
    !a ||
    !b ||
    point.length > 128 ||
    (encoding === 'e7' && !/^-?(0|[1-9][0-9]*)$/.test(raw))
  )
    return false;
  if (b.n !== 0n && encoding === 'e7') b.scale += 7n;
  if (a.n !== b.n || a.scale !== b.scale) return false;
  if (a.n === 0n) return true;
  const n = a.n < 0n ? -a.n : a.n;
  const wholeDigits = BigInt(n.toString().length) - a.scale,
    maximumDigits = BigInt(String(bound).length);
  if (wholeDigits !== maximumDigits) return wholeDigits < maximumDigits;
  return a.scale >= 0n
    ? n <= BigInt(bound) * 10n ** a.scale
    : n * 10n ** -a.scale <= BigInt(bound);
}
