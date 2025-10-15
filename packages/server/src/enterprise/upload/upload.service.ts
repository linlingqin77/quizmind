import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as sharp from 'sharp';

export interface UploadConfig {
  maxSize: number; // 最大文件大小（字节）
  allowedMimeTypes: string[]; // 允许的MIME类型
  category: string; // 文件分类
  isPublic?: boolean; // 是否公开访问
  generateThumbnail?: boolean; // 是否生成缩略图
}

export interface UploadResult {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  category: string;
}

/**
 * 文件上传服务
 * 支持本地存储、云存储等多种方式
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    this.ensureUploadDir();
  }

  /**
   * 上传文件
   */
  async uploadFile(
    file: Express.Multer.File,
    config: UploadConfig,
    uploaderId?: string,
  ): Promise<UploadResult> {
    // 验证文件
    this.validateFile(file, config);

    // 生成存储文件名
    const storedName = this.generateStoredName(file.originalname);
    const categoryDir = path.join(this.uploadDir, config.category);
    const filePath = path.join(categoryDir, storedName);

    try {
      // 确保分类目录存在
      await fs.mkdir(categoryDir, { recursive: true });

      // 保存文件
      await fs.writeFile(filePath, file.buffer);

      // 处理图片（生成缩略图等）
      let metadata: any = {};
      if (this.isImage(file.mimetype)) {
        metadata = await this.processImage(filePath, config);
      }

      // 生成访问URL
      const url = this.generateUrl(config.category, storedName, config.isPublic);

      // 保存到数据库
      const fileRecord = await this.prisma.fileUpload.create({
        data: {
          filename: file.originalname,
          storedName,
          mimeType: file.mimetype,
          size: file.size,
          path: filePath,
          url,
          uploaderId,
          category: config.category,
          isPublic: config.isPublic || false,
          metadata,
        },
      });

      this.logger.log(`文件上传成功: ${file.originalname} -> ${storedName}`);

      return {
        id: fileRecord.id,
        filename: file.originalname,
        url,
        size: file.size,
        mimeType: file.mimetype,
        category: config.category,
      };
    } catch (error) {
      this.logger.error(`文件上传失败: ${error.message}`, error.stack);
      
      // 清理已保存的文件
      try {
        await fs.unlink(filePath);
      } catch {}

      throw new BadRequestException('文件上传失败');
    }
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(
    files: Express.Multer.File[],
    config: UploadConfig,
    uploaderId?: string,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, config, uploaderId);
        results.push(result);
      } catch (error) {
        this.logger.error(`批量上传中的文件失败: ${file.originalname}`, error);
        // 继续处理其他文件
      }
    }

    return results;
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileId: string) {
    return this.prisma.fileUpload.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    const file = await this.prisma.fileUpload.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('文件不存在');
    }

    // 检查权限（如果提供了用户ID）
    if (userId && file.uploaderId !== userId) {
      throw new BadRequestException('无权删除此文件');
    }

    try {
      // 删除物理文件
      await fs.unlink(file.path);

      // 删除缩略图（如果存在）
      if (file.metadata && file.metadata.thumbnailPath) {
        try {
          await fs.unlink(file.metadata.thumbnailPath);
        } catch {}
      }

      // 删除数据库记录
      await this.prisma.fileUpload.delete({
        where: { id: fileId },
      });

      this.logger.log(`文件删除成功: ${file.filename}`);
    } catch (error) {
      this.logger.error(`文件删除失败: ${error.message}`, error.stack);
      throw new BadRequestException('文件删除失败');
    }
  }

  /**
   * 获取用户文件列表
   */
  async getUserFiles(
    uploaderId: string,
    params: {
      category?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { category, page = 1, limit = 20 } = params;

    const where: any = { uploaderId };
    if (category) where.category = category;

    const [files, total] = await Promise.all([
      this.prisma.fileUpload.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.fileUpload.count({ where }),
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 清理过期文件
   */
  async cleanupExpiredFiles(days = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const expiredFiles = await this.prisma.fileUpload.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        // 只清理临时文件
        category: 'temp',
      },
    });

    let deletedCount = 0;

    for (const file of expiredFiles) {
      try {
        await this.deleteFile(file.id);
        deletedCount++;
      } catch (error) {
        this.logger.error(`清理过期文件失败: ${file.filename}`, error);
      }
    }

    this.logger.log(`清理了 ${deletedCount} 个过期文件`);
    return deletedCount;
  }

  private validateFile(file: Express.Multer.File, config: UploadConfig): void {
    // 检查文件大小
    if (file.size > config.maxSize) {
      throw new BadRequestException(
        `文件大小超过限制 (${this.formatFileSize(config.maxSize)})`,
      );
    }

    // 检查MIME类型
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `不支持的文件类型: ${file.mimetype}`,
      );
    }
  }

  private generateStoredName(originalName: string): string {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${hash}${ext}`;
  }

  private generateUrl(category: string, storedName: string, isPublic: boolean): string {
    const prefix = isPublic ? 'public' : 'private';
    return `${this.baseUrl}/api/files/${prefix}/${category}/${storedName}`;
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async processImage(filePath: string, config: UploadConfig): Promise<any> {
    const metadata: any = {};

    try {
      const image = sharp(filePath);
      const info = await image.metadata();

      metadata.width = info.width;
      metadata.height = info.height;
      metadata.format = info.format;

      // 生成缩略图
      if (config.generateThumbnail) {
        const thumbnailPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
        await image
          .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
          .toFile(thumbnailPath);
        
        metadata.thumbnailPath = thumbnailPath;
        metadata.thumbnailUrl = this.generateUrl(
          config.category,
          path.basename(thumbnailPath),
          config.isPublic,
        );
      }
    } catch (error) {
      this.logger.warn(`图片处理失败: ${error.message}`);
    }

    return metadata;
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error(`创建上传目录失败: ${error.message}`);
    }
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// 预定义的上传配置
export const UploadConfigs = {
  // 头像上传
  AVATAR: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    category: 'avatars',
    isPublic: true,
    generateThumbnail: true,
  },

  // 文档上传
  DOCUMENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    category: 'documents',
    isPublic: false,
  },

  // 图片上传
  IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    category: 'images',
    isPublic: true,
    generateThumbnail: true,
  },

  // 临时文件
  TEMP: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ['*/*'], // 允许所有类型
    category: 'temp',
    isPublic: false,
  },
} as const;
