import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Supported input types. */
export type InputType = 'text' | 'textarea' | 'date' | 'select' | 'number';

/** Option for select dropdowns. */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Reusable input component matching the dark-form design.
 * Supports text, textarea, date, number, and select.
 * Implements ControlValueAccessor for use with Reactive & Template-driven forms.
 *
 * @example
 * ```html
 * <app-input label="Survey name" placeholder="Enter name" />
 * <app-input label="Describing text" type="textarea" [optional]="true" />
 * <app-input label="Choose category" type="select" [options]="categories" />
 * ```
 */
@Component({
  selector: 'app-input',
  standalone: true,
  templateUrl: '../input/input.html',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  /** Label text displayed above the field. */
  readonly label = input<string>('');

  /** Placeholder text inside the field. */
  readonly placeholder = input<string>('');

  /** Input type variant. */
  readonly type = input<InputType>('text');

  /** Whether the field is optional (shows "(optional)" hint). */
  readonly optional = input<boolean>(false);

  /** Disabled state. */
  readonly disabled = input<boolean>(false);

  /** Textarea row count. */
  readonly rows = input<number>(4);

  /** Options for select type. */
  readonly options = input<SelectOption[]>([]);

  /** Show a delete icon button beside the field. */
  readonly showDelete = input<boolean>(false);

  /** Emits on value change. */
  readonly valueChange = output<string>();

  /** Emits when the delete icon is clicked. */
  readonly deleteClick = output<void>();

  /** Internal value signal. */
  readonly value = signal('');

  /** Internal disabled state for CVA. */
  readonly isDisabled = signal(false);

  // CVA callbacks
  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Handles input/textarea changes. */
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.updateValue(target.value);
  }

  /** Handles select changes. */
  onSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateValue(target.value);
  }

  /** Marks field as touched on blur. */
  onBlur(): void {
    this.onTouched();
  }

  // -- ControlValueAccessor --
  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  private updateValue(val: string): void {
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }
}
