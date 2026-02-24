import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Displays survey details, voting form and live results (US-4 / US-5).
 */
@Component({
  selector: 'app-survey-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyService = inject(SurveyService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  /** Selected option ID. */
  readonly selectedOption = signal<string | null>(null);

  /** Survey ID from route. */
  private readonly surveyId = this.route.snapshot.paramMap.get('id') ?? '';

  /** Current survey. */
  readonly survey = computed(() =>
    this.surveyService.getSurveyById(this.surveyId)
  );

  /** Whether current user has already voted. */
  readonly hasVoted = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;
    return this.surveyService.hasUserVoted(this.surveyId, user.id);
  });

  /** Total votes for progress bars. */
  readonly totalVotes = computed(() =>
    this.surveyService.getTotalVotes(this.surveyId)
  );

  /** Selects an option before voting. */
  selectOption(optionId: string): void {
    this.selectedOption.set(optionId);
  }

  /** Submits the vote. */
  submitVote(): void {
    const optId = this.selectedOption();
    const user = this.authService.currentUser();
    if (!optId || !user) return;

    this.surveyService.vote(this.surveyId, optId, user.id);
    this.toastService.success('Vote submitted!');
  }

  /** Calculates percentage for a vote count. */
  percent(voteCount: number): number {
    const total = this.totalVotes();
    return total === 0 ? 0 : Math.round((voteCount / total) * 100);
  }
}
