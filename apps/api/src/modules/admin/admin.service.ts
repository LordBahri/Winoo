import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ProvisionTagsDto } from './dto/provision-tags.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: EventsGateway,
  ) {}

  // ── Platform Stats ─────────────────────────────────────────────────────────

  async getPlatformStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers, newUsersToday, newUsersMonth, newUsersLastMonth,
      totalPets, lostPets, newPetsMonth,
      totalTags, activeTags, unlinkedTags,
      scansToday, scansMonth,
      activeSubscriptions, mrr,
      wsConnections,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfDay }, deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: startOfMonth }, deletedAt: null } }),
      this.prisma.pet.count({ where: { deletedAt: null } }),
      this.prisma.pet.count({ where: { isLost: true, deletedAt: null } }),
      this.prisma.pet.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
      this.prisma.nfcTag.count(),
      this.prisma.nfcTag.count({ where: { status: 'ACTIVE' } }),
      this.prisma.nfcTag.count({ where: { status: 'UNLINKED' } }),
      this.prisma.scanEvent.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.scanEvent.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.$queryRaw<Array<{ mrr: number }>>`
        SELECT COALESCE(SUM(sp.price_monthly), 0) as mrr
        FROM user_subscriptions us
        JOIN subscription_plans sp ON sp.id = us.plan_id
        WHERE us.status = 'ACTIVE'
      `,
      Promise.resolve(this.gateway.getConnectedCount()),
    ]);

    const userGrowthPct =
      newUsersLastMonth > 0
        ? Math.round(((newUsersMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : 0;

    return {
      users: {
        total: totalUsers,
        today: newUsersToday,
        thisMonth: newUsersMonth,
        growthPercent: userGrowthPct,
      },
      pets: { total: totalPets, lost: lostPets, newThisMonth: newPetsMonth },
      tags: { total: totalTags, active: activeTags, unlinked: unlinkedTags },
      scans: { today: scansToday, thisMonth: scansMonth },
      revenue: {
        mrr: Number((mrr as any)[0]?.mrr ?? 0),
        activeSubscriptions,
      },
      realtime: { connectedClients: wsConnections },
    };
  }

  // ── User Management ────────────────────────────────────────────────────────

  async getUsers(query: AdminUsersQueryDto) {
    const { page = 1, limit = 20, search, role, isBanned } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(role && { role }),
      ...(typeof isBanned === 'boolean' && { isBanned }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, phone: true,
          avatarUrl: true, role: true, isBanned: true,
          isEmailVerified: true, createdAt: true, lastLoginAt: true,
          _count: { select: { pets: true } },
          subscription: { select: { status: true, plan: { select: { name: true } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        pets: {
          where: { deletedAt: null },
          select: { id: true, name: true, species: true, isLost: true, createdAt: true },
        },
        subscription: { include: { plan: true } },
        _count: { select: { pets: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserAdminDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true, email: true, name: true, role: true, isBanned: true, updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Pet Management ─────────────────────────────────────────────────────────

  async getPets(query: PaginationDto & { species?: string; isLost?: boolean }) {
    const { page = 1, limit = 20, species, isLost } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(species && { species }),
      ...(typeof isLost === 'boolean' && { isLost }),
    };

    const [pets, total] = await this.prisma.$transaction([
      this.prisma.pet.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          nfcTag: { select: { tagUid: true, status: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pet.count({ where }),
    ]);

    return { pets, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── NFC Tag Management ─────────────────────────────────────────────────────

  async getTags(query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as any } : {};

    const [tags, total] = await this.prisma.$transaction([
      this.prisma.nfcTag.findMany({
        where,
        include: {
          pet: { select: { id: true, name: true, species: true, profileImageUrl: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.nfcTag.count({ where }),
    ]);

    return { tags, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async provisionTags(dto: ProvisionTagsDto) {
    // Upsert each tag (skip if already exists)
    const results = await Promise.allSettled(
      dto.tagUids.map((tagUid) =>
        this.prisma.nfcTag.upsert({
          where: { tagUid },
          create: {
            tagUid,
            status: 'UNLINKED',
            batchId: dto.batchId,
          },
          update: {},
        }),
      ),
    );

    const created = results.filter((r) => r.status === 'fulfilled').length;
    const skipped = results.filter((r) => r.status === 'rejected').length;

    return {
      requested: dto.tagUids.length,
      created,
      skipped,
      message: `${created} tags provisioned, ${skipped} already existed`,
    };
  }

  // ── Lost Pet Reports ───────────────────────────────────────────────────────

  async getLostReports(query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as any } : {};

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.lostPetReport.findMany({
        where,
        include: {
          pet: { select: { id: true, name: true, species: true, profileImageUrl: true } },
          reportedBy: { select: { id: true, name: true, email: true } },
          _count: { select: { sightings: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lostPetReport.count({ where }),
    ]);

    return { reports, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  async getAuditLogs(query: AuditQueryDto) {
    const { page = 1, limit = 50, actorId, action, resourceType, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      ...(actorId && { actorId }),
      ...(action && { action: { contains: action, mode: 'insensitive' } }),
      ...(resourceType && { resourceType }),
      ...(from || to
        ? {
            createdAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Scan Events ────────────────────────────────────────────────────────────

  async getScanEvents(query: PaginationDto & { from?: string; to?: string }) {
    const { page = 1, limit = 50, from, to } = query;
    const skip = (page - 1) * limit;

    const where =
      from || to
        ? {
            createdAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {};

    const [events, total] = await this.prisma.$transaction([
      this.prisma.scanEvent.findMany({
        where,
        include: {
          pet: { select: { id: true, name: true, species: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.scanEvent.count({ where }),
    ]);

    return { events, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
