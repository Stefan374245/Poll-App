/**
 * Service for survey CRUD operations with Supabase.
 * Handles data fetching and persistence.
 * All functions follow max 14 lines convention.
 */

import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';
import { AuthService } from '../auth.service';
import { SurveyStateService } from './survey-state.service';
import type {
  Survey,
  SurveyWithDetails,
  CreateSurveyPayload,
  Vote
} from '../../models';
import type { Database } from '../../models/database.types';

type SurveyInsert = Database['public']['Tables']['surveys']['Insert'];
type SurveyRow = Database['public']['Tables']['surveys']['Row'];
type QuestionInsert = Database['public']['Tables']['questions']['Insert'];
type OptionInsert = Database['public']['Tables']['options']['Insert'];
type QuestionRow = Database['public']['Tables']['questions']['Row'];
type OptionRow = Database['public']['Tables']['options']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type VoteInsert = Database['public']['Tables']['votes']['Insert'];
type VoteRow = Database['public']['Tables']['votes']['Row'];

// Types for joined query results
interface SurveyWithJoins extends SurveyRow {
  creator: Partial<UserRow> | null;
  questions: Array<QuestionRow & { options: OptionRow[] }>;
}

@Injectable({
  providedIn: 'root'
})
export class SurveyDataService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly state = inject(SurveyStateService);

  /**
   * Loads all surveys from database.
   */
  async loadAllSurveys(): Promise<void> {
    this.state.setLoading(true);
    this.state.clearError();

    try {
      const surveys = await this.fetchSurveysWithDetails();
      this.state.setSurveys(surveys);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.state.setLoading(false);
    }
  }

  /**
   * Gets single survey by ID.
   */
  async getSurveyById(id: string): Promise<SurveyWithDetails> {
    const { data, error } = await this.supabase.client
      .from('surveys')
      .select(this.buildDetailedQuery())
      .eq('id', id)
      .single();

    if (error) {
      throw this.createError(error);
    }

    return this.mapToSurveyWithDetails(data);
  }

  /**
   * Creates a new survey.
   */
  async createSurvey(payload: CreateSurveyPayload): Promise<Survey> {
    console.log('Creating survey with payload:', payload);

    const surveyData: SurveyInsert = this.mapToInsertPayload(payload);

    const { data, error } = await this.supabase.client
      .from('surveys')
      // Known Supabase typing issue - types are correct but not recognized by generic
      // @ts-expect-error - Database types are properly typed but not inferred correctly by Supabase client
      .insert(surveyData)
      .select()
      .single();

    if (error) {
      console.error('Survey creation error:', error);
      throw this.createError(error);
    }

    console.log('Survey created:', data);

    // Create questions and options
    if (payload.questions && payload.questions.length > 0) {
      const surveyRow = data as Database['public']['Tables']['surveys']['Row'];
      await this.createQuestionsWithOptions(surveyRow.id, payload.questions);
    }

    await this.loadAllSurveys();
    const surveyRow = data as Database['public']['Tables']['surveys']['Row'];
    return this.mapToSurvey(surveyRow);
  }

  /**
   * Creates questions and their options for a survey.
   */
  private async createQuestionsWithOptions(
    surveyId: string,
    questions: {text: string; allowMultiple: boolean; options: string[]}[]
  ): Promise<void> {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      // Insert question
      const questionInsert: QuestionInsert = {
        survey_id: surveyId,
        text: q.text,
        allow_multiple: q.allowMultiple,
        position: i
      };

      const { data: questionData, error: questionError } = await this.supabase.client
        .from('questions')
        // Known Supabase typing issue - types are correct but not recognized by generic
        // @ts-expect-error - Database types are properly typed but not inferred correctly by Supabase client
        .insert(questionInsert)
        .select()
        .single();

      if (questionError) {
        console.error('Question creation error:', questionError);
        throw this.createError(questionError);
      }

      // Insert options
      const questionRow = questionData as QuestionRow;

      if (q.options && q.options.length > 0) {
        const optionsData: OptionInsert[] = q.options.map((opt: string, idx: number) => ({
          question_id: questionRow.id,
          label: opt,
          position: idx
        }));

        const { error: optionsError } = await this.supabase.client
          .from('options')
          // Known Supabase typing issue - types are correct but not recognized by generic
          // @ts-expect-error - Database types are properly typed but not inferred correctly by Supabase client
          .insert(optionsData);

        if (optionsError) {
          console.error('Options creation error:', optionsError);
          throw this.createError(optionsError);
        }
      }
    }
  }

  /**
   * Updates existing survey.
   */
  async updateSurvey(
    id: string,
    updates: Database['public']['Tables']['surveys']['Update']
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('surveys')
      // @ts-ignore - Supabase typing will be resolved after generating types from project
      .update(updates)
      .eq('id', id);

    if (error) {
      throw this.createError(error);
    }

    await this.loadAllSurveys();
  }

  /**
   * Deletes a survey.
   */
  async deleteSurvey(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('surveys')
      .delete()
      .eq('id', id);

    if (error) {
      throw this.createError(error);
    }

    this.state.removeSurvey(id);
  }

  /**
   * Submits a single vote for an option.
   * Handles unique constraint and deadline validation.
   */
  async submitVote(
    surveyId: string,
    questionId: string,
    optionId: string,
    userId: string
  ): Promise<Vote> {
    // Check deadline
    const survey = await this.getSurveyById(surveyId);
    if (survey.deadline && new Date() > survey.deadline) {
      throw new Error('Survey deadline has passed');
    }

    const voteData: VoteInsert = {
      survey_id: surveyId,
      question_id: questionId,
      option_id: optionId,
      user_id: userId
    };

    const { data, error } = await this.supabase.client
      .from('votes')
      // @ts-expect-error - Database types are properly typed but not inferred correctly by Supabase client
      .insert(voteData)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error('You have already voted for this option');
      }
      throw this.createError(error);
    }

    const voteRow = data as VoteRow;
    return this.mapToVote(voteRow);
  }

  /**
   * Deletes a vote (allows user to change their vote).
   */
  async deleteVote(voteId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('votes')
      .delete()
      .eq('id', voteId);

    if (error) {
      throw this.createError(error);
    }
  }

  /**
   * Gets all votes by a specific user.
   */
  async getVotesByUser(userId: string): Promise<Vote[]> {
    const { data, error } = await this.supabase.client
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .order('voted_at', { ascending: false });

    if (error) {
      throw this.createError(error);
    }

    return (data as VoteRow[]).map(v => this.mapToVote(v));
  }

  /**
   * Gets all votes for a specific survey.
   */
  async getVotesBySurvey(surveyId: string): Promise<Vote[]> {
    const { data, error } = await this.supabase.client
      .from('votes')
      .select('*')
      .eq('survey_id', surveyId)
      .order('voted_at', { ascending: false });

    if (error) {
      throw this.createError(error);
    }

    return (data as VoteRow[]).map(v => this.mapToVote(v));
  }

  /**
   * Fetches surveys with full details (join).
   */
  private async fetchSurveysWithDetails(): Promise<SurveyWithDetails[]> {
    const { data, error } = await this.supabase.client
      .from('surveys')
      .select(this.buildDetailedQuery())
      .order('created_at', { ascending: false });

    if (error) {
      throw this.createError(error);
    }

    return (data as unknown as SurveyWithJoins[]).map((item) => this.mapToSurveyWithDetails(item));
  }

  /**
   * Builds query string for detailed survey data.
   */
  private buildDetailedQuery(): string {
    return `
      *,
      creator:users!creator_id (id, display_name, avatar_url),
      questions (*, options (*))
    `;
  }

  /**
   * Maps database row to SurveyWithDetails interface.
   */
  private mapToSurveyWithDetails(data: SurveyWithJoins): SurveyWithDetails {
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      category: data.category,
      questions: this.mapQuestions(data.questions || []),
      createdAt: new Date(data.created_at),
      deadline: data.deadline ? new Date(data.deadline) : null,
      creatorId: data.creator_id,
      isActive: data.is_active,
      creator: this.mapCreator(data.creator),
      statistics: null, // Statistics calculated from votes in calculator service
      userHasVoted: false
    };
  }

  /**
   * Maps creator data.
   */
  private mapCreator(creator: Partial<UserRow> | null) {
    return {
      id: creator?.id || '',
      displayName: creator?.display_name || 'Unknown',
      avatarUrl: creator?.avatar_url || null
    };
  }

  /**
   * Maps statistics data.
   */
  private mapStatistics(stats: Array<{ total_participants: number; total_votes: number; last_vote_at: string | null }>) {
    if (!stats || !stats[0]) {
      return null;
    }

    return {
      totalParticipants: stats[0].total_participants || 0,
      totalVotes: stats[0].total_votes || 0,
      lastVoteAt: stats[0].last_vote_at ? new Date(stats[0].last_vote_at) : null
    };
  }

  /**
   * Maps questions from database.
   */
  private mapQuestions(questions: Array<QuestionRow & { options: OptionRow[] }>) {
    return questions.map(q => ({
      id: q.id,
      text: q.text,
      allowMultiple: q.allow_multiple,
      options: this.mapOptions(q.options || [])
    }));
  }

  /**
   * Maps options from database.
   */
  private mapOptions(options: OptionRow[]) {
    return options.map(o => ({
      id: o.id,
      label: o.label,
      voteCount: 0
    }));
  }

  /**
   * Maps database row to Survey interface.
   */
  private mapToSurvey(data: SurveyRow): Survey {
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      category: data.category,
      questions: [],
      createdAt: new Date(data.created_at),
      deadline: data.deadline ? new Date(data.deadline) : null,
      creatorId: data.creator_id,
      isActive: data.is_active
    };
  }

  /**
   * Maps payload to database insert format.
   */
  private mapToInsertPayload(payload: CreateSurveyPayload): SurveyInsert {
    const supabaseUser = this.auth.getSupabaseUser();
    if (!supabaseUser) {
      throw new Error('User must be authenticated to create a survey');
    }

    return {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      deadline: payload.deadline?.toISOString() || null,
      creator_id: supabaseUser.id
    };
  }

  /**
   * Creates standardized error object.
   */
  private createError(error: unknown): Error {
    return new Error(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  /**
   * Handles errors and updates state.
   */
  private handleError(error: unknown): void {
    const message = this.createErrorMessage(error);
    this.state.setError(message);
    console.error('Survey data error:', error);
  }

  /**
   * Extracts error message from error object.
   */
  private createErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Failed to load surveys';
  }

  /**
   * Maps database row to Vote interface.
   */
  private mapToVote(data: VoteRow): Vote {
    return {
      id: data.id,
      surveyId: data.survey_id,
      questionId: data.question_id,
      optionId: data.option_id,
      userId: data.user_id,
      votedAt: new Date(data.voted_at)
    };
  }
}
