import { useLocation, useNavigate } from '@solidjs/router';
import { createMemo } from 'solid-js';
import { RequestFailure } from '#shared/model';
import { readFleetQuery } from '../../model/fleet-query';
import { metadataHref } from '../../model/metadata-query';
import { useMetadataReader } from './MetadataReaderProvider';
import { useMetadataRead } from './useMetadataRead';
/** Overview and map share the exact same scoped, cancellable fleet read boundary. */
export function useFleetWorkspace(path: '/' | '/map') {
  const location = useLocation(),
    navigate = useNavigate(),
    context = useMetadataReader();
  const query = createMemo(() => readFleetQuery(location.search));
  const request = createMemo(() => {
    const q = query();
    return q.kind === 'ready' ? q.request : null;
  });
  const read = useMetadataRead(
    request,
    (_reader, r, options) =>
      context.reader?.fleet?.snapshot(r, options) ??
      Promise.reject(new RequestFailure('unavailable')),
  );
  const ready = createMemo(() => {
    const state = read.state(),
      q = query();
    return state.kind === 'ready' && q.kind === 'ready'
      ? { page: state.value, query: q }
      : null;
  });
  return {
    context,
    query,
    request,
    read,
    ready,
    search: () => location.search,
    tenant: () => new URLSearchParams(location.search).get('tenant') ?? '',
    change: (values: Record<string, string | null>) =>
      navigate(metadataHref(path, location.search, values)),
  };
}
