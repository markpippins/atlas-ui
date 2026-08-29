import { Injectable, signal, computed, inject } from '@angular/core';
import { ComponentRegistryService } from './component-registry.service.js';
import { ComponentConfig } from '../models/component-config.js';

/**
 * Manages state for the Component Creator feature across multiple UI locations
 * (sidebar library, main editor, detail pane preview)
 */
@Injectable({
    providedIn: 'root'
})
export class ComponentCreatorStateService {
    private registry = inject(ComponentRegistryService);

    // Currently selected/active component for editing
    private _activeConfig = signal<ComponentConfig | null>(null);
    private _selectedId = signal<string | null>(null);
    private _isEditingExisting = signal(false);

    // Public readonly accessors
    activeConfig = this._activeConfig.asReadonly();
    selectedId = this._selectedId.asReadonly();
    isEditingExisting = this._isEditingExisting.asReadonly();

    // Computed lists
    systemComponents = computed(() => this.registry.allComponents().filter(c => c.isSystem));
    customComponents = computed(() => this.registry.allComponents().filter(c => !c.isSystem));
    allTypes = this.registry.availableTypes;

    selectComponent(comp: ComponentConfig): void {
        if (comp.isSystem) {
            // System components are read-only, suggest inheritance
            if (confirm(`System components are read-only. Create a new component based on '${comp.name}'?`)) {
                this.createFrom(comp);
            }
        } else {
            // Deep copy for form
            const copy = JSON.parse(JSON.stringify(comp));
            this._selectedId.set(comp.id);
            this._activeConfig.set(copy);
            this._isEditingExisting.set(true);
        }
    }

    startNew(): void {
        const base = this.systemComponents()[0];
        if (base) {
            this.createFrom(base);
        }
    }

    createFrom(parent: ComponentConfig): void {
        const newConfig = this.registry.createDerivedComponent(parent.id, `New ${parent.name}`);
        this._activeConfig.set(newConfig);
        this._selectedId.set(null);
        this._isEditingExisting.set(false);
    }

    cancel(): void {
        this._activeConfig.set(null);
        this._selectedId.set(null);
    }

    save(): void {
        const form = this._activeConfig();
        if (!form) return;

        if (this._isEditingExisting()) {
            this.registry.updateComponent(form.id, form);
        } else {
            this.registry.addComponent(form);
            this._selectedId.set(form.id);
            this._isEditingExisting.set(true);
        }
    }

    deleteCurrent(): void {
        const form = this._activeConfig();
        if (form && !form.isSystem) {
            if (confirm('Delete this component definition? Existing nodes on the canvas may break.')) {
                this.registry.deleteComponent(form.id);
                this._activeConfig.set(null);
            }
        }
    }

    updateField(field: keyof ComponentConfig, value: unknown): void {
        const current = this._activeConfig();
        if (current) {
            (current as unknown as Record<string, unknown>)[field] = value;
            // Trigger reactivity by creating a new reference
            this._activeConfig.set({ ...current });
        }
    }

    getParentName(id: string): string {
        return this.registry.getConfigById(id)?.name || 'Unknown';
    }

    getLabelForType(type: string): string {
        return this.registry.getConfig(type).name;
    }
}
