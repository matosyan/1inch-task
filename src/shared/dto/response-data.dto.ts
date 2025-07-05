import { ApiProperty } from '@nestjs/swagger';

export class ResponseDataDto<T> {
  @ApiProperty({ name: 'data' })
  data: T;
}
