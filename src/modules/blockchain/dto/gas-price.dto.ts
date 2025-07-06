import { ApiProperty } from '@nestjs/swagger';

export class GasPriceDto {
  @ApiProperty({
    description: 'Legacy gas price in wei',
    example: '20000000000',
  })
  gasPrice: string;

  @ApiProperty({
    description: 'Maximum fee per gas in wei (EIP-1559)',
    example: '30000000000',
  })
  maxFeePerGas: string;

  @ApiProperty({
    description: 'Maximum priority fee per gas in wei (EIP-1559)',
    example: '2000000000',
  })
  maxPriorityFeePerGas: string;

  @ApiProperty({
    description: 'Timestamp when the gas price was fetched',
    example: 1704067200000,
  })
  timestamp: number;
}
