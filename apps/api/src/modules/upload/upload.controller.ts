import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StorageService } from '../../config/storage.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { ApiException } from '../../common/exceptions/api.exception';
import { HttpStatus } from '@nestjs/common';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function imageFileFilter(_req: any, file: Express.Multer.File, cb: Function) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiException({
        code: ErrorCodes.FILE_TYPE_NOT_ALLOWED,
        message: `File type '${file.mimetype}' is not allowed. Use JPEG, PNG, or WebP.`,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
      false,
    );
  }
  cb(null, true);
}

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  constructor(private readonly storage: StorageService) {}

  /**
   * General-purpose single image upload.
   * Returns { url } — a CDN URL for the uploaded image.
   * Pet photos, profile avatars, and lost-report images all use this endpoint.
   */
  @Post('image')
  @ApiOperation({ summary: 'Upload a single image (max 10 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) {
      throw new ApiException({
        code: ErrorCodes.FILE_UPLOAD_FAILED,
        message: 'No file provided',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new ApiException({
        code: ErrorCodes.FILE_TOO_LARGE,
        message: `File exceeds the 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB received)`,
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      });
    }

    const url = await this.storage.upload(`uploads/${user.id}`, file);
    return { url };
  }
}
