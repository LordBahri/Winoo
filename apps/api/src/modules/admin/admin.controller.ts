import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ProvisionTagsDto } from './dto/provision-tags.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide KPI statistics' })
  getStats() {
    return this.adminService.getPlatformStats();
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated, filterable)' })
  getUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail with pets and subscription' })
  getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @Audit('admin.user.update', 'users')
  @ApiOperation({ summary: 'Update user role or ban status' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserAdminDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit('admin.user.delete', 'users')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a user account (SUPER_ADMIN only)' })
  deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUser(id);
  }

  // ── Pets ───────────────────────────────────────────────────────────────────

  @Get('pets')
  @ApiOperation({ summary: 'List all pets (admin view)' })
  @ApiQuery({ name: 'species', required: false })
  @ApiQuery({ name: 'isLost', required: false, type: Boolean })
  getPets(
    @Query() pagination: PaginationDto,
    @Query('species') species?: string,
    @Query('isLost') isLost?: string,
  ) {
    return this.adminService.getPets({
      ...pagination,
      species,
      isLost: isLost === 'true' ? true : isLost === 'false' ? false : undefined,
    });
  }

  // ── NFC Tags ───────────────────────────────────────────────────────────────

  @Get('tags')
  @ApiOperation({ summary: 'List all NFC tags (admin view)' })
  @ApiQuery({ name: 'status', required: false, enum: ['UNLINKED', 'ACTIVE', 'DEACTIVATED'] })
  getTags(@Query() pagination: PaginationDto, @Query('status') status?: string) {
    return this.adminService.getTags({ ...pagination, status });
  }

  @Post('tags/provision')
  @Audit('admin.tags.provision', 'nfc_tags')
  @ApiOperation({ summary: 'Bulk pre-register NFC tag UIDs (max 500)' })
  provisionTags(@Body() dto: ProvisionTagsDto) {
    return this.adminService.provisionTags(dto);
  }

  // ── Lost Reports ───────────────────────────────────────────────────────────

  @Get('lost-reports')
  @ApiOperation({ summary: 'All lost pet reports (admin view)' })
  @ApiQuery({ name: 'status', required: false })
  getLostReports(@Query() pagination: PaginationDto, @Query('status') status?: string) {
    return this.adminService.getLostReports({ ...pagination, status });
  }

  // ── Scan Events ────────────────────────────────────────────────────────────

  @Get('scan-events')
  @ApiOperation({ summary: 'All scan events (admin view)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getScanEvents(
    @Query() pagination: PaginationDto,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getScanEvents({ ...pagination, from, to });
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  @Get('audit-logs')
  @ApiOperation({ summary: 'Immutable audit trail (admin view)' })
  getAuditLogs(@Query() query: AuditQueryDto) {
    return this.adminService.getAuditLogs(query);
  }
}
