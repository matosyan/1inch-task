import { extname } from 'path';
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class FileTypeValidatorPipe implements PipeTransform {
  protected allowedTypes = [];

  constructor(
    @Optional()
    options?: {
      allowedTypes?: string[];
    },
  ) {
    this.allowedTypes = options?.allowedTypes || [];
  }

  transform(file: Express.Multer.File, metadata: ArgumentMetadata) {
    const allowedExtensions = this.allowedTypes;
    const fileExt = extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      const allowedTypesStr = this.allowedTypes.join(', ');
      throw new BadRequestException(
        `Invalid file type. Only [${allowedTypesStr}] files are allowed.`,
      );
    }

    return file;
  }
}
