# Nexus Project Blueprint

## Overview

Nexus is a unified service mesh management dashboard allowing users to visualize, monitor, and manage services, deployments, and infrastructure across multiple host servers.

## Current Feature: Active Registry Server Profile Selection

Implemented the ability for users to designate a specific Service Registry profile as "active", which is then used by Platform Management and Service Mesh for all API calls.

### Implementation Status

✅ **Completed:**

- **RegistryServerProfile Model** (`registry-server-profile.model.ts`):
  - Added `isActive?: boolean` field to track the active registry server profile.
- **RegistryServerProfileService** (`registry-server-profile.service.ts`):
  - Added `activeProfile` computed signal that returns the currently active profile.
  - Added `activeBaseUrl` computed signal that returns the active profile's properly formatted URL.
  - Added `setActiveProfile(profileId)` method to set a profile as active (deactivates all others).
  - Updated `loadProfiles()` to ensure at least one profile is always active.
  - Updated `deleteProfile()` to auto-activate the next available profile if the deleted one was active.
- **ServiceMeshService** (`service-mesh.service.ts`):
  - Refactored constructor to connect only to the active profile instead of all profiles.
  - Profile switching now triggers a reconnect to the newly active registry server.
- **RegistryServerProfilesDialogComponent**:
  - Updated UI to display an "Active" badge next to the active profile.
  - Added green ring/highlight around active profile in sidebar list.
  - Added "Set Active" button (checkmark icon) that appears on hover for inactive profiles.
  - Added `setActive()` method to trigger profile activation.
- **AppComponent** (`app.component.ts`):
  - **Bug Fix**: Updated `getPlatformNodeForPath()` to use `activeProfile` instead of `profiles[0]`.
  - This fixes the issue where Platform Management CRUD screens were calling the wrong service registry.

### How It Works

1. Users configure Service Registry profiles in the "Manage Service Registries" dialog.
2. One profile is always marked as "active" (indicated by a green badge and ring).
3. Hovering over an inactive profile shows a checkmark button to "Set as Active".
4. When the active profile changes, Platform Management and Service Mesh automatically reconnect to the new registry server.
5. All API calls (services, deployments, frameworks, etc.) are routed to the active registry server.

## Previous Feature: Platform Management Images

Ensured that children of the "Platform Management" node (and other Service Registry nodes) in the main explorer view request custom images matching their defined icons, consistent with the sidebar tree view.

### Implementation Status

✅ **Completed:**

- **App Component**: Updated `homeProvider` and `buildCombinedFolderTree` to preserve the `icon` property from the provider in the `metadata` object of `FileSystemNode`.
- **File Explorer**: Updated `getIconUrl` in `FileExplorerComponent` to prioritize using `metadata.icon` as the requested image name from `ImageService`, enabling custom icons (like 'cloud_upload', 'storage', 'dns') to be fetched instead of falling back to the item name.
- **File Explorer Path Fix**: Added `'Platform Management'` to the `virtualFolders` array in `FileExplorerComponent.providerPath()` to ensure the full path is passed to `homeProvider.getContents()` when loading Platform Management children.
- **Provider Routing Fix**: Added `'Platform Management'` to the `virtualOrgFolders` array in `AppComponent.getProvider()` to ensure `homeProvider` is returned instead of `TreeProviderAdapter`. This prevents the "Node not found" error that occurred when TreeProviderAdapter tried to resolve 'Platform Management' as a child node.
- **Lazy Loading Fix**: Modified `onLoadChildren` in `AppComponent` to NOT return early for Platform Management paths. Added special handling so the function proceeds with lazy loading for Platform Management, and passes the full path (including 'Platform Management') to `homeProvider.getContents()`.
- **Verification**: Ran build to ensure no regressions.


## Current Feature: Explorer Tree Refinements

Refining the "Platform Management" explorer tree nodes to match user requirements for structure and naming consistency.

### Implementation Status

✅ **Completed:**

- Modified `RegistryServerProvider.ts` to reorder children of `platform` node: Deployments, Hosts, Services, System Health.
- Renamed "Service Hosts" to "Hosts" in `fetchPlatformInfo` for consistency.
- **Folder Rename Restriction**: Added `isRenamingAllowed` computed signal in `FileExplorerComponent` that only allows double-click rename when inside the File Systems path (e.g., Local Session). This prevents accidental renaming of Platform Management, Gateways, and Service Registries items which are managed entities.
- Verified build success.

