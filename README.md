# FleetIQ UI

> Enterprise IoT Fleet Management Platform — Web Operator Console, Mobile App,
> and Shared Engine.

FleetIQ UI is a high-performance, multi-tenant monorepo built to process
high-frequency GPS telemetry, live geospatial tracking, geofencing, and
historical route playback for large-scale vehicle fleets.

---

## 🏗️ Monorepo Architecture

The workspace is powered by **Nx** and **pnpm**, enforcing a single-dependency
policy and sharing business logic, state stores, and spatial utility functions
across all client applications.

```text
fleetiq-ui/
├── apps/
│   ├── web/           # React 19 + Vite (MapLibre GL + deck.gl GPU rendering)
│   ├── mobile/        # React Native + Expo (@maplibre/maplibre-react-native)
│   └── api-gateway/   # Node.js BFF (Mock REST, GraphQL & MQTT stream server)
└── libs/
└── shared-core/       # Shared Zustand stores, API clients, and Turf.js spatial logic
```

### 📦 Applications & Libraries

| Project           | Type         | Description                                          | Path Alias                |
|:------------------|:-------------|:-----------------------------------------------------|:--------------------------|
| **`web`**         | React + Vite | Real-time dispatch console & operator dashboard      | —                         |
| **`mobile`**      | Expo (RN)    | Driver & field mobile application *(Phase 2)*        | —                         |
| **`api-gateway`** | Node.js      | BFF Mock server publishing MQTT GPS streams & APIs   | —                         |
| **`shared-core`** | TS Library   | Core Zustand stores, hooks, and geospatial utilities | `@fleetiq-ui/shared-core` |

---

## 🛠️ Tech Stack

* **Monorepo
  Management:** [Nx](https://nx.dev) + [pnpm Workspaces](https://pnpm.io)
* **Web Frontend:** React 19, Vite, Tailwind CSS
* **Geospatial & Mapping:**
    * **Web:** MapLibre GL JS + deck.gl (WebGL/GPU-accelerated high-density
      marker rendering)
    * **Mobile:** `@maplibre/maplibre-react-native`
* **State Management:**
    * **Global Client State:** [Zustand](https://github.com/pmndrs/zustand)
    * **Server State:** [TanStack Query](https://tanstack.com/query)
* **Geospatial Math:** [Turf.js](https://turfjs.org/)
* **Build Plugin:** `vite-tsconfig-paths` for workspace path resolution

---

## 🚀 Getting Started

### Prerequisites

* **Node.js:** `>= 20.0.0`
* **pnpm:** `>= 9.0.0`

### 1. Installation

Clone the repository and install workspace dependencies:

```bash
git clone [https://github.com/stanimirivanovfleetiq-ui.git](https://github.com/stanimirivanov/fleetiq-ui.git)
cd fleetiq-ui
pnpm install
```

### 2. Development Commands

**Note**: Make sure the protobuf stubs are generated before making any code
changes.

Start the application targets using Nx:

```bash
# Start the Web Dispatch Console (http://localhost:4200)
pnpm nx serve web

# Start the Node API Gateway / Mock MQTT Stream
pnpm nx serve api-gateway

# Start the Expo Mobile App bundler
pnpm nx start mobile

# Serve Web and API Gateway concurrently
pnpm nx run-many -t serve -p web api-gateway
```

