import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseMetaDto {
  @ApiProperty({ type: Number })
  count: number;

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  pageCount: number;

  @ApiProperty({ type: Boolean })
  hasNext: boolean;

  @ApiProperty({ type: Boolean })
  hasPrev: boolean;
}
