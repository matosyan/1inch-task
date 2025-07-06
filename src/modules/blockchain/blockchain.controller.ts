import { UniswapV2Service } from './uniswap-v2.service';
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@ApiTags('blockchain')
@Controller()
export class BlockchainController {
  constructor(
    private readonly logger: AppLogger,
    // private readonly gasPriceService: GasPriceService,
    // private readonly uniswapV2Service: UniswapV2Service,
  ) {}

  @Get('gasPrice')
  @ApiOperation({
    summary: 'Get current Ethereum gas price',
    description: 'Returns the current gas price information with response time under 50ms',
  })
  @ApiOkResponse({
    description: 'Gas price information retrieved successfully',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error while fetching gas price',
  })
  async getGasPrice(): Promise<any> {
    return null;
    // try {
    //   const startTime = Date.now();
    //   const gasPrice = await this.gasPriceService.getGasPrice();
    //   const responseTime = Date.now() - startTime;

    //   this.logger.debug(`Gas price retrieved in ${responseTime}ms`);
    //   return gasPrice;
    // } catch (error) {
    //   this.logger.error('Failed to get gas price', error as string);
    //   throw new HttpException('Failed to retrieve gas price', HttpStatus.INTERNAL_SERVER_ERROR);
    // }
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
