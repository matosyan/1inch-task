import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';
import { BlockchainService } from './blockchain.service';
import { AppLogger } from '../../packages/app-logger/app-logger';
import { EthersService } from '../../packages/ethers/ethers.service';
import { GasPriceDto, GasPriceRepository } from '../../repositories';

describe('BlockchainService', () => {
  let service: BlockchainService;
  let mockLogger: jest.Mocked<AppLogger>;
  let mockEthersService: jest.Mocked<EthersService>;
  let gasPriceRepository: GasPriceRepository;

  const mockFeeData: ethers.FeeData = {
    gasPrice: BigInt('20000000000'),
    maxFeePerGas: BigInt('30000000000'),
    maxPriorityFeePerGas: BigInt('2000000000'),
  } as ethers.FeeData;

  beforeEach(async () => {
    // Create mocks
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
    } as any;

    mockEthersService = {
      getFeeData: jest.fn(),
      isConnected: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: EthersService,
          useValue: mockEthersService,
        },
        GasPriceRepository,
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    gasPriceRepository = module.get<GasPriceRepository>(GasPriceRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear repository data
    gasPriceRepository.gasPrice = undefined as any;
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should fetch gas price on module initialization', async () => {
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);

      await service.onModuleInit();

      expect(mockEthersService.getFeeData).toHaveBeenCalled();
      expect(gasPriceRepository.gasPrice).toEqual({
        gasPrice: '20000000000',
        maxFeePerGas: '30000000000',
        maxPriorityFeePerGas: '2000000000',
        timestamp: expect.any(Number),
      });
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Gas price updated',
        data: { gasPrice: expect.any(Object) },
        resourceName: 'GasPriceSchedulerService',
      });
    });

    it('should handle errors during module initialization', async () => {
      const error = new Error('Network error');
      mockEthersService.getFeeData.mockRejectedValue(error);

      const result = await service.onModuleInit();

      expect(result).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failed to fetch gas price',
        data: { error },
        resourceName: 'GasPriceSchedulerService',
      });
      expect(gasPriceRepository.gasPrice).toBeUndefined();
    });
  });

  describe('fetchGasPrice method', () => {
    describe('Successful scenarios', () => {
      beforeEach(() => {
        mockEthersService.getFeeData.mockResolvedValue(mockFeeData);
      });

      it('should successfully fetch and store gas price', async () => {
        await service.fetchGasPrice();

        expect(mockEthersService.getFeeData).toHaveBeenCalled();
        expect(gasPriceRepository.gasPrice).toEqual({
          gasPrice: '20000000000',
          maxFeePerGas: '30000000000',
          maxPriorityFeePerGas: '2000000000',
          timestamp: expect.any(Number),
        });
        expect(mockLogger.debug).toHaveBeenCalledWith({
          message: 'Gas price updated',
          data: { gasPrice: expect.any(Object) },
          resourceName: 'GasPriceSchedulerService',
        });
      });

      it('should update timestamp on each fetch', async () => {
        // First fetch
        await service.fetchGasPrice();
        const firstTimestamp = gasPriceRepository.gasPrice.timestamp;

        // Wait a small amount of time
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Second fetch
        await service.fetchGasPrice();
        const secondTimestamp = gasPriceRepository.gasPrice.timestamp;

        expect(secondTimestamp).toBeGreaterThan(firstTimestamp);
      });

      it('should handle zero gas price values', async () => {
        mockEthersService.getFeeData.mockResolvedValue({
          gasPrice: BigInt('0'),
          maxFeePerGas: BigInt('0'),
          maxPriorityFeePerGas: BigInt('0'),
        } as ethers.FeeData);

        await service.fetchGasPrice();

        expect(gasPriceRepository.gasPrice).toEqual({
          gasPrice: '0',
          maxFeePerGas: '0',
          maxPriorityFeePerGas: '0',
          timestamp: expect.any(Number),
        });
      });

      it('should handle very large gas price values', async () => {
        mockEthersService.getFeeData.mockResolvedValue({
          gasPrice: BigInt('999999999999999999999'),
          maxFeePerGas: BigInt('888888888888888888888'),
          maxPriorityFeePerGas: BigInt('777777777777777777777'),
        } as ethers.FeeData);

        await service.fetchGasPrice();

        expect(gasPriceRepository.gasPrice).toEqual({
          gasPrice: '999999999999999999999',
          maxFeePerGas: '888888888888888888888',
          maxPriorityFeePerGas: '777777777777777777777',
          timestamp: expect.any(Number),
        });
      });

      it('should handle null fee data gracefully', async () => {
        mockEthersService.getFeeData.mockResolvedValue({
          gasPrice: null,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
        } as any);

        await service.fetchGasPrice();

        expect(gasPriceRepository.gasPrice).toEqual({
          gasPrice: '0',
          maxFeePerGas: '0',
          maxPriorityFeePerGas: '0',
          timestamp: expect.any(Number),
        });
      });

      it('should handle undefined fee data gracefully', async () => {
        mockEthersService.getFeeData.mockResolvedValue({
          gasPrice: undefined,
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
        } as any);

        await service.fetchGasPrice();

        expect(gasPriceRepository.gasPrice).toEqual({
          gasPrice: '0',
          maxFeePerGas: '0',
          maxPriorityFeePerGas: '0',
          timestamp: expect.any(Number),
        });
      });
    });

    describe('Error scenarios', () => {
      it('should handle network errors gracefully', async () => {
        const error = new Error('Network timeout');
        mockEthersService.getFeeData.mockRejectedValue(error);

        const result = await service.fetchGasPrice();

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to fetch gas price',
          data: { error },
          resourceName: 'GasPriceSchedulerService',
        });
        expect(gasPriceRepository.gasPrice).toBeUndefined();
      });

      it('should handle RPC errors gracefully', async () => {
        const error = new Error('RPC call failed');
        mockEthersService.getFeeData.mockRejectedValue(error);

        const result = await service.fetchGasPrice();

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to fetch gas price',
          data: { error },
          resourceName: 'GasPriceSchedulerService',
        });
      });

      it('should handle provider disconnection errors', async () => {
        const error = new Error('Provider not connected');
        mockEthersService.getFeeData.mockRejectedValue(error);

        const result = await service.fetchGasPrice();

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to fetch gas price',
          data: { error },
          resourceName: 'GasPriceSchedulerService',
        });
      });

      it('should not update repository on error', async () => {
        // First successful fetch
        mockEthersService.getFeeData.mockResolvedValue(mockFeeData);
        await service.fetchGasPrice();
        const originalGasPrice = gasPriceRepository.gasPrice;

        // Second fetch fails
        mockEthersService.getFeeData.mockRejectedValue(new Error('Network error'));
        await service.fetchGasPrice();

        // Repository should still contain original data
        expect(gasPriceRepository.gasPrice).toEqual(originalGasPrice);
      });
    });

    describe('Data conversion and validation', () => {
      it('should properly convert BigInt to string', async () => {
        const bigIntValues = {
          gasPrice: BigInt('123456789012345678901234567890'),
          maxFeePerGas: BigInt('987654321098765432109876543210'),
          maxPriorityFeePerGas: BigInt('111111111111111111111111111111'),
        };

        mockEthersService.getFeeData.mockResolvedValue(bigIntValues as ethers.FeeData);

        await service.fetchGasPrice();

        expect(gasPriceRepository.gasPrice).toEqual({
          gasPrice: '123456789012345678901234567890',
          maxFeePerGas: '987654321098765432109876543210',
          maxPriorityFeePerGas: '111111111111111111111111111111',
          timestamp: expect.any(Number),
        });
      });

      it('should handle mixed null and valid values', async () => {
        mockEthersService.getFeeData.mockResolvedValue({
          gasPrice: BigInt('20000000000'),
          maxFeePerGas: null,
          maxPriorityFeePerGas: BigInt('2000000000'),
        } as any);

        await service.fetchGasPrice();

        expect(gasPriceRepository.gasPrice).toEqual({
          gasPrice: '20000000000',
          maxFeePerGas: '0',
          maxPriorityFeePerGas: '2000000000',
          timestamp: expect.any(Number),
        });
      });

      it('should ensure timestamp is current', async () => {
        const beforeTime = Date.now();

        mockEthersService.getFeeData.mockResolvedValue(mockFeeData);
        await service.fetchGasPrice();

        const afterTime = Date.now();

        expect(gasPriceRepository.gasPrice.timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(gasPriceRepository.gasPrice.timestamp).toBeLessThanOrEqual(afterTime);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should successfully initialize and fetch gas price on startup', async () => {
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);

      await service.onModuleInit();

      expect(service).toBeDefined();
      expect(gasPriceRepository.gasPrice).toBeDefined();
      expect(gasPriceRepository.gasPrice.gasPrice).toBe('20000000000');
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should handle startup failure gracefully', async () => {
      mockEthersService.getFeeData.mockRejectedValue(new Error('Startup error'));

      await service.onModuleInit();

      expect(service).toBeDefined();
      expect(gasPriceRepository.gasPrice).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle multiple consecutive fetch calls', async () => {
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);

      // Multiple calls
      await service.fetchGasPrice();
      await service.fetchGasPrice();
      await service.fetchGasPrice();

      expect(mockEthersService.getFeeData).toHaveBeenCalledTimes(3);
      expect(gasPriceRepository.gasPrice).toBeDefined();
    });

    it('should handle rapid successive calls', async () => {
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);

      // Rapid calls
      const promises = Array(5)
        .fill(null)
        .map(() => service.fetchGasPrice());
      await Promise.all(promises);

      expect(mockEthersService.getFeeData).toHaveBeenCalledTimes(5);
      expect(gasPriceRepository.gasPrice).toBeDefined();
    });

    it('should handle partial failures in a series of calls', async () => {
      // First call succeeds
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);
      await service.fetchGasPrice();
      expect(gasPriceRepository.gasPrice).toBeDefined();

      // Second call fails
      mockEthersService.getFeeData.mockRejectedValue(new Error('Network error'));
      const result1 = await service.fetchGasPrice();
      expect(result1).toBeNull();

      // Third call succeeds
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);
      await service.fetchGasPrice();
      expect(gasPriceRepository.gasPrice).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle extremely large BigInt values', async () => {
      const extremeValues = {
        gasPrice: BigInt('340282366920938463463374607431768211455'), // Max uint128
        maxFeePerGas: BigInt(
          '115792089237316195423570985008687907853269984665640564039457584007913129639935',
        ), // Max uint256
        maxPriorityFeePerGas: BigInt('1'),
      };

      mockEthersService.getFeeData.mockResolvedValue(extremeValues as ethers.FeeData);

      await service.fetchGasPrice();

      expect(gasPriceRepository.gasPrice.gasPrice).toBe('340282366920938463463374607431768211455');
      expect(gasPriceRepository.gasPrice.maxFeePerGas).toBe(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      );
      expect(gasPriceRepository.gasPrice.maxPriorityFeePerGas).toBe('1');
    });

    it('should handle empty FeeData object', async () => {
      mockEthersService.getFeeData.mockResolvedValue({} as ethers.FeeData);

      await service.fetchGasPrice();

      expect(gasPriceRepository.gasPrice).toEqual({
        gasPrice: '0',
        maxFeePerGas: '0',
        maxPriorityFeePerGas: '0',
        timestamp: expect.any(Number),
      });
    });

    it('should handle malformed FeeData', async () => {
      mockEthersService.getFeeData.mockResolvedValue({
        gasPrice: 'invalid' as any,
        maxFeePerGas: 'invalid' as any,
        maxPriorityFeePerGas: 'invalid' as any,
        toJSON: () => ({}),
      } as ethers.FeeData);

      await service.fetchGasPrice();

      expect(gasPriceRepository.gasPrice).toEqual({
        gasPrice: 'invalid',
        maxFeePerGas: 'invalid',
        maxPriorityFeePerGas: 'invalid',
        timestamp: expect.any(Number),
      });
    });

    it('should handle concurrent fetch operations', async () => {
      let resolveCount = 0;
      mockEthersService.getFeeData.mockImplementation(() => {
        resolveCount++;
        return Promise.resolve({
          gasPrice: BigInt(resolveCount * 1000000000),
          maxFeePerGas: BigInt(resolveCount * 2000000000),
          maxPriorityFeePerGas: BigInt(resolveCount * 500000000),
        } as ethers.FeeData);
      });

      // Start multiple concurrent operations
      const promises = [service.fetchGasPrice(), service.fetchGasPrice(), service.fetchGasPrice()];

      await Promise.all(promises);

      expect(mockEthersService.getFeeData).toHaveBeenCalledTimes(3);
      expect(gasPriceRepository.gasPrice).toBeDefined();
      // The final stored value should be from one of the calls
      expect(['1000000000', '2000000000', '3000000000']).toContain(
        gasPriceRepository.gasPrice.gasPrice,
      );
    });
  });

  describe('Logging verification', () => {
    it('should log successful gas price updates', async () => {
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);

      await service.fetchGasPrice();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Gas price updated',
        data: { gasPrice: expect.any(Object) },
        resourceName: 'GasPriceSchedulerService',
      });
    });

    it('should log errors with proper context', async () => {
      const error = new Error('Test error message');
      mockEthersService.getFeeData.mockRejectedValue(error);

      await service.fetchGasPrice();

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failed to fetch gas price',
        data: { error },
        resourceName: 'GasPriceSchedulerService',
      });
    });

    it('should log with correct resource name', async () => {
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);

      await service.fetchGasPrice();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceName: 'GasPriceSchedulerService',
        }),
      );
    });

    it('should log gas price data with proper structure', async () => {
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);

      await service.fetchGasPrice();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Gas price updated',
        data: {
          gasPrice: {
            gasPrice: '20000000000',
            maxFeePerGas: '30000000000',
            maxPriorityFeePerGas: '2000000000',
            timestamp: expect.any(Number),
          },
        },
        resourceName: 'GasPriceSchedulerService',
      });
    });
  });
});
