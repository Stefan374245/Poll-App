import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryTagComponent } from '../../shared/components/category-tag/category-tag';
import { CountdownBadgeComponent } from '../../shared/components/countdown-badge/countdown-badge';

@Component({
  selector: 'app-highlights-card',
  standalone: true,
  imports: [RouterLink, CategoryTagComponent, CountdownBadgeComponent],
  templateUrl: './highlights-card.html',
  styleUrl: './highlights-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightsCardComponent {

  readonly surveyId = input.required<string>();
  readonly title = input.required<string>();
  readonly category = input<string>('');
  readonly deadline = input.required<Date>();

  readonly countdownLabel = computed(() => {
    return this.formatCountdown(this.deadline());
  });

  readonly isUrgent = computed(() => {
    const diff = this.deadline().getTime() - Date.now();
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    return diff < TWO_DAYS_MS;
  });

  /**
   * Formats the countdown label based on the deadline.
   * @param deadline The survey deadline date.
   * @returns The formatted countdown label.
   * @remarks This is a helper function to keep the template clean. It calculates the time difference and returns a user-friendly string.
   */
  private formatCountdown(deadline: Date): string {
    const diffMs = deadline.getTime() - Date.now();
    if (diffMs <= 0) return 'Ended';
    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return days === 1 ? 'Ends in 1 Day' : `Ends in ${days} Days`;
  }
}
