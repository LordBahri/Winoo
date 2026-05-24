import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Role } from '@prisma/client';

export class AdminUsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Full-text search on name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isBanned?: boolean;
}
