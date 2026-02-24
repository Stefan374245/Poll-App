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
  surveyId: string;
  questionId: string;
  optionId: string;
  userId: string;
  votedAt: Date;
}

/** Status filter for survey lists. */
export type SurveyFilter = 'active' | 'past';
