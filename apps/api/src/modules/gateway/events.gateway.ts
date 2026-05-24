import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface ScanEventPayload {
  id: string;
  tagUid: string;
  petId: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  deviceType: string | null;
  createdAt: string;
}

export interface LostPetPayload {
  petId: string;
  petName: string;
  species: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  reportId: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  // userId → Set<socketId> — track which sockets belong to each user
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const payload = this.jwt.verify(token, {
          secret: this.config.get('jwt.accessSecret'),
        }) as { sub: string; role: string };

        client.data.userId = payload.sub;
        client.data.role = payload.role;

        // Join personal room
        client.join(`user:${payload.sub}`);

        // Admin gets the live-feed room
        if (['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
          client.join('admin');
        }

        // Track socket for this user
        if (!this.userSockets.has(payload.sub)) {
          this.userSockets.set(payload.sub, new Set());
        }
        this.userSockets.get(payload.sub)!.add(client.id);
      }

      this.logger.debug(`Client connected: ${client.id} (user: ${client.data.userId ?? 'anon'})`);
    } catch {
      // Unauthenticated connections are allowed for public channels
      this.logger.debug(`Anonymous client connected: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  // ── Client-subscribed messages ─────────────────────────────────────────────

  @SubscribeMessage('subscribe:lost-pets')
  handleSubscribeLostPets(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { city: string },
  ) {
    if (data?.city) {
      client.join(`lost-pets:${data.city.toLowerCase()}`);
      client.emit('subscribed', { channel: `lost-pets:${data.city}` });
    }
  }

  @SubscribeMessage('unsubscribe:lost-pets')
  handleUnsubscribeLostPets(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { city: string },
  ) {
    if (data?.city) {
      client.leave(`lost-pets:${data.city.toLowerCase()}`);
    }
  }

  // ── Internal event emitters (triggered by EventEmitter2) ──────────────────

  @OnEvent('scan.created')
  broadcastScanEvent(payload: ScanEventPayload) {
    // Push to admin live feed
    this.server.to('admin').emit('scan_event', payload);

    // Push to pet owner's personal room
    if (payload.petId) {
      this.server.to(`user:${payload.petId}`).emit('pet_scanned', payload);
    }
  }

  @OnEvent('pet.lost')
  broadcastPetLost(payload: LostPetPayload & { ownerId: string }) {
    this.server.to('admin').emit('pet_lost', payload);

    // Notify users subscribed to that city
    if (payload.city) {
      this.server
        .to(`lost-pets:${payload.city.toLowerCase()}`)
        .emit('lost_pet_nearby', payload);
    }
  }

  @OnEvent('pet.found')
  broadcastPetFound(payload: { petId: string; petName: string; ownerId: string }) {
    this.server.to('admin').emit('pet_found', payload);
    this.server.to(`user:${payload.ownerId}`).emit('pet_found', payload);
  }

  @OnEvent('sighting.created')
  broadcastSighting(payload: { reportId: string; ownerId: string; address?: string }) {
    this.server.to(`user:${payload.ownerId}`).emit('sighting_reported', payload);
  }

  // ── Public emit helpers (used by services) ────────────────────────────────

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToAdmins(event: string, data: unknown) {
    this.server.to('admin').emit(event, data);
  }

  getConnectedCount(): number {
    return this.server.sockets.sockets.size;
  }
}
