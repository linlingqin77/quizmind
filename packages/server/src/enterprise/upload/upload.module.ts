import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    MulterModule.register({
      // 使用内存存储，由服务处理文件保存
      storage: require('multer').memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB 最大文件大小
      },
    }),
  ],
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
