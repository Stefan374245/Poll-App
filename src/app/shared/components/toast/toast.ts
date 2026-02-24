import { Component } from '@angular/core';
import { ToastService } from '../../../core/services';

/**
 * Toast notification container component.
 * Displays stacked toast messages.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastComponent {
  readonly toasts;

  constructor(private readonly toastService: ToastService) {
    this.toasts = this.toastService.toasts;
  }

  /** Dismisses a toast by ID. */
  onDismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
