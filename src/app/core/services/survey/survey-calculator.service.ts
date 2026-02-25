/**
 * Service for survey-related calculations and transformations.
 * Contains pure functions without side effects.
 * All functions follow max 14 lines convention.
 */

import { Injectable } from '@angular/core';

import type {
  SurveyQuestion,
  SurveyQuestionWithResults,
  SurveyOptionWithVotes,
  Vote,
  DeadlineInfo
} from '../../models';
import { URGENT_SURVEY_THRESHOLD_MS } from '../../constants/survey.constants';

@Injectable({
  providedIn: 'root'
})
export class SurveyCalculatorService {

  /**
   * Calculates vote percentage for an option.
   */
  calculatePercentage(voteCount: number, totalVotes: number): number {
    if (totalVotes === 0) {
      return 0;
    }

    return Math.round((voteCount / totalVotes) * 100);
  }

  /**
   * Enhances question with vote results and statistics.
   */
  enhanceQuestion(
    question: SurveyQuestion,
    votes: Vote[],
    userId: string
  ): SurveyQuestionWithResults {
    const questionVotes = this.filterVotesByQuestion(votes, question.id);
    const totalVotes = questionVotes.length;
    const userVotes = this.filterVotesByUser(questionVotes, userId);
    const enrichedOptions = this.enrichOptions(
      question.options,
      questionVotes,
      userVotes,
      totalVotes
    );

    return { ...question, options: enrichedOptions, totalVotes };
  }

  /**
   * Calculates deadline information for a survey.
   */
  getDeadlineInfo(deadline: Date | null): DeadlineInfo {
    if (!deadline) {
      return this.createNoDeadlineInfo();
    }

    const timeDiff = this.calculateTimeDifference(deadline);

    if (timeDiff <= 0) {
      return this.createExpiredDeadlineInfo();
    }

    return this.createActiveDeadlineInfo(timeDiff);
  }

  /**
   * Filters votes by question ID.
   */
  private filterVotesByQuestion(votes: Vote[], questionId: string): Vote[] {
    return votes.filter(vote => vote.questionId === questionId);
  }

  /**
   * Filters votes by user ID.
   */
  private filterVotesByUser(votes: Vote[], userId: string): Vote[] {
    return votes.filter(vote => vote.userId === userId);
  }

  /**
   * Counts votes for specific option.
   */
  private countOptionVotes(votes: Vote[], optionId: string): number {
    return votes.filter(vote => vote.optionId === optionId).length;
  }

  /**
   * Checks if user voted for specific option.
   */
  private hasUserVoted(userVotes: Vote[], optionId: string): boolean {
    return userVotes.some(vote => vote.optionId === optionId);
  }

  /**
   * Enriches options with vote data.
   */
  private enrichOptions(
    options: SurveyQuestion['options'],
    questionVotes: Vote[],
    userVotes: Vote[],
    totalVotes: number
  ): SurveyOptionWithVotes[] {
    return options.map(option => this.enrichSingleOption(
      option,
      questionVotes,
      userVotes,
      totalVotes
    ));
  }

  /**
   * Enriches single option with vote data.
   */
  private enrichSingleOption(
    option: SurveyQuestion['options'][0],
    questionVotes: Vote[],
    userVotes: Vote[],
    totalVotes: number
  ): SurveyOptionWithVotes {
    const voteCount = this.countOptionVotes(questionVotes, option.id);
    const percentage = this.calculatePercentage(voteCount, totalVotes);
    const isUserChoice = this.hasUserVoted(userVotes, option.id);

    return { ...option, voteCount, percentage, isUserChoice };
  }

  /**
   * Creates deadline info for surveys without deadline.
   */
  private createNoDeadlineInfo(): DeadlineInfo {
    return {
      isUrgent: false,
      hoursRemaining: Infinity,
      daysRemaining: Infinity,
      hasExpired: false,
      formattedTime: 'No deadline'
    };
  }

  /**
   * Creates deadline info for expired surveys.
   */
  private createExpiredDeadlineInfo(): DeadlineInfo {
    return {
      isUrgent: false,
      hoursRemaining: 0,
      daysRemaining: 0,
      hasExpired: true,
      formattedTime: 'Expired'
    };
  }

  /**
   * Creates deadline info for active surveys.
   */
  private createActiveDeadlineInfo(milliseconds: number): DeadlineInfo {
    const hours = this.convertToHours(milliseconds);
    const days = this.convertToDays(hours);

    return {
      isUrgent: this.isDeadlineUrgent(milliseconds),
      hoursRemaining: hours,
      daysRemaining: days,
      hasExpired: false,
      formattedTime: this.formatRemainingTime(days, hours)
    };
  }

  /**
   * Calculates time difference in milliseconds.
   */
  private calculateTimeDifference(deadline: Date): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate.getTime() - now.getTime();
  }

  /**
   * Converts milliseconds to hours.
   */
  private convertToHours(milliseconds: number): number {
    return Math.floor(milliseconds / (1000 * 60 * 60));
  }

  /**
   * Converts hours to days.
   */
  private convertToDays(hours: number): number {
    return Math.floor(hours / 24);
  }

  /**
   * Checks if deadline is within urgent threshold.
   */
  private isDeadlineUrgent(milliseconds: number): boolean {
    return milliseconds < URGENT_SURVEY_THRESHOLD_MS;
  }

  /**
   * Formats remaining time as human-readable string.
   */
  private formatRemainingTime(days: number, hours: number): string {
    if (days > 1) {
      return `${days} days left`;
    }

    if (hours > 1) {
      return `${hours} hours left`;
    }

    return 'Less than 1 hour left';
  }
}
