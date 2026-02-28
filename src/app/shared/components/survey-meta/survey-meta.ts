import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * Displays survey title and description.
 *
 * @example
 * ```html
 * <app-survey-meta
 *   title="Let's Plan the Next Team Event Together"
 *   description="We want to create team activities..."
 * />
 * ```
 */
@Component({
  selector: 'app-survey-meta',
  standalone: true,
  templateUrl: './survey-meta.html',
  styleUrl: './survey-meta.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyMetaComponent {
  /** Survey title. */
  readonly title = input.required<string>();

  /** Survey description. */
  readonly description = input<string | null>(null);
}
