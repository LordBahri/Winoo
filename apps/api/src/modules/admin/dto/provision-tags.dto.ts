import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProvisionTagsDto {
  @ApiProperty({
    description: 'Array of NFC tag UIDs to pre-register (max 500 at a time)',
    type: [String],
    example: ['04:A3:2B:F1:C8:44:80', '04:B4:3C:F2:D9:55:91'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  tagUids: string[];

  @ApiProperty({ required: false })
  batchId?: string;
}
