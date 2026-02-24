import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputComponent, SelectOption } from '../../shared/components/input/input';
import { BtnComponent } from '../../shared/components/btn/btn';
import { SurveyService } from '../../core/services/survey.service';
import { CreateSurveyPayload } from '../../core/models';

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
    { value: 'team-activities', label: 'Team Activities' },
    { value: 'health & wellness', label: 'Health & Wellness' },
    { value: 'gaming & entertainment', label: 'Gaming & Entertainment' },
    { value: 'education & learning', label: 'Education & Learning' },
    { value: 'lifestyle & preferences', label: 'Lifestyle & Preferences' },
    { value: 'technology & innovation', label: 'Technology & Innovation' },
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

  constructor(
    private readonly router: Router,
    private readonly surveyService: SurveyService,
  ) {}

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

  /** Publishes the survey via SurveyService. */
  publish(): void {
    const payload: CreateSurveyPayload = {
      title: this.surveyName(),
      description: this.description(),
      category: this.category(),
      questions: this.questions().map(q => ({
        text: q.text,
        allowMultiple: q.allowMultiple,
        options: q.answers.map(a => a.text),
      })),
      deadline: this.endDate() ? new Date(this.endDate()) : null,
    };

    this.surveyService.createSurvey(payload, 'current-user');
    this.router.navigate(['/']);
  }

  /** Cancels creation and navigates back. */
  cancel(): void {
    this.router.navigate(['/']);
  }
}
