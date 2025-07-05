import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export function TFindAndCountAll<T>(classRef: Type<T>): any {
  class FindAndCountAllDto {
    @ApiProperty({ type: () => classRef })
    rows: T;

    @ApiProperty({ type: 'integer' })
    count: number;
  }

  return FindAndCountAllDto;
}
