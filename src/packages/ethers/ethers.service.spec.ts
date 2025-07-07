import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';
import { EthersService } from './ethers.service';
import { ETHERS_OPTIONS } from './constants';
import { EthersOptions } from './interfaces';
import { EtherAdapter } from './types';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn(),
    ZeroAddress: '0x0000000000000000000000000000000000000000',
    FeeData: jest.fn(),
    Contract: jest.fn(),
  },
}));

describe('EthersService', () => {
  let service: EthersService;
  let mockProvider: jest.Mocked<ethers.JsonRpcProvider>;

  const mockOptions: EthersOptions = {
    adapter: EtherAdapter.INFURA,
    infura: {
      rpc: {
        url: 'https://mainnet.infura.io/v3',
      },
      apiKey: 'test-api-key',
    },
  };

  beforeEach(async () => {
    // Create mock provider
    mockProvider = {
      getNetwork: jest.fn(),
      getFeeData: jest.fn(),
      getBlockNumber: jest.fn(),
      getBalance: jest.fn(),
    } as any;

    // Mock the JsonRpcProvider constructor
    (ethers.JsonRpcProvider as jest.Mock).mockImplementation(() => mockProvider);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EthersService,
        {
          provide: ETHERS_OPTIONS,
          useValue: mockOptions,
        },
      ],
    }).compile();

    service = module.get<EthersService>(EthersService);
    service.onModuleInit(); // Initialize the provider
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Critical Connectivity', () => {
    it('should check if provider is connected', async () => {
      mockProvider.getNetwork.mockResolvedValue({ name: 'mainnet', chainId: 1 } as any);

      const isConnected = await service.isConnected();

      expect(isConnected).toBe(true);
      expect(mockProvider.getNetwork).toHaveBeenCalled();
    });

    it('should return false when network call fails', async () => {
      mockProvider.getNetwork.mockRejectedValue(new Error('Network error'));

      const isConnected = await service.isConnected();

      expect(isConnected).toBe(false);
    });
  });

  describe('Critical Fee Data', () => {
    it('should get fee data successfully', async () => {
      const mockFeeData = {
        gasPrice: BigInt('20000000000'),
        maxFeePerGas: BigInt('30000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
      };

      mockProvider.getFeeData.mockResolvedValue(mockFeeData as ethers.FeeData);

      const feeData = await service.getFeeData();

      expect(feeData).toEqual(mockFeeData);
      expect(mockProvider.getFeeData).toHaveBeenCalled();
    });

    it('should throw error when getFeeData fails', async () => {
      const error = new Error('RPC error');
      mockProvider.getFeeData.mockRejectedValue(error);

      await expect(service.getFeeData()).rejects.toThrow('RPC error');
    });
  });

  describe('Critical Contract Creation', () => {
    it('should create contract instance successfully', async () => {
      const address = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      const abi = ['function balanceOf(address) view returns (uint256)'];
      const mockContract = { address, abi };

      (ethers.Contract as jest.Mock).mockReturnValue(mockContract);

      const contract = await service.getContract(address, abi);

      expect(contract).toBe(mockContract);
      expect(ethers.Contract).toHaveBeenCalledWith(address, abi, mockProvider);
    });
  });

  describe('Critical Integration', () => {
    it('should work in complete blockchain flow: connect and get fee data', async () => {
      // Setup mocks for critical path
      mockProvider.getNetwork.mockResolvedValue({ name: 'mainnet', chainId: 1 } as any);
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt('20000000000'),
        maxFeePerGas: BigInt('30000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
      } as ethers.FeeData);

      // Execute critical flow
      const isConnected = await service.isConnected();
      expect(isConnected).toBe(true);

      const feeData = await service.getFeeData();
      expect(feeData.gasPrice).toBe(BigInt('20000000000'));
    });

    it('should handle network failures gracefully', async () => {
      // Connection fails
      mockProvider.getNetwork.mockRejectedValue(new Error('Network unavailable'));

      const isConnected = await service.isConnected();
      expect(isConnected).toBe(false);

      // Fee data should also fail when network is down
      mockProvider.getFeeData.mockRejectedValue(new Error('Fee data unavailable'));
      await expect(service.getFeeData()).rejects.toThrow('Fee data unavailable');
    });
  });
});
