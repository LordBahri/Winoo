import { IsOptional, IsDateString, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ScanEventsQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  petId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tagUid?: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
