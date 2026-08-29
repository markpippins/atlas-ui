import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { ComponentCreatorStateService } from '../../services/component-creator-state.service.js';
import { ComponentConfig } from '../../models/component-config.js';

@Component({
  selector: 'app-component-creator',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full w-full bg-[#0f172a] text-[#e2e8f0] overflow-hidden select-none">
      @if (state.activeConfig(); as form) {
        <!-- Editor Header -->
        <div class="px-6 py-3.5 border-b border-[#334155] bg-[#1e293b] flex justify-between items-center flex-shrink-0 shadow-sm">
          <div>
            <h2 class="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              @if (state.isEditingExisting()) {
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-[#22d3ee] border border-cyan-800 uppercase tracking-wide">Edit</span>
                <span>{{ form.name }}</span>
              } @else {
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase tracking-wide">New</span>
                <span>New Component</span>
              }
            </h2>
            @if (form.parentId) {
              <p class="text-xs text-[#94a3b8] mt-0.5">
                <span class="text-[#64748b]">Extends:</span> {{ state.getParentName(form.parentId) }}
              </p>
            }
          </div>
          
          <div class="flex items-center gap-2">
            @if (state.isEditingExisting() && !form.isSystem) {
              <button 
                (click)="state.deleteCurrent()" 
                class="text-xs font-medium text-[#f87171] hover:text-[#fecaca] bg-red-950/40 hover:bg-red-900/60 px-3 py-1.5 rounded border border-red-900/60 transition-all cursor-pointer"
              >
                Delete
              </button>
            }
            <button 
              (click)="state.cancel()" 
              class="text-xs font-medium text-[#94a3b8] hover:text-white bg-[#0f172a] hover:bg-[#334155] px-3.5 py-1.5 rounded border border-[#334155] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              (click)="onSave()" 
              class="text-xs font-semibold text-white bg-[#0891b2] hover:bg-[#06b6d4] active:bg-[#0e7490] px-4 py-1.5 rounded transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>💾</span> Save
            </button>
          </div>
        </div>

        <!-- Editor Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0f172a]">
          
          <!-- Identity Section -->
          <section class="space-y-3 max-w-3xl">
            <h3 class="text-xs font-bold text-[#22d3ee] uppercase tracking-wider border-b border-[#334155] pb-1.5 mb-3 flex items-center gap-2">
              Identity & Classification
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-[#94a3b8] mb-1.5">Label Name</label>
                <input 
                  [ngModel]="form.name" 
                  (ngModelChange)="state.updateField('name', $event)" 
                  placeholder="e.g. Authentication Service"
                  class="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-xs text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#22d3ee] transition-colors"
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-[#94a3b8] mb-1.5">Category</label>
                <input 
                  [ngModel]="form.category" 
                  (ngModelChange)="state.updateField('category', $event)"
                  placeholder="e.g. Security, Backend, Data"
                  class="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-xs text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#22d3ee] transition-colors"
                >
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-[#94a3b8] mb-1.5">Description</label>
              <textarea 
                [ngModel]="form.description" 
                (ngModelChange)="state.updateField('description', $event)"
                rows="2" 
                placeholder="Optional description of this component's purpose and role..."
                class="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-xs text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#22d3ee] transition-colors resize-none"
              ></textarea>
            </div>
          </section>

          <!-- Visuals Section -->
          <section class="space-y-3 max-w-3xl">
            <h3 class="text-xs font-bold text-[#22d3ee] uppercase tracking-wider border-b border-[#334155] pb-1.5 mb-3 flex items-center gap-2">
              3D Visual Properties
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-[#94a3b8] mb-1.5">Geometry / 3D Mesh Shape</label>
                <select 
                  [ngModel]="form.geometry" 
                  (ngModelChange)="state.updateField('geometry', $event)"
                  class="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-[#22d3ee] transition-colors cursor-pointer"
                >
                  <option value="sphere">Sphere</option>
                  <option value="box">Box (Cube)</option>
                  <option value="cylinder">Cylinder</option>
                  <option value="tall-cylinder">Tall Server Cylinder</option>
                  <option value="octahedron">Octahedron</option>
                  <option value="icosahedron">Icosahedron</option>
                  <option value="dodecahedron">Dodecahedron</option>
                  <option value="torus">Torus (Ring)</option>
                  <option value="cone">Cone</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-[#94a3b8] mb-1.5">Mesh Color</label>
                <div class="flex items-center gap-2.5">
                  <input 
                    type="color" 
                    [value]="colorHexStr()" 
                    (input)="onColorChange($event)" 
                    class="h-8 w-12 bg-[#1e293b] cursor-pointer rounded border border-[#334155] p-0.5"
                  >
                  <span class="text-xs font-mono self-center text-[#94a3b8] uppercase bg-[#1e293b] px-2.5 py-1.5 rounded border border-[#334155]">
                    {{ colorHexStr() }}
                  </span>
                </div>
              </div>
              <div class="md:col-span-2">
                <div class="flex justify-between items-center mb-1.5">
                  <label class="text-xs font-medium text-[#94a3b8]">3D Node Scale</label>
                  <span class="text-xs font-mono text-[#22d3ee] font-semibold">{{ form.scale }}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="5" 
                  step="0.1" 
                  [ngModel]="form.scale" 
                  (ngModelChange)="state.updateField('scale', $event)" 
                  class="w-full accent-[#22d3ee] h-1.5 bg-[#334155] rounded-lg appearance-none cursor-pointer"
                >
              </div>
            </div>
          </section>

          <!-- Rules Section -->
          <section class="space-y-3 max-w-3xl">
            <h3 class="text-xs font-bold text-[#22d3ee] uppercase tracking-wider border-b border-[#334155] pb-1.5 mb-3 flex items-center gap-2">
              Topology & Connection Rules
            </h3>
            
            <div>
              <label class="block text-xs font-medium text-[#94a3b8] mb-2">Allowed Outbound Connections</label>
              <div class="bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 max-h-48 overflow-y-auto space-y-1">
                <label class="flex items-center gap-2.5 text-xs hover:bg-[#334155] p-2 rounded cursor-pointer transition-colors border-b border-[#334155]/60 mb-1">
                  <input type="checkbox" [checked]="isAllowedAll()" (change)="toggleAllowed('all')" class="accent-[#22d3ee] rounded cursor-pointer">
                  <span class="font-bold text-[#22d3ee]">Allow All Outbound Connections</span>
                </label>
                
                @if (!isAllowedAll()) {
                  @for (type of state.allTypes(); track type) {
                    <label class="flex items-center gap-2.5 text-xs hover:bg-[#334155] px-2 py-1.5 rounded cursor-pointer transition-colors">
                      <input type="checkbox" [checked]="isConnectionAllowed(type)" (change)="toggleAllowed(type)" class="accent-[#22d3ee] rounded cursor-pointer">
                      <span class="text-[#cbd5e1]">{{ state.getLabelForType(type) }}</span>
                    </label>
                  }
                }
              </div>
            </div>
          </section>
        </div>
      } @else {
        <!-- Empty State -->
        <div class="flex-1 flex flex-col items-center justify-center text-[#64748b] bg-[#0f172a] p-8 text-center">
          <div class="w-16 h-16 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-2xl mb-4 text-[#94a3b8]">
            ⚙️
          </div>
          <p class="text-sm font-semibold text-[#e2e8f0] mb-1">Component Editor</p>
          <p class="text-xs text-[#94a3b8] max-w-xs mb-4">
            Select a component from the library on the left to customize its 3D geometry, colors, and connection rules, or build a new one.
          </p>
          <button 
            (click)="state.startNew()" 
            class="bg-[#0891b2] hover:bg-[#06b6d4] active:bg-[#0e7490] text-white px-4 py-2 rounded text-xs font-semibold tracking-wide transition-all shadow-sm cursor-pointer"
          >
            + Create Component
          </button>
        </div>
      }
    </div>
  `
})
export class ComponentCreatorComponent {
  state = inject(ComponentCreatorStateService);

  colorHexStr = computed(() => {
    const form = this.state.activeConfig();
    if (!form) return '#ffffff';
    return '#' + new THREE.Color(form.defaultColor).getHexString();
  });

  onColorChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const colorNum = parseInt(val.replace('#', ''), 16);
    this.state.updateField('defaultColor', colorNum);
  }

  onSave(): void {
    this.state.save();
  }

  isAllowedAll(): boolean {
    const form = this.state.activeConfig();
    return form ? form.allowedConnections === 'all' : false;
  }

  isConnectionAllowed(type: string): boolean {
    const form = this.state.activeConfig();
    if (!form) return false;
    if (form.allowedConnections === 'all') return true;
    return !!form.allowedConnections && form.allowedConnections.includes(type);
  }

  toggleAllowed(type: string | 'all'): void {
    const form = this.state.activeConfig();
    if (!form) return;

    if (type === 'all') {
      if (form.allowedConnections === 'all') {
        this.state.updateField('allowedConnections', []);
      } else {
        this.state.updateField('allowedConnections', 'all');
      }
    } else {
      let current: string[] = (Array.isArray(form.allowedConnections)
        ? [...form.allowedConnections]
        : []);

      if (current.includes(type)) {
        current = current.filter(t => t !== type);
      } else {
        current.push(type);
      }
      this.state.updateField('allowedConnections', current);
    }
  }
}
