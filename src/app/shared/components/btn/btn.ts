import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** Supported button visual variants. */
export type BtnVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'filter'
  | 'status'
  | 'icon';

/** Supported button icon types. */
export type BtnIcon =
  | 'add'
  | 'check'
  | 'delete'
  | 'edit'
  | 'none';

/** Status badge sub-type. */
export type BtnStatus = 'published' | 'draft';

/**
 * Reusable button component with property-binding-driven variants.
 *
 * @example
 * ```html
 * <app-btn variant="primary" icon="add" label="New survey" />
 * <app-btn variant="filter" label="Past survey" [active]="true" />
 * <app-btn variant="status" statusType="published" label="Published" />
 * <app-btn variant="icon" icon="delete" ariaLabel="Delete survey" />
 * ```
 */
@Component({
  selector: 'app-btn',
  standalone: true,
  templateUrl: './btn.html',
  styleUrl: './btn.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
})
export class BtnComponent {
  /** Visual variant of the button. */
  readonly variant = input<BtnVariant>('primary');

  /** Icon to display (SVG). */
  readonly icon = input<BtnIcon>('none');

  /** Text label. Omit for icon-only buttons. */
  readonly label = input<string>('');

  /** Whether this is the dark sub-variant (tertiary only). */
  readonly dark = input<boolean>(false);

  /** Whether button is in active/toggle-on state. */
  readonly active = input<boolean>(false);

  /** Disables the button. */
  readonly disabled = input<boolean>(false);

  /** Status badge sub-type (status variant only). */
  readonly statusType = input<BtnStatus>('published');

  /** Accessible label for icon-only buttons. */
  readonly ariaLabel = input<string>('');

  /** Computed CSS class list bound to host. */
  readonly hostClasses = computed(() => {
    const classes = ['btn', `btn--${this.variant()}`];

    if (this.active()) {
      classes.push('btn--active');
    }
    if (this.dark()) {
      classes.push('btn--dark');
    }
    if (this.variant() === 'status') {
      classes.push(`btn--${this.statusType()}`);
    }

    return classes.join(' ');
  });
}
