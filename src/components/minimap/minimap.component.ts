import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  inject,
  effect,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArchitectureVizService, NodeData } from '../../services/architecture-viz.service.js';

@Component({
  selector: 'app-minimap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './minimap.component.html',
  styleUrls: ['./minimap.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinimapComponent {
  isOpen = input<boolean>(false);

  private vizService = inject(ArchitectureVizService);
  private canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('minimapCanvas');

  // Local state for rendering
  private animFrame: number | null = null;
  isVisible = signal(false);

  // Expose allNodes for the template
  allNodes = this.vizService.allNodes;
  collapsedSystemIds = this.vizService.collapsedSystemIds;
  drilledDownSystemId = this.vizService.drilledDownSystemId;

  constructor() {
    // Start/stop the render loop when the minimap opens/closes
    effect(() => {
      const open = this.isOpen();
      this.isVisible.set(open);
      if (open) {
        this.startLoop();
      } else {
        this.stopLoop();
      }
    });
  }

  private startLoop(): void {
    const render = () => {
      this.draw();
      this.animFrame = requestAnimationFrame(render);
    };
    this.animFrame = requestAnimationFrame(render);
  }

  private stopLoop(): void {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  /** Draw the minimap — nodes as dots, connections as lines, viewport as a rect. */
  private draw(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = this.vizService.allNodes();
    if (nodes.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Compute bounds of all node positions
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x);
      minZ = Math.min(minZ, n.position.z);
      maxZ = Math.max(maxZ, n.position.z);
    }
    // Add padding
    const pad = 10;
    minX -= pad; maxX += pad; minZ -= pad; maxZ += pad;
    const worldW = maxX - minX || 1;
    const worldH = maxZ - minZ || 1;

    // Scale to fit canvas (maintain aspect ratio)
    const scale = Math.min(canvas.width / worldW, canvas.height / worldH);
    const offsetX = (canvas.width - worldW * scale) / 2;
    const offsetY = (canvas.height - worldH * scale) / 2;

    // World → canvas transform
    const toX = (wx: number) => (wx - minX) * scale + offsetX;
    const toY = (wz: number) => (wz - minZ) * scale + offsetY;

    // Clear
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    ctx.strokeStyle = 'rgba(74, 168, 216, 0.3)';
    ctx.lineWidth = 1;
    for (const n of nodes) {
      for (const targetId of n.connectedTo) {
        const target = nodes.find(t => t.id === targetId);
        if (!target) continue;
        ctx.beginPath();
        ctx.moveTo(toX(n.position.x), toY(n.position.z));
        ctx.lineTo(toX(target.position.x), toY(target.position.z));
        ctx.stroke();
      }
    }

    // Draw nodes as dots
    const collapsed = this.collapsedSystemIds();
    for (const n of nodes) {
      const x = toX(n.position.x);
      const y = toY(n.position.z);
      const isCollapsed = collapsed.has(n.id);
      const isDrilled = this.drilledDownSystemId() === n.id;

      ctx.beginPath();
      ctx.arc(x, y, isCollapsed ? 4 : 3, 0, Math.PI * 2);
      if (isCollapsed) {
        ctx.fillStyle = '#a78bfa';
      } else if (isDrilled) {
        ctx.fillStyle = '#f87171';
      } else {
        // Use the node's color
        ctx.fillStyle = n.color || '#6366f1';
      }
      ctx.fill();
    }

    // Draw viewport indicator (camera frustum approximation)
    const camPos = this.vizService.getCameraPosition();
    const camTarget = this.vizService.getCameraTarget();
    const cx = toX(camTarget.x);
    const cy = toY(camTarget.z);
    const dist = camPos.distanceTo(camTarget);
    const viewRadius = Math.max(10, dist * 0.15 * scale);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, viewRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Camera position indicator
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(toX(camPos.x), toY(camPos.z), 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Click on the minimap to navigate the camera. */
  onClick(event: MouseEvent): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Reverse the transform to get world coordinates
    const nodes = this.vizService.allNodes();
    if (nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x);
      minZ = Math.min(minZ, n.position.z);
      maxZ = Math.max(maxZ, n.position.z);
    }
    const pad = 10;
    minX -= pad; maxX += pad; minZ -= pad; maxZ += pad;
    const worldW = maxX - minX || 1;
    const worldH = maxZ - minZ || 1;
    const scale = Math.min(canvas.width / worldW, canvas.height / worldH);
    const offsetX = (canvas.width - worldW * scale) / 2;
    const offsetY = (canvas.height - worldH * scale) / 2;

    // Canvas → world
    const worldX = (clickX - offsetX) / scale + minX;
    const worldZ = (clickY - offsetY) / scale + minZ;

    // Move the camera target to the clicked world position
    this.vizService.setCameraTarget(worldX, 0, worldZ);
  }
}
