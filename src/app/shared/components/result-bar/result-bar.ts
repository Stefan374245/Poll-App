import {
  Component,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';

/**
 * Single horizontal result bar showing a letter label + fill percentage.
 * Uses primary (orange) or secondary (light gray) color variants.
 *
 * @example
 * ```html
 * <app-result-bar label="A" [percentage]="44" variant="primary" />
 * ```
 */
@Component({
  selector: 'app-result-bar',
  standalone: true,
  templateUrl: './result-bar.html',
  styleUrl: './result-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultBarComponent {
  /** Letter label (A, B, C, ...). */
  readonly label = input.required<string>();

  /** Fill percentage (0–100). */
  readonly percentage = input<number>(0);

  /** Color variant. */
  readonly variant = input<'primary' | 'secondary'>('primary');
}
