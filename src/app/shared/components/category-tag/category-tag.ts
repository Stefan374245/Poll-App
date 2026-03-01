import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-category-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="tag" [class.tag--dark]="variant() === 'dark'">{{ label() }}</span>`,
  styles: [
    `
      @use '../../../../styles/abstract/variables' as v;
      .tag {
        display: inline-block;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        line-height: 1;
        color: v.$text-primary;
      }
      .tag--dark {
        color: v.$text-secondary;
      }
    `,
  ],
})
export class CategoryTagComponent {
  readonly label = input.required<string>();

  readonly variant = input<'light' | 'dark'>('light');
}
