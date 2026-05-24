import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get('storage.bucket')!;
    this.cdnUrl = config.get('storage.cdnUrl', '');

    this.s3 = new S3Client({
      region: config.get('storage.region'),
      credentials: {
        accessKeyId: config.get('storage.accessKeyId')!,
        secretAccessKey: config.get('storage.secretAccessKey')!,
      },
      ...(config.get('storage.endpoint') && {
        endpoint: config.get('storage.endpoint'),
        forcePathStyle: true,
      }),
    });
  }

  async upload(prefix: string, file: Express.Multer.File): Promise<string> {
    const ext = file.mimetype.split('/')[1] ?? 'jpg';
    const key = `${prefix}/${uuidv4()}.${ext}`;

    // Generate responsive variants
    const variants = await this.generateVariants(file.buffer);

    await Promise.all(
      variants.map(({ suffix, buffer, contentType }) =>
        this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: suffix === 'original' ? key : key.replace(`.${ext}`, `-${suffix}.webp`),
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000',
          }),
        ),
      ),
    );

    const baseUrl = this.cdnUrl || `https://${this.bucket}.s3.amazonaws.com`;
    return `${baseUrl}/${key}`;
  }

  private async generateVariants(buffer: Buffer) {
    const [thumbnail, card, original] = await Promise.all([
      sharp(buffer).resize(150, 150, { fit: 'cover' }).webp({ quality: 80 }).toBuffer(),
      sharp(buffer).resize(400, 400, { fit: 'cover' }).webp({ quality: 85 }).toBuffer(),
      sharp(buffer).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toBuffer(),
    ]);

    return [
      { suffix: 'thumb', buffer: thumbnail, contentType: 'image/webp' },
      { suffix: 'card', buffer: card, contentType: 'image/webp' },
      { suffix: 'original', buffer: original, contentType: 'image/webp' },
    ];
  }
}
