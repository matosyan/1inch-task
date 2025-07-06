import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { UniswapReturnDto } from './dto/uniswap-return.dto';

@Injectable()
export class UniswapV2Service {
  private readonly logger = new Logger(UniswapV2Service.name);
  private readonly FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
  private readonly INIT_CODE_HASH =
    '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f';

  // UniswapV2 Factory ABI (minimal)
  private readonly FACTORY_ABI = [
    'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  ];

  // UniswapV2 Pair ABI (minimal)
  private readonly PAIR_ABI = [
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
  ];

  // ERC20 ABI (minimal)
  private readonly ERC20_ABI = [
    'function decimals() external view returns (uint8)',
    'function symbol() external view returns (string)',
  ];

  constructor(private blockchainService: BlockchainService) {}

  async calculateReturn(
    fromTokenAddress: string,
    toTokenAddress: string,
    amountIn: string,
  ): Promise<UniswapReturnDto> {
    try {
      this.logger.debug(
        `Calculating return for swap: ${fromTokenAddress} -> ${toTokenAddress}, amount: ${amountIn}`,
      );

      // Validate addresses
      if (!ethers.isAddress(fromTokenAddress) || !ethers.isAddress(toTokenAddress)) {
        throw new BadRequestException('Invalid token addresses');
      }

      // Get pair address
      const pairAddress = await this.getPairAddress(fromTokenAddress, toTokenAddress);
      if (!pairAddress || pairAddress === ethers.ZeroAddress) {
        throw new BadRequestException('Pair does not exist');
      }

      // Get pair reserves
      const { reserve0, reserve1, token0, token1 } = await this.getPairReserves(pairAddress);

      // Get token decimals for proper calculation
      const fromTokenDecimals = await this.getTokenDecimals(fromTokenAddress);
      const toTokenDecimals = await this.getTokenDecimals(toTokenAddress);

      // Determine which token is token0 and which is token1
      const isToken0FromToken = token0.toLowerCase() === fromTokenAddress.toLowerCase();
      const reserveIn = isToken0FromToken ? reserve0 : reserve1;
      const reserveOut = isToken0FromToken ? reserve1 : reserve0;

      // Convert amountIn to BigNumber with proper decimals
      const amountInBN = new BigNumber(amountIn).multipliedBy(
        new BigNumber(10).pow(fromTokenDecimals),
      );

      // Calculate amount out using UniswapV2 formula
      const amountOut = this.getAmountOut(amountInBN, reserveIn, reserveOut);

      // Convert back to human-readable format
      const amountOutFormatted = amountOut.dividedBy(new BigNumber(10).pow(toTokenDecimals));

      return {
        fromTokenAddress,
        toTokenAddress,
        amountIn,
        amountOut: amountOutFormatted.toString(),
        priceImpact: this.calculatePriceImpact(amountInBN, reserveIn, reserveOut).toString(),
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to calculate return', error);
      throw error;
    }
  }

  private async getPairAddress(tokenA: string, tokenB: string): Promise<string> {
    const factory = await this.blockchainService.getContract(
      this.FACTORY_ADDRESS,
      this.FACTORY_ABI,
    );
    return await factory.getPair(tokenA, tokenB);
  }

  private async getPairReserves(pairAddress: string): Promise<{
    reserve0: string;
    reserve1: string;
    token0: string;
    token1: string;
  }> {
    const pair = await this.blockchainService.getContract(pairAddress, this.PAIR_ABI);
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();

    return {
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      token0,
      token1,
    };
  }

  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    // Handle ETH/WETH
    if (tokenAddress.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
      return 18; // WETH decimals
    }

    const token = await this.blockchainService.getContract(tokenAddress, this.ERC20_ABI);
    return await token.decimals();
  }

  /**
   * UniswapV2 formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
   * The 997/1000 factor accounts for the 0.3% fee
   */
  private getAmountOut(amountIn: BigNumber, reserveIn: string, reserveOut: string): BigNumber {
    const reserveInBN = new BigNumber(reserveIn);
    const reserveOutBN = new BigNumber(reserveOut);

    if (amountIn.isLessThanOrEqualTo(0)) {
      throw new BadRequestException('Amount in must be greater than 0');
    }

    if (reserveInBN.isLessThanOrEqualTo(0) || reserveOutBN.isLessThanOrEqualTo(0)) {
      throw new BadRequestException('Insufficient liquidity');
    }

    const amountInWithFee = amountIn.multipliedBy(997);
    const numerator = amountInWithFee.multipliedBy(reserveOutBN);
    const denominator = reserveInBN.multipliedBy(1000).plus(amountInWithFee);

    return numerator.dividedBy(denominator);
  }

  /**
   * Calculate price impact as a percentage
   */
  private calculatePriceImpact(
    amountIn: BigNumber,
    reserveIn: string,
    reserveOut: string,
  ): BigNumber {
    const reserveInBN = new BigNumber(reserveIn);
    const reserveOutBN = new BigNumber(reserveOut);

    // Price before swap
    const priceBefore = reserveOutBN.dividedBy(reserveInBN);

    // Price after swap
    const newReserveIn = reserveInBN.plus(amountIn);
    const amountOut = this.getAmountOut(amountIn, reserveIn, reserveOut);
    const newReserveOut = reserveOutBN.minus(amountOut);
    const priceAfter = newReserveOut.dividedBy(newReserveIn);

    // Price impact percentage
    const priceImpact = priceBefore.minus(priceAfter).dividedBy(priceBefore).multipliedBy(100);

    return priceImpact;
  }
}
