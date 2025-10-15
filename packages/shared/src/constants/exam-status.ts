export const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const EXAM_STATUS_LABELS = {
  [EXAM_STATUS.DRAFT]: '草稿',
  [EXAM_STATUS.PUBLISHED]: '已发布',
  [EXAM_STATUS.ARCHIVED]: '已归档',
} as const;

export const EXAM_STATUS_COLORS = {
  [EXAM_STATUS.DRAFT]: '#909399',
  [EXAM_STATUS.PUBLISHED]: '#67C23A',
  [EXAM_STATUS.ARCHIVED]: '#E6A23C',
} as const;
