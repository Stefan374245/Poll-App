import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SurveyService } from '../../core/services/survey.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { BtnComponent } from '../../shared/components/btn/btn';
import { CategoryTagComponent } from '../../shared/components/category-tag/category-tag';
import { QuestionBlockComponent, QuestionSelection } from '../../shared/components/question-block/question-block';
import { ResultBlockComponent } from '../../shared/components/result-block/result-block';

/**
 * Displays a single survey: metadata header, interactive questions (left)
 * and live results (right) in a two-column layout.
 */
@Component({
  selector: 'app-survey-detail',
  standalone: true,
  imports: [
    BtnComponent,
    CategoryTagComponent,
    QuestionBlockComponent,
    ResultBlockComponent,
  ],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyService = inject(SurveyService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  private readonly surveyId = this.route.snapshot.paramMap.get('id') ?? '';

  /** The survey data. */
  readonly survey = computed(() =>
    this.surveyService.getSurveyById(this.surveyId),
  );

  /** Whether the current user has voted on all questions. */
  readonly hasVoted = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;
    return this.surveyService.hasUserVoted(this.surveyId, user.id);
  });

  /** Total unique voters. */
  readonly totalVoters = computed(() =>
    this.surveyService.getTotalVotes(this.surveyId),
  );

  /** Whether results should be shown. */
  readonly showResults = computed(() => {
    const s = this.survey();
    if (!s) return false;
    return this.hasVoted() || !s.isActive;
  });

  /** Whether there are any votes at all. */
  readonly hasAnyResults = computed(() => this.totalVoters() > 0);

  /** Formatted deadline string. */
  readonly deadlineText = computed(() => {
    const s = this.survey();
    if (!s?.deadline) return null;
    return s.deadline.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  });

  /** Collected user selections: questionId → optionIds[]. */
  readonly selections = signal<Map<string, string[]>>(new Map());

  /** Track selection changes from question blocks. */
  onSelectionChange(event: QuestionSelection): void {
    this.selections.update(prev => {
      const next = new Map(prev);
      next.set(event.questionId, event.optionIds);
      return next;
    });
  }

  /** Submit votes for all questions. */
  submitVotes(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.surveyService.voteAll(this.surveyId, this.selections(), user.id);
    this.toastService.success('Survey completed!');
  }

  /** Whether the user has selected at least one option per question. */
  readonly canSubmit = computed(() => {
    const s = this.survey();
    if (!s) return false;
    const sel = this.selections();
    return s.questions.every(q => {
      const opts = sel.get(q.id);
      return opts && opts.length > 0;
    });
  });
}
