import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { ethers } from 'ethers';

describe('BlockchainService', () => {
  let service: BlockchainService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with default RPC URL when not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const provider = service.getProvider();
      expect(provider).toBeInstanceOf(ethers.JsonRpcProvider);
    });

    it('should initialize with configured RPC URL', () => {
      const customRpcUrl = 'https://custom-rpc.com';
      mockConfigService.get.mockReturnValue(customRpcUrl);

      // Create a new instance to test configuration
      const testService = new BlockchainService(configService);
      const provider = testService.getProvider();

      expect(provider).toBeInstanceOf(ethers.JsonRpcProvider);
      expect(mockConfigService.get).toHaveBeenCalledWith('ETHEREUM_RPC_URL');
    });
  });

  describe('getProvider', () => {
    it('should return the ethers provider', () => {
      const provider = service.getProvider();
      expect(provider).toBeInstanceOf(ethers.JsonRpcProvider);
    });
  });

  describe('getContract', () => {
    it('should return a contract instance', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const abi = ['function test() view returns (uint256)'];

      const contract = await service.getContract(address, abi);
      expect(contract).toBeInstanceOf(ethers.Contract);
    });
  });

  describe('getBlockNumber', () => {
    it('should return block number on success', async () => {
      const mockBlockNumber = 12345;
      const mockProvider = {
        getBlockNumber: jest.fn().mockResolvedValue(mockBlockNumber),
      };

      // Mock the provider
      jest.spyOn(service, 'getProvider').mockReturnValue(mockProvider as any);

      const result = await service.getBlockNumber();
      expect(result).toBe(mockBlockNumber);
      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      const mockError = new Error('Network error');
      const mockProvider = {
        getBlockNumber: jest.fn().mockRejectedValue(mockError),
      };

      jest.spyOn(service, 'getProvider').mockReturnValue(mockProvider as any);

      await expect(service.getBlockNumber()).rejects.toThrow(mockError);
    });
  });

  describe('getBalance', () => {
    it('should return balance on success', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const mockBalance = BigInt('1000000000000000000');
      const mockProvider = {
        getBalance: jest.fn().mockResolvedValue(mockBalance),
      };

      jest.spyOn(service, 'getProvider').mockReturnValue(mockProvider as any);

      const result = await service.getBalance(address);
      expect(result).toBe(mockBalance);
      expect(mockProvider.getBalance).toHaveBeenCalledWith(address);
    });

    it('should throw error on failure', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const mockError = new Error('Invalid address');
      const mockProvider = {
        getBalance: jest.fn().mockRejectedValue(mockError),
      };

      jest.spyOn(service, 'getProvider').mockReturnValue(mockProvider as any);

      await expect(service.getBalance(address)).rejects.toThrow(mockError);
    });
  });
});