## Current Feature: Data Dictionary Expansion

Added "Operating Systems" and "Environments" to the Data Dictionary to support server management. These are lookup tables needed when adding new servers.

### Implementation Status

✅ **Completed (Frontend):**

- **RegistryServerProvider**: Added `Operating Systems` and `Environments` nodes to `getDataDictionaryNodes()` with appropriate icons ('computer' and 'cloud'), API endpoints (`/api/operating-systems` and `/api/environments`), and management types.
- **PlatformManagementComponent**: Added `operating-systems` and `environments` cases to all switch statements (loadData, onAdd, onEdit, onDelete) and template @case entries for displaying these lookup lists.
- **AppComponent**: Added 'operating systems' and 'environments' to the `validTypes` array in `getPlatformNodeForPath()` for proper path routing to the management component.

✅ **Completed (Backend - Spring Boot service-registry):**

- **OperatingSystem Entity**: Created new JPA entity `OperatingSystem.java` with fields: id, name, activeFlag, createdAt, updatedAt, and OneToMany relationship to Host.
- **OperatingSystemRepository**: Created repository interface with caching support.
- **OperatingSystemController**: Created REST controller at `/api/operating-systems` with full CRUD (GET, GET/{id}, POST, PUT/{id}, DELETE/{id}).
- **EnvironmentTypeController**: Created REST controller at `/api/environments` with full CRUD (entity and repository already existed).
- **Host Entity Update**: Added ManyToOne relationship from Host to OperatingSystem.
- **SQL Seed Data**: Created `data-seed.sql` with default operating systems (Windows Server, Ubuntu, CentOS, RHEL, Debian, macOS, Alpine) and environment types (Development, Testing, Staging, Production, DR).

✅ **Completed (Server Dialog Improvements):**

- **UpsertServerDialogComponent**: Refactored to use modern Angular v20+ control flow (@if, @for instead of *ngIf, *ngFor).
- **Dropdown Integration**: Server dialog now fetches Operating Systems and Environments from the backend API via `PlatformManagementService.getLookup()`.
- **PlatformManagementService**: Added `operating-systems` and `environments` to `getLookup()` and `getLookupEndpoint()` endpoint mappings.
- **Fallback Handling**: Dialog gracefully falls back to default OS options if the API is unavailable.

## Current Feature: Visual Editor & Graph Integration

Integration of the 3D Service Architecture Graph and Visual Component Editor with real backend data from `PlatformManagementService`.

### Implementation Status

✅ **Completed:**

- **Backend Integration**:
  - Updated `PlatformManagementService` to handle `VisualComponent` CRUD operations.
  - Updated `ComponentRegistryService` to fetch component definitions from the backend (`http://localhost:8080`).
  - Added `defaultComponentId` to `ServiceType` and `componentOverrideId` to `ServiceInstance` models.
- **Service Graph**:
  - Refactored `ServiceGraphComponent` to visualize real `ServiceInstance` data fetched from the backend.
  - Implemented visual style resolution: `Service Override` -> `Service Type Default` -> `Fallback`.
  - Removed demo scene loading to ensure specific server data is visualized.
- **Visual Editor UI**:
  - Updated `UpsertLookupDialog` to allow associating a Default Visual Style with a `ServiceType`.
  - Updated `UpsertServiceDialog` to allow setting a specific Visual Style Override for a `ServiceInstance`.
  - Updated `ComponentCreator` to save new component definitions to the backend.
  - Fixed build errors related to strict typing (`label` vs `name`, `allowedConnections`).
- **Build Verification**:
  - Validated that the application builds successfully with the new integration.

### Next Steps

1. Verify visual appearance in the sidebar.

## Current Feature: UI Consistency

### Align Toolbar Behavior for Service Registries

Updated the toolbar context handling to apply the same rules for Service Registries as Gateways. This ensures that file operation buttons (cut, copy, paste, etc.) are hidden when in a Service Registry context, and enabling relevant actions like "Save", "Reset", and "Add Service Registry".

- **Modified**: `src/app.component.html` - Bound `isRegistryServer` signals to toolbar and updated event handlers.
- **Modified**: `src/app.component.html` - Bound save/reset triggers to `app-registry-server-editor` to enable toolbar-driven saving.
- **Modified**: `src/components/toolbar/toolbar.component.html` - Hidden "Copy To" and "Move To" dropdowns when in Service Registry context.

