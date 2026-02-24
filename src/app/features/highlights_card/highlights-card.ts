import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryTagComponent } from '../../shared/components/category-tag/category-tag';
import { CountdownBadgeComponent } from '../../shared/components/countdown-badge/countdown-badge';

/**
 * Highlight card for "Ending soon" surveys.
 * Light purple background with category tag, title, and countdown badge.
 */
@Component({
  selector: 'app-highlights-card',
  standalone: true,
  imports: [RouterLink, CategoryTagComponent, CountdownBadgeComponent],
  templateUrl: './highlights-card.html',
  styleUrl: './highlights-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightsCardComponent {
  /** Survey ID for routing. */
  readonly surveyId = input.required<string>();

  /** Survey title. */
  readonly title = input.required<string>();

  /** Category label. */
  readonly category = input<string>('');

  /** Deadline date for computing remaining time. */
  readonly deadline = input.required<Date>();

  /** Computed countdown label (e.g., "Ends in 1 Day"). */
  readonly countdownLabel = computed(() => {
    return this.formatCountdown(this.deadline());
  });

  /** Whether the deadline is urgent (< 2 days). */
  readonly isUrgent = computed(() => {
    const diff = this.deadline().getTime() - Date.now();
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    return diff < TWO_DAYS_MS;
  });

  private formatCountdown(deadline: Date): string {
    const diffMs = deadline.getTime() - Date.now();
    if (diffMs <= 0) return 'Ended';
    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return days === 1 ? 'Ends in 1 Day' : `Ends in ${days} Days`;
  }
}
