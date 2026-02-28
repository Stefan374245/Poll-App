import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * Displays "Survey results" header with optional LIVE badge.
 *
 * @example
 * ```html
 * <app-results-header [isLive]="true" />
 * <app-results-header [isLive]="false" />
 * ```
 */
@Component({
  selector: 'app-results-header',
  standalone: true,
  templateUrl: './results-header.html',
  styleUrl: './results-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsHeaderComponent {
  /** Whether results are updating in realtime. */
  readonly isLive = input<boolean>(true);

  /** CSS class for LIVE badge. */
  readonly liveClass = computed(() => {
    return this.isLive() ? 'results-header__live--active' : '';
  });
}
