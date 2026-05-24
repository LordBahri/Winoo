import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  async list(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId: user.id } }),
      this.prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: AuthUser) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
