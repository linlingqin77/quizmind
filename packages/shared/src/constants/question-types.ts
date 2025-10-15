export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
} as const;

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.SINGLE_CHOICE]: '单选题',
  [QUESTION_TYPES.MULTIPLE_CHOICE]: '多选题',
  [QUESTION_TYPES.TRUE_FALSE]: '判断题',
  [QUESTION_TYPES.SHORT_ANSWER]: '简答题',
  [QUESTION_TYPES.ESSAY]: '论述题',
} as const;

export const DIFFICULTY_LEVELS = {
  VERY_EASY: 1,
  EASY: 2,
  MEDIUM: 3,
  HARD: 4,
  VERY_HARD: 5,
} as const;

export const DIFFICULTY_LABELS = {
  [DIFFICULTY_LEVELS.VERY_EASY]: '非常简单',
  [DIFFICULTY_LEVELS.EASY]: '简单',
  [DIFFICULTY_LEVELS.MEDIUM]: '中等',
  [DIFFICULTY_LEVELS.HARD]: '困难',
  [DIFFICULTY_LEVELS.VERY_HARD]: '非常困难',
} as const;
