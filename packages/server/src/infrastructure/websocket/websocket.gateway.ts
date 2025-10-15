import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';

/**
 * WebSocket 网关
 * 类似 Spring WebSocket 的 @MessageMapping
 * 提供实时通信功能
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class WebSocketGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebSocketGateway');
  private onlineUsers: Map<string, Socket> = new Map();

  /**
   * 网关初始化
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket 网关已初始化');
  }

  /**
   * 客户端连接
   */
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    
    if (userId) {
      this.onlineUsers.set(userId, client);
      this.logger.log(`客户端已连接: ${client.id}, 用户: ${userId}`);
      
      // 广播在线用户数
      this.server.emit('onlineUsers', this.onlineUsers.size);
    } else {
      this.logger.log(`客户端已连接: ${client.id}`);
    }
  }

  /**
   * 客户端断开连接
   */
  handleDisconnect(client: Socket) {
    const userId = this.findUserIdBySocket(client);
    
    if (userId) {
      this.onlineUsers.delete(userId);
      this.logger.log(`客户端已断开: ${client.id}, 用户: ${userId}`);
      
      // 广播在线用户数
      this.server.emit('onlineUsers', this.onlineUsers.size);
    } else {
      this.logger.log(`客户端已断开: ${client.id}`);
    }
  }

  /**
   * 监听消息
   */
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    this.logger.log(`收到消息: ${JSON.stringify(payload)}`);
    
    // 回复消息
    client.emit('message', {
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }

  /**
   * 加入房间（考试房间、聊天室等）
   */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(data.roomId);
    this.logger.log(`客户端 ${client.id} 加入房间: ${data.roomId}`);
    
    // 通知房间内其他用户
    client.to(data.roomId).emit('userJoined', {
      userId: client.handshake.query.userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 离开房间
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(data.roomId);
    this.logger.log(`客户端 ${client.id} 离开房间: ${data.roomId}`);
    
    // 通知房间内其他用户
    client.to(data.roomId).emit('userLeft', {
      userId: client.handshake.query.userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 发送实时通知
   */
  sendNotification(userId: string, notification: any) {
    const socket = this.onlineUsers.get(userId);
    
    if (socket) {
      socket.emit('notification', notification);
      this.logger.log(`发送通知给用户 ${userId}: ${JSON.stringify(notification)}`);
    }
  }

  /**
   * 广播消息到房间
   */
  broadcastToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
    this.logger.log(`广播到房间 ${roomId}: ${event}`);
  }

  /**
   * 广播消息到所有客户端
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`广播到所有客户端: ${event}`);
  }

  /**
   * 获取在线用户数
   */
  getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * 根据 Socket 查找用户 ID
   */
  private findUserIdBySocket(socket: Socket): string | undefined {
    for (const [userId, sock] of this.onlineUsers.entries()) {
      if (sock.id === socket.id) {
        return userId;
      }
    }
    return undefined;
  }
}
