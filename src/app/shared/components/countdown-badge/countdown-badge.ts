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
  @use '../../../../styles/abstract/variables' as v;
    .badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: v.$primary-btn-light;
      color: v.$text-primary;
    }
    .urgent {
      background: v.$primary-btn-light;
      color: v.$text-primary;
    }
  `],
})
export class CountdownBadgeComponent {
  label = input.required<string>();

  isUrgent = input<boolean>(false);
}
