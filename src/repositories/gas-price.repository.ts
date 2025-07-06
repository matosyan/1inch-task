import { Injectable } from '@nestjs/common';

export class GasPriceDto {
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  timestamp: number;
}

@Injectable()
export class GasPriceRepository {
  /**
   * @description The gas price data
   */
  private _gasPrice: GasPriceDto;

  get gasPrice(): GasPriceDto {
    return this._gasPrice;
  }

  set gasPrice(gasPrice: GasPriceDto) {
    this._gasPrice = gasPrice;
  }
}
