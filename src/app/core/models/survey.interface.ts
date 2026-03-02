/**
 * Represents a single answer option within a survey question.
 */
export interface SurveyOption {
  id: string;
  label: string;
  voteCount: number;
}

/**
 * Represents a single question within a survey.
 */
export interface SurveyQuestion {
  id: string;
  text: string;
  hint?: string;
  allowMultiple: boolean;
  options: SurveyOption[];
}

/**
 * Represents a survey/poll entity.
 */
export interface Survey {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: SurveyQuestion[];
  createdAt: Date;
  deadline: Date | null;
  creatorId: string;
  isActive: boolean;
}

/**
 * Question payload for creating a new survey.
 */
export interface CreateQuestionPayload {
  text: string;
  hint?: string;
  allowMultiple: boolean;
  options: string[];
}

/**
 * Payload for creating a new survey.
 */
export interface CreateSurveyPayload {
  title: string;
  description: string;
  category: string;
  questions: CreateQuestionPayload[];
  deadline: Date | null;
}

/**
 * Tracks which user voted for which option in which question.
 */
export interface Vote {
  id: string;
  surveyId: string;
  questionId: string;
  optionId: string;
  userId: string;
  votedAt: Date;
}

/**
 * Survey option enriched with voting statistics.
 */
export interface SurveyOptionWithVotes extends SurveyOption {
  percentage: number;
  isUserChoice: boolean;
}

/**
 * Survey question with calculated results.
 */
export interface SurveyQuestionWithResults extends SurveyQuestion {
  options: SurveyOptionWithVotes[];
  totalVotes: number;
}

/**
 * Survey statistics aggregated from votes.
 */
export interface SurveyStatistics {
  totalParticipants: number;
  totalVotes: number;
  lastVoteAt: Date | null;
}

/**
 * Survey with complete nested data from database join.
 */
export interface SurveyWithDetails extends Survey {
  creator: {
    id: string;
    displayName: string;
  };
  statistics: SurveyStatistics | null;
  userHasVoted: boolean;
}

/**
 * Time remaining calculation for survey deadline.
 */
export interface DeadlineInfo {
  isUrgent: boolean;
  hoursRemaining: number;
  daysRemaining: number;
  hasExpired: boolean;
  formattedTime: string;
}

/** Status filter for survey lists. */
export type SurveyFilter = 'active' | 'past';