### Align Toolbar Behavior for Platform Management

Extended the toolbar consistency to "Platform Management" contexts (e.g., Services, Deployments, Frameworks).

- **Modified**: `src/app.component.ts` - Added `isPlatformManagementContext` computed signal.
- **Modified**: `src/app.component.html` - Bound `isPlatformManagementContext` to toolbar and updated `toolbarAction` binding for `app-platform-management` to be pane-aware.
- **Modified**: `src/components/toolbar/toolbar.component.ts` - Added `isPlatformManagementContext` input.
- **Modified**: `src/components/toolbar/toolbar.component.html` - Hidden file operations (Cut, Copy, Paste, Share, Copy To, Move To, Magnetize) when in Platform Management context. "New" button dynamically shows "Add [Type]" (already implemented in template logic).

## Current Feature: UI Cleanup

### Remove Redundant Header Cards

Removed redundant header cards containing the "Add New ..." buttons from the Gateway and Service Registry management views, as this functionality is already provided by the Toolbar.

- **Modified**: `src/components/gateway-management/gateway-management.component.ts`
- **Modified**: `src/components/registry-server-management/registry-server-management.component.ts`

## Current Feature: Bug Fixes

### Fixed "Delete Service Registry" Button

Fixed an issue where clicking "Delete" for a Service Registry profile would initiate the confirmation logic but fail to show the dialog.

- **Implemented**: Added missing `<app-confirm-dialog>` for `isDeleteRegistryServerConfirmOpen` in `app.component.html`.
- **Verified**: Confirmed `onDeleteRegistryServer` method exists and is correctly wired.
- **Cleaned**: Removed duplicate/stub implementations of `onDeleteRegistryServer` mistakenly added during investigation.

### Fixed Accidental Toolbar Action Triggers

Fixed an issue where stale toolbar actions (like "New File") would re-trigger when navigating between views (e.g., clicking "Platform Management").

- **Diagnosis**: The global `toolbarAction` signal retained its value across navigation events, causing newly mounted components to react to old actions.
- **Fix**: Updated `AppComponent` to clear `toolbarAction` (`set(null)`) on `onSidebarNavigation`, `onPane1PathChanged`, `onPane2PathChanged`, and `setActivePane`.

### Status Bar Improvements

Updated the main status bar to provide more context about the active view and sub-views.

- **Added**: Visual indicator for "Service Mesh (Graph/Console)" vs "File Explorer (Split)".
- **Context**: Helps users orient themselves between the different main tabs and sub-tabs.

### Feature: Data Dictionary

Refactored the Platform Management views to group dictionary Lookup items under a dedicated "Data Dictionary" node.

- **Added**: "Data Dictionary" node to Platform Management tree.
- **Moved**: CRUD screens for `Frameworks`, `Service Types`, `Server Types`, `Languages`, `Categories`, and `Library Categories` are now individual nodes under Data Dictionary.
- **Cleaned**: Removed the tabbed interface from the "Services" view, as these items are now accessed via the tree.
- **Fixed**: Updated `RegistryServerProvider.canHandle` to explicitly accept `platform-dictionary-` nodes, resolving an issue where the new dictionary folder would not expand.
- **Fixed**: Updated `AppComponent.getPlatformNodeForPath` to correctly resolve nested "Data Dictionary" paths and normalize "Languages" and "Categories" to their platform management types (`framework-languages`, `framework-categories`).

### Fixed Missing Platform Management Screens

Fixed an issue where "Services", "Hosts", and "Deployments" management screens were hidden.

- **Diagnosis**: The `<app-platform-management>` component was incorrectly nested inside the `isGatewaysNodeSelected` condition block in `app.component.html`, making it unreachable for non-gateway nodes.
- **Fix**: Moved `<app-platform-management>` to its own `@else if (pane1PlatformNode())` block, restoring visibility for all platform management nodes.
- **Verified**: Build successful.

### Fixed Navigation Breadcrumb Bug

Fixed an issue where clicking on a breadcrumb in the address bar would navigate to the parent of the intended destination.

- **Diagnosis**: The index passed to `navigatePathActivePane` was calculated based on the display path (which excludes the root), but the function expects an index relative to the full path.
- **Fix**: Updated `app.component.html` to pass `0` for the root segment and `i + 1` for subsequent segments, ensuring the path is sliced correctly to include the targeted folder.

