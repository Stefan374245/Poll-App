import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
} from '@angular/core';
import { SurveyQuestion } from '../../../core/models/survey.interface';

/** Emitted selection for a question. */
export interface QuestionSelection {
  questionId: string;
  optionIds: string[];
}

/**
 * Displays a single survey question with lettered answer options.
 * Supports single-select (radio) and multi-select (checkbox) modes.
 *
 * @example
 * ```html
 * <app-question-block
 *   [question]="q"
 *   [questionNumber]="1"
 *   (selectionChange)="onSelect($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-question-block',
  standalone: true,
  templateUrl: './question-block.html',
  styleUrl: './question-block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBlockComponent {
  /** The question data. */
  readonly question = input.required<SurveyQuestion>();

  /** 1-based question number for display. */
  readonly questionNumber = input<number>(1);

  /** Whether the user already voted (read-only mode). */
  readonly readonly = input<boolean>(false);

  /** Emits whenever selection changes. */
  readonly selectionChange = output<QuestionSelection>();

  /** Currently selected option IDs. */
  readonly selectedIds = signal<Set<string>>(new Set());

  /** Alphabet for answer labels. */
  readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /** Toggle an option. */
  toggleOption(optionId: string): void {
    if (this.readonly()) return;

    const q = this.question();

    this.selectedIds.update(prev => {
      const next = new Set(prev);

      if (q.allowMultiple) {
        // multi-select: toggle
        if (next.has(optionId)) {
          next.delete(optionId);
        } else {
          next.add(optionId);
        }
      } else {
        // single-select: replace
        next.clear();
        next.add(optionId);
      }
      return next;
    });

    this.selectionChange.emit({
      questionId: q.id,
      optionIds: [...this.selectedIds()],
    });
  }

  /** Check if an option is selected. */
  isSelected(optionId: string): boolean {
    return this.selectedIds().has(optionId);
  }
}
