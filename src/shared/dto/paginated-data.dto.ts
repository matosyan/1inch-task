import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseMetaDto } from './paginated-response-meta.dto';

export class PaginatedDataDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginatedResponseMetaDto })
  meta: PaginatedResponseMetaDto;
}
