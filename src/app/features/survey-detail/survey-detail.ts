import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SurveyDataService } from '../../core/services/survey/survey-data.service';
import { SurveyStateService } from '../../core/services/survey/survey-state.service';
import { SurveyCalculatorService } from '../../core/services/survey/survey-calculator.service';
import { SupabaseService } from '../../core/services/supabase/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { BtnComponent } from '../../shared/components/btn/btn';
import { CategoryTagComponent } from '../../shared/components/category-tag/category-tag';
import { QuestionBlockComponent, QuestionSelection } from '../../shared/components/question-block/question-block';
import { ResultBlockComponent } from '../../shared/components/result-block/result-block';
import type { SurveyWithDetails, Vote } from '../../core/models';

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
export class SurveyDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyDataService = inject(SurveyDataService);
  private readonly surveyStateService = inject(SurveyStateService);
  private readonly calculatorService = inject(SurveyCalculatorService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  private readonly surveyId = this.route.snapshot.paramMap.get('id') ?? '';
  private realtimeChannel?: RealtimeChannel;

  /** The survey data. */
  readonly survey = signal<SurveyWithDetails | null>(null);

  /** All votes for this survey. */
  readonly votes = signal<Vote[]>([]);

  /** Loading state. */
  readonly loading = signal<boolean>(true);

  /** Whether to show results view (toggle). */
  readonly showResultsView = signal<boolean>(false);

  /** Whether the current user has voted on this survey. */
  readonly hasVoted = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;
    return this.calculatorService.hasUserVoted(
      this.votes(),
      this.surveyId,
      user.id
    );
  });

  /** Survey statistics. */
  readonly statistics = computed(() => 
    this.calculatorService.calculateSurveyStatistics(this.votes())
  );

  /** Questions enriched with vote data for display. */
  readonly questionsWithResults = computed(() => {
    const s = this.survey();
    const user = this.authService.currentUser();
    if (!s || !user) return [];

    return s.questions.map(q => 
      this.calculatorService.enhanceQuestion(q, this.votes(), user.id)
    );
  });

  /** Whether results should be available to view. */
  readonly canViewResults = computed(() => {
    const s = this.survey();
    if (!s) return false;
    return this.hasVoted() || !s.isActive;
  });

  /** Whether there are any votes at all. */
  readonly hasAnyResults = computed(() => this.statistics().totalVotes > 0);

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

  async ngOnInit(): Promise<void> {
    await this.loadSurveyData();
    this.subscribeToRealtimeVotes();
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      this.supabaseService.unsubscribe(this.realtimeChannel);
    }
  }

  /** Loads survey and vote data. */
  private async loadSurveyData(): Promise<void> {
    this.loading.set(true);
    try {
      const [surveyData, votesData] = await Promise.all([
        this.surveyDataService.getSurveyById(this.surveyId),
        this.surveyDataService.getVotesBySurvey(this.surveyId)
      ]);

      this.survey.set(surveyData);
      this.votes.set(votesData);
    } catch (error) {
      console.error('Failed to load survey:', error);
      this.toastService.error('Failed to load survey');
    } finally {
      this.loading.set(false);
    }
  }

  /** Subscribes to realtime vote updates. */
  private subscribeToRealtimeVotes(): void {
    this.realtimeChannel = this.supabaseService.subscribeToVotes(
      this.surveyId,
      async () => {
        // Reload votes when any change happens
        const votesData = await this.surveyDataService.getVotesBySurvey(this.surveyId);
        this.votes.set(votesData);
      }
    );
  }

  /** Track selection changes from question blocks. */
  onSelectionChange(event: QuestionSelection): void {
    this.selections.update(prev => {
      const next = new Map(prev);
      next.set(event.questionId, event.optionIds);
      return next;
    });
  }

  /** Submit votes for all questions. */
  async submitVotes(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      this.toastService.error('You must be logged in to vote');
      return;
    }

    const selections = this.selections();
    const votePromises: Promise<Vote>[] = [];

    selections.forEach((optionIds, questionId) => {
      optionIds.forEach(optionId => {
        votePromises.push(
          this.surveyDataService.submitVote(
            this.surveyId,
            questionId,
            optionId,
            user.id
          )
        );
      });
    });

    try {
      await Promise.all(votePromises);
      this.toastService.success('Survey completed!');
      this.showResultsView.set(true);
    } catch (error) {
      console.error('Failed to submit votes:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit votes';
      this.toastService.error(message);
    }
  }

  /** Toggles results view. */
  toggleResultsView(): void {
    this.showResultsView.update(v => !v);
  }
}
