import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RecoverTagDto {
  @ApiPropertyOptional({ description: 'NTAG424 SUN picc_data (hex, 32 chars)' })
  @IsOptional()
  @IsString()
  @Length(32, 32)
  picc_data?: string;

  @ApiPropertyOptional({ description: 'NTAG424 SUN cmac (hex, 16 chars)' })
  @IsOptional()
  @IsString()
  @Length(16, 16)
  cmac?: string;

  @ApiPropertyOptional({ description: 'Finder latitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Finder longitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
