import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BlockchainController } from './blockchain.controller';
import { UniswapV2Service } from './uniswap-v2.service';
import { BlockchainService } from './blockchain.service';
import { AppLogger } from '../../packages/app-logger/app-logger';
import { GasPriceDto, GasPriceRepository } from '../../repositories';

describe('BlockchainController', () => {
  let controller: BlockchainController;
  let mockLogger: jest.Mocked<AppLogger>;
  let mockUniswapV2Service: jest.Mocked<UniswapV2Service>;
  let mockBlockchainService: jest.Mocked<BlockchainService>;
  let gasPriceRepository: GasPriceRepository;

  const mockGasPriceDto: GasPriceDto = {
    gasPrice: '20000000000',
    maxFeePerGas: '30000000000',
    maxPriorityFeePerGas: '2000000000',
    timestamp: Date.now(),
  };

  const mockUniswapReturnDto = {
    fromTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    toTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    amountIn: 100,
    amountOut: 0.456789123456,
    priceImpact: 0.12,
    timestamp: 1704067200000,
  };

  beforeEach(async () => {
    // Create mocks
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
    } as any;

    mockUniswapV2Service = {
      calculateReturn: jest.fn(),
    } as any;

    mockBlockchainService = {
      fetchGasPrice: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: UniswapV2Service,
          useValue: mockUniswapV2Service,
        },
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
        GasPriceRepository,
      ],
    }).compile();

    controller = module.get<BlockchainController>(BlockchainController);
    gasPriceRepository = module.get<GasPriceRepository>(GasPriceRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    gasPriceRepository.gasPrice = undefined as any;
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('getGasPrice endpoint', () => {
    describe('Successful scenarios', () => {
      beforeEach(() => {
        gasPriceRepository.gasPrice = mockGasPriceDto;
      });

      it('should return cached gas price when available', async () => {
        const result = await controller.getGasPrice();

        expect(result).toEqual(mockGasPriceDto);
        expect(mockBlockchainService.fetchGasPrice).not.toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith({
          message: expect.stringContaining('Gas price retrieved in'),
          resourceName: 'BlockchainController',
        });
      });

      it('should fetch gas price when not cached', async () => {
        gasPriceRepository.gasPrice = undefined as any;
        mockBlockchainService.fetchGasPrice.mockImplementation(async () => {
          gasPriceRepository.gasPrice = mockGasPriceDto;
        });

        const result = await controller.getGasPrice();

        expect(mockBlockchainService.fetchGasPrice).toHaveBeenCalled();
        expect(result).toEqual(mockGasPriceDto);
        expect(mockLogger.info).toHaveBeenCalledWith({
          message: expect.stringContaining('Gas price retrieved in'),
          resourceName: 'BlockchainController',
        });
      });

      it('should measure and log response time', async () => {
        const result = await controller.getGasPrice();

        expect(result).toEqual(mockGasPriceDto);
        expect(mockLogger.info).toHaveBeenCalledWith({
          message: expect.stringMatching(/Gas price retrieved in \d+ms/),
          resourceName: 'BlockchainController',
        });
      });

      it('should return gas price with correct structure', async () => {
        const result = await controller.getGasPrice();

        expect(result).toHaveProperty('gasPrice');
        expect(result).toHaveProperty('maxFeePerGas');
        expect(result).toHaveProperty('maxPriorityFeePerGas');
        expect(result).toHaveProperty('timestamp');
        expect(typeof result.gasPrice).toBe('string');
        expect(typeof result.maxFeePerGas).toBe('string');
        expect(typeof result.maxPriorityFeePerGas).toBe('string');
        expect(typeof result.timestamp).toBe('number');
      });

      it('should handle response time under 50ms requirement', async () => {
        const startTime = Date.now();
        await controller.getGasPrice();
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // With cached data, response should be very fast
        expect(responseTime).toBeLessThan(50);
      });
    });

    describe('Error scenarios', () => {
      it('should throw HttpException when gas price fetch fails', async () => {
        gasPriceRepository.gasPrice = undefined as any;
        mockBlockchainService.fetchGasPrice.mockRejectedValue(new Error('Network error'));

        await expect(controller.getGasPrice()).rejects.toThrow(HttpException);
        await expect(controller.getGasPrice()).rejects.toThrow('Failed to retrieve gas price');

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to get gas price', expect.any(Error));
      });

      it('should throw HttpException with INTERNAL_SERVER_ERROR status', async () => {
        gasPriceRepository.gasPrice = undefined as any;
        mockBlockchainService.fetchGasPrice.mockRejectedValue(new Error('Network error'));

        try {
          await controller.getGasPrice();
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect((error as HttpException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        }
      });

      it('should handle unexpected errors during logging', async () => {
        gasPriceRepository.gasPrice = mockGasPriceDto;
        mockLogger.info.mockImplementation(() => {
          throw new Error('Logging error');
        });

        // Should still return the gas price despite logging error
        const result = await controller.getGasPrice();
        expect(result).toEqual(mockGasPriceDto);
      });

      it('should handle null gas price repository data', async () => {
        gasPriceRepository.gasPrice = null as any;
        mockBlockchainService.fetchGasPrice.mockImplementation(async () => {
          gasPriceRepository.gasPrice = mockGasPriceDto;
        });

        const result = await controller.getGasPrice();

        expect(mockBlockchainService.fetchGasPrice).toHaveBeenCalled();
        expect(result).toEqual(mockGasPriceDto);
      });
    });
  });

  describe('getReturn endpoint', () => {
    const fromTokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const toTokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const amountIn = 100;

    describe('Successful scenarios', () => {
      beforeEach(() => {
        mockUniswapV2Service.calculateReturn.mockResolvedValue(mockUniswapReturnDto);
      });

      it('should calculate and return UniswapV2 swap result', async () => {
        const result = await controller.getReturn(fromTokenAddress, toTokenAddress, amountIn);

        expect(result).toEqual(mockUniswapReturnDto);
        expect(mockUniswapV2Service.calculateReturn).toHaveBeenCalledWith(
          fromTokenAddress,
          toTokenAddress,
          amountIn,
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
          `Calculating return for: ${fromTokenAddress} -> ${toTokenAddress}, amount: ${amountIn}`,
        );
      });

      it('should handle different token addresses', async () => {
        const differentFromToken = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI
        const differentToToken = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT

        await controller.getReturn(differentFromToken, differentToToken, amountIn);

        expect(mockUniswapV2Service.calculateReturn).toHaveBeenCalledWith(
          differentFromToken,
          differentToToken,
          amountIn,
        );
      });

      it('should handle various amount values', async () => {
        const testAmounts = [0.001, 1, 100, 1000000];

        for (const amount of testAmounts) {
          await controller.getReturn(fromTokenAddress, toTokenAddress, amount);
          expect(mockUniswapV2Service.calculateReturn).toHaveBeenCalledWith(
            fromTokenAddress,
            toTokenAddress,
            amount,
          );
        }
      });

      it('should return result with correct structure', async () => {
        const result = await controller.getReturn(fromTokenAddress, toTokenAddress, amountIn);

        expect(result).toHaveProperty('fromTokenAddress');
        expect(result).toHaveProperty('toTokenAddress');
        expect(result).toHaveProperty('amountIn');
        expect(result).toHaveProperty('amountOut');
        expect(result).toHaveProperty('priceImpact');
        expect(result).toHaveProperty('timestamp');
      });

      it('should log debug information correctly', async () => {
        await controller.getReturn(fromTokenAddress, toTokenAddress, amountIn);

        expect(mockLogger.debug).toHaveBeenCalledWith(
          `Calculating return for: ${fromTokenAddress} -> ${toTokenAddress}, amount: ${amountIn}`,
        );
      });
    });

    describe('Error scenarios', () => {
      it('should handle UniswapV2Service errors and rethrow HttpException', async () => {
        const error = new Error('Pair does not exist');
        mockUniswapV2Service.calculateReturn.mockRejectedValue(error);

        await expect(
          controller.getReturn(fromTokenAddress, toTokenAddress, amountIn),
        ).rejects.toThrow(HttpException);

        await expect(
          controller.getReturn(fromTokenAddress, toTokenAddress, amountIn),
        ).rejects.toThrow('Failed to calculate return amount');

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to calculate return',
          expect.any(Error),
        );
      });

      it('should preserve HttpException when service throws it', async () => {
        const httpException = new HttpException('Invalid token address', HttpStatus.BAD_REQUEST);
        mockUniswapV2Service.calculateReturn.mockRejectedValue(httpException);

        await expect(
          controller.getReturn(fromTokenAddress, toTokenAddress, amountIn),
        ).rejects.toThrow(httpException);

        // Should not log error for HttpException (it's handled by service)
        expect(mockLogger.error).not.toHaveBeenCalled();
      });

      it('should throw INTERNAL_SERVER_ERROR for non-HTTP exceptions', async () => {
        const error = new Error('Network timeout');
        mockUniswapV2Service.calculateReturn.mockRejectedValue(error);

        try {
          await controller.getReturn(fromTokenAddress, toTokenAddress, amountIn);
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(HttpException);
          expect((thrownError as HttpException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          expect((thrownError as HttpException).message).toBe('Failed to calculate return amount');
        }
      });

      it('should handle service returning null/undefined', async () => {
        mockUniswapV2Service.calculateReturn.mockResolvedValue(null as any);

        const result = await controller.getReturn(fromTokenAddress, toTokenAddress, amountIn);

        expect(result).toBeNull();
      });

      it('should handle very large amounts', async () => {
        const largeAmount = Number.MAX_SAFE_INTEGER;

        await controller.getReturn(fromTokenAddress, toTokenAddress, largeAmount);

        expect(mockUniswapV2Service.calculateReturn).toHaveBeenCalledWith(
          fromTokenAddress,
          toTokenAddress,
          largeAmount,
        );
      });
    });

    describe('Parameter validation through pipes', () => {
      // Note: These tests would normally test the pipes, but since they're integration tests
      // and pipes are handled by the NestJS framework, we test that the controller
      // receives the properly validated parameters

      it('should receive validated token addresses', async () => {
        // Assuming addresses are validated by ParseBlockchainAddressPipe
        const validFromAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        const validToAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

        await controller.getReturn(validFromAddress, validToAddress, amountIn);

        expect(mockUniswapV2Service.calculateReturn).toHaveBeenCalledWith(
          validFromAddress,
          validToAddress,
          amountIn,
        );
      });

      it('should receive parsed float amount', async () => {
        // Assuming amount is validated by ParseFloatPipe
        const floatAmount = 123.456;

        await controller.getReturn(fromTokenAddress, toTokenAddress, floatAmount);

        expect(mockUniswapV2Service.calculateReturn).toHaveBeenCalledWith(
          fromTokenAddress,
          toTokenAddress,
          floatAmount,
        );
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle concurrent requests to both endpoints', async () => {
      gasPriceRepository.gasPrice = mockGasPriceDto;
      mockUniswapV2Service.calculateReturn.mockResolvedValue(mockUniswapReturnDto);

      const gasPricePromise = controller.getGasPrice();
      const returnPromise = controller.getReturn(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        100,
      );

      const [gasPriceResult, returnResult] = await Promise.all([gasPricePromise, returnPromise]);

      expect(gasPriceResult).toEqual(mockGasPriceDto);
      expect(returnResult).toEqual(mockUniswapReturnDto);
    });

    it('should handle mixed success and failure scenarios', async () => {
      gasPriceRepository.gasPrice = mockGasPriceDto;
      mockUniswapV2Service.calculateReturn.mockRejectedValue(new Error('Calculation failed'));

      // Gas price should succeed
      const gasPriceResult = await controller.getGasPrice();
      expect(gasPriceResult).toEqual(mockGasPriceDto);

      // Return calculation should fail
      await expect(
        controller.getReturn(
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          100,
        ),
      ).rejects.toThrow(HttpException);
    });

    it('should maintain performance under load', async () => {
      gasPriceRepository.gasPrice = mockGasPriceDto;

      const startTime = Date.now();
      const promises = Array(100)
        .fill(null)
        .map(() => controller.getGasPrice());
      await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / 100;

      // Each request should still be fast when cached
      expect(averageTime).toBeLessThan(10);
    });
  });

  describe('Logging verification', () => {
    it('should log gas price retrieval with timing', async () => {
      gasPriceRepository.gasPrice = mockGasPriceDto;

      await controller.getGasPrice();

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: expect.stringMatching(/Gas price retrieved in \d+ms/),
        resourceName: 'BlockchainController',
      });
    });

    it('should log debug information for return calculations', async () => {
      mockUniswapV2Service.calculateReturn.mockResolvedValue(mockUniswapReturnDto);

      await controller.getReturn(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        100,
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Calculating return for: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 -> 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, amount: 100',
      );
    });

    it('should log errors with proper context', async () => {
      const error = new Error('Test error');
      mockUniswapV2Service.calculateReturn.mockRejectedValue(error);

      await expect(
        controller.getReturn(
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          100,
        ),
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to calculate return',
        expect.any(Error),
      );
    });

    it('should use correct resource name in logs', async () => {
      gasPriceRepository.gasPrice = mockGasPriceDto;

      await controller.getGasPrice();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceName: 'BlockchainController',
        }),
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle zero amount in return calculation', async () => {
      mockUniswapV2Service.calculateReturn.mockResolvedValue({
        ...mockUniswapReturnDto,
        amountIn: 0,
        amountOut: 0,
      });

      const result = await controller.getReturn(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        0,
      );

      expect(result.amountIn).toBe(0);
      expect(result.amountOut).toBe(0);
    });

    it('should handle very small amounts', async () => {
      const verySmallAmount = 0.000000001;
      mockUniswapV2Service.calculateReturn.mockResolvedValue({
        ...mockUniswapReturnDto,
        amountIn: verySmallAmount,
      });

      const result = await controller.getReturn(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        verySmallAmount,
      );

      expect(result.amountIn).toBe(verySmallAmount);
    });

    it('should handle stale gas price data gracefully', async () => {
      // Set old timestamp (more than 5 minutes ago)
      const staleGasPrice = {
        ...mockGasPriceDto,
        timestamp: Date.now() - 6 * 60 * 1000,
      };
      gasPriceRepository.gasPrice = staleGasPrice;

      const result = await controller.getGasPrice();

      // Should still return the stale data (caching strategy is handled by repository/scheduler)
      expect(result).toEqual(staleGasPrice);
    });

    it('should handle same token addresses in return calculation', async () => {
      const sameAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      mockUniswapV2Service.calculateReturn.mockRejectedValue(
        new Error('Cannot swap token with itself'),
      );

      await expect(controller.getReturn(sameAddress, sameAddress, 100)).rejects.toThrow(
        HttpException,
      );
    });

    it('should handle null response from services', async () => {
      gasPriceRepository.gasPrice = null as any;
      mockBlockchainService.fetchGasPrice.mockImplementation(async () => {
        // Don't set anything in repository
      });

      await expect(controller.getGasPrice()).rejects.toThrow(HttpException);
    });
  });
});
