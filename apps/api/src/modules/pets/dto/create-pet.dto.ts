import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PetSpecies, PetGender, PetVisibility } from '@prisma/client';

export class CreatePetDto {
  @ApiProperty({ example: 'Buddy' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: PetSpecies })
  @IsEnum(PetSpecies)
  species: PetSpecies;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(500)
  weightKg?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ enum: PetGender, required: false })
  @IsOptional()
  @IsEnum(PetGender)
  gender?: PetGender;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  microchipNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ enum: PetVisibility, required: false })
  @IsOptional()
  @IsEnum(PetVisibility)
  visibility?: PetVisibility;
}
