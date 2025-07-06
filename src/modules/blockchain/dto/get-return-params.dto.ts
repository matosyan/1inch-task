import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, IsNumberString } from 'class-validator';

export class GetReturnParamsDto {
  @ApiProperty({
    description: 'Address of the input token (must be a valid Ethereum address)',
    example: '0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'fromTokenAddress must be a valid Ethereum address',
  })
  fromTokenAddress: string;

  @ApiProperty({
    description: 'Address of the output token (must be a valid Ethereum address)',
    example: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'toTokenAddress must be a valid Ethereum address',
  })
  toTokenAddress: string;

  @ApiProperty({
    description: 'Input amount in human-readable format (must be a positive number)',
    example: '1.5',
  })
  @IsString()
  @IsNotEmpty()
  @IsNumberString(
    {},
    {
      message: 'amountIn must be a valid number string',
    },
  )
  amountIn: string;
}
