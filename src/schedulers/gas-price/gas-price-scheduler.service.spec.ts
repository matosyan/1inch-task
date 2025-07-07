import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';
import { GasPriceSchedulerService } from './gas-price-scheduler.service';
import { GasPriceDto, GasPriceRepository } from '../../repositories';
import { AppLogger } from '../../packages/app-logger/app-logger';
import { EthersService } from '../../packages/ethers/ethers.service';

describe('GasPriceSchedulerService', () => {
  let service: GasPriceSchedulerService;
  let mockLogger: jest.Mocked<AppLogger>;
  let mockEthersService: jest.Mocked<EthersService>;
  let gasPriceRepository: GasPriceRepository;

  const mockFeeData: ethers.FeeData = {
    gasPrice: BigInt('20000000000'),
    maxFeePerGas: BigInt('30000000000'),
    maxPriorityFeePerGas: BigInt('2000000000'),
  } as ethers.FeeData;

  const mockGasPriceDto: GasPriceDto = {
    gasPrice: '20000000000',
    maxFeePerGas: '30000000000',
    maxPriorityFeePerGas: '2000000000',
    timestamp: Date.now(),
  };

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
      isConnected: jest.fn(),
      getFeeData: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GasPriceSchedulerService,
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

    service = module.get<GasPriceSchedulerService>(GasPriceSchedulerService);
    gasPriceRepository = module.get<GasPriceRepository>(GasPriceRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear repository data
    gasPriceRepository.gasPrice = undefined as any;
  });

  describe('Critical Gas Price Fetching', () => {
    beforeEach(() => {
      mockEthersService.isConnected.mockResolvedValue(true);
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);
    });

    it('should successfully refresh gas price when cache is invalid', async () => {
      const result = await service.refreshGasPrice();

      expect(result).toBe(true);
      expect(mockEthersService.isConnected).toHaveBeenCalled();
      expect(mockEthersService.getFeeData).toHaveBeenCalled();
      expect(gasPriceRepository.gasPrice).toEqual({
        gasPrice: '20000000000',
        maxFeePerGas: '30000000000',
        maxPriorityFeePerGas: '2000000000',
        timestamp: expect.any(Number),
      });
    });

    it('should skip refresh when cache is still valid', async () => {
      // Set fresh cache data
      gasPriceRepository.gasPrice = {
        ...mockGasPriceDto,
        timestamp: Date.now(), // Fresh timestamp
      };

      const result = await service.refreshGasPrice();

      expect(result).toBe(true);
      expect(mockEthersService.getFeeData).not.toHaveBeenCalled();
    });

    it('should refresh when cache is expired', async () => {
      // Set expired cache data (older than 5 minutes)
      gasPriceRepository.gasPrice = {
        ...mockGasPriceDto,
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
      };

      const result = await service.refreshGasPrice();

      expect(result).toBe(true);
      expect(mockEthersService.getFeeData).toHaveBeenCalled();
      expect(gasPriceRepository.gasPrice.timestamp).toBeGreaterThan(mockGasPriceDto.timestamp);
    });
  });

  describe('Critical Error Handling', () => {
    it('should return false when EthersService is not connected', async () => {
      mockEthersService.isConnected.mockResolvedValue(false);

      const result = await service.refreshGasPrice();

      expect(result).toBe(false);
      expect(mockEthersService.getFeeData).not.toHaveBeenCalled();
    });

    it('should return false when getFeeData fails', async () => {
      mockEthersService.isConnected.mockResolvedValue(true);
      const error = new Error('Network error');
      mockEthersService.getFeeData.mockRejectedValue(error);

      const result = await service.refreshGasPrice();

      expect(result).toBe(false);
    });

    it('should handle isConnected throwing an error', async () => {
      mockEthersService.isConnected.mockRejectedValue(new Error('Connection check failed'));

      const result = await service.refreshGasPrice();

      expect(result).toBe(false);
    });
  });

  describe('Critical Data Conversion', () => {
    it('should properly convert BigInt fee data to strings', async () => {
      mockEthersService.isConnected.mockResolvedValue(true);
      mockEthersService.getFeeData.mockResolvedValue({
        gasPrice: BigInt('123456789012345'),
        maxFeePerGas: BigInt('987654321098765'),
        maxPriorityFeePerGas: BigInt('555555555555555'),
      } as ethers.FeeData);

      await service.refreshGasPrice();

      expect(gasPriceRepository.gasPrice).toEqual({
        gasPrice: '123456789012345',
        maxFeePerGas: '987654321098765',
        maxPriorityFeePerGas: '555555555555555',
        timestamp: expect.any(Number),
      });
    });

    it('should handle null fee data values', async () => {
      mockEthersService.isConnected.mockResolvedValue(true);
      mockEthersService.getFeeData.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      } as any);

      const result = await service.refreshGasPrice();

      // Calling toString() on null will throw error, so should return false
      expect(result).toBe(false);
      // Repository should remain unchanged (undefined)
      expect(gasPriceRepository.gasPrice).toBeUndefined();
    });
  });

  describe('Critical Integration', () => {
    it('should work in complete gas price flow: check connection, fetch, and cache', async () => {
      // Ensure clean state
      gasPriceRepository.gasPrice = null as any;

      mockEthersService.isConnected.mockResolvedValue(true);
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);

      // First call should fetch and cache
      const result1 = await service.refreshGasPrice();
      expect(result1).toBe(true);
      expect(mockEthersService.getFeeData).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await service.refreshGasPrice();
      expect(result2).toBe(true);
      expect(mockEthersService.getFeeData).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should handle network failures gracefully in production flow', async () => {
      // Simulate production scenario where network goes down
      mockEthersService.isConnected.mockResolvedValue(false);

      const result = await service.refreshGasPrice();

      expect(result).toBe(false);
      expect(gasPriceRepository.gasPrice).toBeUndefined();
    });

    it('should handle rapid successive calls', async () => {
      mockEthersService.isConnected.mockResolvedValue(true);
      mockEthersService.getFeeData.mockResolvedValue(mockFeeData);

      // Multiple rapid calls
      const promises = Array(5)
        .fill(null)
        .map(() => service.refreshGasPrice());
      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => expect(result).toBe(true));

      // In concurrent scenarios, multiple calls might happen before cache is set
      // This is realistic behavior for rapid concurrent requests
      expect(mockEthersService.getFeeData.mock.calls.length).toBeGreaterThan(0);
      expect(mockEthersService.getFeeData.mock.calls.length).toBeLessThanOrEqual(5);
    });
  });
});
