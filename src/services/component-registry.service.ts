
import { Injectable, signal, computed, inject } from '@angular/core';
import { ComponentConfig, INITIAL_REGISTRY, NodeType } from '../models/component-config.js';
import { PlatformManagementService } from './platform-management.service.js';
import { RegistryServerProfileService } from './registry-server-profile.service.js';
import { SERVICE_REGISTRY_ENV, SERVICE_REGISTRY_LEGACY, readEnv } from './endpoint-resolver.js';

@Injectable({
    providedIn: 'root'
})
export class ComponentRegistryService {
    private platformService = inject(PlatformManagementService);
    private registryServerProfileService = inject(RegistryServerProfileService);

    // Master list of all components
    private registry = signal<ComponentConfig[]>([]);

    /** Whether backend components have been successfully loaded at least once. */
    public readonly backendLoaded = signal(false);

    // Derived Accessors
    public allComponents = computed(() => {
        return [...this.registry()].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
    });

    public availableTypes = computed(() => this.registry().map(c => c.type));

    constructor() {
        this.loadComponents();
    }

    private getBaseUrl(): string {
        // Prefer the active profile's resolved base URL over profiles[0]
        const activeUrl = this.registryServerProfileService.activeBaseUrl();
        if (activeUrl) return activeUrl;

        const profiles = this.registryServerProfileService.profiles();
        if (profiles.length === 0) {
            // T25 3.2 (R-A-2026-08-15-008): runtime lookup > env > legacy localhost.
            return readEnv(SERVICE_REGISTRY_ENV) || SERVICE_REGISTRY_LEGACY; // Default fallback
        }
        let url = profiles[0].registryServerUrl;
        if (!url.startsWith('http')) url = `http://${url}`;
        if (url.endsWith('/')) url = url.slice(0, -1);
        return url;
    }

    /** Retry loading components from the backend with exponential backoff. */
    async loadComponents(retries = 2): Promise<void> {
        const baseUrl = this.getBaseUrl();
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await this.platformService.getVisualComponents(baseUrl);
                const components = response.data;
                if (components && components.length > 0) {
                    this.registry.set(components);
                    this.backendLoaded.set(true);
                    console.log(`[ComponentRegistry] Loaded ${components.length} visual components from backend (attempt ${attempt + 1})`);
                    return;
                }
            } catch (e) {
                console.warn(`[ComponentRegistry] Attempt ${attempt + 1} failed to load visual components:`, e);
            }
            if (attempt < retries) {
                // Wait with exponential backoff before retry
                await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
            }
        }
        // All retries exhausted — fall back to initial registry only if we haven't
        // already loaded backend data on a prior attempt.
        if (!this.backendLoaded()) {
            console.warn('[ComponentRegistry] All load attempts failed, falling back to initial registry');
            this.registry.set([...INITIAL_REGISTRY]);
        }
    }

    /** Force a re-fetch of visual components from the backend. */
    async refresh(): Promise<void> {
        await this.loadComponents();
    }

    getConfig(type: NodeType): ComponentConfig {
        const config = this.registry().find(c => c.type === type);
        if (!config) {
            // Fallback
            return this.registry().find(c => c.type === 'internal') || this.registry()[0] || INITIAL_REGISTRY[0];
        }
        return config;
    }

    getConfigById(id: string): ComponentConfig | undefined {
        // ID is string (number from backend converted to string if needed)
        // Backend IDs are numbers, but frontend treats as string. 
        // I should ensure loose comparison or consistent type.
        return this.registry().find(c => String(c.id) === String(id));
    }

    async addComponent(config: ComponentConfig) {
        const baseUrl = this.getBaseUrl();
        // Exclude ID to let backend generate it
        const { id, ...rest } = config;
        const created = await this.platformService.createVisualComponent(baseUrl, rest);
        this.registry.update(current => [...current, created]);
        return created;
    }

    async updateComponent(id: string, updates: Partial<ComponentConfig>) {
        const baseUrl = this.getBaseUrl();
        const updated = await this.platformService.updateVisualComponent(baseUrl, id, updates);
        this.registry.update(current =>
            current.map(c => String(c.id) === String(id) ? updated : c)
        );
        return updated;
    }

    async deleteComponent(id: string) {
        const config = this.getConfigById(id);
        if (config?.isSystem) return;

        const baseUrl = this.getBaseUrl();
        await this.platformService.deleteVisualComponent(baseUrl, id);

        this.registry.update(current => current.filter(c => String(c.id) !== String(id)));
    }

    // Generates a new component config based on a parent (Visual Cloning)
    createDerivedComponent(parentId: string, newName: string): ComponentConfig {
        const parent = this.getConfigById(parentId);
        if (!parent) throw new Error('Parent not found');

        const newSlug = newName.toLowerCase().replace(/[^a-z0-9]/g, '-');

        return {
            ...parent, // Copy visual props
            id: '', // Empty ID (new)
            isSystem: false,
            type: `custom-${newSlug}-${Date.now().toString().slice(-4)}`,
            name: newName,
            description: `Derived from ${parent.name}`,
            createdAt: undefined,
            updatedAt: undefined
        };
    }
}
