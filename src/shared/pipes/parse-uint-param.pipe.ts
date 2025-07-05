import {
  Injectable,
  ArgumentMetadata,
  ParseIntPipe,
  Optional,
  ParseIntPipeOptions,
} from '@nestjs/common';

@Injectable()
export class ParseUIntParamPipe extends ParseIntPipe {
  protected min: number;
  protected max: number;
  protected required = true;

  constructor(
    @Optional()
    options?: ParseIntPipeOptions & {
      max?: number;
      min?: number;
      required?: boolean;
    },
  ) {
    super(options);
    this.min = options?.min || 0;
    this.max = options?.max;
    this.required = options?.required == null ? this.required : options.required;
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<number> {
    let num: number;

    if (value == null && !this.required) {
      return value;
    }

    try {
      num = await super.transform(value, metadata);
    } catch (_) {
      throw this.exceptionFactory(
        `Validation failed for ${metadata.data} value in ${metadata.type} (numeric string is expected)`,
      );
    }

    if (num < this.min) {
      throw this.exceptionFactory(
        `Validation failed for ${metadata.data} value in ${metadata.type} (number must be greater than or equal to ${this.min})`,
      );
    }
    if (this.max && num > this.max) {
      throw this.exceptionFactory(
        `Validation failed for ${metadata.data} value in ${metadata.type} (number must be smaller than or equal to ${this.max})`,
      );
    }

    return num;
  }
}
