# DRIFT.md — nexus-console Client vs Backend Services

**Date:** 2026-07-23
**Compared:** `src/services/` (multiple service files) ↔ multiple backend services
**Status:** Aggregator application — communicates with 10+ services, complex drift landscape

---

## Important: Aggregator Architecture

Nexus-console is the **main shell application** that orchestrates multiple backend services. It does not have a single backend to compare against. Instead, it:
1. Embeds other UIs via iframes (conduit-ui, duality, plurality, etc.)
2. Talks to service-registry via SSE (`RegistryServerProvider`)
3. Talks to broker gateways via remote file system providers
4. Manages platform management, topology, and system health
5. Syncs UI preferences and theme across applications

---

## Service Connections Summary

| Service | Connection Method | Client File | Status |
|---|---|---|---|
| **Service Registry** | REST + SSE | `registry-server-provider.service.ts` | ✅ Dedicated provider |
| **Broker Gateways** | Remote file system (REST) | `remote-file-system.service.ts` | ✅ Multiple profiles |
| **Terrain** (topology) | REST | `atlas.service.ts`, `architecture-viz.service.ts` | ✅ |
| **Image Server** | REST | `image.service.ts`, `image-client.service.ts` | ✅ |
| **Event Bus** | SSE + HTTP POST | `ui-event-bus.service.ts` | ✅ Cross-app sync |
| **Health Checks** | HTTP polling | `health-check.service.ts` | ✅ Per-service health |
| **DB** (via service-registry) | REST | `db.service.ts` | ✅ |
| **Gemini AI** | REST | `gemini.service.ts` | ✅ |
| **Assembly/Forums** | REST | `service-mesh.service.ts` | ✅ |
| **Preferences** | Local state + service | `ui-preferences.service.ts`, `preferences.service.ts` | ✅ Client-side |

---

## Service-by-Service Drift Assessment

### Service Registry Provider (`registry-server-provider.service.ts`)

| Client Method | Target Endpoint | Risk |
|---|---|---|
| `getChildren(id)` | Service registry `/<id>/children` | Low — established interface |
| Platform management tree navigation | Registry-specific API | Low — version-specific |

### Remote File System (`remote-file-system.service.ts`)

| Client Method | Target Endpoint | Risk |
|---|---|---|
| File CRUD operations | Broker gateway file API | Low — standard file operations |
| Tree listing | Gateway directory API | Low — established |

### UI Event Bus (`ui-event-bus.service.ts`)

| Aspect | Client | Backend (event-bus-srv port 3200) | Verdict |
|---|---|---|---|
| `connect(sender)` | Registers sender | EventSource on `/api/events/stream?sender=` | ✅ |
| `emit(event)` | POST `/api/events` | Event bus accepts | ✅ |
| Phase synchronization | Location change events | Child apps report location | ⚠️ Not all apps implement this |

---

## Medium

### M1 — Theme Synchronization

The nexus-console syncs themes across embedded iframe apps via the event bus. Not all child apps (e.g., execution-ui, cascade-ui) may implement the event bus listener. This is an integration gap, not an API drift.

### M2 — Fragment-Level Health Checks

`health-check.service.ts` monitors individual services. Each monitored profile may report health differently (different ports, different payload shapes). The client normalizes these, but if a service changes its health response shape, the health indicator may show stale data.

---

## Summary

| Priority | Area | Notes |
|---|---|---|
| **Low** | Event bus adoption | Child apps that don't listen for theme/location events won't sync |
| **Low** | Health check shapes | Service-specific — need to validate per-service |
| **None** | Single-backend drift | N/A — nexus-console is an aggregator, not a single-backend client |
