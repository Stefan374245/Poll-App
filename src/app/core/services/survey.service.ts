import { Injectable, signal, computed } from '@angular/core';
import { Survey, SurveyOption, SurveyQuestion, CreateSurveyPayload, Vote, SurveyFilter } from '../models';

/** Maximum number of options per question. */
const MAX_OPTIONS = 10;

/** Generates a simple unique ID. */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Service for managing survey CRUD operations.
 * Uses in-memory storage with Angular Signals.
 */
@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly surveysSignal = signal<Survey[]>([]);
  private readonly votesSignal = signal<Vote[]>([]);

  /** All surveys as readonly signal. */
  readonly surveys = this.surveysSignal.asReadonly();

  /** All votes as readonly signal. */
  readonly votes = this.votesSignal.asReadonly();

  /** Returns only active surveys. */
  readonly activeSurveys = computed(() => {
    return this.filterActive(this.surveysSignal());
  });

  /** Returns only past (inactive) surveys. */
  readonly pastSurveys = computed(() => {
    return this.filterPast(this.surveysSignal());
  });

  /** Returns urgent surveys sorted by deadline. */
  readonly urgentSurveys = computed(() => {
    return this.filterUrgent(this.activeSurveys());
  });

  /** Creates a new survey from payload. */
  createSurvey(payload: CreateSurveyPayload, creatorId: string): Survey {
    const questions: SurveyQuestion[] = payload.questions.map(q => ({
      id: generateId(),
      text: q.text,
      allowMultiple: q.allowMultiple,
      options: this.buildOptions(q.options),
    }));

    const survey: Survey = {
      id: generateId(),
      title: payload.title,
      description: payload.description,
      category: payload.category,
      questions,
      createdAt: new Date(),
      deadline: payload.deadline,
      creatorId,
      isActive: true,
    };
    this.surveysSignal.update(list => [...list, survey]);
    return survey;
  }

  /** Retrieves a survey by ID. */
  getSurveyById(id: string): Survey | undefined {
    return this.surveysSignal().find(s => s.id === id);
  }

  /** Casts a vote for a question's option. */
  vote(surveyId: string, questionId: string, optionId: string, userId: string): void {
    if (this.hasUserVotedQuestion(surveyId, questionId, userId)) {
      return;
    }
    const newVote: Vote = {
      surveyId,
      questionId,
      optionId,
      userId,
      votedAt: new Date(),
    };
    this.votesSignal.update(v => [...v, newVote]);
    this.incrementVoteCount(surveyId, questionId, optionId);
  }

  /** Casts votes for multiple questions at once. */
  voteAll(surveyId: string, selections: Map<string, string[]>, userId: string): void {
    selections.forEach((optionIds, questionId) => {
      for (const optionId of optionIds) {
        this.vote(surveyId, questionId, optionId, userId);
      }
    });
  }

  /** Checks if user already voted for a specific question. */
  hasUserVotedQuestion(surveyId: string, questionId: string, userId: string): boolean {
    return this.votesSignal().some(
      v => v.surveyId === surveyId && v.questionId === questionId && v.userId === userId,
    );
  }

  /** Checks if user has completed the full survey (voted in all questions). */
  hasUserVoted(surveyId: string, userId: string): boolean {
    const survey = this.getSurveyById(surveyId);
    if (!survey) return false;
    return survey.questions.every(q =>
      this.hasUserVotedQuestion(surveyId, q.id, userId),
    );
  }

  /** Returns total votes for a specific question. */
  getQuestionTotalVotes(surveyId: string, questionId: string): number {
    const survey = this.getSurveyById(surveyId);
    if (!survey) return 0;
    const question = survey.questions.find(q => q.id === questionId);
    if (!question) return 0;
    return question.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  }

  /** Returns total unique voters for a survey. */
  getTotalVotes(surveyId: string): number {
    const voters = new Set(
      this.votesSignal()
        .filter(v => v.surveyId === surveyId)
        .map(v => v.userId),
    );
    return voters.size;
  }

  /** Deactivates expired surveys. */
  deactivateExpired(): void {
    const now = new Date();
    this.surveysSignal.update(list =>
      list.map(s => this.checkExpired(s, now)),
    );
  }

  /** Filters surveys by status. */
  getFilteredSurveys(filter: SurveyFilter): Survey[] {
    return filter === 'active'
      ? this.activeSurveys()
      : this.pastSurveys();
  }

  private filterActive(surveys: Survey[]): Survey[] {
    return surveys.filter(s => s.isActive);
  }

  private filterPast(surveys: Survey[]): Survey[] {
    return surveys.filter(s => !s.isActive);
  }

  private filterUrgent(surveys: Survey[]): Survey[] {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return surveys
      .filter(s => s.deadline !== null && s.deadline.getTime() - now < THREE_DAYS_MS)
      .sort((a, b) => (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0));
  }

  private buildOptions(labels: string[]): SurveyOption[] {
    return labels.slice(0, MAX_OPTIONS).map(label => ({
      id: generateId(),
      label,
      voteCount: 0,
    }));
  }

  private incrementVoteCount(surveyId: string, questionId: string, optionId: string): void {
    this.surveysSignal.update(list =>
      list.map(s =>
        s.id === surveyId
          ? {
              ...s,
              questions: s.questions.map(q =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options.map(o =>
                        o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o,
                      ),
                    }
                  : q,
              ),
            }
          : s,
      ),
    );
  }

  private checkExpired(survey: Survey, now: Date): Survey {
    if (survey.isActive && survey.deadline && survey.deadline < now) {
      return { ...survey, isActive: false };
    }
    return survey;
  }
}
