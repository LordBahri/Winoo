import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LostPetsService } from './lost-pets.service';
import { CreateSightingDto } from './dto/create-sighting.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Lost Pets')
@Controller({ path: 'lost-pets', version: '1' })
export class LostPetsController {
  constructor(private readonly lostPetsService: LostPetsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'PUBLIC — list active lost pet reports' })
  findAll(@Query() pagination: PaginationDto, @Query('species') species?: string) {
    return this.lostPetsService.findAll(pagination, species);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'PUBLIC — lost pets within radius (PostGIS)' })
  findNearby(@Query() query: NearbyQueryDto) {
    return this.lostPetsService.findNearby(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'PUBLIC — get single lost pet report' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lostPetsService.findOne(id);
  }

  @Public()
  @Post(':id/sightings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'PUBLIC — report a sighting of a lost pet' })
  reportSighting(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSightingDto,
  ) {
    return this.lostPetsService.createSighting(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  @ApiOperation({ summary: 'Get own lost pet reports' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.lostPetsService.findByUser(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Close/delete lost pet report' })
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.lostPetsService.close(id, user);
  }
}
