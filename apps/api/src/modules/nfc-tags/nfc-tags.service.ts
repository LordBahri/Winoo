import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LinkTagDto } from './dto/link-tag.dto';
import { ScanEventDto } from './dto/scan-event.dto';
import { RecoverTagDto } from './dto/recover-tag.dto';
import { ContactRequestDto } from './dto/contact-request.dto';
import { SunValidatorService } from './crypto/sun-validator.service';
import { AuthUser } from '../../common/types/auth-user.type';

@Injectable()
export class NfcTagsService {
  private readonly logger = new Logger(NfcTagsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly sunValidator: SunValidatorService,
    @InjectQueue('notifications') private readonly notifQueue: Queue,
    @InjectQueue('geo') private readonly geoQueue: Queue,
  ) {}

  // ── Public recovery flow (SUN-validated where applicable) ────────────
  async recoverTag(publicId: string, dto: RecoverTagDto, ip: string, userAgent: string) {
    const tag = await this.prisma.nfcTag.findUnique({
      where: { publicId },
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
            owner: { select: { name: true } },
          },
        },
      },
    });

    if (!tag) throw new NotFoundException('Tag not found');
    if (tag.status === 'DEACTIVATED') throw new GoneException('This tag has been deactivated');

    // SUN validation (only for tags provisioned with a CMAC key)
    let cmacStatus: 'valid' | 'invalid' | 'not_required' = 'not_required';
    if (tag.cmacEnabled) {
      if (!tag.cmacKey || !dto.picc_data || !dto.cmac) {
        cmacStatus = 'invalid';
      } else {
        const result = this.sunValidator.validate(
          Buffer.from(tag.cmacKey, 'hex'),
          dto.picc_data,
          dto.cmac,
          tag.sunCounter,
        );
        if (result.valid && result.counter != null) {
          cmacStatus = 'valid';
          await this.prisma.nfcTag.update({
            where: { id: tag.id },
            data: { sunCounter: result.counter },
          });
        } else {
          cmacStatus = 'invalid';
          this.logger.warn(`SUN validation failed for ${publicId}: ${result.reason}`);
          this.events.emit('tag.cmac_failed', { tagId: tag.id, reason: result.reason });
        }
      }
    }

    // Log the scan regardless — admins need to see suspected-clone attempts
    await this.prisma.scanEvent.create({
      data: {
        tagUid: tag.tagUid,
        tagId: tag.id,
        petId: tag.petId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        ipAddress: ip,
        userAgent,
        deviceType: this.detectDeviceType(userAgent),
      },
    });

    await this.prisma.nfcTag.update({
      where: { id: tag.id },
      data: { lastScannedAt: new Date(), scanCount: { increment: 1 } },
    });

    if (tag.petId && dto.latitude && dto.longitude) {
      this.notifQueue.add('pet-scanned', {
        petId: tag.petId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        cmacStatus,
      }).catch(() => null);
    }

    // Don't reveal pet data if CMAC failed — treat as suspected clone
    if (cmacStatus === 'invalid') {
      return {
        publicId: tag.publicId,
        cmacStatus,
        pet: null,
        message: 'This tag could not be verified. It may be invalid or damaged.',
      };
    }

    if (!tag.pet || tag.status !== 'ACTIVE') {
      return {
        publicId: tag.publicId,
        cmacStatus,
        pet: null,
        message: 'This tag is not yet registered to a pet.',
      };
    }

    return {
      publicId: tag.publicId,
      cmacStatus,
      pet: {
        id: tag.pet.id,
        name: tag.pet.name,
        species: tag.pet.species,
        breed: tag.pet.breed,
        color: tag.pet.color,
        profileImageUrl: tag.pet.profileImageUrl,
        isLost: tag.pet.isLost,
        lostAt: tag.pet.lostAt,
        ownerFirstName: tag.pet.owner.name.split(' ')[0],
      },
    };
  }

  // ── Public contact request (rate-limited at controller level) ────────
  async createContactRequest(publicId: string, dto: ContactRequestDto, ip: string, userAgent: string) {
    const tag = await this.prisma.nfcTag.findUnique({
      where: { publicId },
      select: { id: true, status: true, petId: true },
    });
    if (!tag || tag.status !== 'ACTIVE' || !tag.petId) {
      throw new NotFoundException('Tag not found or not active');
    }

    const request = await this.prisma.contactRequest.create({
      data: {
        tagId: tag.id,
        finderName: dto.finderName,
        finderPhone: dto.finderPhone,
        finderEmail: dto.finderEmail,
        message: dto.message,
        latitude: dto.latitude,
        longitude: dto.longitude,
        ipAddress: ip,
        userAgent,
      },
    });

    this.notifQueue.add('contact-request', {
      contactRequestId: request.id,
      petId: tag.petId,
    }).catch(() => null);

    return { accepted: true, id: request.id };
  }

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
