import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

/**
 * 数据完整性服务
 * 在 Service 层验证数据存在性和完整性
 * 遵循阿里开发规范，不使用物理外键
 * 
 * 使用方式：
 * 1. 在 Service 层注入此服务
 * 2. 在业务逻辑中调用验证方法
 * 3. 一次查询，同时完成存在性验证和获取数据
 */
@Injectable()
export class DataIntegrityService {
  private readonly logger = new Logger(DataIntegrityService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 检查用户是否存在（并返回用户对象）
   * @param userId 用户ID
   * @param options 查询选项（可选）
   * @returns 用户对象
   * @throws NotFoundException 用户不存在
   */
  async validateAndGetUser(userId: string, options?: any) {
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      ...options,
    });

    if (!user) {
      throw new NotFoundException(`用户不存在: ${userId}`);
    }

    return user;
  }

  /**
   * 检查考试是否存在（并返回考试对象）
   */
  async validateAndGetExam(examId: string, options?: any) {
    if (!examId) {
      throw new BadRequestException('考试ID不能为空');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      ...options,
    });

    if (!exam) {
      throw new NotFoundException(`考试不存在: ${examId}`);
    }

    return exam;
  }

  /**
   * 检查题目是否存在（并返回题目对象）
   */
  async validateAndGetQuestion(questionId: string, options?: any) {
    if (!questionId) {
      throw new BadRequestException('题目ID不能为空');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      ...options,
    });

    if (!question) {
      throw new NotFoundException(`题目不存在: ${questionId}`);
    }

    return question;
  }

  /**
   * 批量检查题目是否存在
   */
  async validateQuestionsExist(questionIds: string[]) {
    if (!questionIds || questionIds.length === 0) return true;

    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true },
    });

    const existingIds = questions.map(q => q.id);
    const missingIds = questionIds.filter(id => !existingIds.includes(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(`题目不存在: ${missingIds.join(', ')}`);
    }

    return true;
  }

  /**
   * 检查分类是否存在（并返回分类对象）
   */
  async validateAndGetCategory(categoryId: string, options?: any) {
    if (!categoryId) {
      throw new BadRequestException('分类ID不能为空');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      ...options,
    });

    if (!category) {
      throw new NotFoundException(`分类不存在: ${categoryId}`);
    }

    return category;
  }

  /**
   * 检查分类父子关系是否会形成循环
   */
  async validateCategoryHierarchy(categoryId: string, parentId: string): Promise<boolean> {
    if (!parentId) return true;

    const isCircular = await this.checkCategoryCircular(categoryId, parentId);
    if (isCircular) {
      throw new BadRequestException('分类层级不能形成循环引用');
    }

    return true;
  }

  /**
   * 检查是否可以安全删除用户
   */
  async canDeleteUser(userId: string): Promise<{ canDelete: boolean; reason?: string; relatedCount?: number }> {
    const [examRecords, practiceRecords, wrongQuestions, favorites, notes] = await Promise.all([
      this.prisma.examRecord.count({ where: { userId } }),
      this.prisma.practiceRecord.count({ where: { userId } }),
      this.prisma.wrongQuestion.count({ where: { userId } }),
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.note.count({ where: { userId } }),
    ]);

    const totalRecords = examRecords + practiceRecords + wrongQuestions + favorites + notes;

    if (totalRecords > 0) {
      return {
        canDelete: false,
        reason: `用户有 ${totalRecords} 条关联数据，建议设置为非活跃状态而不是删除`,
        relatedCount: totalRecords,
      };
    }

    return { canDelete: true };
  }

  /**
   * 检查是否可以安全删除题目
   */
  async canDeleteQuestion(questionId: string): Promise<{ canDelete: boolean; reason?: string; relatedCount?: number }> {
    const [paperQuestions, wrongQuestions, favorites, notes] = await Promise.all([
      this.prisma.paperQuestion.count({ where: { questionId } }),
      this.prisma.wrongQuestion.count({ where: { questionId } }),
      this.prisma.favorite.count({ where: { questionId } }),
      this.prisma.note.count({ where: { questionId } }),
    ]);

    const totalRecords = paperQuestions + wrongQuestions + favorites + notes;

    if (totalRecords > 0) {
      return {
        canDelete: false,
        reason: `题目有 ${totalRecords} 条关联数据，无法删除`,
        relatedCount: totalRecords,
      };
    }

    return { canDelete: true };
  }

  /**
   * 检查是否可以安全删除考试
   */
  async canDeleteExam(examId: string): Promise<{ canDelete: boolean; reason?: string; relatedCount?: number }> {
    const examRecords = await this.prisma.examRecord.count({ where: { examId } });

    if (examRecords > 0) {
      return {
        canDelete: false,
        reason: `考试有 ${examRecords} 条考试记录，无法删除`,
        relatedCount: examRecords,
      };
    }

    return { canDelete: true };
  }

  /**
   * 软删除用户（设置为非活跃）
   */
  async softDeleteUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${userId}@deleted.com`,
        username: `deleted_${Date.now()}_${userId}`,
      },
    });

    this.logger.log(`用户已软删除: ${userId}`);
  }

  /**
   * 清理孤儿数据
   * 定期清理没有关联主记录的数据
   */
  async cleanupOrphanedData(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    try {
      // 清理孤儿考试记录
      const orphanedExamRecords = await this.prisma.$executeRaw`
        DELETE FROM exam_records 
        WHERE user_id NOT IN (SELECT id FROM users)
        OR exam_id NOT IN (SELECT id FROM exams)
      `;
      results.examRecords = Number(orphanedExamRecords);

      // 清理孤儿练习记录
      const orphanedPracticeRecords = await this.prisma.$executeRaw`
        DELETE FROM practice_records 
        WHERE user_id NOT IN (SELECT id FROM users)
      `;
      results.practiceRecords = Number(orphanedPracticeRecords);

      // 清理孤儿错题记录
      const orphanedWrongQuestions = await this.prisma.$executeRaw`
        DELETE FROM wrong_questions 
        WHERE user_id NOT IN (SELECT id FROM users)
        OR question_id NOT IN (SELECT id FROM questions)
      `;
      results.wrongQuestions = Number(orphanedWrongQuestions);

      // 清理孤儿收藏记录
      const orphanedFavorites = await this.prisma.$executeRaw`
        DELETE FROM favorites 
        WHERE user_id NOT IN (SELECT id FROM users)
        OR question_id NOT IN (SELECT id FROM questions)
      `;
      results.favorites = Number(orphanedFavorites);

      // 清理孤儿笔记记录
      const orphanedNotes = await this.prisma.$executeRaw`
        DELETE FROM notes 
        WHERE user_id NOT IN (SELECT id FROM users)
        OR question_id NOT IN (SELECT id FROM questions)
      `;
      results.notes = Number(orphanedNotes);

      this.logger.log('孤儿数据清理完成', results);
      return results;
    } catch (error) {
      this.logger.error('孤儿数据清理失败', error);
      throw error;
    }
  }

  /**
   * 检查分类是否会形成循环引用（私有方法）
   */
  private async checkCategoryCircular(categoryId: string, parentId: string): Promise<boolean> {
    if (categoryId === parentId) return true;

    let currentParentId = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) return true;
      if (currentParentId === categoryId) return true;

      visited.add(currentParentId);

      const parent = await this.prisma.category.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

      currentParentId = parent?.parentId || null;
    }

    return false;
  }
}
