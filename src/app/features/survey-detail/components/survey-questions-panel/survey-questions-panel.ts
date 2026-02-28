import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { SurveyQuestion } from '../../../../core/models/survey.interface';
import { SurveyMetaComponent } from '../../../../shared/components/survey-meta/survey-meta';
import { QuestionBlockComponent, QuestionSelection } from '../../../../shared/components/question-block/question-block';
import { BtnComponent } from '../../../../shared/components/btn/btn';

/**
 * Displays survey title, description, questions, and submit button.
 *
 * @example
 * ```html
 * <app-survey-questions-panel
 *   title="Survey Title"
 *   description="Survey description"
 *   [questions]="questions"
 *   [selections]="selections"
 *   [canSubmit]="true"
 *   [hasVoted]="false"
 *   [isActive]="true"
 *   (selectionChange)="onSelect($event)"
 *   (submit)="onSubmit()"
 * />
 * ```
 */
@Component({
  selector: 'app-survey-questions-panel',
  standalone: true,
  imports: [SurveyMetaComponent, QuestionBlockComponent, BtnComponent],
  templateUrl: './survey-questions-panel.html',
  styleUrl: './survey-questions-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyQuestionsPanelComponent {
  /** Survey title. */
  readonly title = input.required<string>();

  /** Survey description. */
  readonly description = input<string | null>(null);

  /** Questions to display. */
  readonly questions = input.required<SurveyQuestion[]>();

  /** Current user selections. */
  readonly selections = input.required<Map<string, string[]>>();

  /** Whether form is valid for submission. */
  readonly canSubmit = input.required<boolean>();

  /** Whether user already voted. */
  readonly hasVoted = input.required<boolean>();

  /** Whether survey is active. */
  readonly isActive = input.required<boolean>();

  /** Emits when user changes selection. */
  readonly selectionChange = output<QuestionSelection>();

  /** Emits when user clicks submit. */
  readonly submit = output<void>();

  /** Submit button label. */
  readonly submitLabel = computed(() => {
    return this.canSubmit()
      ? 'Complete survey'
      : 'Select at least one option';
  });

  /** Whether to show submit button. */
  readonly showSubmit = computed(() => {
    return !this.hasVoted() && this.isActive();
  });

  /** Handles selection change from question block. */
  onQuestionChange(selection: QuestionSelection): void {
    this.selectionChange.emit(selection);
  }

  /** Handles submit button click. */
  onSubmitClick(): void {
    this.submit.emit();
  }
}
