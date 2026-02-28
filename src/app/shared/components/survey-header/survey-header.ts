import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { StatusBadgeComponent, SurveyStatus } from '../status-badge/status-badge';
import { CategoryTagComponent } from '../category-tag/category-tag';

/**
 * Displays survey metadata header: status, deadline, and category.
 *
 * @example
 * ```html
 * <app-survey-header
 *   status="published"
 *   [deadline]="survey.deadline"
 *   category="Team activities"
 *   [createdAt]="survey.createdAt"
 * />
 * ```
 */
@Component({
  selector: 'app-survey-header',
  standalone: true,
  imports: [StatusBadgeComponent, CategoryTagComponent],
  templateUrl: './survey-header.html',
  styleUrl: './survey-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyHeaderComponent {
  /** Survey status. */
  readonly status = input.required<SurveyStatus>();

  /** Survey deadline. */
  readonly deadline = input<Date | null>(null);

  /** Survey category. */
  readonly category = input<string | null>(null);

  /** Survey creation date. */
  readonly createdAt = input.required<Date>();

  /** Formatted deadline text. */
  readonly deadlineText = computed(() => {
    return this.formatDeadline(this.deadline());
  });

  /** Formatted creation date text. */
  readonly createdText = computed(() => {
    return this.formatDate(this.createdAt());
  });

  /** Formats deadline with "Ends on" prefix. */
  private formatDeadline(date: Date | null): string | null {
    if (!date) return null;
    return `Ends on ${this.formatDate(date)}`;
  }

  /** Formats date to locale string. */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}
