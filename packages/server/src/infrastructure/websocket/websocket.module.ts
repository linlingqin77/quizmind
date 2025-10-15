import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebSocketGatewayService } from './websocket.gateway';
import { WsJwtGuard } from './ws-jwt.guard';

@Module({
  imports: [JwtModule],
  providers: [WebSocketGatewayService, WsJwtGuard],
  exports: [WebSocketGatewayService],
})
export class WebSocketModule {}
