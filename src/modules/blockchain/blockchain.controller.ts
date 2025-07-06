import { GasPriceDto, GasPriceRepository } from '../../repositories';
import { BlockchainService } from './blockchain.service';
import { UniswapReturnDto } from './dto/uniswap-return.dto';
import { AppLogger } from '../../packages/app-logger/app-logger';
import { GetReturnParamsDto } from './dto/get-return-params.dto';
import {
  Get,
  Param,
  UsePipes,
  HttpStatus,
  Controller,
  HttpException,
  ValidationPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import {
  BlockchainNetwork,
  ParseBlockchainAddressPipe,
} from './pipes/parse-blockchain-address.pipe';

@ApiTags('blockchain')
@Controller()
export class BlockchainController {
  constructor(
    private readonly logger: AppLogger,
    private readonly blockchainService: BlockchainService,
    private readonly gasPriceRepository: GasPriceRepository,
  ) {}

  @Get('/gasPrice')
  @ApiOperation({
    summary: 'Get current Ethereum gas price',
    description: 'Returns the current gas price information with response time under 50ms',
  })
  @ApiOkResponse({
    description: 'Gas price information retrieved successfully',
    type: () => GasPriceDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error while fetching gas price',
  })
  async getGasPrice(): Promise<GasPriceDto> {
    try {
      const startTime = Date.now();

      if (!this.gasPriceRepository.gasPrice) {
        await this.blockchainService.fetchGasPrice();
      }

      const responseTime = Date.now() - startTime;

      this.logger.debug({
        message: `Gas price retrieved in ${responseTime}ms`,
        data: { gasPrice: this.gasPriceRepository.gasPrice },
        resourceName: BlockchainController.name,
      });

      return this.gasPriceRepository.gasPrice;
    } catch (error) {
      this.logger.error('Failed to get gas price', error as string);
      throw new HttpException('Failed to retrieve gas price', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('return/:fromTokenAddress/:toTokenAddress/:amountIn')
  @ApiOperation({
    summary: 'Calculate UniswapV2 return amount',
    description:
      'Calculate the estimated output amount for a UniswapV2 swap using off-chain calculations',
  })
  @ApiParam({
    name: 'fromTokenAddress',
    description: 'Address of the input token',
    example: '0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20',
  })
  @ApiParam({
    name: 'toTokenAddress',
    description: 'Address of the output token',
    example: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  })
  @ApiParam({
    name: 'amountIn',
    description: 'Input amount in human-readable format',
    example: '1.5',
  })
  @ApiResponse({
    status: 200,
    description: 'Return amount calculated successfully',
    type: UniswapReturnDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid parameters provided',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error while calculating return',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getReturn(
    @Param(
      'fromTokenAddress',
      new ParseBlockchainAddressPipe({
        required: true,
        network: BlockchainNetwork.ETHEREUM,
        allowChecksum: true,
      }),
    )
    fromTokenAddress: string,
    @Param(
      'toTokenAddress',
      new ParseBlockchainAddressPipe({
        required: true,
        network: BlockchainNetwork.ETHEREUM,
        allowChecksum: true,
      }),
    )
    toTokenAddress: string,
    @Param('amountIn', ParseFloatPipe) amountIn: number,
  ): Promise<UniswapReturnDto> {
    return null;
    // try {
    //   const { fromTokenAddress, toTokenAddress, amountIn } = params;

    //   this.logger.debug(
    //     `Calculating return for: ${fromTokenAddress} -> ${toTokenAddress}, amount: ${amountIn}`,
    //   );

    //   const result = await this.uniswapV2Service.calculateReturn(
    //     fromTokenAddress,
    //     toTokenAddress,
    //     amountIn,
    //   );

    //   return result;
    // } catch (error) {
    //   this.logger.error('Failed to calculate return', error as string);

    //   if (error instanceof HttpException) {
    //     throw error;
    //   }

    //   throw new HttpException(
    //     'Failed to calculate return amount',
    //     HttpStatus.INTERNAL_SERVER_ERROR,
    //   );
    // }
  }
}
