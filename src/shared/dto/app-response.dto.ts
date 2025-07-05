import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export function TAppResponse<T>(classRef: Type<T>): any {
  class AppResponseClass {
    @ApiProperty({ type: () => classRef })
    data: T;
  }

  return AppResponseClass;
}
