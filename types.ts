export enum QuestionType {
  TEXT = 'TEXT',
  MCQ = 'MCQ',
  SLIDER = 'SLIDER',
  CHECKBOX = 'CHECKBOX',
  INFO = 'INFO'
}

export interface Branch {
  optionId: string;
  targetQuestionId: string;
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
  options?: Option[];
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  required?: boolean;
  branches?: Branch[];
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
  answers: Record<string, any>;
  pathTaken: string[];
}

export type ViewState = 'DASHBOARD' | 'BUILDER' | 'RUNNER' | 'RESULTS' | 'PREVIEW' | 'TRAINING';