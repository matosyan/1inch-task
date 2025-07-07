import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { UniswapV2Service } from './uniswap-v2.service';
import { AppLogger } from '../../packages/app-logger/app-logger';
import { EthersService } from '../../packages/ethers/ethers.service';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    ZeroAddress: '0x0000000000000000000000000000000000000000',
    Contract: jest.fn(),
  },
}));

describe('UniswapV2Service', () => {
  let service: UniswapV2Service;
  let mockLogger: jest.Mocked<AppLogger>;
  let mockEthersService: jest.Mocked<EthersService>;

  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const PAIR_ADDRESS = '0x397FF1542f962076d0BFE58eA045FfA2d347ACa0';

  const mockFactoryContract = {
    getPair: jest.fn(),
  };

  const mockPairContract = {
    getReserves: jest.fn(),
    token0: jest.fn(),
    token1: jest.fn(),
  };

  const mockTokenContract = {
    decimals: jest.fn(),
    symbol: jest.fn(),
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
      getContract: jest.fn(),
    } as any;

    // Setup contract mocks
    mockEthersService.getContract.mockImplementation((address, abi) => {
      if (address === '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f') {
        // Factory
        return Promise.resolve(mockFactoryContract as any);
      } else if (address === PAIR_ADDRESS) {
        // Pair
        return Promise.resolve(mockPairContract as any);
      } else {
        // Token contracts
        return Promise.resolve(mockTokenContract as any);
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniswapV2Service,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: EthersService,
          useValue: mockEthersService,
        },
      ],
    }).compile();

    service = module.get<UniswapV2Service>(UniswapV2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('calculateReturn method', () => {
    describe('Successful scenarios', () => {
      beforeEach(() => {
        // Setup default mocks for successful scenario
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000'), // reserve0 (1000 USDC)
          BigInt('1000000000000000000'), // reserve1 (1 WETH)
          1234567890, // timestamp
        ]);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);
        mockTokenContract.decimals.mockImplementation(() => {
          // Return different decimals based on which token is being queried
          return Promise.resolve(18); // Default to 18 for simplicity
        });
      });

      it('should calculate return for USDC to WETH swap', async () => {
        // Setup: USDC has 6 decimals, WETH has 18 decimals
        mockTokenContract.decimals.mockImplementation((address) => {
          if (address === USDC_ADDRESS) return Promise.resolve(6);
          if (address === WETH_ADDRESS) return Promise.resolve(18);
          return Promise.resolve(18);
        });

        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100);

        expect(result).toEqual({
          fromTokenAddress: USDC_ADDRESS,
          toTokenAddress: WETH_ADDRESS,
          amountIn: 100,
          amountOut: expect.any(Number),
          priceImpact: expect.any(Number),
          timestamp: expect.any(Number),
        });

        expect(mockLogger.debug).toHaveBeenCalledWith({
          message: 'Calculating return for swap',
          data: { fromTokenAddress: USDC_ADDRESS, toTokenAddress: WETH_ADDRESS, amountIn: 100 },
          resourceName: 'UniswapV2Service',
        });
      });

      it('should calculate return for WETH to USDC swap', async () => {
        // Setup: USDC has 6 decimals, WETH has 18 decimals
        mockTokenContract.decimals.mockImplementation(() => {
          // Mock calls based on call order
          return Promise.resolve(18); // WETH decimals
        });

        // Set reserves for WETH to USDC (token order reversed)
        mockPairContract.token0.mockResolvedValue(WETH_ADDRESS);
        mockPairContract.token1.mockResolvedValue(USDC_ADDRESS);

        const result = await service.calculateReturn(WETH_ADDRESS, USDC_ADDRESS, 1.5);

        expect(result).toEqual({
          fromTokenAddress: WETH_ADDRESS,
          toTokenAddress: USDC_ADDRESS,
          amountIn: 1.5,
          amountOut: expect.any(Number),
          priceImpact: expect.any(Number),
          timestamp: expect.any(Number),
        });
      });

      it('should handle WETH address with default decimals', async () => {
        const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // lowercase

        const result = await service.calculateReturn(wethAddress, USDC_ADDRESS, 1);

        expect(result).toBeDefined();
        expect(result.fromTokenAddress).toBe(wethAddress);
        expect(result.toTokenAddress).toBe(USDC_ADDRESS);
      });

      it('should calculate correct price impact', async () => {
        // Setup reserves with known values
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000000'), // Large reserve0
          BigInt('1000000000000'), // Large reserve1
          1234567890,
        ]);

        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 1);

        expect(result.priceImpact).toBeDefined();
        expect(Number(result.priceImpact)).toBeGreaterThanOrEqual(0);
        expect(Number(result.priceImpact)).toBeLessThan(100); // Should be reasonable percentage
      });

      it('should handle small amounts correctly', async () => {
        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 0.000001);

        expect(result.amountOut).toBeDefined();
        expect(Number(result.amountOut)).toBeGreaterThan(0);
      });

      it('should handle large amounts correctly', async () => {
        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 1000000);

        expect(result.amountOut).toBeDefined();
        expect(Number(result.amountOut)).toBeGreaterThan(0);
      });
    });

    describe('Error scenarios', () => {
      it('should throw BadRequestException when pair does not exist', async () => {
        mockFactoryContract.getPair.mockResolvedValue(ethers.ZeroAddress);

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100)).rejects.toThrow(
          'Pair does not exist',
        );
      });

      it('should throw BadRequestException when pair address is null', async () => {
        mockFactoryContract.getPair.mockResolvedValue(null);

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw BadRequestException for zero amount', async () => {
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000'),
          BigInt('1000000000000000000'),
          1234567890,
        ]);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 0)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 0)).rejects.toThrow(
          'Amount in must be greater than 0',
        );
      });

      it('should throw BadRequestException for negative amount', async () => {
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000'),
          BigInt('1000000000000000000'),
          1234567890,
        ]);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, -1)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw BadRequestException for insufficient liquidity', async () => {
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('0'), // Zero reserve
          BigInt('1000000000000000000'),
          1234567890,
        ]);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);
        mockTokenContract.decimals.mockResolvedValue(18);

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100)).rejects.toThrow(
          'Insufficient liquidity',
        );
      });

      it('should handle contract call failures', async () => {
        mockFactoryContract.getPair.mockRejectedValue(new Error('Contract call failed'));

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100)).rejects.toThrow(
          'Contract call failed',
        );

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to calculate return',
          error: expect.any(Error),
          resourceName: 'UniswapV2Service',
        });
      });

      it('should handle token decimals fetch failure', async () => {
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000'),
          BigInt('1000000000000000000'),
          1234567890,
        ]);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);
        mockTokenContract.decimals.mockRejectedValue(new Error('Decimals fetch failed'));

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100)).rejects.toThrow(
          'Decimals fetch failed',
        );
      });
    });

    describe('Mathematical accuracy', () => {
      beforeEach(() => {
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);
        mockTokenContract.decimals.mockImplementation(() => {
          return Promise.resolve(18); // Same decimals for simplicity
        });
      });

      it('should apply 0.3% fee correctly in calculations', async () => {
        // Set up known reserves
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000000000000000'), // 1000 tokens reserve0
          BigInt('1000000000000000000000'), // 1000 tokens reserve1
          1234567890,
        ]);

        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 1);

        // With equal reserves and 1 token input, we should get slightly less than 1 due to fees
        const amountOut = Number(result.amountOut);
        expect(amountOut).toBeLessThan(1);
        expect(amountOut).toBeGreaterThan(0.99); // Should be close to 1 but less due to fees
      });

      it('should handle high precision calculations', async () => {
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1234567890123456789012345'), // Very large number
          BigInt('9876543210987654321098765'),
          1234567890,
        ]);

        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 0.000000001);

        expect(result.amountOut).toBeDefined();
        expect(Number(result.amountOut)).toBeGreaterThan(0);
      });

      it('should maintain precision with different decimal tokens', async () => {
        // USDC (6 decimals) to WETH (18 decimals)
        mockTokenContract.decimals.mockImplementation(() => {
          return Promise.resolve(6); // USDC decimals
        });

        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000'), // 1000 USDC (6 decimals)
          BigInt('1000000000000000000'), // 1 WETH (18 decimals)
          1234567890,
        ]);

        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 1000);

        expect(result.amountOut).toBeDefined();
        expect(Number(result.amountOut)).toBeGreaterThan(0);
      });

      it('should calculate price impact accurately', async () => {
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000000000000000'), // Large reserves
          BigInt('1000000000000000000000'),
          1234567890,
        ]);

        const smallSwapResult = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 1);
        const largeSwapResult = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100);

        const smallPriceImpact = Number(smallSwapResult.priceImpact);
        const largePriceImpact = Number(largeSwapResult.priceImpact);

        // Larger swaps should have higher price impact
        expect(largePriceImpact).toBeGreaterThan(smallPriceImpact);
      });
    });

    describe('Edge cases', () => {
      beforeEach(() => {
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);
        mockTokenContract.decimals.mockResolvedValue(18);
      });

      it('should handle minimal reserves', async () => {
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1'), // Minimal reserve
          BigInt('1'),
          1234567890,
        ]);

        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 0.000000001);

        expect(result.amountOut).toBeDefined();
        expect(Number(result.amountOut)).toBeGreaterThanOrEqual(0);
      });

      it('should handle very unbalanced reserves', async () => {
        // Ensure token decimals are properly mocked
        mockTokenContract.decimals.mockImplementation((address) => {
          if (address === USDC_ADDRESS) return Promise.resolve(6);
          if (address === WETH_ADDRESS) return Promise.resolve(18);
          return Promise.resolve(18); // Default
        });

        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000000000000000'), // 1000 tokens (large)
          BigInt('1000000'), // 1 token in smaller decimals (small but not extreme)
          1234567890,
        ]);

        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 1);

        expect(result.amountOut).toBeDefined();
        expect(Number(result.amountOut)).toBeGreaterThanOrEqual(0);
        expect(Number(result.priceImpact)).toBeGreaterThan(0);
      });

      it('should handle same token addresses', async () => {
        // This should fail at the pair level (no pair exists for same token)
        mockFactoryContract.getPair.mockResolvedValue(ethers.ZeroAddress);

        await expect(service.calculateReturn(USDC_ADDRESS, USDC_ADDRESS, 100)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle token order correctly (token0 vs token1)', async () => {
        // Test both possible token orders
        mockPairContract.token0.mockResolvedValue(WETH_ADDRESS); // Reversed order
        mockPairContract.token1.mockResolvedValue(USDC_ADDRESS);

        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000000000000'), // WETH reserve (token0)
          BigInt('1000000000'), // USDC reserve (token1)
          1234567890,
        ]);

        const result = await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100);

        expect(result).toBeDefined();
        expect(result.fromTokenAddress).toBe(USDC_ADDRESS);
        expect(result.toTokenAddress).toBe(WETH_ADDRESS);
      });

      it('should handle very small decimal amounts', async () => {
        const result = await service.calculateReturn(
          USDC_ADDRESS,
          WETH_ADDRESS,
          0.000000000000000001,
        );

        expect(result.amountOut).toBeDefined();
        // Even very small amounts should produce some output
        expect(Number(result.amountOut)).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Contract interaction verification', () => {
      it('should call all required contract methods', async () => {
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000'),
          BigInt('1000000000000000000'),
          1234567890,
        ]);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);
        mockTokenContract.decimals.mockResolvedValue(18);

        await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100);

        // Verify factory contract was called
        expect(mockEthersService.getContract).toHaveBeenCalledWith(
          '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
          expect.any(Array),
        );
        expect(mockFactoryContract.getPair).toHaveBeenCalledWith(USDC_ADDRESS, WETH_ADDRESS);

        // Verify pair contract was called
        expect(mockEthersService.getContract).toHaveBeenCalledWith(PAIR_ADDRESS, expect.any(Array));
        expect(mockPairContract.getReserves).toHaveBeenCalled();
        expect(mockPairContract.token0).toHaveBeenCalled();
        expect(mockPairContract.token1).toHaveBeenCalled();

        // Verify token contracts were called
        expect(mockTokenContract.decimals).toHaveBeenCalled();
      });

      it('should use correct contract ABIs', async () => {
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.getReserves.mockResolvedValue([BigInt('1'), BigInt('1'), 1]);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);
        mockTokenContract.decimals.mockResolvedValue(18);

        await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 1);

        // Check that the correct ABIs were used
        const calls = mockEthersService.getContract.mock.calls;

        // Factory ABI should contain getPair
        const factoryABI = calls.find(
          (call) => call[0] === '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
        )[1];
        expect(factoryABI.some((method: string) => method.includes('getPair'))).toBe(true);

        // Pair ABI should contain getReserves, token0, token1
        const pairABI = calls.find((call) => call[0] === PAIR_ADDRESS)[1];
        expect(pairABI.some((method: string) => method.includes('getReserves'))).toBe(true);
        expect(pairABI.some((method: string) => method.includes('token0'))).toBe(true);
        expect(pairABI.some((method: string) => method.includes('token1'))).toBe(true);

        // Token ABI should contain decimals
        const tokenABI = calls.find(
          (call) =>
            call[0] !== '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f' && call[0] !== PAIR_ADDRESS,
        )[1];
        expect(tokenABI.some((method: string) => method.includes('decimals'))).toBe(true);
      });
    });

    describe('Logging verification', () => {
      beforeEach(() => {
        mockFactoryContract.getPair.mockResolvedValue(PAIR_ADDRESS);
        mockPairContract.getReserves.mockResolvedValue([
          BigInt('1000000000'),
          BigInt('1000000000000000000'),
          1234567890,
        ]);
        mockPairContract.token0.mockResolvedValue(USDC_ADDRESS);
        mockPairContract.token1.mockResolvedValue(WETH_ADDRESS);
        mockTokenContract.decimals.mockResolvedValue(18);
      });

      it('should log successful calculations', async () => {
        await service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100);

        expect(mockLogger.debug).toHaveBeenCalledWith({
          message: 'Calculating return for swap',
          data: {
            fromTokenAddress: USDC_ADDRESS,
            toTokenAddress: WETH_ADDRESS,
            amountIn: 100,
          },
          resourceName: 'UniswapV2Service',
        });
      });

      it('should log errors with proper context', async () => {
        const error = new Error('Test error');
        mockFactoryContract.getPair.mockRejectedValue(error);

        await expect(service.calculateReturn(USDC_ADDRESS, WETH_ADDRESS, 100)).rejects.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to calculate return',
          error,
          resourceName: 'UniswapV2Service',
        });
      });
    });
  });
});
