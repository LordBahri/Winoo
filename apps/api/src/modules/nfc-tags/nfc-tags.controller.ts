import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NfcTagsService } from './nfc-tags.service';
import { LinkTagDto } from './dto/link-tag.dto';
import { ScanEventDto } from './dto/scan-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('NFC Tags')
@Controller({ path: 'tags', version: '1' })
export class NfcTagsController {
  constructor(private readonly nfcTagsService: NfcTagsService) {}

  // ── Public: resolve tag → pet profile (cached 30 s) ───────────
  @Public()
  @Get(':uid')
  @Throttle({ medium: { limit: 30, ttl: 60000 } })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @ApiOperation({ summary: 'PUBLIC — resolve NFC tag to pet public profile (cached 30s)' })
  resolveTag(@Param('uid') uid: string) {
    return this.nfcTagsService.resolveTag(uid);
  }

  // ── Public: log scan event ──────────────────────────────────────
  @Public()
  @Post('scan-event')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ medium: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'PUBLIC — log scan event with optional location' })
  logScanEvent(
    @Body() dto: ScanEventDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.nfcTagsService.logScanEvent(dto, ip, userAgent);
  }

  // ── Authenticated: tag management ─────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: "List user's registered tags" })
  findMyTags(@CurrentUser() user: AuthUser) {
    return this.nfcTagsService.findByOwner(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('link')
  @ApiOperation({ summary: 'Link NFC tag to a pet' })
  linkTag(@CurrentUser() user: AuthUser, @Body() dto: LinkTagDto) {
    return this.nfcTagsService.linkTag(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':uid/unlink')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink NFC tag from a pet' })
  unlinkTag(@Param('uid') uid: string, @CurrentUser() user: AuthUser) {
    return this.nfcTagsService.unlinkTag(uid, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':uid/history')
  @ApiOperation({ summary: 'Scan history for a tag' })
  tagHistory(@Param('uid') uid: string, @CurrentUser() user: AuthUser) {
    return this.nfcTagsService.getHistory(uid, user);
  }
}
