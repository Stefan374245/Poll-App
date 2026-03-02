import { Component, inject, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SurveyDataService } from '../../core/services/survey/survey-data.service';
import { SurveyStateService } from '../../core/services/survey/survey-state.service';
import { SurveyCalculatorService } from '../../core/services/survey/survey-calculator.service';
import { SupabaseService } from '../../core/services/supabase/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SurveyHeaderComponent } from '../../shared/components/survey-header/survey-header';
import { SurveyStatus } from '../../shared/components/status-badge/status-badge';
import { QuestionSelection } from '../../shared/components/question-block/question-block';
import { SurveyQuestionsPanelComponent } from './components/survey-questions-panel/survey-questions-panel';
import { SurveyResultsPanelComponent } from './components/survey-results-panel/survey-results-panel';
import { SurveyContentComponent } from './components/survey-content/survey-content';
import type { SurveyWithDetails, Vote } from '../../core/models';

@Component({
  selector: 'app-survey-detail',
  standalone: true,
  imports: [
    SurveyHeaderComponent,
    SurveyQuestionsPanelComponent,
    SurveyResultsPanelComponent,
    SurveyContentComponent,
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

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      console.log('👤 User changed in survey-detail:', user?.displayName, user?.id);

      if (this.survey() !== null) {
        console.log('🔄 Reloading votes due to user change');
        this.reloadVotes();
      }
    });
  }

  readonly survey = signal<SurveyWithDetails | null>(null);
  readonly votes = signal<Vote[]>([]);
  readonly loading = signal<boolean>(true);
  readonly showResultsView = signal<boolean>(true);

  readonly hasVoted = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      console.log('🔍 hasVoted check: No user logged in');
      return false;
    }

    const votes = this.votes();
    const userVotes = votes.filter(v => v.userId === user.id);
    const hasVoted = this.calculatorService.hasUserVoted(
      votes,
      this.surveyId,
      user.id
    );

    console.log('🔍 hasVoted check:', {
      userId: user.id,
      displayName: user.displayName,
      surveyId: this.surveyId,
      totalVotes: votes.length,
      userVotes: userVotes.length,
      hasVoted
    });

    return hasVoted;
  });

  readonly statistics = computed(() =>
    this.calculatorService.calculateSurveyStatistics(this.votes())
  );

  readonly questionsWithResults = computed(() => {
    const s = this.survey();
    const user = this.authService.currentUser();
    if (!s || !user) return [];

    return s.questions.map(q =>
      this.calculatorService.enhanceQuestion(q, this.votesWithPreview(), user.id)
    );
  });

  readonly canViewResults = computed(() => {
    const s = this.survey();
    if (!s) return false;
    return this.hasVoted() || !s.isActive;
  });

  readonly hasAnyResults = computed(() => this.statistics().totalVotes > 0);

  readonly surveyStatus = computed((): SurveyStatus => {
    const s = this.survey();
    if (!s) return 'draft';
    return s.isActive ? 'published' : 'ended';
  });

  readonly contentLayout = computed(() => {
    return 'split' as const;
  });

  readonly selections = signal<Map<string, string[]>>(new Map());

  /** Preview votes from current selections for live feedback. */
  readonly previewVotes = computed(() => {
    const user = this.authService.currentUser();
    const selections = this.selections();
    const hasVoted = this.hasVoted();

    if (!user || hasVoted || selections.size === 0) {
      return [];
    }

    const previewVotes: Vote[] = [];
    const now = new Date();

    selections.forEach((optionIds, questionId) => {
      optionIds.forEach(optionId => {
        previewVotes.push({
          id: `preview-${questionId}-${optionId}`,
          surveyId: this.surveyId,
          questionId,
          optionId,
          userId: user.id,
          votedAt: now
        });
      });
    });

    return previewVotes;
  });

  /** Combines real votes with preview votes for live UI updates. */
  readonly votesWithPreview = computed(() => {
    return [...this.votes(), ...this.previewVotes()];
  });

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

  private async loadSurveyData(): Promise<void> {
    this.loading.set(true);
    const currentUser = this.authService.currentUser();
    console.log('📊 Loading survey data for user:', currentUser?.displayName, currentUser?.id);

    try {
      const [surveyData, votesData] = await Promise.all([
        this.surveyDataService.getSurveyById(this.surveyId),
        this.surveyDataService.getVotesBySurvey(this.surveyId)
      ]);

      console.log('📊 Survey loaded:', surveyData.title);
      console.log('📊 Total votes loaded:', votesData.length);
      console.log('📊 Votes by userId:', votesData.reduce((acc, v) => {
        acc[v.userId] = (acc[v.userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));

      this.survey.set(surveyData);
      this.votes.set(votesData);

      if (votesData.length > 0) {
        console.log('📊 Results available, showing results view');
        this.showResultsView.set(true);
      }
    } catch (error) {
      console.error('Failed to load survey:', error);
      this.toastService.error('Failed to load survey');
    } finally {
      this.loading.set(false);
    }
  }

  private async reloadVotes(): Promise<void> {
    try {
      const votesData = await this.surveyDataService.getVotesBySurvey(this.surveyId);
      console.log('🔄 Votes reloaded:', votesData.length);
      this.votes.set(votesData);
      this.selections.set(new Map());
    } catch (error) {
      console.error('Failed to reload votes:', error);
    }
  }

  private subscribeToRealtimeVotes(): void {
    this.realtimeChannel = this.supabaseService.subscribeToVotes(
      this.surveyId,
      async () => {
        const votesData = await this.surveyDataService.getVotesBySurvey(this.surveyId);
        this.votes.set(votesData);
      }
    );
  }

  onSelectionChange(event: QuestionSelection): void {
    this.selections.update(prev => {
      const next = new Map(prev);
      next.set(event.questionId, event.optionIds);
      return next;
    });
  }

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

      console.log('✅ Votes submitted, reloading to show results...');
      await this.reloadVotes();

      this.toastService.success('Survey completed!');
      this.showResultsView.set(true);
    } catch (error) {
      console.error('Failed to submit votes:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit votes';
      this.toastService.error(message);
    }
  }

  toggleResultsView(): void {
    this.showResultsView.update(v => !v);
  }
}
