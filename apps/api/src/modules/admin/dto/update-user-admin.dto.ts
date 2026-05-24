import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserAdminDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;
}
