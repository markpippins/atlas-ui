import {
  Component,
  input,
  output,
  model,
  effect,
  signal,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  ServiceInstance,
  ServiceDependency,
  Deployment
} from '../../models/service-mesh.model.js';
import { ArchitectureVizService, NodeData } from '../../services/architecture-viz.service.js';
import { ComponentRegistryService } from '../../services/component-registry.service.js';
import { NodeType } from '../../models/component-config.js';
import { AtlasService } from '../../services/atlas.service.js';
import type { ConnectionData } from '../../models/graph-view.model.js';
import { LoadViewDialogComponent } from '../load-view-dialog/load-view-dialog.component.js';
import { ComponentCreatorComponent } from '../component-creator/component-creator.component.js';
import { ComponentLibraryComponent } from '../component-library/component-library.component.js';
import { AddServiceDialogComponent } from '../add-service-dialog/add-service-dialog.component.js';
import { ComponentCreatorStateService } from '../../services/component-creator-state.service.js';
import { MinimapComponent } from '../minimap/minimap.component.js';
import * as THREE from 'three';

@Component({
  selector: 'app-service-graph',
  imports: [CommonModule, FormsModule, LoadViewDialogComponent, ComponentCreatorComponent, ComponentLibraryComponent, AddServiceDialogComponent, MinimapComponent],
  templateUrl: './service-graph.component.html',
  styleUrls: ['./service-graph.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceGraphComponent implements AfterViewInit, OnDestroy {
  // Inputs from parent
  services = input<ServiceInstance[]>([]);
  dependencies = input<ServiceDependency[]>([]);
  deployments = input<Deployment[]>([]);
  showInternalPanels = input(true); // When false, hide internal palette and inspector sidebars
  graphSubView = input<'canvas' | 'creator'>('canvas');
  paletteCollapsed = input(false);
  showRunningOnly = model(false);
  bloomParams = input<{ strength?: number; radius?: number; threshold?: number }>();

  // Outputs
  selectedNode = output<ServiceInstance>();
  graphSubViewChange = output<'canvas' | 'creator'>();
  refreshServices = output<void>();

  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('labelInput') labelInput!: ElementRef<HTMLInputElement>;

  public vizService = inject(ArchitectureVizService);
  private registry = inject(ComponentRegistryService);
  private atlas = inject(AtlasService);
  private cdr = inject(ChangeDetectorRef);
  private creatorState = inject(ComponentCreatorStateService);

  /** Exposed for template — number of multi-selected nodes. */
  multiSelectedCount = this.vizService.multiSelectedCount;

  /** IDs of all current nodes — for the Add Service dialog's existingNodeIds input. */
  existingNodeIds = computed(() => this.vizService.allNodes().map(n => n.id));

  // UI Panels
  isInspectorOpen = signal(true);

  // Interaction Mode
  currentMode = this.vizService.modeSignal;
  viewMode = this.vizService.viewMode;
  isSimulationActive = this.vizService.isSimulationActive;

  // Tools - loaded from Registry Service
  toolItems = this.registry.allComponents;

  // Inspector Form Data
  selectedNodeData = this.vizService.selectedNodeData;
  allNodes = this.vizService.allNodes;

  // Scene Settings
  bgColor = '#000510';

  // Active Camera — 1 or 2, toggled via the camera switch button
  activeCamera = this.vizService.activeCamera;

  // Initialization flag
  private isInitialized = signal(false);

  // Guards loadDefaultView to run only once (not every poll cycle)
  private hasLoadedDefaultView = false;

  // Stable per-service key to detect whether service list *or visual style* actually changed (not just reference)
  private lastServiceKey = '';
  private lastRegistryReady = false;

  // Context Menu State
  contextMenu = signal<{
    visible: boolean,
    x: number,
    y: number,
    targetNodeId: string | null,
    worldPos: { x: number, y: number, z: number } | null
  }>({
    visible: false, x: 0, y: 0, targetNodeId: null, worldPos: null
  });

  // Computed list of nodes we can connect to (not self, not already connected, AND allowed by config)
  availableTargets = computed(() => {
    const current = this.selectedNodeData();
    const all = this.allNodes();
    if (!current) return [];

    // Get connection rules for current node type
    const config = this.registry.getConfig(current.type);
    // Pre-build a Set for O(1) connected-to lookups (was O(n) .includes inside filter)
    const connectedSet = new Set(current.connectedTo);

    return all.filter(n => {
      // Rule 1: Cannot connect to self
      if (n.id === current.id) return false;
      // Rule 2: Cannot connect if already connected
      if (connectedSet.has(n.id)) return false;
      // Rule 3: Must be in allowed connections list
      if (config.allowedConnections && config.allowedConnections !== 'all' && !config.allowedConnections.includes(n.type)) return false;

      return true;
    }).sort((a, b) => a.label.localeCompare(b.label));
  });

  /** All connections involving the selected node (outbound, inbound, bidirectional). */
  allConnections = computed(() => {
    const current = this.selectedNodeData();
    const all = this.allNodes();
    if (!current) return [];

    const result: { nodeId: string; label: string; direction: 'out' | 'in' | 'bidirectional' }[] = [];
    const seen = new Set<string>();

    // Outbound + bidirectional from current
    for (const targetId of current.connectedTo) {
      const key = [current.id, targetId].sort().join('::');
      if (seen.has(key)) continue;
      seen.add(key);
      const target = all.find(n => n.id === targetId);
      const bidir = this.vizService.isBidirectional(current.id, targetId);
      result.push({
        nodeId: targetId,
        label: target?.label ?? targetId,
        direction: bidir ? 'bidirectional' : 'out'
      });
    }

    // Incoming (other nodes point to current, not already covered)
    for (const n of all) {
      if (n.id === current.id) continue;
      if (n.connectedTo.includes(current.id)) {
        const key = [current.id, n.id].sort().join('::');
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({
          nodeId: n.id,
          label: n.label,
          direction: 'in'
        });
      }
    }
    return result;
  });

  // Form Models (synced with effect)
  formLabel = '';
  formDesc = '';
  formColor = '#ffffff';
  formX = 0;
  formY = 0;
  formZ = 0;

  // Connection Form
  selectedTargetId = '';

  // Load View Dialog
  showLoadDialog = signal(false);

  // Add Registered Service Dialog
  showAddServiceDialog = signal(false);

  // --- Enhancement features ---
  // Search & Highlight
  searchTerm = signal('');
  // Export dropdown
  showExportMenu = signal(false);
  // Undo/redo availability — arrow functions preserve `this` binding to vizService
  canUndo = () => this.vizService.canUndo();
  canRedo = () => this.vizService.canRedo();
  // Diff mode
  diffModeActive = this.vizService.diffModeActive;
  // Auto-detected systems (for the auto-detect popup)
  detectedSystems = signal<string[][]>([]);
  showAutoDetectPopup = signal(false);
  // Edge labels toggle
  edgeLabelsVisible = signal(false);
  // Health pulse toggle
  healthPulseEnabled = this.vizService.healthPulseEnabled;
  // Minimap toggle
  showMinimap = signal(false);

  // --- Collapse/Explode: System grouping ---
  // Maps parent service ID → array of child service IDs, derived from the
  // services input. A "System" is any service that other services point to
  // via parentServiceId.
  childrenMap = computed(() => {
    const svcs = this.services();
    const map = new Map<string, string[]>();
    for (const svc of svcs) {
      if (svc.parentServiceId != null) {
        const parentId = String(svc.parentServiceId);
        const children = map.get(parentId) ?? [];
        children.push(String(svc.id));
        map.set(parentId, children);
      }
    }
    return map;
  });

  /** Whether the context-menu target node has child services (is a System). */
  targetHasChildren = computed(() => {
    const targetId = this.contextMenu().targetNodeId;
    if (!targetId) return false;
    return (this.childrenMap().get(targetId)?.length ?? 0) > 0;
  });

  /** Whether the context-menu target node is currently collapsed. */
  targetIsCollapsed = computed(() => {
    const targetId = this.contextMenu().targetNodeId;
    if (!targetId) return false;
    return this.vizService.isSystemCollapsed(targetId);
  });

  // --- Drag-to-Connect Direction Popup ---
  showConnDirectionPopup = signal(false);
  connPopupPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  pendingConnection = signal<{ sourceId: string; targetId: string } | null>(null);
  private connPopupTimer: ReturnType<typeof setTimeout> | null = null;

  // Delete Confirmation Dialog
  showDeleteConfirm = signal(false);

  // Toast notification for save/load debugging
  toastMessage = signal('');
  toastVisible = signal(false);
  toastIsError = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  private sub = new Subscription();
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingAutoSave = false;

  constructor() {
    // Sync Services Input to Graph
    effect(() => {
      if (!this.isInitialized()) return;
      const services = this.services();
      const allComponents = this.registry.allComponents(); // Dependency to ensure loaded

      if (!services || services.length === 0) return;
      if (allComponents.length === 0) return; // Wait for registry (at least fallback)
      // Only resolve visual styles when backend registry is loaded.
      // INITIAL_REGISTRY uses string IDs (sys-rest, sys-cache) that won't
      // match the numeric IDs returned by the /api/v1/services endpoint.
      const registryReady = this.registry.backendLoaded();

      // Skip full rebuild when nothing changed (prevents position snap-back on poll cycles).
      // Key includes per-service visual style so editing a ServiceType's
      // defaultComponentId (or a service's componentOverrideId) triggers a
      // full rebuild that re-resolves the 3D component.
      // Also includes dependency count so new connections between existing
      // services are picked up during polling without a manual refresh.
      const key = services
        .map(s => `${s.id}:${s.componentOverrideId ?? ''}:${s.type?.defaultComponentId ?? s.type?.defaultComponent?.id ?? ''}`)
        .sort().join(',') + `|deps:${this.dependencies().length}`;
      if (key === this.lastServiceKey && registryReady === this.lastRegistryReady) {
        // Lightweight update: refresh labels without clearScene
        services.forEach(svc => {
          const node = this.vizService.getNode(String(svc.id));
          if (node) {
            node.label = svc.name;
            node.description = svc.description || 'No description';
          }
        });
        this.vizService.updateAllLabels();
        return;
      }
      this.lastServiceKey = key;
      this.lastRegistryReady = registryReady;

      // Clear existing scene first
      this.vizService.clearScene();

      // Calculate a simple layout (grid or circle)
      const count = services.length;
      const radius = Math.max(10, count * 2);

      services.forEach((svc, i) => {
        // Resolve Visual Component
        let compConfig = this.registry.getConfigById(String(svc.componentOverrideId));

        // Try ServiceType.defaultComponentId (numeric, from API when set)
        if (!compConfig && svc.type?.defaultComponentId) {
          compConfig = this.registry.getConfigById(String(svc.type.defaultComponentId));
        }

        // Fallback: backend returns `type.defaultComponent: { id: N }` but
        // NOT `type.defaultComponentId` (it's @Transient). The number may
        // come through as number or string — getConfigById coerces with String().
        if (!compConfig && svc.type?.defaultComponent?.id !== undefined &&
            svc.type.defaultComponent.id !== null) {
          compConfig = this.registry.getConfigById(String(svc.type.defaultComponent.id));
        }

        // Fallback or use resolved config
        const typeSlug = compConfig ? compConfig.type : 'box';
        // Note: 'box' isn't really a type slug but generic geometry. 
        // We need a valid registered type slug for addNode to lookup config again?
        // OR addNode should accept the config object directly.
        // Current addNode implementation looks up config by type slug.
        // So we should pass the type slug if found, or a fallback.

        // Position
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Add Node
        // We pass the svc.id as idOverride so we can map back later
        this.vizService.addNode(
          compConfig ? compConfig.type : 'sys-rest', // fallback type to existing system one
          { x, y: 0, z },
          svc.name,
          svc.description || 'No description',
          compConfig ? undefined : undefined, // Color override handled by config lookup in viz service usually
          String(svc.id)
        );
      });

      // Handle Dependencies — also wire edge labels (type + criticality)
      this.vizService.clearEdgeLabels();
      this.dependencies().forEach(dep => {
        const fromId = String(dep.sourceServiceId);
        const toId = String(dep.targetServiceId);
        this.vizService.connectNodes(fromId, toId);
        this.vizService.setEdgeLabel(fromId, toId, dep.dependencyType ?? 'REQUIRED', undefined);
      });

      // Restore user-created and DB-loaded connections that clearScene() snapshot
      // before the rebuild. connectNodes deduplicates, so dependency edges already
      // wired above are preserved without duplication.
      this.vizService.restoreSavedConnections();

      // Re-apply collapsed state so collapsed systems survive graph rebuilds
      // (poll cycles). This re-hides member meshes and re-redirects connections.
      this.vizService.reapplyCollapsedState();

      // Re-apply drill-down state so the drilled-down view survives rebuilds.
      // Must run AFTER reapplyCollapsedState so drill-down visibility overrides.
      this.vizService.reapplyDrillDownState();

      // Try to load the default graph view for camera + position overrides
      if (!this.hasLoadedDefaultView) {
        this.hasLoadedDefaultView = true;
        this.loadDefaultView().catch(err => console.warn('[ServiceGraph] Default view load skipped:', err));
      }

    }, { allowSignalWrites: true });

    // Sync Selected Node to Form (Inspector)
    effect(() => {
      // ... existing sync logic ...
      const node = this.selectedNodeData();
      if (node) {
        this.formLabel = node.label;
        this.formDesc = node.description;
        this.formColor = node.color;
        this.formX = Number(node.position?.x?.toFixed(2) || "0");
        this.formY = Number(node.position?.y?.toFixed(2) || "0");
        this.formZ = Number(node.position?.z?.toFixed(2) || "0");

        this.isInspectorOpen.set(true);
        this.selectedTargetId = '';
        this.cdr.markForCheck();

        // Find corresponding service if any
        const match = this.services().find(s => String(s.id) === node.id);
        if (match) {
          this.selectedNode.emit(match);
        }
      }
    });

    // Listen for Double Click — drill into collapsed systems, or focus label
    this.sub.add(this.vizService.nodeDoubleClicked.subscribe((id) => {
      // If the double-clicked node is a collapsed system, drill into it
      if (this.vizService.isSystemCollapsed(id)) {
        this.vizService.drillDown(id);
        return;
      }
      // Otherwise, focus the label input for editing
      setTimeout(() => {
        if (this.labelInput) this.labelInput.nativeElement.focus();
      }, 50);
    }));

    // Watch for view load requests from toolbar
    effect(() => {
      const viewId = this.atlas.loadRequested();
      if (viewId !== null) {
        this.loadView(viewId);
        this.atlas.loadRequested.set(null);
      }
    }, { allowSignalWrites: true });

    // Watch for save requests from toolbar
    effect(() => {
      const name = this.atlas.saveRequested();
      if (name !== null) {
        this.saveCurrentView(name);
        this.atlas.saveRequested.set(null);
      }
    }, { allowSignalWrites: true });

    // Apply configurable bloom parameters when provided
    effect(() => {
      const params = this.bloomParams();
      if (!params) return;
      this.vizService.setBloomParams(
        params.strength ?? this.vizService.bloomStrength(),
        params.radius ?? this.vizService.bloomRadius(),
        params.threshold ?? this.vizService.bloomThreshold()
      );
    }, { allowSignalWrites: true });

    // Pause the 3D renderer while the Component Creator sub-view is open
    effect(() => {
      this.vizService.setPaused(this.graphSubView() === 'creator');
    }, { allowSignalWrites: true });

    // Auto-save after drag or camera changes (debounced 500ms)
    this.sub.add(this.vizService.nodePositionChanged.subscribe(() => this.scheduleAutoSave()));
    this.sub.add(this.vizService.cameraChanged.subscribe(() => this.scheduleAutoSave()));
    // Auto-save when edges are added/removed/toggled — connections must persist
    this.sub.add(this.vizService.connectionsChanged.subscribe(() => this.scheduleAutoSave()));

    // Drag-to-Connect: when a Shift+Drag connection completes, show the direction popup
    this.sub.add(this.vizService.connectionCreated.subscribe(({ sourceId, targetId, screenX, screenY }) => {
      this.pendingConnection.set({ sourceId, targetId });
      // Position the popup near the drop point, clamped to the viewport
      const padding = 10;
      const popupW = 180;
      const popupH = 50;
      const x = Math.min(screenX + padding, window.innerWidth - popupW - padding);
      const y = Math.min(screenY + padding, window.innerHeight - popupH - padding);
      this.connPopupPos.set({ x, y });
      this.showConnDirectionPopup.set(true);
      this.cdr.markForCheck();

      // Auto-dismiss after 4 seconds (defaults to bidirectional)
      if (this.connPopupTimer) clearTimeout(this.connPopupTimer);
      this.connPopupTimer = setTimeout(() => this.confirmDragConnection('bidirectional'), 4000);
    }));
  }

  ngAfterViewInit() {
    if (this.canvasContainer) {
      this.vizService.initialize(this.canvasContainer.nativeElement);
      this.isInitialized.set(true);
    }
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    if (this.connPopupTimer) clearTimeout(this.connPopupTimer);
    this.vizService.dispose();
    this.sub.unsubscribe();
  }

  // --- Context Menu Handlers ---

  onContextMenu(event: MouseEvent) {
    event.preventDefault();

    // Determine if we clicked a node
    const hitId = this.vizService.getHitNodeId(event);
    // Determine world position for potential new node
    const worldPos = this.vizService.getWorldPosition(event);

    // If we hit a node, select it right away
    if (hitId) {
      this.vizService.selectNode(hitId);
    }

    this.contextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      targetNodeId: hitId,
      worldPos: worldPos
    });
  }

  closeContextMenu() {
    if (this.contextMenu().visible) {
      this.contextMenu.update(s => ({ ...s, visible: false }));
    }
  }

  onContextAction(action: 'new' | 'edit' | 'delete', payload?: any) {
    const menuState = this.contextMenu();

    if (action === 'delete') {
      // If we right-clicked a node, delete it.
      // Otherwise check if a node is currently selected (fallback logic)
      const target = menuState.targetNodeId || this.vizService.selectedNodeData()?.id;
      if (target) {
        this.vizService.deleteNode(target);
      }
    } else if (action === 'new' && payload) {
      // Payload is the Type ID
      const pos = menuState.worldPos || { x: 0, y: 0, z: 0 };
      this.vizService.snapshotForUndo();
      const id = this.vizService.addNode(payload, pos);
      this.vizService.selectNode(id);
      this.setMode('edit'); // Switch to edit so they can fine tune
    }

    this.closeContextMenu();
  }

  /** Collapse a System node — hide its children and redirect their connections. */
  onCollapseSystem() {
    const targetId = this.contextMenu().targetNodeId;
    if (!targetId) return;

    const memberIds = this.childrenMap().get(targetId) ?? [];
    if (memberIds.length === 0) return;

    this.vizService.snapshotForUndo();
    this.vizService.collapseSystem(targetId, memberIds);
    this.closeContextMenu();
  }

  /** Explode a System node — restore its children and their connections. */
  onExplodeSystem() {
    const targetId = this.contextMenu().targetNodeId;
    if (!targetId) return;

    this.vizService.snapshotForUndo();
    this.vizService.explodeSystem(targetId);
    this.closeContextMenu();
  }

  /** Escape from drill-down mode — return to the parent graph view. */
  onEscapeDrillDown() {
    this.vizService.escapeDrillDown();
    this.closeContextMenu();
  }

  // --- Enhancement Handlers ---

  /** Search & Highlight — highlight matching nodes, dim non-matching. */
  onSearchInput(value: string) {
    this.searchTerm.set(value);
    this.vizService.searchNodes(value);
  }

  /** Clear the search and restore normal highlighting. */
  clearSearch() {
    this.searchTerm.set('');
    this.vizService.searchNodes('');
  }

  /** Apply a layout preset. */
  onApplyLayout(type: 'radial' | 'grid' | 'hierarchical' | 'force') {
    this.vizService.snapshotForUndo();
    this.vizService.applyLayout(type);
    this.scheduleAutoSave();
  }

  /** Capture canvas as PNG and trigger download. */
  onExportPNG() {
    const dataUrl = this.vizService.captureCanvasPNG();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `service-mesh-${Date.now()}.png`;
    link.click();
    this.showExportMenu.set(false);
  }

  /** Export topology as JSON and trigger download. */
  onExportJSON() {
    const json = this.vizService.exportTopologyJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `service-mesh-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.showExportMenu.set(false);
  }

  /** Undo the last graph mutation. */
  onUndo() {
    this.vizService.undo();
    this.scheduleAutoSave();
  }

  /** Redo the last undone action. */
  onRedo() {
    this.vizService.redo();
    this.scheduleAutoSave();
  }

  /** Auto-detect system clusters via strongly connected components. */
  onAutoDetectSystems() {
    const systems = this.vizService.autoDetectSystems();
    if (systems.length === 0) {
      this.showToast('No tightly-connected clusters detected');
      return;
    }
    this.detectedSystems.set(systems);
    this.showAutoDetectPopup.set(true);
  }

  /** Collapse a detected cluster (from the auto-detect popup).
   *  Uses the first node as the "system" ID. */
  onCollapseDetected(members: string[]) {
    if (members.length < 2) return;
    // Use the first member as the system ID for grouping
    const systemId = members[0];
    const otherMembers = members.slice(1);
    this.vizService.snapshotForUndo();
    this.vizService.collapseSystem(systemId, otherMembers);
    this.showAutoDetectPopup.set(false);
  }

  /** Capture current graph as a diff baseline. */
  onCaptureDiffBaseline() {
    this.vizService.captureDiffBaseline();
    this.showToast('Diff baseline captured — new nodes/edges will be highlighted green');
  }

  /** Clear diff mode. */
  onClearDiffMode() {
    this.vizService.clearDiffMode();
    this.showToast('Diff mode cleared');
  }

  /** Toggle edge labels (dependency type) visibility. */
  onToggleEdgeLabels() {
    const next = !this.edgeLabelsVisible();
    this.edgeLabelsVisible.set(next);
    this.vizService.setEdgeLabelsVisible(next);
  }

  /** Toggle live health pulse animation. */
  onToggleHealthPulse() {
    const next = !this.healthPulseEnabled();
    this.vizService.setHealthPulseEnabled(next);
    if (next) {
      // Load health data from deployments
      const healthEntries = this.deployments()
        .filter(d => d.service && d.healthStatus)
        .map(d => ({
          id: String(d.service.id),
          status: d.healthStatus as 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED',
        }));
      this.vizService.setNodeHealthBatch(healthEntries);
      this.showToast(`Health pulse enabled — ${healthEntries.length} deployments mapped`);
    } else {
      this.showToast('Health pulse disabled');
    }
  }

  /** Open the Component Creator in edit mode for the selected node's type. */
  onEditComponent() {
    const targetId = this.contextMenu().targetNodeId || this.selectedNodeData()?.id;
    if (!targetId) return;

    const node = this.vizService.getNode(targetId);
    if (!node) return;

    const compConfig = this.registry.getConfig(node.type);
    if (!compConfig) {
      console.warn(`[edit] No component config found for type '${node.type}'`);
      return;
    }

    // selectComponent handles system vs custom:
    // - System components prompt to create a derived copy (read-only)
    // - Custom components open directly in edit mode
    this.creatorState.selectComponent(compConfig);

    // Only switch to the Creator sub-view if a config was actually opened.
    // For system components, the user may decline the "create derived?" prompt,
    // in which case activeConfig stays null and we should not switch views.
    if (this.creatorState.activeConfig()) {
      this.graphSubViewChange.emit('creator');
    }

    this.closeContextMenu();
  }

  /** Open the Add Registered Service dialog. */
  onAddRegisteredService() {
    this.showAddServiceDialog.set(true);
    this.closeContextMenu();
  }

  /** Handle service selection from the Add Registered Service dialog. */
  onServiceSelected(service: ServiceInstance) {
    this.showAddServiceDialog.set(false);
    this.vizService.snapshotForUndo();

    // Resolve the visual component for this service type
    let compConfig = this.registry.getConfigById(String(service.componentOverrideId));
    if (!compConfig && service.type?.defaultComponentId) {
      compConfig = this.registry.getConfigById(String(service.type.defaultComponentId));
    }
    if (!compConfig && service.type?.defaultComponent?.id !== undefined &&
        service.type.defaultComponent.id !== null) {
      compConfig = this.registry.getConfigById(String(service.type.defaultComponent.id));
    }

    const typeSlug = compConfig ? compConfig.type : 'sys-rest';

    // Use the world position from the context menu, or a random position if not available
    const pos = this.contextMenu().worldPos || { x: 0, y: 0, z: 0 };

    // Add the node with the service's ID as idOverride so we can map back
    const id = this.vizService.addNode(
      typeSlug,
      pos,
      service.name,
      service.description || 'No description',
      undefined,
      String(service.id)
    );
    this.vizService.selectNode(id);
    this.setMode('edit');

    // Emit the selected service so the parent can update its service list
    this.selectedNode.emit(service);
  }

  // --- Actions ---

  setMode(mode: 'camera' | 'edit') {
    this.vizService.setViewMode(mode);
  }

  switchCamera() {
    this.vizService.switchActiveCamera();
  }

  toggleSimulation() {
    this.vizService.toggleSimulation(!this.isSimulationActive());
  }

  addNode(type: NodeType) {
    const x = (Math.random() - 0.5) * 40;
    const y = (Math.random() - 0.5) * 20 + 10;
    const z = (Math.random() - 0.5) * 20;
    const id = this.vizService.addNode(type, { x, y, z });
    this.vizService.selectNode(id);

    // Auto switch to edit mode when adding so they can move it
    this.setMode('edit');
  }

  // --- Graph Views (Atlas) ---

  async loadView(id: number): Promise<void> {
    try {
      this.vizService.clearUserDraggedNodes(); // fresh slate for each load
      const view = await this.atlas.getById(id);
      this.atlas.selectedViewId.set(id);

      // Apply camera 1 state to the live camera (preset 1 is set inside setCameraState)
      this.vizService.setCameraState(
        new THREE.Vector3(view.cameraPositionX, view.cameraPositionY, view.cameraPositionZ),
        new THREE.Vector3(view.cameraTargetX, view.cameraTargetY, view.cameraTargetZ)
      );

      // Load camera 2 preset from saved data
      if (view.camera2PositionX !== undefined) {
        this.vizService.setCameraPreset(2,
          new THREE.Vector3(view.camera2PositionX, view.camera2PositionY, view.camera2PositionZ),
          new THREE.Vector3(view.camera2TargetX, view.camera2TargetY, view.camera2TargetZ)
        );
      }

      // Apply node positions + metadata (fromLoadView skips nodes user already dragged)
      if (view.positions) {
        for (const pos of view.positions) {
          this.vizService.setNodePosition(pos.nodeId, pos.positionX, pos.positionY, pos.positionZ, true);
          // Only apply metadata fields that are actually present (avoid undefined overwrites)
          const updates: Partial<NodeData> = {};
          if (pos.label !== undefined) updates.label = pos.label;
          if (pos.description !== undefined) updates.description = pos.description;
          if (pos.color !== undefined) updates.color = pos.color;
          if (Object.keys(updates).length > 0) {
            this.vizService.updateNode(pos.nodeId, updates);
          }
        }
      }

      // Restore connections (backend returns as an array)
      const conns = view.connections;
      if (conns && conns.length > 0) {
        this.vizService.restoreConnections(conns);
      }

      // Always start on camera 1 after loading a view
      if (this.vizService.activeCamera() === 2) {
        this.vizService.switchActiveCamera();
      }
    } catch (e) {
      console.error('Failed to load graph view', e);
    }
  }

  /** Build a view payload from the current scene state. */
  private buildViewPayload(name: string): any {
    return this.vizService.buildAtlasViewPayload(name);
  }

  async saveCurrentView(name: string): Promise<void> {
    try {
      const view = this.buildViewPayload(name);
      const currentId = this.atlas.selectedViewId();
      if (currentId !== null) {
        await this.atlas.update(currentId, view);
        this.showToast(`Saved "${name}"`);
      } else {
        const created = await this.atlas.create(view);
        this.showToast(`Created "${name}"`);
      }
    } catch (e) {
      console.error('Failed to save graph view', e);
      this.showToast('Save failed — check console', true);
    }
  }

  async loadDefaultView(): Promise<void> {
    try {
      // Only run on initial load — don't switch views mid-session
      if (this.atlas.selectedViewId() !== null) return;

      await this.atlas.refresh();
      const views = this.atlas.views();
      if (views.length === 0) return;

      // Load the most recently updated view, not just isDefault.
      // This ensures auto-saved changes survive restarts even after a "Save As"
      // switches selectedViewId to a new (non-default) view.
      const latest = views
        .filter(v => v.updatedAt)
        .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())[0]
        ?? views[0];

      if (latest.id) {
        await this.loadView(latest.id);
        this.showToast(`Loaded "${latest.name ?? 'view'}"`);
        // User-dragged nodes during load take priority over DB — clear tracking now
        this.vizService.clearUserDraggedNodes();
      }

      // If there are pending auto-saves queued before the view was loaded, flush now.
      if (this.pendingAutoSave) {
        this.pendingAutoSave = false;
        this.flushAutoSave();
      }
    } catch (e) {
      console.error('Failed to load default graph view', e);
    }
  }

  clearCanvas() {
    this.vizService.snapshotForUndo();
    this.vizService.clearScene();
  }

  resetDemo() {
    if (confirm('Discard changes and reload default demo?')) {
      this.vizService.loadDefaultScene();
    }
  }

  // --- Camera Controls ---

  updateBgColor(color: string) {
    this.bgColor = color;
    this.vizService.setBackgroundColor(color);
  }

  zoomIn() { this.vizService.zoomCamera(10); }
  zoomOut() { this.vizService.zoomCamera(-10); }
  rotateLeft() { this.vizService.rotateCamera(0.2); }
  rotateRight() { this.vizService.rotateCamera(-0.2); }

  // --- Save / Load (Atlas DB) ---

  async saveToAtlas() {
    // Always "Save As" — prompt for a name and create a brand-new view copy
    const name = window.prompt('Save view as:');
    if (!name || !name.trim()) return;

    try {
      await this.atlas.create(this.buildViewPayload(name.trim()));
      this.showToast(`Created "${name.trim()}"`);
    } catch (e) {
      console.error('Save As failed', e);
      this.showToast('Save As failed — check console', true);
    }
  }

  openLoadDialog() {
    this.atlas.refresh();
    this.showLoadDialog.set(true);
  }

  closeLoadDialog() {
    this.showLoadDialog.set(false);
  }

  async onSelectLoadView(id: number) {
    this.showLoadDialog.set(false);
    await this.loadView(id);
  }

  // --- File methods removed, using Atlas DB ---

  // --- Form Handling ---

  onFormChange() {
    const node = this.selectedNodeData();
    if (!node) return;

    this.vizService.updateNode(node.id, {
      label: this.formLabel,
      description: this.formDesc,
      color: this.formColor,
      position: { x: this.formX, y: this.formY, z: this.formZ }
    });

    // Auto-save whenever inspector values change
    this.scheduleAutoSave();
  }

  deleteSelected() {
    const node = this.selectedNodeData();
    if (node) {
      this.vizService.deleteNode(node.id);
    }
  }

  // --- Connections ---

  addConnection(direction: 'out' | 'in' | 'bidirectional' = 'out') {
    const current = this.selectedNodeData();
    if (!current || !this.selectedTargetId) return;
    this.vizService.snapshotForUndo();

    let fromId: string, toId: string;
    if (direction === 'in') {
      fromId = this.selectedTargetId;
      toId = current.id;
    } else {
      fromId = current.id;
      toId = this.selectedTargetId;
    }

    this.vizService.connectNodes(fromId, toId);
    if (direction === 'bidirectional') {
      this.vizService.toggleConnectionDirection(fromId, toId);
    }
    this.selectedTargetId = '';
  }

  removeConnection(targetId: string) {
    const current = this.selectedNodeData();
    if (!current) return;
    this.vizService.snapshotForUndo();
    // If this is an inbound connection (targetId has current in its connectedTo),
    // disconnect from their side so the visual line is properly removed
    const targetNode = this.vizService.getNode(targetId);
    if (targetNode?.connectedTo.includes(current.id)) {
      this.vizService.disconnectNodes(targetId, current.id);
    } else {
      this.vizService.disconnectNodes(current.id, targetId);
    }
  }

  /** Confirm a drag-to-connect connection with the chosen direction.
   *  Bidirectional is the default (per architect direction 2026-07-27). */
  confirmDragConnection(direction: 'out' | 'in' | 'bidirectional') {
    const pending = this.pendingConnection();
    if (this.connPopupTimer) {
      clearTimeout(this.connPopupTimer);
      this.connPopupTimer = null;
    }
    this.showConnDirectionPopup.set(false);
    if (!pending) return;

    this.vizService.snapshotForUndo();

    let fromId: string, toId: string;
    if (direction === 'in') {
      fromId = pending.targetId;
      toId = pending.sourceId;
    } else {
      fromId = pending.sourceId;
      toId = pending.targetId;
    }

    this.vizService.connectNodes(fromId, toId);
    if (direction === 'bidirectional') {
      this.vizService.toggleConnectionDirection(fromId, toId);
    }

    // Select the source node so the inspector shows the new connection
    this.vizService.selectNode(pending.sourceId);
    this.pendingConnection.set(null);
  }

  /** Cancel the direction popup without creating a connection. */
  cancelDragConnection() {
    if (this.connPopupTimer) {
      clearTimeout(this.connPopupTimer);
      this.connPopupTimer = null;
    }
    this.showConnDirectionPopup.set(false);
    this.pendingConnection.set(null);
  }

  toggleConnectionDirection(targetId: string, direction: 'out' | 'in' | 'bidirectional') {
    const current = this.selectedNodeData();
    if (!current) return;
    this.vizService.snapshotForUndo();

    // Use the 3-state cycle: bidirectional → out → in → bidirectional
    // cycleConnectionDirection takes the "current" node as fromId and the
    // "other" node as toId, and figures out the current state internally.
    this.vizService.cycleConnectionDirection(current.id, targetId);
    // Force inspector refresh
    this.vizService.selectNode(current.id);
  }

  toggleInspector() { this.isInspectorOpen.update(v => !v); }

  confirmDelete() {
    this.vizService.snapshotForUndo();
    this.vizService.deleteSelectedNodes();
    this.showDeleteConfirm.set(false);
  }

  /** Debounce auto-save so rapid inspector edits don't hammer the API. */
  private scheduleAutoSave(): void {
    if (this.atlas.selectedViewId() === null) {
      this.pendingAutoSave = true;
      console.warn('[auto-save] deferred — no view loaded yet (selectedViewId is null)');
      return;
    }
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => this.flushAutoSave(), 500);
  }

  /** Execute auto-save immediately (called from debounced timer or pending flush). */
  private flushAutoSave(): void {
    const currentId = this.atlas.selectedViewId();
    if (currentId === null) return;
    const existingView = this.atlas.views().find(v => v.id === currentId);
    if (!existingView?.name) return;
    this.saveCurrentView(existingView.name);
  }

  /** Show a toast notification (auto-fades after 2.5s). */
  private showToast(message: string, isError = false): void {
    this.toastMessage.set(message);
    this.toastIsError.set(isError);
    this.toastVisible.set(true);
    this.cdr.markForCheck();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible.set(false);
      this.cdr.markForCheck();
    }, 2500);
  }
}