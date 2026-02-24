/**
 * Represents a single answer option within a survey.
 */
export interface SurveyOption {
  id: string;
  label: string;
  voteCount: number;
}

/**
 * Represents a survey/poll entity.
 */
export interface Survey {
  id: string;
  title: string;
  description: string;
  question: string;
  options: SurveyOption[];
  createdAt: Date;
  deadline: Date | null;
  creatorId: string;
  isActive: boolean;
}

/**
 * Payload for creating a new survey.
 */
export interface CreateSurveyPayload {
  title: string;
  description: string;
  question: string;
  options: string[];
  deadline: Date | null;
}

/**
 * Tracks which user voted for which option.
 */
export interface Vote {
  surveyId: string;
  optionId: string;
  userId: string;
  votedAt: Date;
}

/** Status filter for survey lists. */
export type SurveyFilter = 'active' | 'past';
