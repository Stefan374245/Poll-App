import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** Supported status values. */
export type SurveyStatus = 'published' | 'draft' | 'ended';

/**
 * Displays a colored status badge for surveys.
 *
 * @example
 * ```html
 * <app-status-badge status="published" />
 * <app-status-badge status="ended" />
 * ```
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
})
export class StatusBadgeComponent {
  /** Status to display. */
  readonly status = input.required<SurveyStatus>();

  /** Computed CSS classes for host. */
  readonly hostClasses = computed(() => {
    return `status-badge status-badge--${this.status()}`;
  });

  /** Display text for status. */
  readonly statusText = computed(() => {
    const statusMap: Record<SurveyStatus, string> = {
      published: 'Published',
      draft: 'Draft',
      ended: 'Ended',
    };
    return statusMap[this.status()];
  });
}
