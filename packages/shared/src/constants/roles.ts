export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export const ROLE_LABELS = {
  [ROLES.ADMIN]: '管理员',
  [ROLES.TEACHER]: '教师',
  [ROLES.STUDENT]: '学生',
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'manage_users',
    'manage_questions',
    'manage_exams',
    'view_reports',
    'manage_system',
  ],
  [ROLES.TEACHER]: [
    'create_questions',
    'manage_own_questions',
    'create_exams',
    'manage_own_exams',
    'view_results',
  ],
  [ROLES.STUDENT]: ['take_exams', 'view_own_results', 'practice_questions'],
} as const;
