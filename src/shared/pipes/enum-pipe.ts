import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class EnumPipe implements PipeTransform {
  protected enumValues: any[];
  protected toLowerCase = false;
  protected caseSensitive = false;
  protected required = true;

  constructor(options: {
    enumValues: any[];
    caseSensitive?: boolean;
    required?: boolean;
    toLowerCase?: boolean;
  }) {
    this.enumValues = options.enumValues;
    this.caseSensitive = options.caseSensitive;
    this.toLowerCase = options?.toLowerCase == null ? this.toLowerCase : options.toLowerCase;

    if (!options.caseSensitive) {
      this.enumValues = this.enumValues.map((v) => {
        if (typeof v === 'string') {
          return v.toLowerCase();
        }
        return v;
      });
    }
    this.required = options.required == null ? this.required : options.required;
  }

  transform(value: any, metadata: ArgumentMetadata) {
    if (!this.required && value == null) {
      return value;
    }

    let valueToCheck = value;
    if (typeof value === 'string' && !this.caseSensitive) {
      valueToCheck = valueToCheck.toLowerCase();
    }

    if (!this.enumValues.includes(valueToCheck)) {
      throw new BadRequestException(
        `${metadata.data} value in ${
          metadata.type
        } should be one of the values of ${this.enumValues.join(', ')}`,
      );
    }

    if (typeof value === 'string' && this.toLowerCase) {
      return value.toLowerCase();
    }

    return value;
  }
}
