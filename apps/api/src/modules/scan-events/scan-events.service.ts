import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ScanEventsQueryDto } from './dto/scan-events-query.dto';
import { AuthUser } from '../../common/types/auth-user.type';
import { Role } from '@prisma/client';

@Injectable()
export class ScanEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ScanEventsQueryDto, user: AuthUser) {
    const { page = 1, limit = 20, petId, tagUid, from, to } = query;
    const skip = (page - 1) * limit;

    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(user.role as Role);

    const where: Record<string, unknown> = {
      ...(tagUid && { tagUid }),
      ...(from || to
        ? { createdAt: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } }
        : {}),
    };

    // Non-admins can only see events for their own pets
    if (!isAdmin) {
      where['pet'] = { ownerId: user.id };
    } else if (petId) {
      where['petId'] = petId;
    }

    const [events, total] = await this.prisma.$transaction([
      this.prisma.scanEvent.findMany({
        where,
        include: {
          pet: { select: { id: true, name: true, species: true, profileImageUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.scanEvent.count({ where }),
    ]);

    return { events, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, thisWeek, thisMonth, total, byDevice, topCities] =
      await this.prisma.$transaction([
        this.prisma.scanEvent.count({ where: { createdAt: { gte: startOfDay } } }),
        this.prisma.scanEvent.count({ where: { createdAt: { gte: startOfWeek } } }),
        this.prisma.scanEvent.count({ where: { createdAt: { gte: startOfMonth } } }),
        this.prisma.scanEvent.count(),
        this.prisma.scanEvent.groupBy({
          by: ['deviceType'],
          _count: true,
          orderBy: { _count: { deviceType: 'desc' } },
        }),
        this.prisma.$queryRaw<Array<{ city: string; count: bigint }>>`
          SELECT city, COUNT(*) as count
          FROM scan_events
          WHERE city IS NOT NULL
          GROUP BY city
          ORDER BY count DESC
          LIMIT 10
        `,
      ]);

    return {
      today,
      thisWeek,
      thisMonth,
      total,
      byDevice: byDevice.map((d) => ({ device: d.deviceType ?? 'unknown', count: d._count })),
      topCities: topCities.map((c) => ({ city: c.city, count: Number(c.count) })),
    };
  }
}
