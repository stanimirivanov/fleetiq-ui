import { createSignal, Show } from 'solid-js';
import { CommunicationPanel } from './CommunicationPanel';
import { buttonClass, DeviceField, inputClass } from './DevicePrimitives';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { ProtocolRoutePanel } from './ProtocolRoutePanel';

function ChannelControl(props: {
  channel: string;
  change: (id: string) => void;
}) {
  const [draft, setDraft] = createSignal(props.channel);
  return (
    <form
      class="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (/^[A-Za-z0-9_.-]{1,128}$/u.test(draft())) props.change(draft());
      }}
    >
      <DeviceField label="Listener channel ID">
        {(id) => (
          <input
            id={id}
            class={inputClass}
            value={draft()}
            onInput={(e) => setDraft(e.currentTarget.value)}
          />
        )}
      </DeviceField>
      <button
        type="submit"
        class={buttonClass}
        disabled={!/^[A-Za-z0-9_.-]{1,128}$/u.test(draft())}
      >
        Review channel
      </button>
    </form>
  );
}
export function DeviceReview(props: {
  tenant: string;
  device: string;
  channel: string;
  changeChannel: (id: string) => void;
}) {
  const [registrationRevision, setRegistrationRevision] = createSignal(0);
  const scope = () => ({
    tenant: props.tenant,
    device: props.device,
    channel: props.channel,
  });
  return (
    <>
      <div class="flex flex-wrap items-end gap-3">
        <h2 class="min-w-0 flex-1 break-all text-lg font-semibold">
          {props.device}
        </h2>
        <Show when={props.channel} keyed>
          {(channel) => (
            <ChannelControl channel={channel} change={props.changeChannel} />
          )}
        </Show>
      </div>
      <CommunicationPanel
        scope={scope()}
        registered={() => setRegistrationRevision((revision) => revision + 1)}
      />
      <Show when={props.channel} keyed>
        {(channel) => (
          <ProtocolRoutePanel
            scope={{ tenant: props.tenant, device: props.device, channel }}
            registrationRevision={registrationRevision()}
          />
        )}
      </Show>
      <DiagnosticsPanel
        scope={scope()}
        registrationRevision={registrationRevision()}
      />
    </>
  );
}
