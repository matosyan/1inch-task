import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BlockchainController } from './blockchain.controller';
import { GasPriceService } from './gas-price.service';
import { UniswapV2Service } from './uniswap-v2.service';
import { GasPriceDto } from './dto/gas-price.dto';
import { UniswapReturnDto } from './dto/uniswap-return.dto';

describe('BlockchainController', () => {
  let controller: BlockchainController;
  let gasPriceService: GasPriceService;
  let uniswapV2Service: UniswapV2Service;

  const mockGasPriceService = {
    getGasPrice: jest.fn(),
  };

  const mockUniswapV2Service = {
    calculateReturn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [
        {
          provide: GasPriceService,
          useValue: mockGasPriceService,
        },
        {
          provide: UniswapV2Service,
          useValue: mockUniswapV2Service,
        },
      ],
    }).compile();

    controller = module.get<BlockchainController>(BlockchainController);
    gasPriceService = module.get<GasPriceService>(GasPriceService);
    uniswapV2Service = module.get<UniswapV2Service>(UniswapV2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('getGasPrice', () => {
    const mockGasPriceResponse: GasPriceDto = {
      gasPrice: '20000000000',
      maxFeePerGas: '30000000000',
      maxPriorityFeePerGas: '2000000000',
      timestamp: 1704067200000,
    };

    it('should return gas price successfully', async () => {
      mockGasPriceService.getGasPrice.mockResolvedValue(mockGasPriceResponse);

      const result = await controller.getGasPrice();

      expect(result).toEqual(mockGasPriceResponse);
      expect(mockGasPriceService.getGasPrice).toHaveBeenCalled();
    });

    it('should throw HttpException when service fails', async () => {
      const serviceError = new Error('Service unavailable');
      mockGasPriceService.getGasPrice.mockRejectedValue(serviceError);

      await expect(controller.getGasPrice()).rejects.toThrow(HttpException);
      await expect(controller.getGasPrice()).rejects.toThrow('Failed to retrieve gas price');
    });

    it('should complete within reasonable time', async () => {
      mockGasPriceService.getGasPrice.mockResolvedValue(mockGasPriceResponse);

      const startTime = Date.now();
      await controller.getGasPrice();
      const responseTime = Date.now() - startTime;

      // Should complete much faster than 50ms in tests
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('getReturn', () => {
    const validParams = {
      fromTokenAddress: '0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20',
      toTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      amountIn: '1.5',
    };

    const mockReturnResponse: UniswapReturnDto = {
      fromTokenAddress: validParams.fromTokenAddress,
      toTokenAddress: validParams.toTokenAddress,
      amountIn: validParams.amountIn,
      amountOut: '0.000123456789',
      priceImpact: '0.15',
      timestamp: 1704067200000,
    };

    it('should return calculated amount successfully', async () => {
      mockUniswapV2Service.calculateReturn.mockResolvedValue(mockReturnResponse);

      const result = await controller.getReturn(validParams);

      expect(result).toEqual(mockReturnResponse);
      expect(mockUniswapV2Service.calculateReturn).toHaveBeenCalledWith(
        validParams.fromTokenAddress,
        validParams.toTokenAddress,
        validParams.amountIn,
      );
    });

    it('should handle BadRequestException from service', async () => {
      const serviceError = new HttpException('Invalid token addresses', HttpStatus.BAD_REQUEST);
      mockUniswapV2Service.calculateReturn.mockRejectedValue(serviceError);

      await expect(controller.getReturn(validParams)).rejects.toThrow(HttpException);
      await expect(controller.getReturn(validParams)).rejects.toThrow('Invalid token addresses');
    });

    it('should convert unknown errors to HttpException', async () => {
      const serviceError = new Error('Unknown error');
      mockUniswapV2Service.calculateReturn.mockRejectedValue(serviceError);

      await expect(controller.getReturn(validParams)).rejects.toThrow(HttpException);
      await expect(controller.getReturn(validParams)).rejects.toThrow(
        'Failed to calculate return amount',
      );
    });

    it('should pass through HttpExceptions from service', async () => {
      const serviceError = new HttpException('Pair does not exist', HttpStatus.BAD_REQUEST);
      mockUniswapV2Service.calculateReturn.mockRejectedValue(serviceError);

      try {
        await controller.getReturn(validParams);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).message).toBe('Pair does not exist');
        expect((error as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('logging behavior', () => {
    it('should log debug messages for getGasPrice', async () => {
      const mockGasPriceResponse: GasPriceDto = {
        gasPrice: '20000000000',
        maxFeePerGas: '30000000000',
        maxPriorityFeePerGas: '2000000000',
        timestamp: 1704067200000,
      };

      mockGasPriceService.getGasPrice.mockResolvedValue(mockGasPriceResponse);

      // Spy on the logger
      const loggerSpy = jest.spyOn((controller as any).logger, 'debug');

      await controller.getGasPrice();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Gas price retrieved in'));
    });

    it('should log debug messages for getReturn', async () => {
      const validParams = {
        fromTokenAddress: '0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20',
        toTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        amountIn: '1.5',
      };

      const mockReturnResponse: UniswapReturnDto = {
        fromTokenAddress: validParams.fromTokenAddress,
        toTokenAddress: validParams.toTokenAddress,
        amountIn: validParams.amountIn,
        amountOut: '0.000123456789',
        priceImpact: '0.15',
        timestamp: 1704067200000,
      };

      mockUniswapV2Service.calculateReturn.mockResolvedValue(mockReturnResponse);

      // Spy on the logger
      const loggerSpy = jest.spyOn((controller as any).logger, 'debug');

      await controller.getReturn(validParams);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Calculating return for:'));
    });

    it('should log errors when operations fail', async () => {
      const serviceError = new Error('Service error');
      mockGasPriceService.getGasPrice.mockRejectedValue(serviceError);

      // Spy on the logger
      const loggerSpy = jest.spyOn((controller as any).logger, 'error');

      try {
        await controller.getGasPrice();
      } catch (error) {
        // Expected to throw
      }

      expect(loggerSpy).toHaveBeenCalledWith('Failed to get gas price', serviceError);
    });
  });
});
