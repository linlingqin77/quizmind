import { User } from '@prisma/client';

/**
 * 用户仓储接口
 * 定义用户数据访问的抽象方法
 */
export interface IUserRepository {
  /**
   * 根据 ID 查找用户
   */
  findById(id: string): Promise<User | null>;

  /**
   * 根据邮箱查找用户
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * 根据用户名查找用户
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * 创建用户
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * 更新用户
   */
  update(id: string, data: UpdateUserData): Promise<User>;

  /**
   * 更新最后登录时间
   */
  updateLastLogin(id: string): Promise<User>;

  /**
   * 删除用户
   */
  delete(id: string): Promise<User>;
}

/**
 * 创建用户数据
 */
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  role?: string;
  nickname?: string;
}

/**
 * 更新用户数据
 */
export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

