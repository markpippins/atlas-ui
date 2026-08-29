import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentCreatorStateService } from '../../services/component-creator-state.service.js';
import { ComponentConfig } from '../../models/component-config.js';

@Component({
    selector: 'app-component-library',
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="flex flex-col h-full bg-[rgb(var(--color-surface-sidebar))] text-[rgb(var(--color-text-base))]">
      <!-- Header -->
      <div class="p-3 border-b border-[rgb(var(--color-border-base))]">
        <h2 class="text-sm font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider mb-2">Component Library</h2>
        <input 
          type="text" 
          placeholder="Filter components..." 
          class="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border-muted))] rounded px-2 py-1 text-sm focus:border-[rgb(var(--color-accent-ring))] focus:outline-none"
        >
      </div>
      
      <!-- Component Lists -->
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <div class="text-[10px] text-[rgb(var(--color-text-subtle))] px-2 py-1 uppercase font-bold">System</div>
        @for (comp of state.systemComponents(); track comp.id) {
          <button 
            (click)="state.selectComponent(comp)" 
            class="w-full text-left px-3 py-2 rounded border border-transparent hover:bg-[rgb(var(--color-surface-hover))] flex items-center gap-2 group cursor-pointer transition-colors"
          >
            <div [class]="comp.colorClass + ' ' + comp.iconClass" class="w-3 h-3 shadow-sm"></div>
            <span class="text-sm truncate">{{ comp.label }}</span>
            <span class="ml-auto text-[10px] text-[rgb(var(--color-text-subtle))] opacity-0 group-hover:opacity-100">⊕</span>
          </button>
        }

        <div class="text-[10px] text-[rgb(var(--color-text-subtle))] px-2 py-1 uppercase font-bold mt-4">Custom</div>
        @for (comp of state.customComponents(); track comp.id) {
          <button 
            (click)="state.selectComponent(comp)" 
            [class.bg-[rgb(var(--color-accent-bg))]]="state.selectedId() === comp.id"
            [class.border-[rgb(var(--color-accent-ring))]]="state.selectedId() === comp.id"
            class="w-full text-left px-3 py-2 rounded border border-transparent hover:bg-[rgb(var(--color-surface-hover))] flex items-center gap-2 group cursor-pointer transition-colors"
          >
            <div [class]="comp.colorClass + ' ' + comp.iconClass" class="w-3 h-3 shadow-sm"></div>
            <span class="text-sm truncate">{{ comp.label }}</span>
          </button>
        }
        @if (state.customComponents().length === 0) {
          <div class="text-sm text-[rgb(var(--color-text-subtle))] px-3 py-2 italic">No custom components yet.</div>
        }
      </div>

      <!-- Create New Button -->
      <div class="p-3 border-t border-[rgb(var(--color-border-base))]">
        <button 
          (click)="state.startNew()" 
          class="w-full bg-[rgb(var(--color-accent-solid-bg))] hover:bg-[rgb(var(--color-accent-solid-bg-hover))] text-white py-2 rounded text-sm font-bold transition-colors"
        >
          + Create New Component
        </button>
      </div>
    </div>
  `
})
export class ComponentLibraryComponent {
    state = inject(ComponentCreatorStateService);
}
