# Nexus Console — Specification

## Functional Requirements

- Manage and monitor the Atomic Service Mesh (services, hosts, gateways, deployments)
- Visualize service dependencies with an interactive 3D architecture graph
- Provide CRUD interfaces for services, frameworks, deployments, hosts, and configurations
- Enable multi-source search with Google, Unsplash, YouTube, academic databases, and Gemini AI
- Monitor real-time service health via WebSocket integration
- Support dual-pane navigation for comparing configuration or logs
- Provide integrated chat, notes, RSS feed, and terminal emulator

## Non-Functional Requirements

- Angular 20+ with standalone components and signals for performance
- Three.js for 3D service dependency visualization
- WebSocket integration for live service status updates
- Three themes: Light, Steel, and Dark
- Tree provider architecture for abstracted navigation across data sources

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| (UI) | Service mesh graph | 3D interactive architecture visualization |
| (UI) | Platform management | CRUD for services, frameworks, hosts, deployments |
| (UI) | Search | Multi-source search with grid/list results |
| (UI) | Terminal | Integrated terminal emulator |
| (UI) | Chat/Notes | Built-in collaboration tools |

## Data Model

- ServiceMeshNode: id (UUID), name (String), type (String), status (String), dependencies (UUID[]), metadata (JSON)
- HostServer: id (UUID), name (String), ip (String), status (String), services (UUID[]), config (JSON)
- Deployment: id (UUID), serviceId (UUID), version (String), environment (String), status (String), rolloutAt (Instant)
- SearchResult: source (String), title (String), url (String), snippet (String), type (String)