## Previous Feature: Gateway Editing Experience Integration

Integrating the gateway editor directly into the Nexus Explorer view to allow inline editing of gateway profiles when a gateway node is selected.

### Implementation Status

✅ **Completed:**

- `GatewayEditorComponent` created with full form functionality
- Template integration in `app.component.html` (lines 211-219, 299-307)
- Computed signals for gateway detection:
  - `pane1GatewayProfileId` and `pane2GatewayProfileId` (lines 305-306)
  - `isGatewayContext`, `isGatewaysNodeSelected`, `isGatewaySelected` (lines 410-413)
- Supporting methods implemented:
  - `getGatewayProfileIdForPath()` (line 318)
  - `onSaveGateway()`, `onResetGateway()` (lines 424-430)
  - `onDeleteGateway()`, `onDeleteGatewayById()` (lines 435-458)
  - `onAddGateway()` (lines 506-529)
  - `onEditGatewayByName()` (lines 539-545)
- `GatewayManagementComponent` fully integrated
- Editor save/reset triggers connected via `editorSaveTrigger` and `editorResetTrigger`
- Dirty state tracking via `editorIsDirty` signal

⏳ **Pending Verification:**

- Build validation to ensure no compilation errors
- Runtime testing of gateway selection and editing workflow
- Testing "Add Gateway" functionality from context menu/toolbar

### Component Palette Improvements

Enhanced the Component Palette in the Graph View to show realistic shape previews instead of generic squares.

- **Implemented**: Dynamic CSS classes for each geometry type (`box`, `sphere`, `cylinder`, `tall-cylinder`, `octahedron`, `torus`).
- **Visuals**: Added gradients and border-radius tricks to mimic 3D shapes in 2D CSS.
- **Fix**: Corrected label display to use `tool.name` instead of undefined `label`.

### Fixed Backend Build & CORS

Resolved compilation errors in the Service Registry caused by missing Lombok-generated methods, which were preventing the new `VisualComponentController` from being deployed.

- **Fixed**: Manually added missing getters/setters to `Deployment.java`, `Host.java`, `Service.java`, and `ServiceConfiguration.java`.
- **Verified**: Backend `mvn clean install` passed.
- **Action Required**: User must restart the Service Registry to apply these changes and enable the Visual Component endpoints.

## Previous Feature: Service Mesh Sub-Service Visibility

Enhanced the service mesh to display hosted/embedded services within gateway facades, enabling full visibility into the service hierarchy.

### Implemented Features

- **Broker Gateway (Spring Boot)**:
  - Enhanced `RegistryServerRegistrationService.getHostedServices()` to include additional metadata (framework, status, type, endpoint, healthCheck).
  - Services embedded in the gateway are now registered with full context.
- **Service Registry (Spring Boot)**:
  - Enhanced `ExternalServiceRegistration.HostedServiceInfo` DTO with new fields.
  - Updated `storeHostedServices()` to persist all metadata as JSON.
  - Added `getAllServicesWithHosted()` and `getHostedServicesForService()` methods.
  - Added new API endpoints: `GET /api/registry/services/with-hosted` and `GET /api/registry/services/{name}/hosted`.
- **Nexus UI (Angular)**:
  - Added `HostedService` and `ServiceWithHosted` interfaces to the model.
  - Updated `ServiceMeshService` to fetch and track services with hosted services via `servicesWithHosted` signal.
  - Integrated `fetchServicesWithHosted()` into the polling data fetch cycle.

### Migration Path

The architecture supports future migration to standalone microservices via deployment profiles (`embedded` vs `standalone`) without code changes.

## Previous Feature: Service Registry & Gateway Integration

Implemented comprehensive management for Broker Gateways and Service Registries, enabling multi-host connectivity and profile management directly within the application.

### Implemented Features

- **Service Registry Management**:
  - Integrated `RegistryServerManagementComponent` into the main application view.
  - Implemented Add, Edit, and Delete workflows for Service Registry profiles.
  - Connected `RegistryServerEditorComponent` properly to the application state.
- **Gateway Management**:
  - Finalized `GatewayManagementComponent` integration.
  - Implemented Add, Edit, and Delete workflows for Gateway profiles.
  - Resolved extensive syntax and integration issues in `AppComponent` to ensure robust handling of profile actions.
