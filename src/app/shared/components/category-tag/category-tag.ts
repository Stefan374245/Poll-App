import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Small colored label showing the survey category.
 *
 * @example
 * ```html
 * <app-category-tag label="Team activities" />
 * <app-category-tag label="Gaming" variant="dark" />
 * ```
 */
@Component({
  selector: 'app-category-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="tag" [class.tag--dark]="variant() === 'dark'">{{ label() }}</span>`,
  styles: [`
    .tag {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.4;
      background-color: #FFB77040;
      color: #35273A;
    }
    .tag--dark {
      background-color: #FFB770;
      color: #35273A;
    }
  `],
})
export class CategoryTagComponent {
  /** Category text to display. */
  readonly label = input.required<string>();

  /** Visual variant: 'light' (default) or 'dark'. */
  readonly variant = input<'light' | 'dark'>('light');
}
