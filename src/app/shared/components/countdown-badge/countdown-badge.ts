import { Component, input } from '@angular/core';

/**
 * Displays a countdown badge showing remaining time.
 * Used for urgent surveys approaching their deadline.
 */
@Component({
  selector: 'app-countdown-badge',
  standalone: true,
  template: `
    <span class="badge" [class.urgent]="isUrgent()" role="status">
      {{ label() }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #e0e0ee;
      color: #555;
    }
    .urgent {
      background: #ffe0e0;
      color: #c0392b;
    }
  `],
})
export class CountdownBadgeComponent {
  /** Text to display inside the badge. */
  label = input.required<string>();

  /** Whether the badge should appear in urgent style. */
  isUrgent = input<boolean>(false);
}
