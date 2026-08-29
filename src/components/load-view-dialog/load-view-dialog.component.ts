import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtlasService } from '../../services/atlas.service.js';

@Component({
  selector: 'app-load-view-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './load-view-dialog.component.html',
  styleUrls: ['./load-view-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.escape)': 'onClose()',
  },
})
export class LoadViewDialogComponent {
  isOpen = input.required<boolean>();

  close = output<void>();
  viewSelected = output<number>();

  atlas = inject(AtlasService);

  onClose(): void {
    this.close.emit();
  }

  onSelectView(id: number | undefined): void {
    if (id === undefined) return;
    this.viewSelected.emit(id);
  }
}
