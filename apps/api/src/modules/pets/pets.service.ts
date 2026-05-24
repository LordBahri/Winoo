import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../config/storage.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { AuthUser } from '../../common/types/auth-user.type';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly events: EventEmitter2,
  ) {}

  async findByOwner(ownerId: string, { page = 1, limit = 20 }: PaginationDto) {
    const skip = (page - 1) * limit;
    const [pets, total] = await this.prisma.$transaction([
      this.prisma.pet.findMany({
        where: { ownerId, deletedAt: null },
        include: { nfcTag: { select: { tagUid: true, status: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pet.count({ where: { ownerId, deletedAt: null } }),
    ]);

    return { pets, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(ownerId: string, dto: CreatePetDto) {
    const petCount = await this.prisma.pet.count({ where: { ownerId, deletedAt: null } });

    // Plan enforcement is handled by PlanGuard in the controller
    // but we double-check here for safety
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      include: { subscription: { include: { plan: true } } },
    });

    const maxPets = user?.subscription?.plan?.maxPets ?? 1;
    if (petCount >= maxPets) {
      throw new BadRequestException(`Your plan allows a maximum of ${maxPets} pets`);
    }

    return this.prisma.pet.create({
      data: { ...dto, ownerId },
    });
  }

  async findOne(id: string, user: AuthUser) {
    const pet = await this.prisma.pet.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, phone: true, email: true } },
        nfcTag: { select: { tagUid: true, status: true, lastScannedAt: true } },
      },
    });

    if (!pet) throw new NotFoundException('Pet not found');
    this.assertAccess(pet.ownerId, user);
    return pet;
  }

  async update(id: string, user: AuthUser, dto: UpdatePetDto) {
    const pet = await this.findOneRaw(id);
    this.assertAccess(pet.ownerId, user);
    return this.prisma.pet.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    const pet = await this.findOneRaw(id);
    this.assertAccess(pet.ownerId, user);
    await this.prisma.pet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async uploadPhoto(id: string, user: AuthUser, file: Express.Multer.File) {
    const pet = await this.findOneRaw(id);
    this.assertAccess(pet.ownerId, user);

    const url = await this.storage.upload(`pets/${id}/profile`, file);
    return this.prisma.pet.update({ where: { id }, data: { profileImageUrl: url } });
  }

  async markLost(id: string, user: AuthUser, dto: MarkLostDto) {
    const pet = await this.findOneRaw(id);
    this.assertAccess(pet.ownerId, user);

    if (pet.isLost) throw new BadRequestException('Pet is already marked as lost');

    const [updatedPet, report] = await this.prisma.$transaction([
      this.prisma.pet.update({
        where: { id },
        data: { isLost: true, lostAt: new Date() },
      }),
      this.prisma.lostPetReport.create({
        data: {
          petId: id,
          reportedById: user.id,
          lastSeenLatitude: dto.lastSeenLatitude,
          lastSeenLongitude: dto.lastSeenLongitude,
          lastSeenAddress: dto.lastSeenAddress,
          lastSeenAt: dto.lastSeenAt ? new Date(dto.lastSeenAt) : new Date(),
          description: dto.description,
          rewardAmount: dto.rewardAmount,
          contactPhone: dto.contactPhone,
          contactEmail: dto.contactEmail,
        },
      }),
    ]);

    this.events.emit('pet.lost', { pet: updatedPet, report });
    return { pet: updatedPet, report };
  }

  async markFound(id: string, user: AuthUser) {
    const pet = await this.findOneRaw(id);
    this.assertAccess(pet.ownerId, user);

    if (!pet.isLost) throw new BadRequestException('Pet is not currently marked as lost');

    await this.prisma.$transaction([
      this.prisma.pet.update({
        where: { id },
        data: { isLost: false, foundAt: new Date() },
      }),
      this.prisma.lostPetReport.updateMany({
        where: { petId: id, status: 'ACTIVE' },
        data: { status: 'FOUND', foundAt: new Date() },
      }),
    ]);

    this.events.emit('pet.found', { petId: id, ownerId: user.id });
  }

  async getScanEvents(id: string, user: AuthUser, { page = 1, limit = 20 }: PaginationDto) {
    const pet = await this.findOneRaw(id);
    this.assertAccess(pet.ownerId, user);

    const skip = (page - 1) * limit;
    const [events, total] = await this.prisma.$transaction([
      this.prisma.scanEvent.findMany({
        where: { petId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.scanEvent.count({ where: { petId: id } }),
    ]);

    return { events, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  private async findOneRaw(id: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id, deletedAt: null } });
    if (!pet) throw new NotFoundException('Pet not found');
    return pet;
  }

  private assertAccess(ownerId: string, user: AuthUser) {
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(user.role as Role);
    if (!isAdmin && ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
  }
}
