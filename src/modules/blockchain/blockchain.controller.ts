import { UniswapReturnDto } from './dto';
import { UniswapV2Service } from './uniswap-v2.service';
import { BlockchainService } from './blockchain.service';
import { AppLogger } from '../../packages/app-logger/app-logger';
import { GasPriceDto, GasPriceRepository } from '../../repositories';
import { BlockchainNetwork, ParseBlockchainAddressPipe } from './pipes';
import {
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Controller,
  HttpException,
  ParseFloatPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('blockchain')
@Controller()
export class BlockchainController {
  constructor(
    private readonly logger: AppLogger,
    private readonly uniswapV2Service: UniswapV2Service,
    private readonly blockchainService: BlockchainService,
    private readonly gasPriceRepository: GasPriceRepository,
  ) {}

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
  @Throttle({
    'gas-price': {
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute - generous due to caching
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('/gasPrice')
  async getGasPrice(): Promise<GasPriceDto> {
    try {
      const startTime = Date.now();

      if (!this.gasPriceRepository.gasPrice) {
        await this.blockchainService.fetchGasPrice();
      }

      // Check if gas price is still null after fetching
      if (!this.gasPriceRepository.gasPrice) {
        throw new HttpException('Failed to retrieve gas price', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const responseTime = Date.now() - startTime;

      try {
        this.logger.info({
          message: `Gas price retrieved in ${responseTime}ms`,
          resourceName: BlockchainController.name,
        });
      } catch (loggingError) {
        // Continue execution even if logging fails
      }

      return this.gasPriceRepository.gasPrice;
    } catch (error) {
      this.logger.error('Failed to get gas price', error as string);
      throw new HttpException('Failed to retrieve gas price', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

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
  @ApiOkResponse({
    description: 'Return amount calculated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid parameters provided',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error while calculating return',
  })
  @Throttle({
    'uniswap-calculation': {
      ttl: 60000, // 1 minute
      limit: 30, // 30 requests per minute - more restrictive due to computation
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('return/:fromTokenAddress/:toTokenAddress/:amountIn')
  async getReturn(
    @Param(
      'fromTokenAddress',
      new ParseBlockchainAddressPipe({
        required: true,
        network: BlockchainNetwork.ETHEREUM,
      }),
    )
    fromTokenAddress: string,
    @Param(
      'toTokenAddress',
      new ParseBlockchainAddressPipe({
        required: true,
        network: BlockchainNetwork.ETHEREUM,
      }),
    )
    toTokenAddress: string,
    @Param('amountIn', ParseFloatPipe) amountIn: number,
  ): Promise<UniswapReturnDto> {
    try {
      this.logger.debug(
        `Calculating return for: ${fromTokenAddress} -> ${toTokenAddress}, amount: ${amountIn}`,
      );

      const result = await this.uniswapV2Service.calculateReturn(
        fromTokenAddress,
        toTokenAddress,
        amountIn,
      );

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Failed to calculate return', error as string);

      throw new HttpException(
        'Failed to calculate return amount',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