- **App Component Refactoring**:
  - Fixed significant parser and scope issues in `AppComponent` caused by malformed methods.
  - Restored proper class structure and ensured all profile management methods are correctly defined and accessible.
  - Verified build integrity and template usage.

## Previous Feature: Platform Management

This feature adds the ability to manage the underlying metadata of the service mesh (Services, Frameworks, Deployments, Hosts) directly from the Nexus UI.

### Implemented Features

- **Backend**: GET/POST/PUT/DELETE endpoints for Services, Frameworks, Deployments, and Hosts.
- **Frontend Service**: `PlatformManagementService` handling API interactions.
- **UI Integration**:
  - `DetailPaneComponent` dynamically switches to Management View when "Platform Management" nodes are selected.
  - `PlatformManagementComponent`: A reusable component for listing and managing entities.
  - `UpsertServiceDialog`: specific form for adding/editing Services.
  - `UpsertFrameworkDialog`: specific form for adding/editing Frameworks.
  - `UpsertDeploymentDialog`: specific form for adding/editing Deployments (including Service, Server, Environment lookups).
  - `UpsertServerDialog`: specific form for adding/editing Hosts (including Type, Enviroment, OS lookups).

## Current Feature: Double-Click to Edit

Enabled double-click interactions in Nexus CRUD screens to open the edit dialog for items, improving user workflow efficiency.

### Implementation Status

✅ **Completed:**

- **RegistryServerManagementComponent**: Added double-click handler to Service Registry cards.
- **PlatformManagementComponent**: Added double-click handlers to tables for:
  - Services
  - Libraries
  - Frameworks
  - Deployments
  - Servers
- **LookupListComponent**: Added double-click handler to Data Dictionary lookup item rows.

## Current Feature: Connect Buttons

Added explicit "Connect" buttons to the Gateway Management card view and the Gateway Editor detail view to improve accessibility of the connection workflow.

### Implementation Status

✅ **Completed:**

- **GatewayManagementComponent**:
  - Added `connectGateway` output event.
  - Added "Connect" button to gateway cards (visible on hover), disabled if already connected.
- **GatewayEditorComponent**:
  - Added `connectGateway` output event.
  - Added "Connect" button to the editor header if the gateway is disconnected.
- **AppComponent**:
  - Wired `(connectGateway)` events from both components to the existing `onConnectToServer` handler.
  - This triggers the standard Login Dialog workflow.

## Current Feature: Content Status Bar

Added a content status bar between the main content area and the Idea Stream that displays contextual information about the current CRUD screen.

### Implementation Status

✅ **Completed:**

- **PlatformManagementComponent**:
  - Added `statusInfo` output event.
  - Added effect to emit status info (type and count) when data changes.
- **AppComponent**:
  - Added `contentStatusInfo` signal to store status bar data.
  - Added `activePanePlatformNode` computed to detect if active pane shows a CRUD screen.
  - Wired `(statusInfo)` event from platform-management components.
- **Template**:
  - Added status bar div between content and Idea Stream.
  - Shows only when active pane displays a platform management component.
  - Displays data type (e.g., "Services", "Frameworks") and item count.

## Current Feature: Search & Discovery Conflict Fix

Fixed a bug where folder names in "Search & Discovery" that matched Platform Management nodes (e.g., "Services", "Libraries") were being hijacked and causing the CRUD management screen to appear instead of the folder contents.

### Implementation Status

✅ **Completed:**

- **AppComponent**: Updated `getPlatformNodeForPath` to explicitly ignore paths starting with "Search & Discovery", ensuring they are treated as standard file explorer paths.


## Current Feature: CRUD Keyboard Shortcuts

Enabled keyboard shortcuts for CRUD management screens to improve accessibility and workflow efficiency.

### Implementation Status

✅ **Completed:**

- **PlatformManagementComponent**: Added `tabindex="0"` and `(keydown.enter)` listener to all data tables (Services, Libraries, Frameworks, Deployments, Servers) to allow opening the edit dialog via Enter key.
- **LookupListComponent**: Added `tabindex="0"` and `(keydown.enter)` listener to lookup item rows.
- **Upsert Dialogs**: Added `(window:keydown.escape)` listener to all 7 upsert/management dialogs to allow closing them via Escape key.

