export enum QuestionType {
  TEXT = 'TEXT',
  MCQ = 'MCQ',
  SLIDER = 'SLIDER',
  CHECKBOX = 'CHECKBOX',
  INFO = 'INFO'
}

export interface Branch {
  optionId: string; // The ID of the option that triggers this branch
  targetQuestionId: string; // The ID of the question to jump to
}

export interface Option {
  id: string;
  label: string;
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  description?: string;
  options?: Option[]; // For MCQ, CHECKBOX
  min?: number; // For SLIDER
  max?: number; // For SLIDER
  step?: number; // For SLIDER
  minLabel?: string; // For SLIDER
  maxLabel?: string; // For SLIDER
  required?: boolean;
  branches?: Branch[]; // Branching logic mainly for MCQ
}

export interface SessionTemplate {
  id: string;
  title: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

export interface SessionResult {
  sessionId: string;
  templateId: string;
  templateTitle: string;
  completedAt: string;
  answers: Record<string, any>; // questionId -> value
  pathTaken: string[]; // List of question IDs visited
}

export type ViewState = 'DASHBOARD' | 'BUILDER' | 'RUNNER' | 'RESULTS' | 'PREVIEW';