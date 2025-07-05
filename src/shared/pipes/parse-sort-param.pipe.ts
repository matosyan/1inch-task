import { SortParam } from '../types';
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  Optional,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseSortParamPipe implements PipeTransform {
  protected allowedKeysMapping = null;

  constructor(@Optional() options?: { allowedKeys?: string[] }) {
    if (options?.allowedKeys) {
      this.allowedKeysMapping = {};
      for (const allowedKey of options.allowedKeys) {
        this.allowedKeysMapping[allowedKey] = true;
      }
    }
  }

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return null;
    }

    const isValid = /^[\w]+\.(asc|desc)$/g.test(value);

    if (!isValid) {
      return null;
    }

    const parsed = this.parseParam(value);

    if (!this.isKeyAllowed(parsed[0])) {
      throw new BadRequestException(`You can't sort by ${parsed[0]}`);
    }

    return parsed;
  }

  isKeyAllowed(key: any) {
    return !this.allowedKeysMapping || this.allowedKeysMapping[key];
  }

  parseParam(value): SortParam {
    return value.split('.');
  }
}
