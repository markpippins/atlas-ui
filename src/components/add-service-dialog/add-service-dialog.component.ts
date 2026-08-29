import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ServiceInstance } from '../../models/service-mesh.model.js';

interface RegistryService {
  id: number;
  name: string;
  description?: string;
  status?: string;
  defaultPort?: number;
  framework?: { name?: string; category?: { name?: string } };
  type?: { name?: string };
  parentServiceId?: number | null;
}

@Component({
  selector: 'app-add-service-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-service-dialog.component.html',
  styleUrls: ['./add-service-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.escape)': 'onClose()',
  },
})
export class AddServiceDialogComponent {
  isOpen = input.required<boolean>();
  existingNodeIds = input<string[]>([]);

  close = output<void>();
  serviceSelected = output<ServiceInstance>();

  private http = inject(HttpClient);

  constructor() {
    // Fetch services whenever the dialog opens (not just on init)
    effect(() => {
      if (this.isOpen()) {
        this.fetchServices();
      }
    });
  }

  // State
  allServices = signal<ServiceInstance[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');

  // Filtered services — excludes ones already in the graph + applies search filter
  filteredServices = computed(() => {
    const existing = new Set(this.existingNodeIds());
    const term = this.searchTerm().toLowerCase().trim();

    return this.allServices()
      .filter((s) => !existing.has(String(s.id)))
      .filter((s) => {
        if (!term) return true;
        const name = s.name.toLowerCase();
        const type = s.type?.name?.toLowerCase() ?? '';
        const framework = s.framework?.name?.toLowerCase() ?? '';
        const frameworkType = s.framework?.category?.name?.toLowerCase() ?? '';
        return (
          name.includes(term) ||
          type.includes(term) ||
          framework.includes(term) ||
          frameworkType.includes(term)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Fetch services from the registry. Public so the retry button can call it. */
  fetchServices(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<RegistryService[] | { data: RegistryService[] }>(
      'http://localhost:8085/api/v1/services',
    ).subscribe({
      next: (resp) => {
        const raw = Array.isArray(resp) ? resp : resp.data ?? [];
        // Map to ServiceInstance shape (simplified — only fields needed for graph node creation)
        const services: ServiceInstance[] = raw.map((r) => ({
          id: String(r.id),
          name: r.name,
          description: r.description,
          status: (r.status as any) ?? 'ACTIVE',
          defaultPort: r.defaultPort ?? 0,
          framework: {
            id: '',
            name: r.framework?.name ?? 'Unknown',
            category: { id: '', name: r.framework?.category?.name ?? 'Other' },
            language: { id: '', name: '' },
          } as any,
          type: {
            id: '',
            name: r.type?.name ?? 'REST API',
            defaultComponentId: undefined,
          } as any,
          parentServiceId: r.parentServiceId ?? undefined,
        }));
        this.allServices.set(services);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[AddServiceDialog] Failed to fetch services:', err);
        this.error.set('Failed to load services from registry. Is the service-registry running on port 8085?');
        this.loading.set(false);
      },
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onSelectService(service: ServiceInstance): void {
    this.serviceSelected.emit(service);
  }

  onClose(): void {
    this.close.emit();
  }

  /** Get a status badge color class. */
  statusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'DEPRECATED':
        return 'status-deprecated';
      case 'ARCHIVED':
        return 'status-archived';
      case 'PLANNED':
        return 'status-planned';
      default:
        return 'status-unknown';
    }
  }
}
