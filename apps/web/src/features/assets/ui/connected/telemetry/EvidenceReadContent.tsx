import type { JSX } from 'solid-js';
import type { RequestFailureKind } from '#shared/model';
import { MetadataReadContent } from '../MetadataReadContent';
import type { MetadataReadState } from '../useMetadataRead';

const copy: Record<RequestFailureKind, string> = {
  unauthorized: 'Your session has ended. Sign in again to read telemetry.',
  forbidden:
    'Telemetry access denied. telemetry.read is independent of metadata.read.',
  'not-found':
    'The requested installed property or interpretation was not found.',
  'invalid-request':
    'The telemetry request is invalid. Check its exact property and window.',
  'invalid-response':
    'The telemetry response is invalid. No evidence from that response is shown.',
  unavailable:
    'The telemetry service is unavailable. No sample values are substituted.',
  conflict: 'The telemetry request conflicts with current state.',
};
export function EvidenceReadContent<T>(props: {
  readonly state: MetadataReadState<T>;
  readonly label: string;
  readonly retry: () => void;
  readonly children: (value: T) => JSX.Element;
}) {
  return (
    <MetadataReadContent
      state={props.state}
      label={props.label}
      retry={props.retry}
      messages={{
        failures: copy,
        idle: `Select a declared property to read ${props.label}.`,
        unconfigured: 'Telemetry reader is not configured.',
      }}
    >
      {props.children}
    </MetadataReadContent>
  );
}
