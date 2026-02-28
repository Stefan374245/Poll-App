/**
 * Manages global survey state using Angular signals.
 * Provides reactive state management for survey-related data.
 * All functions follow max 14 lines convention.
 */

import { Injectable, computed, signal, inject } from '@angular/core';

import { AuthService } from '../auth.service';
import type { SurveyWithDetails, SurveyFilter, Vote } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class SurveyStateService {
  private readonly auth = inject(AuthService);

  private readonly _surveys = signal<SurveyWithDetails[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filter = signal<SurveyFilter>('active');
  private readonly _votes = signal<Vote[]>([]);

  /** Read-only surveys signal */
  readonly surveys = this._surveys.asReadonly();

  /** Read-only loading state signal */
  readonly loading = this._loading.asReadonly();

  /** Read-only error signal */
  readonly error = this._error.asReadonly();

  /** Read-only filter signal */
  readonly filter = this._filter.asReadonly();

  /** Read-only votes signal */
  readonly votes = this._votes.asReadonly();

  /** Computed: Votes by current user */
  readonly votesByCurrentUser = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    return this._votes().filter(v => v.userId === user.id);
  });

  /** Computed: Vote counts per survey */
  readonly surveyVoteCounts = computed(() => {
    const voteCounts = new Map<string, number>();
    this._votes().forEach(vote => {
      const count = voteCounts.get(vote.surveyId) || 0;
      voteCounts.set(vote.surveyId, count + 1);
    });
    return voteCounts;
  });

  /** Computed: Surveys created by current user */
  readonly surveysByCurrentUser = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    return this._surveys().filter(s => s.creatorId === user.id);
  });

  /** Computed: Active surveys only */
  readonly activeSurveys = computed(() =>
    this.filterActiveSurveys(this._surveys())
  );

  /** Computed: Past surveys only */
  readonly pastSurveys = computed(() =>
    this.filterPastSurveys(this._surveys())
  );

  /** Computed: Urgent surveys (deadline < 24h) */
  readonly urgentSurveys = computed(() =>
    this.filterAndSortUrgentSurveys(this.activeSurveys())
  );

  /** Computed: Filtered surveys based on current filter */
  readonly filteredSurveys = computed(() =>
    this.applyCurrentFilter()
  );

  /**
   * Sets the survey filter.
   */
  setFilter(filter: SurveyFilter): void {
    this._filter.set(filter);
  }

  /**
   * Replaces all surveys in state.
   */
  setSurveys(surveys: SurveyWithDetails[]): void {
    this._surveys.set(surveys);
  }

  /**
   * Adds a new survey to state.
   */
  addSurvey(survey: SurveyWithDetails): void {
    this._surveys.update(surveys => [survey, ...surveys]);
  }

  /**
   * Updates an existing survey in state.
   */
  updateSurvey(id: string, updates: Partial<SurveyWithDetails>): void {
    this._surveys.update(surveys =>
      surveys.map(survey =>
        survey.id === id ? { ...survey, ...updates } : survey
      )
    );
  }

  /**
   * Removes a survey from state.
   */
  removeSurvey(id: string): void {
    this._surveys.update(surveys =>
      surveys.filter(survey => survey.id !== id)
    );
  }

  /**
   * Sets loading state.
   */
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  /**
   * Sets error message.
   */
  setError(error: string | null): void {
    this._error.set(error);
  }

  /**
   * Clears error state.
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Sets all votes in state.
   */
  setVotes(votes: Vote[]): void {
    this._votes.set(votes);
  }

  /**
   * Adds a single vote to state.
   */
  addVote(vote: Vote): void {
    this._votes.update(votes => [...votes, vote]);
  }

  /**
   * Removes a vote from state.
   */
  removeVote(voteId: string): void {
    this._votes.update(votes => votes.filter(v => v.id !== voteId));
  }

  /**
   * Updates votes for a specific survey.
   */
  updateSurveyVotes(surveyId: string, votes: Vote[]): void {
    this._votes.update(allVotes => [
      ...allVotes.filter(v => v.surveyId !== surveyId),
      ...votes
    ]);
  }

  /**
   * Filters active surveys.
   */
  private filterActiveSurveys(surveys: SurveyWithDetails[]): SurveyWithDetails[] {
    return surveys.filter(survey => this.isSurveyActive(survey));
  }

  /**
   * Filters past surveys.
   */
  private filterPastSurveys(surveys: SurveyWithDetails[]): SurveyWithDetails[] {
    return surveys.filter(survey => !this.isSurveyActive(survey));
  }

  /**
   * Filters urgent surveys and sorts by deadline.
   */
  private filterAndSortUrgentSurveys(
    surveys: SurveyWithDetails[]
  ): SurveyWithDetails[] {
    const urgentList = surveys.filter(survey =>
      this.isSurveyUrgent(survey)
    );

    return this.sortByDeadline(urgentList);
  }

  /**
   * Applies current filter to surveys.
   */
  private applyCurrentFilter(): SurveyWithDetails[] {
    return this._filter() === 'active'
      ? this.activeSurveys()
      : this.pastSurveys();
  }

  /**
   * Checks if survey is active.
   */
  private isSurveyActive(survey: SurveyWithDetails): boolean {
    if (!survey.isActive) {
      return false;
    }

    if (!survey.deadline) {
      return true;
    }

    return new Date(survey.deadline) > new Date();
  }

  /**
   * Checks if survey deadline is urgent (< 24 hours).
   */
  private isSurveyUrgent(survey: SurveyWithDetails): boolean {
    if (!survey.deadline) {
      return false;
    }

    const hours = this.calculateHoursRemaining(survey.deadline);
    return hours > 0 && hours < 24;
  }

  /**
   * Calculates hours remaining until deadline.
   */
  private calculateHoursRemaining(deadline: Date): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const milliseconds = deadlineDate.getTime() - now.getTime();

    return milliseconds / (1000 * 60 * 60);
  }

  /**
   * Sorts surveys by deadline (earliest first).
   */
  private sortByDeadline(surveys: SurveyWithDetails[]): SurveyWithDetails[] {
    return [...surveys].sort((a, b) => {
      const dateA = this.getDeadlineTimestamp(a.deadline);
      const dateB = this.getDeadlineTimestamp(b.deadline);

      return dateA - dateB;
    });
  }

  /**
   * Gets deadline timestamp or Infinity if no deadline.
   */
  private getDeadlineTimestamp(deadline: Date | null): number {
    return deadline ? new Date(deadline).getTime() : Infinity;
  }
}
