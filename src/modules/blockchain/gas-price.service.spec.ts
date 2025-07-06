import { Test, TestingModule } from '@nestjs/testing';
import { GasPriceService } from './gas-price.service';
import { BlockchainService } from './blockchain.service';

describe('GasPriceService', () => {
  let service: GasPriceService;
  let blockchainService: BlockchainService;

  const mockBlockchainService = {
    getProvider: jest.fn(),
  };

  const mockProvider = {
    getFeeData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GasPriceService,
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
      ],
    }).compile();

    service = module.get<GasPriceService>(GasPriceService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Setup default mock behavior
    mockBlockchainService.getProvider.mockReturnValue(mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getGasPrice', () => {
    const mockFeeData = {
      gasPrice: BigInt('20000000000'),
      maxFeePerGas: BigInt('30000000000'),
      maxPriorityFeePerGas: BigInt('2000000000'),
    };

    it('should fetch and return gas price successfully', async () => {
      mockProvider.getFeeData.mockResolvedValue(mockFeeData);

      const result = await service.getGasPrice();

      expect(result).toEqual({
        gasPrice: '20000000000',
        maxFeePerGas: '30000000000',
        maxPriorityFeePerGas: '2000000000',
        timestamp: expect.any(Number),
      });
      expect(mockProvider.getFeeData).toHaveBeenCalled();
    });

    it('should return cached data when available and valid', async () => {
      mockProvider.getFeeData.mockResolvedValue(mockFeeData);

      // First call - should fetch from provider
      const firstResult = await service.getGasPrice();
      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(1);

      // Second call immediately - should return cached data
      const secondResult = await service.getGasPrice();
      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(1); // No additional call
      expect(secondResult).toEqual(firstResult);
    });

    it('should handle null fee data gracefully', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      });

      const result = await service.getGasPrice();

      expect(result).toEqual({
        gasPrice: '0',
        maxFeePerGas: '0',
        maxPriorityFeePerGas: '0',
        timestamp: expect.any(Number),
      });
    });

    it('should return cached data on provider error if available', async () => {
      // First successful call to populate cache
      mockProvider.getFeeData.mockResolvedValueOnce(mockFeeData);
      const cachedResult = await service.getGasPrice();

      // Second call with error - should return cached data
      mockProvider.getFeeData.mockRejectedValueOnce(new Error('Network error'));
      const result = await service.getGasPrice();

      expect(result.gasPrice).toBe(cachedResult.gasPrice);
      expect(result.maxFeePerGas).toBe(cachedResult.maxFeePerGas);
      expect(result.maxPriorityFeePerGas).toBe(cachedResult.maxPriorityFeePerGas);
    });

    it('should throw error when no cached data and provider fails', async () => {
      mockProvider.getFeeData.mockRejectedValue(new Error('Network error'));

      await expect(service.getGasPrice()).rejects.toThrow('Network error');
    });
  });

  describe('caching behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should refresh cache after cache duration expires', async () => {
      const mockFeeData = {
        gasPrice: BigInt('20000000000'),
        maxFeePerGas: BigInt('30000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
      };

      mockProvider.getFeeData.mockResolvedValue(mockFeeData);

      // First call
      await service.getGasPrice();
      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(1);

      // Advance time beyond cache duration (10 seconds)
      jest.advanceTimersByTime(11000);

      // Second call after cache expiration
      await service.getGasPrice();
      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(2);
    });
  });

  describe('periodic updates', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set up periodic updates on initialization', () => {
      const mockFeeData = {
        gasPrice: BigInt('20000000000'),
        maxFeePerGas: BigInt('30000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
      };

      mockProvider.getFeeData.mockResolvedValue(mockFeeData);

      // Create new service instance to test initialization
      const newService = new GasPriceService(blockchainService);

      // Initial call on construction
      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(1);

      // Advance time to trigger periodic update
      jest.advanceTimersByTime(10000);

      // Should have made another call due to periodic update
      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(2);
    });
  });
});
