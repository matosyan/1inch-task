import { ApiProperty } from '@nestjs/swagger';

export class UniswapReturnDto {
  @ApiProperty({
    description: 'Address of the input token',
    example: '0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20',
  })
  fromTokenAddress: string;

  @ApiProperty({
    description: 'Address of the output token',
    example: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  })
  toTokenAddress: string;

  @ApiProperty({
    description: 'Input amount in human-readable format',
    example: '1.5',
  })
  amountIn: string;

  @ApiProperty({
    description: 'Calculated output amount in human-readable format',
    example: '0.000123456789',
  })
  amountOut: string;

  @ApiProperty({
    description: 'Price impact as a percentage',
    example: '0.15',
  })
  priceImpact: string;

  @ApiProperty({
    description: 'Timestamp when the calculation was performed',
    example: 1704067200000,
  })
  timestamp: number;
}
