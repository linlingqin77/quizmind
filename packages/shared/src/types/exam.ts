import { Question } from './question';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration: number;
  totalScore: number;
  passScore: number;
  startTime?: Date;
  endTime?: Date;
  status: ExamStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ExamStatus = 'draft' | 'published' | 'archived';

export interface ExamQuestion {
  id: string;
  examId: string;
  questionId: string;
  score: number;
  order: number;
  question?: Question;
}

export interface CreateExamDto {
  title: string;
  description?: string;
  duration: number;
  totalScore?: number;
  passScore?: number;
  startTime?: Date;
  endTime?: Date;
  questions?: {
    questionId: string;
    score: number;
    order: number;
  }[];
}

export interface UpdateExamDto {
  title?: string;
  description?: string;
  duration?: number;
  totalScore?: number;
  passScore?: number;
  startTime?: Date;
  endTime?: Date;
  status?: ExamStatus;
}

export interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  score: number;
  totalScore: number;
  answers: Record<string, any>;
  isPassed: boolean;
  startedAt: Date;
  submittedAt?: Date;
  duration?: number;
  createdAt: Date;
}

export interface SubmitExamDto {
  examId: string;
  answers: Record<string, any>;
  duration: number;
}
