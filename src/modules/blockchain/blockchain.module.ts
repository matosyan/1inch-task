import { Module } from '@nestjs/common';
import { GasPriceRepository } from '../../repositories';
import { UniswapV2Service } from './uniswap-v2.service';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';

@Module({
  imports: [],
  controllers: [BlockchainController],
  providers: [GasPriceRepository, BlockchainService, UniswapV2Service],
})
export class BlockchainModule {}
