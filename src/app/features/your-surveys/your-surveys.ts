import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SurveyService } from '../../core/services/survey.service';
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
  private readonly surveyService = inject(SurveyService);

  /** Surveys ending soon (urgent, sorted by deadline). */
  readonly endingSoon = this.surveyService.urgentSurveys;
}
