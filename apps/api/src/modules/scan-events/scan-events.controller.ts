import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScanEventsService } from './scan-events.service';
import { ScanEventsQueryDto } from './dto/scan-events-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('Scan Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'scan-events', version: '1' })
export class ScanEventsController {
  constructor(private readonly scanEventsService: ScanEventsService) {}

  @Get()
  @ApiOperation({ summary: "List scan events (owners see own pets' events; admins see all)" })
  findAll(@Query() query: ScanEventsQueryDto, @CurrentUser() user: AuthUser) {
    return this.scanEventsService.findAll(query, user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Aggregated scan statistics (admin)' })
  getStats() {
    return this.scanEventsService.getStats();
  }
}
