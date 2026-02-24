import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey.service';
import { CategoryTagComponent } from '../../shared/components/category-tag/category-tag';
import { CountdownBadgeComponent } from '../../shared/components/countdown-badge/countdown-badge';
import { BtnComponent } from '../../shared/components/btn/btn';
import type { SurveyFilter } from '../../core/models';

/**
 * Displays the survey list with filter pills and dark-themed cards.
 */
@Component({
  selector: 'app-survey-list',
  standalone: true,
  imports: [RouterLink, CategoryTagComponent, CountdownBadgeComponent, BtnComponent],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyListComponent {
  private readonly surveyService = inject(SurveyService);

  /** Current filter: 'active' or 'past'. */
  readonly filter = signal<SurveyFilter>('active');

  /** Urgent surveys (deadline < 3 days). */
  readonly urgentSurveys = this.surveyService.urgentSurveys;

  /** Filtered survey list. */
  readonly surveys = computed(() =>
    this.surveyService.getFilteredSurveys(this.filter())
  );

  /** Switches the active filter. */
  setFilter(value: SurveyFilter): void {
    this.filter.set(value);
  }

  /** Returns countdown label for a deadline. */
  getCountdown(deadline: Date | null): string {
    if (!deadline) return '';
    const diffMs = deadline.getTime() - Date.now();
    if (diffMs <= 0) return 'Ended';
    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return days === 1 ? 'Ends in 1 Day' : `Ends in ${days} Days`;
  }
}
