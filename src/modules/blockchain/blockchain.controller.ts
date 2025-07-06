import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { GasPriceService } from './gas-price.service';
import { UniswapV2Service } from './uniswap-v2.service';
import { GasPriceDto } from './dto/gas-price.dto';
import { UniswapReturnDto } from './dto/uniswap-return.dto';
import { GetReturnParamsDto } from './dto/get-return-params.dto';

@ApiTags('blockchain')
@Controller()
export class BlockchainController {
  private readonly logger = new Logger(BlockchainController.name);

  constructor(
    private readonly gasPriceService: GasPriceService,
    private readonly uniswapV2Service: UniswapV2Service,
  ) {}

  @Get('gasPrice')
  @ApiOperation({
    summary: 'Get current Ethereum gas price',
    description: 'Returns the current gas price information with response time under 50ms',
  })
  @ApiResponse({
    status: 200,
    description: 'Gas price information retrieved successfully',
    type: GasPriceDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error while fetching gas price',
  })
  async getGasPrice(): Promise<GasPriceDto> {
    try {
      const startTime = Date.now();
      const gasPrice = await this.gasPriceService.getGasPrice();
      const responseTime = Date.now() - startTime;

      this.logger.debug(`Gas price retrieved in ${responseTime}ms`);
      return gasPrice;
    } catch (error) {
      this.logger.error('Failed to get gas price', error);
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
  async getReturn(@Param() params: GetReturnParamsDto): Promise<UniswapReturnDto> {
    try {
      const { fromTokenAddress, toTokenAddress, amountIn } = params;

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
      this.logger.error('Failed to calculate return', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to calculate return amount',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
