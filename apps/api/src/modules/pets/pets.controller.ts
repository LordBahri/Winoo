import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Pets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'pets', version: '1' })
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  @ApiOperation({ summary: "List current user's pets" })
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.petsService.findByOwner(user.id, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new pet' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePetDto) {
    return this.petsService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pet details' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.petsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pet profile' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePetDto,
  ) {
    return this.petsService.update(id, user, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete pet' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.petsService.remove(id, user);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload pet profile photo' })
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.petsService.uploadPhoto(id, user, file);
  }

  @Post(':id/mark-lost')
  @ApiOperation({ summary: 'Report pet as lost' })
  markLost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: MarkLostDto,
  ) {
    return this.petsService.markLost(id, user, dto);
  }

  @Post(':id/mark-found')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark lost pet as found' })
  markFound(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.petsService.markFound(id, user);
  }

  @Get(':id/scan-events')
  @ApiOperation({ summary: 'Scan history for a pet' })
  scanEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.petsService.getScanEvents(id, user, pagination);
  }
}
