import { RequestFailure } from '#shared/model';
export interface SseEvent {
  readonly event: string;
  readonly id?: string;
  readonly data: string;
}
/** No inherited IDs: this protocol assigns IDs only to applied state frames. */
export class SseDecoder {
  private text = '';
  private size = 0;
  private event = '';
  private id: string | undefined;
  private data: string[] = [];
  private readonly decoder = new TextDecoder('utf-8', { fatal: true });
  push(bytes: Uint8Array, emit: (event: SseEvent) => void): void {
    if (bytes.length > 1024 * 1024)
      throw new RequestFailure('invalid-response');
    try {
      this.text += this.decoder.decode(bytes, { stream: true });
    } catch {
      throw new RequestFailure('invalid-response');
    }
    let end = this.text.search(/[\r\n]/);
    while (end >= 0) {
      if (this.text[end] === '\r' && end === this.text.length - 1) break;
      const line = this.text.slice(0, end);
      const skip =
        this.text[end] === '\r' && this.text[end + 1] === '\n' ? 2 : 1;
      this.text = this.text.slice(end + skip);
      this.line(line, skip, emit);
      end = this.text.search(/[\r\n]/);
    }
    if (new TextEncoder().encode(this.text).length + this.size > 65536)
      throw new RequestFailure('invalid-response');
  }
  finish(emit: (event: SseEvent) => void): void {
    try {
      this.decoder.decode();
      if (this.text.endsWith('\r')) {
        this.line(this.text.slice(0, -1), 1, emit);
        this.text = '';
      }
    } catch {
      throw new RequestFailure('invalid-response');
    }
  }
  private line(
    line: string,
    ending: number,
    emit: (event: SseEvent) => void,
  ): void {
    this.size += new TextEncoder().encode(line).length + ending;
    if (this.size > 65536) throw new RequestFailure('invalid-response');
    if (!line) {
      if (this.data.length)
        emit({
          event: this.event || 'message',
          ...(this.id === undefined ? {} : { id: this.id }),
          data: this.data.join('\n'),
        });
      this.size = 0;
      this.event = '';
      this.id = undefined;
      this.data = [];
      return;
    }
    if (line.startsWith(':')) return;
    const split = line.indexOf(':');
    const name = split < 0 ? line : line.slice(0, split);
    const raw = split < 0 ? '' : line.slice(split + 1);
    const value = raw.startsWith(' ') ? raw.slice(1) : raw;
    if (name === 'event') this.event = value;
    if (name === 'id') {
      if (value.includes('\0') || this.id !== undefined)
        throw new RequestFailure('invalid-response');
      this.id = value;
    }
    if (name === 'data') this.data.push(value);
  }
}
/** One reader, no producer/queue. Aborts and idle timeouts cancel the body. */
export async function consumeSse(
  response: Response,
  signal: AbortSignal,
  emit: (event: SseEvent) => void,
): Promise<void> {
  if (
    response.headers.get('content-type')?.split(';')[0]?.trim() !==
      'text/event-stream' ||
    !response.body
  )
    throw new RequestFailure('invalid-response');
  const reader = response.body.getReader(),
    decoder = new SseDecoder();
  const cancel = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const next = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new RequestFailure('unavailable'));
            cancel();
          }, 25000);
        }),
      ]).finally(() => clearTimeout(timer));
      signal.throwIfAborted();
      if (next.done) {
        decoder.finish(emit);
        return;
      }
      decoder.push(next.value, emit);
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
