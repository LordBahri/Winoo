import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LinkTagDto } from './dto/link-tag.dto';
import { ScanEventDto } from './dto/scan-event.dto';
import { AuthUser } from '../../common/types/auth-user.type';

@Injectable()
export class NfcTagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    @InjectQueue('notifications') private readonly notifQueue: Queue,
    @InjectQueue('geo') private readonly geoQueue: Queue,
  ) {}

  async resolveTag(tagUid: string) {
    const tag = await this.prisma.nfcTag.findUnique({
      where: { tagUid },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            color: true,
            profileImageUrl: true,
            isLost: true,
            lostAt: true,
            visibility: true,
            owner: {
              select: {
                name: true,
                phone: true, // masked in response
              },
            },
          },
        },
      },
    });

    if (!tag || tag.status !== 'ACTIVE') {
      throw new NotFoundException('Tag not found or inactive');
    }

    const pet = tag.pet!;

    // Mask owner phone number for privacy
    const maskedPhone = pet.owner.phone
      ? pet.owner.phone.replace(/(\+?\d{1,4})\s?\d+(\d{2})/, '$1 *** *** $2')
      : null;

    return {
      tagUid: tag.tagUid,
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        color: pet.color,
        profileImageUrl: pet.profileImageUrl,
        isLost: pet.isLost,
        lostAt: pet.lostAt,
        ownerFirstName: pet.owner.name.split(' ')[0],
        ownerMaskedPhone: maskedPhone,
      },
    };
  }

  async logScanEvent(dto: ScanEventDto, ip: string, userAgent: string) {
    const tag = await this.prisma.nfcTag.findUnique({
      where: { tagUid: dto.tagUid },
      select: { id: true, petId: true, status: true },
    });

    const event = await this.prisma.scanEvent.create({
      data: {
        tagUid: dto.tagUid,
        tagId: tag?.id,
        petId: tag?.petId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        ipAddress: ip,
        userAgent,
        deviceType: this.detectDeviceType(userAgent),
      },
    });

    if (tag?.id) {
      // Update tag last scanned timestamp (fire-and-forget)
      this.prisma.nfcTag
        .update({
          where: { id: tag.id },
          data: { lastScannedAt: new Date(), scanCount: { increment: 1 } },
        })
        .catch(() => null);
    }

    if (tag?.petId && dto.latitude && dto.longitude) {
      // Reverse geocode asynchronously
      this.geoQueue.add('reverse-geocode', {
        scanEventId: event.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });

      // Notify pet owner
      this.notifQueue.add('pet-scanned', {
        petId: tag.petId,
        scanEventId: event.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });
    }

    return { accepted: true };
  }

  async findByOwner(userId: string) {
    return this.prisma.nfcTag.findMany({
      where: { pet: { ownerId: userId, deletedAt: null } },
      include: { pet: { select: { id: true, name: true, profileImageUrl: true } } },
    });
  }

  async linkTag(user: AuthUser, dto: LinkTagDto) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: dto.petId, deletedAt: null },
      include: { nfcTag: true },
    });

    if (!pet) throw new NotFoundException('Pet not found');
    if (pet.ownerId !== user.id && !([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(user.role as Role)) {
      throw new ForbiddenException('Access denied');
    }
    if (pet.nfcTag) throw new BadRequestException('Pet already has a tag linked');

    // Check if tag exists (pre-provisioned) or create on-the-fly
    let tag = await this.prisma.nfcTag.findUnique({ where: { tagUid: dto.tagUid } });

    if (tag && tag.petId) {
      throw new BadRequestException('This tag is already linked to another pet');
    }

    if (tag) {
      tag = await this.prisma.nfcTag.update({
        where: { id: tag.id },
        data: { petId: dto.petId, status: 'ACTIVE', activatedAt: new Date() },
      });
    } else {
      tag = await this.prisma.nfcTag.create({
        data: {
          tagUid: dto.tagUid,
          petId: dto.petId,
          tagType: dto.tagType ?? 'NFC',
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
      });
    }

    this.events.emit('tag.linked', { tag, pet });
    return tag;
  }

  async unlinkTag(tagUid: string, user: AuthUser) {
    const tag = await this.prisma.nfcTag.findUnique({
      where: { tagUid },
      include: { pet: true },
    });

    if (!tag) throw new NotFoundException('Tag not found');

    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(user.role as Role);
    if (!isAdmin && tag.pet?.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.nfcTag.update({
      where: { tagUid },
      data: { petId: null, status: 'DEACTIVATED' },
    });
  }

  async getHistory(tagUid: string, user: AuthUser) {
    const tag = await this.prisma.nfcTag.findUnique({
      where: { tagUid },
      include: { pet: true },
    });

    if (!tag) throw new NotFoundException('Tag not found');

    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(user.role as Role);
    if (!isAdmin && tag.pet?.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.scanEvent.findMany({
      where: { tagUid },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private detectDeviceType(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'MOBILE';
    if (/tablet/i.test(userAgent)) return 'TABLET';
    return 'DESKTOP';
  }
}
