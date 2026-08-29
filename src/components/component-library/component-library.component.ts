import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentCreatorStateService } from '../../services/component-creator-state.service.js';
import { ComponentConfig } from '../../models/component-config.js';

@Component({
  selector: 'app-component-library',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-[#0f172a] text-[#e2e8f0] border-r border-[#334155] select-none">
      <!-- Header -->
      <div class="p-3 border-b border-[#334155] bg-[#0f172a] flex-shrink-0">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Component Library</h2>
          <span class="text-[10px] text-[#94a3b8] bg-[#1e293b] px-1.5 py-0.5 rounded border border-[#334155]">
            {{ filteredSystemComponents().length + filteredCustomComponents().length }}
          </span>
        </div>
        <div class="relative">
          <input 
            type="text" 
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Filter components..." 
            class="w-full bg-[#1e293b] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-[#e2e8f0] placeholder-[#64748b] focus:border-[#22d3ee] focus:outline-none transition-colors"
          >
          @if (searchTerm()) {
            <button 
              (click)="searchTerm.set('')"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#64748b] hover:text-[#e2e8f0]"
            >✕</button>
          }
        </div>
      </div>
      
      <!-- Component Lists -->
      <div class="flex-1 overflow-y-auto p-2 space-y-3">
        <!-- System Components -->
        <div>
          <div class="text-[10px] text-[#64748b] px-2 py-0.5 uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>System</span>
            <span class="text-[9px] text-[#475569]">{{ filteredSystemComponents().length }}</span>
          </div>
          <div class="mt-1 space-y-0.5">
            @for (comp of filteredSystemComponents(); track comp.id) {
              <button 
                (click)="state.selectComponent(comp)" 
                class="w-full text-left px-2.5 py-1.5 rounded-md border border-transparent hover:bg-[#1e293b] hover:border-[#334155] flex items-center gap-2.5 group cursor-pointer transition-all"
                [title]="comp.description || comp.name"
              >
                <div 
                  class="w-3.5 h-3.5 rounded-sm shadow-sm flex-shrink-0"
                  [style.background-color]="'#' + comp.defaultColor.toString(16).padStart(6, '0')"
                ></div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-[#e2e8f0] truncate group-hover:text-white">{{ comp.name }}</div>
                  @if (comp.category) {
                    <div class="text-[10px] text-[#64748b] truncate capitalize">{{ comp.category }}</div>
                  }
                </div>
                <span class="text-xs text-[#22d3ee] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" title="Create derived component">⊕</span>
              </button>
            }
            @if (filteredSystemComponents().length === 0 && searchTerm()) {
              <div class="text-xs text-[#64748b] px-2.5 py-1 italic">No matching system components</div>
            }
          </div>
        </div>

        <!-- Custom Components -->
        <div>
          <div class="text-[10px] text-[#64748b] px-2 py-0.5 uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Custom</span>
            <span class="text-[9px] text-[#475569]">{{ filteredCustomComponents().length }}</span>
          </div>
          <div class="mt-1 space-y-0.5">
            @for (comp of filteredCustomComponents(); track comp.id) {
              <button 
                (click)="state.selectComponent(comp)" 
                [class.bg-[#1e293b]]="state.selectedId() === comp.id"
                [class.border-[#22d3ee]]="state.selectedId() === comp.id"
                [class.text-[#22d3ee]]="state.selectedId() === comp.id"
                [class.border-transparent]="state.selectedId() !== comp.id"
                [class.hover:bg-[#1e293b]]="state.selectedId() !== comp.id"
                [class.hover:border-[#334155]]="state.selectedId() !== comp.id"
                class="w-full text-left px-2.5 py-1.5 rounded-md border flex items-center gap-2.5 group cursor-pointer transition-all"
                [title]="comp.description || comp.name"
              >
                <div 
                  class="w-3.5 h-3.5 rounded-sm shadow-sm flex-shrink-0"
                  [style.background-color]="'#' + comp.defaultColor.toString(16).padStart(6, '0')"
                ></div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-[#e2e8f0] truncate" [class.text-[#22d3ee]]="state.selectedId() === comp.id">{{ comp.name }}</div>
                  @if (comp.category) {
                    <div class="text-[10px] text-[#64748b] truncate capitalize">{{ comp.category }}</div>
                  }
                </div>
              </button>
            }
            @if (state.customComponents().length === 0) {
              <div class="text-xs text-[#64748b] px-3 py-2 italic bg-[#1e293b]/40 rounded border border-[#334155]/40 text-center">
                No custom components yet.
              </div>
            } @else if (filteredCustomComponents().length === 0 && searchTerm()) {
              <div class="text-xs text-[#64748b] px-2.5 py-1 italic">No matching custom components</div>
            }
          </div>
        </div>
      </div>

      <!-- Create New Button -->
      <div class="p-3 border-t border-[#334155] bg-[#0f172a] flex-shrink-0">
        <button 
          (click)="state.startNew()" 
          class="w-full bg-[#0891b2] hover:bg-[#06b6d4] active:bg-[#0e7490] text-white py-2 px-3 rounded text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <span class="text-sm font-bold">+</span> Create New Component
        </button>
      </div>
    </div>
  `
})
export class ComponentLibraryComponent {
  state = inject(ComponentCreatorStateService);
  searchTerm = signal('');

  filteredSystemComponents = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.state.systemComponents();
    if (!term) return all;
    return all.filter(c =>
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.type && c.type.toLowerCase().includes(term)) ||
      (c.category && c.category.toLowerCase().includes(term))
    );
  });

  filteredCustomComponents = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.state.customComponents();
    if (!term) return all;
    return all.filter(c =>
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.type && c.type.toLowerCase().includes(term)) ||
      (c.category && c.category.toLowerCase().includes(term))
    );
  });
}
