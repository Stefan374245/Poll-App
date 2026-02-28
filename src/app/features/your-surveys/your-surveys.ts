import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SurveyStateService } from '../../core/services/survey/survey-state.service';
import { SurveyDataService } from '../../core/services/survey/survey-data.service';
import { HighlightsCardComponent } from '../highlights_card/highlights-card';
import { SurveyListComponent } from '../survey-list/survey-list';

/**
 * "Your surveys" section on the home page.
 * Contains ending-soon highlights and the full survey list.
 */
@Component({
  selector: 'app-your-surveys',
  standalone: true,
  imports: [HighlightsCardComponent, SurveyListComponent],
  templateUrl: './your-surveys.html',
  styleUrl: './your-surveys.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YourSurveysComponent {
  private readonly surveyStateService = inject(SurveyStateService);
  private readonly surveyDataService = inject(SurveyDataService);

  /** Surveys ending soon (urgent, sorted by deadline). */
  readonly endingSoon = this.surveyStateService.urgentSurveys;

  /** Surveys created by the current user. */
  readonly yourSurveys = this.surveyStateService.surveysByCurrentUser;
}
