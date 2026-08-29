import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ServiceGraphComponent } from './components/service-graph/service-graph.component.js';
import { ServiceMeshService } from './services/service-mesh.service.js';

/**
 * Atlas — 3D Services Mesh Viewer.
 *
 * A stripped-down derivative of nexus-console that shows ONLY the
 * interactive 3D service mesh graph (canvas + component creator).
 * No console view, no file explorer, no sidebar, no nav toolbar.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ServiceGraphComponent],
})
export class AppComponent implements OnInit {
  private serviceMeshService = inject(ServiceMeshService);

  /** Sub-view inside the graph: 'canvas' (3D) or 'creator' (component builder). */
  graphSubView = signal<'canvas' | 'creator'>('canvas');

  /** Whether to show only running services. */
  showRunningOnly = signal(false);

  /** Services + dependencies pulled from the active registry profile. */
  readonly services = this.serviceMeshService.services;
  readonly dependencies = this.serviceMeshService.dependencies;
  readonly deployments = this.serviceMeshService.deployments;

  ngOnInit(): void {
    // Ensure data is fetched on startup (polling is started by the service
    // constructor; this is a belt-and-braces refresh).
    void this.serviceMeshService.fetchAllData();
  }

  onGraphSubViewChange(view: 'canvas' | 'creator'): void {
    this.graphSubView.set(view);
  }

  onRefreshServices(): void {
    void this.serviceMeshService.fetchAllData();
  }
}