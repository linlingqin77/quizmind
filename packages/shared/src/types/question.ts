export interface Question {
  id: string;
  title: string;
  content: string;
  type: QuestionType;
  options?: QuestionOption[];
  answer: string;
  explanation?: string;
  difficulty: number;
  tags: string[];
  categoryId?: string;
  createdById: string;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay';

export interface QuestionOption {
  key: string;
  value: string;
}

export interface CreateQuestionDto {
  title: string;
  content: string;
  type: QuestionType;
  options?: QuestionOption[];
  answer: string;
  explanation?: string;
  difficulty?: number;
  tags?: string[];
  categoryId?: string;
}

export interface UpdateQuestionDto {
  title?: string;
  content?: string;
  type?: QuestionType;
  options?: QuestionOption[];
  answer?: string;
  explanation?: string;
  difficulty?: number;
  tags?: string[];
  categoryId?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
