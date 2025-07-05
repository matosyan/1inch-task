import { ApiProperty } from '@nestjs/swagger';

export class HttpExceptionDto {
  @ApiProperty({ type: Number })
  statusCode: number;

  @ApiProperty({
    oneOf: [
      { type: 'string' },
      {
        type: 'array',
        items: { type: 'string' },
      },
    ],
    default: 'string | string[]',
  })
  message: string | string[];

  @ApiProperty({ type: String, required: false, default: 'string (optional)' })
  error?: string;
}
