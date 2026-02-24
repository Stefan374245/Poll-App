import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SurveyService } from '../../core/services/survey.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Displays survey details, voting form and live results.
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

  readonly selectedOption = signal<string | null>(null);

  private readonly surveyId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly survey = computed(() =>
    this.surveyService.getSurveyById(this.surveyId)
  );

  readonly hasVoted = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;
    return this.surveyService.hasUserVoted(this.surveyId, user.id);
  });

  readonly totalVotes = computed(() =>
    this.surveyService.getTotalVotes(this.surveyId)
  );

  selectOption(optionId: string): void {
    this.selectedOption.set(optionId);
  }

  submitVote(): void {
    const optId = this.selectedOption();
    const user = this.authService.currentUser();
    if (!optId || !user) return;
    this.surveyService.vote(this.surveyId, optId, user.id);
    this.toastService.success('Vote submitted!');
  }

  percent(voteCount: number): number {
    const total = this.totalVotes();
    return total === 0 ? 0 : Math.round((voteCount / total) * 100);
  }
}
