import { Injectable, signal } from '@angular/core';

/** Toast notification type. */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/** Single toast message. */
export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

/** Duration in milliseconds before toast auto-dismisses. */
const TOAST_DURATION_MS = 3000;

/**
 * Service for displaying toast notifications.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly toastsSignal = signal<ToastMessage[]>([]);

  /** Active toast messages. */
  readonly toasts = this.toastsSignal.asReadonly();

  /** Shows a success toast. */
  success(message: string): void {
    this.show(message, 'success');
  }

  /** Shows an error toast. */
  error(message: string): void {
    this.show(message, 'error');
  }

  /** Shows an info toast. */
  info(message: string): void {
    this.show(message, 'info');
  }

  /** Shows a warning toast. */
  warning(message: string): void {
    this.show(message, 'warning');
  }

  /** Removes a toast by ID. */
  dismiss(id: number): void {
    this.toastsSignal.update(list =>
      list.filter(t => t.id !== id)
    );
  }

  private show(message: string, type: ToastType): void {
    const id = this.nextId++;
    const toast: ToastMessage = { id, message, type };
    this.toastsSignal.update(list => [...list, toast]);
    setTimeout(() => this.dismiss(id), TOAST_DURATION_MS);
  }
}
