import { Module } from '@nestjs/common';
import { GasPriceService } from './gas-price.service';
import { UniswapV2Service } from './uniswap-v2.service';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';

@Module({
  imports: [],
  controllers: [BlockchainController],
  providers: [BlockchainService, GasPriceService, UniswapV2Service],
})
export class BlockchainModule {}
