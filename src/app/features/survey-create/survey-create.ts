import {
  Component,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputComponent, SelectOption } from '../../shared/components/input/input';
import { BtnComponent } from '../../shared/components/btn/btn';

/** Single answer model. */
interface Answer {
  id: number;
  text: string;
}

/** Single question model. */
interface Question {
  id: number;
  text: string;
  allowMultiple: boolean;
  answers: Answer[];
}

/**
 * Create new survey page.
 * Allows user to set name, description, end date, category,
 * and add multiple questions with answers.
 */
@Component({
  selector: 'app-survey-create',
  standalone: true,
  imports: [FormsModule, InputComponent, BtnComponent],
  templateUrl: './survey-create.html',
  styleUrl: './survey-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyCreateComponent {
  /** Survey name. */
  readonly surveyName = signal('');

  /** Describing text. */
  readonly description = signal('');

  /** End date. */
  readonly endDate = signal('');

  /** Category. */
  readonly category = signal('');

  /** Available categories. */
  readonly categories: SelectOption[] = [
    { value: 'technology', label: 'Technology' },
    { value: 'sports', label: 'Sports' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'health', label: 'Health' },
  ];

  /** Questions list. */
  readonly questions = signal<Question[]>([
    {
      id: 1,
      text: '',
      allowMultiple: false,
      answers: [
        { id: 1, text: '' },
        { id: 2, text: '' },
      ],
    },
  ]);

  /** Next IDs for unique tracking. */
  private nextQuestionId = 2;
  private nextAnswerId = 3;

  /** Alphabet for answer labels. */
  readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  constructor(private readonly router: Router) {}

  // ---------------------------------------------------------------------------
  // Question actions
  // ---------------------------------------------------------------------------

  /** Updates question text. */
  onQuestionTextChange(questionId: number, value: string): void {
    this.questions.update(qs =>
      qs.map(q => (q.id === questionId ? { ...q, text: value } : q)),
    );
  }

  /** Toggles allow-multiple flag. */
  toggleMultiple(questionId: number): void {
    this.questions.update(qs =>
      qs.map(q =>
        q.id === questionId ? { ...q, allowMultiple: !q.allowMultiple } : q,
      ),
    );
  }

  /** Deletes a question. */
  deleteQuestion(questionId: number): void {
    this.questions.update(qs => qs.filter(q => q.id !== questionId));
  }

  /** Adds a new question. */
  addQuestion(): void {
    const id = this.nextQuestionId++;
    this.questions.update(qs => [
      ...qs,
      {
        id,
        text: '',
        allowMultiple: false,
        answers: [
          { id: this.nextAnswerId++, text: '' },
          { id: this.nextAnswerId++, text: '' },
        ],
      },
    ]);
  }

  // ---------------------------------------------------------------------------
  // Answer actions
  // ---------------------------------------------------------------------------

  /** Updates answer text. */
  onAnswerTextChange(questionId: number, answerId: number, value: string): void {
    this.questions.update(qs =>
      qs.map(q =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map(a =>
                a.id === answerId ? { ...a, text: value } : a,
              ),
            }
          : q,
      ),
    );
  }

  /** Deletes an answer. */
  deleteAnswer(questionId: number, answerId: number): void {
    this.questions.update(qs =>
      qs.map(q =>
        q.id === questionId
          ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
          : q,
      ),
    );
  }

  /** Adds an answer to a question. */
  addAnswer(questionId: number): void {
    const id = this.nextAnswerId++;
    this.questions.update(qs =>
      qs.map(q =>
        q.id === questionId
          ? { ...q, answers: [...q.answers, { id, text: '' }] }
          : q,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Form actions
  // ---------------------------------------------------------------------------

  /** Publishes the survey (placeholder). */
  publish(): void {
    // TODO: wire to SurveyService
    console.log('Publishing survey:', {
      name: this.surveyName(),
      description: this.description(),
      endDate: this.endDate(),
      category: this.category(),
      questions: this.questions(),
    });
    this.router.navigate(['/']);
  }

  /** Cancels creation and navigates back. */
  cancel(): void {
    this.router.navigate(['/']);
  }
}
