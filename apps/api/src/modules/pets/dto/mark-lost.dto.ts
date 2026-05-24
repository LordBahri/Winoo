import { IsOptional, IsNumber, IsString, IsDateString, IsEmail, IsPositive, Min, Max } from 'class-validator';

export class MarkLostDto {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lastSeenLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lastSeenLongitude?: number;

  @IsOptional()
  @IsString()
  lastSeenAddress?: string;

  @IsOptional()
  @IsDateString()
  lastSeenAt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  rewardAmount?: number;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
