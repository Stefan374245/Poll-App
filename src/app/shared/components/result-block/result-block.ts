import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { SurveyQuestion } from '../../../core/models/survey.interface';
import { ResultBarComponent } from '../result-bar/result-bar';

/**
 * Displays results for a single question: heading + result bars.
 *
 * @example
 * ```html
 * <app-result-block [question]="q" [questionNumber]="1" />
 * ```
 */
@Component({
  selector: 'app-result-block',
  standalone: true,
  imports: [ResultBarComponent],
  templateUrl: './result-block.html',
  styleUrl: './result-block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultBlockComponent {
  /** The question data (with vote counts). */
  readonly question = input.required<SurveyQuestion>();

  /** 1-based question number. */
  readonly questionNumber = input<number>(1);

  /** Alphabet for bar labels. */
  readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /** Total votes across all options in this question. */
  readonly totalVotes = computed(() =>
    this.question().options.reduce((sum, o) => sum + o.voteCount, 0),
  );

  /** Calculate percentage for an option. */
  percent(voteCount: number): number {
    const total = this.totalVotes();
    return total === 0 ? 0 : Math.round((voteCount / total) * 100);
  }
}
