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
    <div class="flex flex-col h-full w-full bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-base))] overflow-hidden">
      @if (state.activeConfig(); as form) {
        <!-- Editor Header -->
        <div class="p-4 border-b border-[rgb(var(--color-border-base))] bg-[rgb(var(--color-surface-muted))] flex justify-between items-center flex-shrink-0">
          <div>
            <h2 class="text-sm font-bold text-[rgb(var(--color-text-base))]">
              {{ state.isEditingExisting() ? 'Edit Component' : 'New Component' }}
            </h2>
            @if (form.parentId) {
              <p class="text-sm text-[rgb(var(--color-text-muted))]">Extends: {{ state.getParentName(form.parentId) }}</p>
            }
          </div>
          
          <div class="flex gap-2">
            @if (state.isEditingExisting() && !form.isSystem) {
              <button 
                (click)="state.deleteCurrent()" 
                class="text-[rgb(var(--color-danger-text))] text-sm px-3 hover:underline"
              >
                Delete
              </button>
            }
            <button 
              (click)="state.cancel()" 
              class="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-base))] text-sm px-3 hover:underline"
            >
              Cancel
            </button>
            <button 
              (click)="onSave()" 
              class="bg-[rgb(var(--color-success-solid-bg))] hover:bg-[rgb(var(--color-success-solid-bg-hover))] text-white px-4 py-1 rounded text-sm font-bold"
            >
              Save
            </button>
          </div>
        </div>

        <!-- Editor Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Identity Section -->
          <section class="space-y-3">
            <h3 class="text-sm font-bold text-[rgb(var(--color-accent-text))] uppercase tracking-wider border-b border-[rgb(var(--color-border-muted))] pb-1">Identity</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-[rgb(var(--color-text-muted))] mb-1">Label Name</label>
                <input 
                  [ngModel]="form.name" 
                  (ngModelChange)="state.updateField('name', $event)" 
                  class="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border-muted))] rounded px-2 py-1 text-sm outline-none focus:border-[rgb(var(--color-accent-ring))]"
                >
              </div>
              <div>
                <label class="block text-sm text-[rgb(var(--color-text-muted))] mb-1">Category</label>
                <input 
                  [ngModel]="form.category" 
                  (ngModelChange)="state.updateField('category', $event)"
                  class="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border-muted))] rounded px-2 py-1 text-sm outline-none focus:border-[rgb(var(--color-accent-ring))]"
                >
              </div>
            </div>
            <div>
              <label class="block text-sm text-[rgb(var(--color-text-muted))] mb-1">Description</label>
              <textarea 
                [ngModel]="form.description" 
                (ngModelChange)="state.updateField('description', $event)"
                rows="2" 
                class="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border-muted))] rounded px-2 py-1 text-sm outline-none focus:border-[rgb(var(--color-accent-ring))]"
              ></textarea>
            </div>
          </section>

          <!-- Visuals Section -->
          <section class="space-y-3">
            <h3 class="text-sm font-bold text-[rgb(var(--color-accent-text))] uppercase tracking-wider border-b border-[rgb(var(--color-border-muted))] pb-1">Visuals</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-[rgb(var(--color-text-muted))] mb-1">Geometry / Shape</label>
                <select 
                  [ngModel]="form.geometry" 
                  (ngModelChange)="state.updateField('geometry', $event)"
                  class="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border-muted))] rounded px-2 py-1 text-sm outline-none focus:border-[rgb(var(--color-accent-ring))]"
                >
                  <option value="sphere">Sphere</option>
                  <option value="box">Box</option>
                  <option value="cylinder">Cylinder</option>
                  <option value="tall-cylinder">Tall Server</option>
                  <option value="octahedron">Octahedron</option>
                  <option value="icosahedron">Icosahedron</option>
                  <option value="torus">Torus</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-[rgb(var(--color-text-muted))] mb-1">Color</label>
                <div class="flex gap-2">
                  <input 
                    type="color" 
                    [value]="colorHexStr()" 
                    (input)="onColorChange($event)" 
                    class="h-8 w-12 bg-transparent cursor-pointer rounded border border-[rgb(var(--color-border-muted))]"
                  >
                  <span class="text-sm font-mono self-center text-[rgb(var(--color-text-muted))]">{{ colorHexStr() }}</span>
                </div>
              </div>
              <div class="col-span-2">
                <label class="block text-sm text-[rgb(var(--color-text-muted))] mb-1">Scale ({{ form.scale }}x)</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="5" 
                  step="0.1" 
                  [ngModel]="form.scale" 
                  (ngModelChange)="state.updateField('scale', $event)" 
                  class="w-full accent-[rgb(var(--color-accent-solid-bg))]"
                >
              </div>
            </div>
          </section>

          <!-- Rules Section -->
          <section class="space-y-3">
            <h3 class="text-sm font-bold text-[rgb(var(--color-accent-text))] uppercase tracking-wider border-b border-[rgb(var(--color-border-muted))] pb-1">Behavior & Rules</h3>
            
            <div>
              <label class="block text-sm text-[rgb(var(--color-text-muted))] mb-2">Allowed Outbound Connections</label>
              <div class="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border-muted))] rounded p-2 max-h-40 overflow-y-auto grid grid-cols-1 gap-1">
                <label class="flex items-center gap-2 text-sm hover:bg-[rgb(var(--color-surface-hover))] p-1 rounded cursor-pointer">
                  <input type="checkbox" [checked]="isAllowedAll()" (change)="toggleAllowed('all')">
                  <span class="font-bold text-[rgb(var(--color-accent-text))]">Allow All</span>
                </label>
                
                @if (!isAllowedAll()) {
                  @for (type of state.allTypes(); track type) {
                    <label class="flex items-center gap-2 text-sm hover:bg-[rgb(var(--color-surface-hover))] p-1 rounded cursor-pointer">
                      <input type="checkbox" [checked]="isConnectionAllowed(type)" (change)="toggleAllowed(type)">
                      <span class="text-[rgb(var(--color-text-base))]">{{ state.getLabelForType(type) }}</span>
                    </label>
                  }
                }
              </div>
            </div>
          </section>
        </div>
      } @else {
        <!-- Empty State -->
        <div class="flex-1 flex flex-col items-center justify-center text-[rgb(var(--color-text-subtle))]">
          <div class="text-5xl mb-4">🛠️</div>
          <p class="text-lg mb-2">Component Editor</p>
          <p class="text-sm">Select a component from the library to edit,</p>
          <p class="text-sm">or create a new one.</p>
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
