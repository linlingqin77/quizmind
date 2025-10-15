import { Module, Global } from '@nestjs/common';
import { ElasticsearchLoggerService } from './elasticsearch-logger.service';

@Global()
@Module({
  providers: [ElasticsearchLoggerService],
  exports: [ElasticsearchLoggerService],
})
export class LoggingModule {}

