import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { SurveyQuestionWithResults } from '../../../../core/models/survey.interface';
import { ResultsHeaderComponent } from '../../../../shared/components/results-header/results-header';
import { ResultBlockComponent } from '../../../../shared/components/result-block/result-block';

/**
 * Displays live survey results with header and result blocks.
 *
 * @example
 * ```html
 * <app-survey-results-panel
 *   [questionsWithResults]="questions"
 *   [isLive]="true"
 *   [showResults]="true"
 * />
 * ```
 */
@Component({
  selector: 'app-survey-results-panel',
  standalone: true,
  imports: [ResultsHeaderComponent, ResultBlockComponent],
  templateUrl: './survey-results-panel.html',
  styleUrl: './survey-results-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyResultsPanelComponent {
  /** Questions with calculated results. */
  readonly questionsWithResults = input.required<SurveyQuestionWithResults[]>();

  /** Whether results are updating live. */
  readonly isLive = input<boolean>(true);

  /** Whether to show results. */
  readonly showResults = input<boolean>(true);

  /** Whether there are any votes. */
  readonly hasAnyVotes = computed(() => {
    return this.questionsWithResults().some(q => q.totalVotes > 0);
  });

  /** Total votes across all questions. */
  readonly totalVotes = computed(() => {
    return this.questionsWithResults()
      .reduce((sum, q) => sum + q.totalVotes, 0);
  });
}
