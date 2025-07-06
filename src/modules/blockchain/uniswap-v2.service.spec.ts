import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UniswapV2Service } from './uniswap-v2.service';
import { BlockchainService } from './blockchain.service';
import BigNumber from 'bignumber.js';

describe('UniswapV2Service', () => {
  let service: UniswapV2Service;
  let blockchainService: BlockchainService;

  const mockBlockchainService = {
    getContract: jest.fn(),
  };

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniswapV2Service,
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
      ],
    }).compile();

    service = module.get<UniswapV2Service>(UniswapV2Service);
    blockchainService = module.get<BlockchainService>(BlockchainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('calculateReturn', () => {
    const validFromToken = '0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20';
    const validToToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const validPairAddress = '0x1234567890123456789012345678901234567890';
    const validAmountIn = '1.0';

    beforeEach(() => {
      // Setup default mocks
      mockBlockchainService.getContract
        .mockReturnValueOnce(mockFactoryContract) // Factory contract
        .mockReturnValueOnce(mockPairContract) // Pair contract
        .mockReturnValueOnce(mockTokenContract) // From token contract
        .mockReturnValueOnce(mockTokenContract); // To token contract

      mockFactoryContract.getPair.mockResolvedValue(validPairAddress);
      mockPairContract.getReserves.mockResolvedValue([
        BigInt('1000000000000000000000'), // reserve0: 1000 tokens
        BigInt('2000000000000000000000'), // reserve1: 2000 tokens
        1234567890, // timestamp
      ]);
      mockPairContract.token0.mockResolvedValue(validFromToken);
      mockPairContract.token1.mockResolvedValue(validToToken);
      mockTokenContract.decimals.mockResolvedValue(18);
    });

    it('should calculate return successfully', async () => {
      const result = await service.calculateReturn(validFromToken, validToToken, validAmountIn);

      expect(result).toEqual({
        fromTokenAddress: validFromToken,
        toTokenAddress: validToToken,
        amountIn: validAmountIn,
        amountOut: expect.any(String),
        priceImpact: expect.any(String),
        timestamp: expect.any(Number),
      });

      expect(mockFactoryContract.getPair).toHaveBeenCalledWith(validFromToken, validToToken);
      expect(mockPairContract.getReserves).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid from token address', async () => {
      await expect(
        service.calculateReturn('invalid-address', validToToken, validAmountIn),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid to token address', async () => {
      await expect(
        service.calculateReturn(validFromToken, 'invalid-address', validAmountIn),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when pair does not exist', async () => {
      mockFactoryContract.getPair.mockResolvedValue('0x0000000000000000000000000000000000000000');

      await expect(
        service.calculateReturn(validFromToken, validToToken, validAmountIn),
      ).rejects.toThrow('Pair does not exist');
    });

    it('should handle WETH address correctly', async () => {
      const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

      mockBlockchainService.getContract
        .mockReturnValueOnce(mockFactoryContract)
        .mockReturnValueOnce(mockPairContract);

      // Mock to avoid token decimals call for WETH
      const result = await service.calculateReturn(wethAddress, validToToken, validAmountIn);

      expect(result).toBeDefined();
    });

    it('should calculate correct output for token0 -> token1 swap', async () => {
      const result = await service.calculateReturn(validFromToken, validToToken, '1.0');

      // With reserves [1000, 2000] and input 1.0, using UniswapV2 formula:
      // amountOut = (1 * 997 * 2000) / (1000 * 1000 + 1 * 997)
      // Expected output should be less than 2.0 due to slippage and fees
      const amountOut = new BigNumber(result.amountOut);
      expect(amountOut.isGreaterThan(0)).toBe(true);
      expect(amountOut.isLessThan(2)).toBe(true);
    });

    it('should calculate correct output for token1 -> token0 swap', async () => {
      // Swap the token order in mock
      mockPairContract.token0.mockResolvedValue(validToToken);
      mockPairContract.token1.mockResolvedValue(validFromToken);

      const result = await service.calculateReturn(validFromToken, validToToken, '2.0');

      const amountOut = new BigNumber(result.amountOut);
      expect(amountOut.isGreaterThan(0)).toBe(true);
      expect(amountOut.isLessThan(1)).toBe(true); // Should get less than 1 for 2 input
    });

    it('should handle different token decimals correctly', async () => {
      // Mock different decimals for tokens
      mockBlockchainService.getContract
        .mockReturnValueOnce(mockFactoryContract)
        .mockReturnValueOnce(mockPairContract)
        .mockReturnValueOnce({ decimals: jest.fn().mockResolvedValue(6) }) // USDC (6 decimals)
        .mockReturnValueOnce({ decimals: jest.fn().mockResolvedValue(18) }); // WETH (18 decimals)

      const result = await service.calculateReturn(validFromToken, validToToken, '1000');

      expect(result).toBeDefined();
      expect(result.amountOut).toBeDefined();
    });

    it('should calculate price impact correctly', async () => {
      const result = await service.calculateReturn(validFromToken, validToToken, '10.0');

      const priceImpact = new BigNumber(result.priceImpact);
      expect(priceImpact.isGreaterThan(0)).toBe(true);
      expect(priceImpact.isLessThan(100)).toBe(true); // Should be less than 100%
    });
  });

  describe('error handling', () => {
    it('should handle contract call failures gracefully', async () => {
      mockBlockchainService.getContract.mockReturnValue(mockFactoryContract);
      mockFactoryContract.getPair.mockRejectedValue(new Error('Network error'));

      const validFromToken = '0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20';
      const validToToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

      await expect(service.calculateReturn(validFromToken, validToToken, '1.0')).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle zero reserves', async () => {
      const validFromToken = '0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20';
      const validToToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      const validPairAddress = '0x1234567890123456789012345678901234567890';

      mockBlockchainService.getContract
        .mockReturnValueOnce(mockFactoryContract)
        .mockReturnValueOnce(mockPairContract)
        .mockReturnValueOnce(mockTokenContract)
        .mockReturnValueOnce(mockTokenContract);

      mockFactoryContract.getPair.mockResolvedValue(validPairAddress);
      mockPairContract.getReserves.mockResolvedValue([
        BigInt('0'), // reserve0: 0
        BigInt('1000000000000000000000'), // reserve1: 1000 tokens
        1234567890,
      ]);
      mockPairContract.token0.mockResolvedValue(validFromToken);
      mockPairContract.token1.mockResolvedValue(validToToken);
      mockTokenContract.decimals.mockResolvedValue(18);

      await expect(service.calculateReturn(validFromToken, validToToken, '1.0')).rejects.toThrow(
        'Insufficient liquidity',
      );
    });

    it('should handle zero amount input', async () => {
      const validFromToken = '0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20';
      const validToToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      const validPairAddress = '0x1234567890123456789012345678901234567890';

      mockBlockchainService.getContract
        .mockReturnValueOnce(mockFactoryContract)
        .mockReturnValueOnce(mockPairContract)
        .mockReturnValueOnce(mockTokenContract)
        .mockReturnValueOnce(mockTokenContract);

      mockFactoryContract.getPair.mockResolvedValue(validPairAddress);
      mockPairContract.getReserves.mockResolvedValue([
        BigInt('1000000000000000000000'),
        BigInt('2000000000000000000000'),
        1234567890,
      ]);
      mockPairContract.token0.mockResolvedValue(validFromToken);
      mockPairContract.token1.mockResolvedValue(validToToken);
      mockTokenContract.decimals.mockResolvedValue(18);

      await expect(service.calculateReturn(validFromToken, validToToken, '0')).rejects.toThrow(
        'Amount in must be greater than 0',
      );
    });
  });
});
