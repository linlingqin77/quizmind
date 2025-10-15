import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { Audit } from '../../shared/interceptors/audit.interceptor';
import { UploadService, UploadConfigs } from './upload.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Controller('files')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传头像
   */
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Audit({ action: 'UPLOAD', resource: 'FILE' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.uploadService.uploadFile(
      file,
      UploadConfigs.AVATAR,
      req.user.id,
    );
  }

  /**
   * 上传文档
   */
  @Post('document')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('file:upload')
  @UseInterceptors(FileInterceptor('file'))
  @Audit({ action: 'UPLOAD', resource: 'FILE' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.uploadService.uploadFile(
      file,
      UploadConfigs.DOCUMENT,
      req.user.id,
    );
  }

  /**
   * 上传图片
   */
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Audit({ action: 'UPLOAD', resource: 'FILE' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.uploadService.uploadFile(
      file,
      UploadConfigs.IMAGE,
      req.user.id,
    );
  }

  /**
   * 批量上传图片
   */
  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10)) // 最多10个文件
  @Audit({ action: 'BATCH_UPLOAD', resource: 'FILE' })
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.uploadService.uploadFiles(
      files,
      UploadConfigs.IMAGE,
      req.user.id,
    );
  }

  /**
   * 获取文件信息
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getFileInfo(@Param('id') id: string) {
    const file = await this.uploadService.getFileInfo(id);
    if (!file) {
      throw new NotFoundException('文件不存在');
    }
    return file;
  }

  /**
   * 获取用户文件列表
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserFiles(
    @Request() req,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.uploadService.getUserFiles(req.user.id, {
      category,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * 删除文件
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'DELETE', resource: 'FILE' })
  async deleteFile(@Param('id') id: string, @Request() req) {
    await this.uploadService.deleteFile(id, req.user.id);
    return { message: '文件删除成功' };
  }

  /**
   * 访问公开文件
   */
  @Get('public/:category/:filename')
  async getPublicFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    await this.serveFile(category, filename, res, true);
  }

  /**
   * 访问私有文件
   */
  @Get('private/:category/:filename')
  @UseGuards(JwtAuthGuard)
  async getPrivateFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Res() res: Response,
    @Request() req,
  ) {
    // TODO: 添加权限检查，确保用户有权访问此文件
    await this.serveFile(category, filename, res, false);
  }

  private async serveFile(
    category: string,
    filename: string,
    res: Response,
    isPublic: boolean,
  ) {
    try {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const filePath = path.join(uploadDir, category, filename);

      // 检查文件是否存在
      await fs.access(filePath);

      // 获取文件信息
      const stats = await fs.stat(filePath);
      const fileBuffer = await fs.readFile(filePath);

      // 设置响应头
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年缓存

      // 根据文件扩展名设置Content-Type
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
      };

      if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
      }

      res.send(fileBuffer);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ message: '文件不存在' });
      } else {
        res.status(500).json({ message: '文件访问失败' });
      }
    }
  }
}
