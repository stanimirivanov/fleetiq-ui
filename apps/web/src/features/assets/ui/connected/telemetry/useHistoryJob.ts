import { createSignal, onCleanup } from 'solid-js';
import { RequestFailure } from '#shared/model';
import type { AssetReadOptions } from '../../../model/asset-catalogue';
import { useMetadataReader } from '../MetadataReaderProvider';

/** One cancellable operation owned by the current exact history and access scope. */
export function useHistoryJob<J>(
  label: 'Export' | 'Restore',
  requestFailed: string,
) {
  const context = useMetadataReader();
  const [job, setJob] = createSignal<J>();
  const [busy, setBusy] = createSignal(false);
  const [message, setMessage] = createSignal('');
  const [replay, setReplay] = createSignal(false);
  const [denied, setDenied] = createSignal(false);
  let controller: AbortController | undefined;
  onCleanup(() => controller?.abort());

  async function run<T>(
    execute: (options: AssetReadOptions) => Promise<T>,
    accept: (result: T) => void,
    creating = false,
  ) {
    if (busy() || denied()) return;
    const request = new AbortController();
    controller = request;
    setBusy(true);
    setMessage('');
    setReplay(false);
    try {
      const result = await execute({ signal: request.signal });
      if (!request.signal.aborted) accept(result);
    } catch (cause) {
      if (request.signal.aborted) return;
      const failure =
        cause instanceof RequestFailure ? cause.kind : 'unavailable';
      if (failure === 'unauthorized' || failure === 'forbidden') {
        setJob(undefined);
        setDenied(true);
        setMessage(
          failure === 'unauthorized'
            ? 'Sign in again to continue.'
            : `${label} access denied. Review tenant permissions.`,
        );
        if (failure === 'unauthorized') context.onUnauthorized?.();
      } else if (
        creating &&
        (failure === 'unavailable' || failure === 'invalid-response')
      ) {
        setReplay(true);
        setMessage(`${label} outcome is uncertain. Retry the exact request.`);
      } else if (!creating && failure === 'not-found') {
        setJob(undefined);
        setMessage(
          `${label} job is no longer available. Enter the current selection to request work again.`,
        );
      } else {
        setMessage(
          creating
            ? requestFailed
            : `${label} action failed. Refresh status to check availability.`,
        );
      }
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  }

  return { job, setJob, busy, message, replay, denied, run };
}
