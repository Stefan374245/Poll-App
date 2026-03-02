import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyDataService } from '../../core/services/survey/survey-data.service';
import { SurveyStateService } from '../../core/services/survey/survey-state.service';
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
export class SurveyListComponent implements OnInit {
  private readonly surveyDataService = inject(SurveyDataService);
  private readonly surveyStateService = inject(SurveyStateService);

  readonly filter = this.surveyStateService.filter;

  readonly urgentSurveys = this.surveyStateService.urgentSurveys;

  readonly surveys = computed(() => {
    const items = this.surveyStateService.filteredSurveys();
    return [...items].sort((a, b) => {
      const deadlineA = a.deadline?.getTime() ?? Infinity;
      const deadlineB = b.deadline?.getTime() ?? Infinity;
      return deadlineA - deadlineB;
    });
  });

  readonly loading = this.surveyStateService.loading;

  readonly error = this.surveyStateService.error;

  async ngOnInit(): Promise<void> {
    await this.surveyDataService.loadAllSurveys();
  }

  setFilter(value: SurveyFilter): void {
    this.surveyStateService.setFilter(value);
  }

  getCountdown(deadline: Date | null): string {
    if (!deadline) return '';
    const diffMs = deadline.getTime() - Date.now();
    if (diffMs <= 0) return 'Ended';
    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return days === 1 ? 'Ends in 1 Day' : `Ends in ${days} Days`;
  }
}
