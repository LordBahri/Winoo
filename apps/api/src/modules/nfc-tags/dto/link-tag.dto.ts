import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { NfcTagType } from '@prisma/client';

export class LinkTagDto {
  @IsString()
  tagUid: string;

  @IsUUID()
  petId: string;

  @IsOptional()
  @IsEnum(NfcTagType)
  tagType?: NfcTagType;
}
