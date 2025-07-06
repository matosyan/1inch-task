import { Module } from '@nestjs/common';
import { BlockchainController } from './blockchain.controller';

@Module({
  imports: [],
  controllers: [BlockchainController],
  providers: [],
})
export class BlockchainModule {}
