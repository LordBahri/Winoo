import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateSightingDto } from './dto/create-sighting.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { AuthUser } from '../../common/types/auth-user.type';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class LostPetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll({ page = 1, limit = 20 }: PaginationDto, species?: string) {
    const skip = (page - 1) * limit;
    const where = {
      status: 'ACTIVE' as const,
      ...(species && { pet: { species: species as any } }),
    };

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.lostPetReport.findMany({
        where,
        include: {
          pet: {
            select: {
              id: true,
              name: true,
              species: true,
              breed: true,
              color: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lostPetReport.count({ where }),
    ]);

    return { reports, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findNearby(query: NearbyQueryDto) {
    // PostGIS raw query for geo proximity
    const radiusMeters = (query.radiusKm ?? 10) * 1000;

    return this.prisma.$queryRaw`
      SELECT
        r.id,
        r.pet_id,
        r.last_seen_address,
        r.last_seen_at,
        r.description,
        r.reward_amount,
        r.status,
        r.created_at,
        p.name AS pet_name,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.profile_image_url,
        ST_Distance(
          ST_MakePoint(r.last_seen_longitude, r.last_seen_latitude)::geography,
          ST_MakePoint(${query.lng}, ${query.lat})::geography
        ) AS distance_meters
      FROM lost_pet_reports r
      JOIN pets p ON p.id = r.pet_id
      WHERE
        r.status = 'ACTIVE'
        AND r.last_seen_latitude IS NOT NULL
        AND ST_DWithin(
          ST_MakePoint(r.last_seen_longitude, r.last_seen_latitude)::geography,
          ST_MakePoint(${query.lng}, ${query.lat})::geography,
          ${radiusMeters}
        )
      ORDER BY distance_meters ASC
      LIMIT 50
    `;
  }

  async findOne(id: string) {
    const report = await this.prisma.lostPetReport.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            color: true,
            profileImageUrl: true,
            gender: true,
          },
        },
        sightings: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async createSighting(reportId: string, dto: CreateSightingDto) {
    const report = await this.prisma.lostPetReport.findUnique({
      where: { id: reportId },
      include: { pet: { select: { ownerId: true } } },
    });

    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'ACTIVE') throw new NotFoundException('This report is no longer active');

    const sighting = await this.prisma.lostPetSighting.create({
      data: {
        reportId,
        reporterName: dto.reporterName,
        reporterContact: dto.reporterContact,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        sightedAt: dto.sightedAt ? new Date(dto.sightedAt) : new Date(),
        notes: dto.notes,
        imageUrl: dto.imageUrl,
      },
    });

    this.events.emit('sighting.created', {
      sighting,
      ownerId: report.pet.ownerId,
      reportId,
    });

    return sighting;
  }

  async findByUser(userId: string) {
    return this.prisma.lostPetReport.findMany({
      where: { reportedById: userId },
      include: {
        pet: { select: { id: true, name: true, profileImageUrl: true } },
        sightings: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async close(id: string, user: AuthUser) {
    const report = await this.prisma.lostPetReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(user.role as Role);
    if (!isAdmin && report.reportedById !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.lostPetReport.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }
}
