import { readFileSync, statSync } from 'node:fs';

/** Check bounded PNG/WebM framing, not decoded pixels, safe content, or playback. */
export function inspectMedia(file, extension) {
  const metadata = statSync(file);
  if (!metadata.isFile())
    throw new Error('Guide media must be a regular file.');
  const size = metadata.size;
  const limit = extension === '.png' ? 32 * 1024 * 1024 : 256 * 1024 * 1024;
  if (!size || size > limit)
    throw new Error('Guide media is empty or exceeds its size bound.');
  const bytes = readFileSync(file);
  if (extension === '.png') {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (
      bytes.length < 45 ||
      !bytes.subarray(0, 8).equals(signature) ||
      bytes.readUInt32BE(8) !== 13 ||
      bytes.toString('ascii', 12, 16) !== 'IHDR' ||
      bytes.readUInt32BE(16) === 0 ||
      bytes.readUInt32BE(20) === 0 ||
      bytes.toString('ascii', bytes.length - 8, bytes.length - 4) !== 'IEND'
    ) {
      throw new Error('Guide image is not a framed PNG.');
    }
  } else if (extension === '.webm') {
    const signature = Buffer.from([26, 69, 223, 163]);
    // EBML DocType identifies WebM. Restrict the search to the bounded header.
    const header = bytes.subarray(0, Math.min(bytes.length, 512));
    const docType = Buffer.from([66, 130, 132, 119, 101, 98, 109]);
    const segment = Buffer.from([24, 83, 128, 103]);
    if (
      bytes.length < 32 ||
      !bytes.subarray(0, 4).equals(signature) ||
      !header.includes(docType) ||
      !bytes.subarray(0, 1024).includes(segment)
    ) {
      throw new Error('Guide video is not a framed WebM.');
    }
  } else throw new Error('Unsupported guide media type.');
  return size;
}
