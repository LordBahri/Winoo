import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AuditQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional({ description: 'Partial action name, e.g. "pet"' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'pets' })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}
