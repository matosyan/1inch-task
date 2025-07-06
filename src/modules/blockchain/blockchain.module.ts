import { Module } from '@nestjs/common';
import { GasPriceRepository } from '../../repositories';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [],
  controllers: [BlockchainController],
  providers: [GasPriceRepository, BlockchainService],
})
export class BlockchainModule {}
