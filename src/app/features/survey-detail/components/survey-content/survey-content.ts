import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** Layout mode for survey content. */
export type SurveyContentLayout = 'split' | 'results-only';

/**
 * Layout wrapper for survey content with two-column or single-column mode.
 * Uses content projection for questions and results panels.
 *
 * @example
 * ```html
 * <app-survey-content layoutMode="split">
 *   <div questions>
 *     <app-survey-questions-panel ... />
 *   </div>
 *   <div results>
 *     <app-survey-results-panel ... />
 *   </div>
 * </app-survey-content>
 * ```
 */
@Component({
  selector: 'app-survey-content',
  standalone: true,
  templateUrl: './survey-content.html',
  styleUrl: './survey-content.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
})
export class SurveyContentComponent {
  /** Layout mode: split (2-col) or results-only (1-col). */
  readonly layoutMode = input<SurveyContentLayout>('split');

  /** Computed CSS classes for host. */
  readonly hostClasses = computed(() => {
    return `survey-content survey-content--${this.layoutMode()}`;
  });
}
