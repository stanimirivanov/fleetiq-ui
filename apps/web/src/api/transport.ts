import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { FleetStreaming } from '@fleetiq-ui/shared-core';

const transport = createConnectTransport({
  baseUrl: 'http://localhost:3000', 
});

export const apiClient = createClient(FleetStreaming, transport);
