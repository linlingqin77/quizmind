export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'teacher' | 'student';

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  avatar?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: Omit<User, 'password'>;
}
