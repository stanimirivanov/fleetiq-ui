# FleetIQ UI Architecture

## Overview

FleetIQ UI is a high-performance IoT fleet management system built with a
monorepo architecture.

## Key Components

### Data Flow

1. **Telemetry Ingestion**: MQTT broker receives GPS data from vehicles
2. **BFF Layer**: GraphQL API Gateway for metadata, WebSocket bridge for
   telemetry
3. **Client Processing**: Web Workers for data transformation, Zustand for state
4. **Rendering**: deck.gl (WebGL) for web, MapLibre Native for mobile

### Performance Strategies

- **Batching**: Telemetry updates batched at 100ms intervals
- **Protobuf**: Binary serialization for 3-5x smaller payloads
- **Web Workers**: Data processing off main thread
- **GPU Rendering**: deck.gl uses WebGL for smooth animations
- **Connection Resilience**: Automatic reconnection with exponential backoff

### State Management

- **Zustand Store**: For high-frequency telemetry (outside React)
- **TanStack Query**: For server state and caching
- **React Context**: For UI state and preferences