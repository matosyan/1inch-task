import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import {
  ParseBlockchainAddressPipe,
  BlockchainNetwork,
  BlockchainAddressPipeOptions,
} from './parse-blockchain-address.pipe';

describe('ParseBlockchainAddressPipe', () => {
  let pipe: ParseBlockchainAddressPipe;

  const validEthereumAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const validEthereumAddressLowercase = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  const invalidAddress = 'invalid-address';
  const shortAddress = '0x123';
  const addressWithoutPrefix = 'C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const addressWithInvalidChars = '0xG02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

  const mockMetadata: ArgumentMetadata = {
    type: 'param',
    metatype: String,
    data: 'testAddress',
  };

  beforeEach(() => {
    pipe = new ParseBlockchainAddressPipe();
  });

  describe('Default Configuration', () => {
    it('should be defined', () => {
      expect(pipe).toBeDefined();
    });

    it('should accept valid Ethereum address', () => {
      const result = pipe.transform(validEthereumAddress, mockMetadata);
      expect(result).toBe(validEthereumAddress);
    });

    it('should accept valid Ethereum address in lowercase', () => {
      const result = pipe.transform(validEthereumAddressLowercase, mockMetadata);
      expect(result).toBe(validEthereumAddressLowercase);
    });

    it('should throw BadRequestException for invalid address', () => {
      expect(() => pipe.transform(invalidAddress, mockMetadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(invalidAddress, mockMetadata)).toThrow(
        'testAddress "invalid-address" is not a valid ethereum address',
      );
    });

    it('should throw BadRequestException for short address', () => {
      expect(() => pipe.transform(shortAddress, mockMetadata)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for address without 0x prefix', () => {
      expect(() => pipe.transform(addressWithoutPrefix, mockMetadata)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for address with invalid characters', () => {
      expect(() => pipe.transform(addressWithInvalidChars, mockMetadata)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for null value when required', () => {
      expect(() => pipe.transform(null, mockMetadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(null, mockMetadata)).toThrow(
        'testAddress is required and must be a valid ethereum address',
      );
    });

    it('should throw BadRequestException for undefined value when required', () => {
      expect(() => pipe.transform(undefined, mockMetadata)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty string when required', () => {
      expect(() => pipe.transform('', mockMetadata)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-string value', () => {
      expect(() => pipe.transform(123, mockMetadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(123, mockMetadata)).toThrow(
        'testAddress must be a string, received number',
      );
    });
  });

  describe('Optional Configuration', () => {
    beforeEach(() => {
      const options: BlockchainAddressPipeOptions = {
        required: false,
      };
      pipe = new ParseBlockchainAddressPipe(options);
    });

    it('should return undefined for null value when optional', () => {
      const result = pipe.transform(null, mockMetadata);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined value when optional', () => {
      const result = pipe.transform(undefined, mockMetadata);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string when optional', () => {
      const result = pipe.transform('', mockMetadata);
      expect(result).toBeUndefined();
    });

    it('should still validate non-empty addresses when optional', () => {
      const result = pipe.transform(validEthereumAddress, mockMetadata);
      expect(result).toBe(validEthereumAddress);
    });

    it('should still throw for invalid addresses when optional', () => {
      expect(() => pipe.transform(invalidAddress, mockMetadata)).toThrow(BadRequestException);
    });
  });

  describe('Different Network Configuration', () => {
    beforeEach(() => {
      const options: BlockchainAddressPipeOptions = {
        network: BlockchainNetwork.ETHEREUM,
      };
      pipe = new ParseBlockchainAddressPipe(options);
    });

    it('should validate Ethereum addresses correctly', () => {
      const result = pipe.transform(validEthereumAddress, mockMetadata);
      expect(result).toBe(validEthereumAddress);
    });

    it('should throw for invalid Ethereum addresses', () => {
      expect(() => pipe.transform(invalidAddress, mockMetadata)).toThrow(
        'testAddress "invalid-address" is not a valid ethereum address',
      );
    });
  });

  describe('Checksum Configuration', () => {
    beforeEach(() => {
      const options: BlockchainAddressPipeOptions = {
        required: true,
      };
      pipe = new ParseBlockchainAddressPipe(options);
    });

    it('should accept addresses with checksum when enabled', () => {
      const result = pipe.transform(validEthereumAddress, mockMetadata);
      expect(result).toBe(validEthereumAddress);
    });

    it('should accept lowercase addresses when checksum is enabled', () => {
      const result = pipe.transform(validEthereumAddressLowercase, mockMetadata);
      expect(result).toBe(validEthereumAddressLowercase);
    });
  });

  describe('Address Normalization', () => {
    it('should trim whitespace from addresses', () => {
      const addressWithSpaces = `  ${validEthereumAddress}  `;
      const result = pipe.transform(addressWithSpaces, mockMetadata);
      expect(result).toBe(validEthereumAddress);
    });

    it('should handle addresses with leading and trailing whitespace', () => {
      const addressWithWhitespace = `\t${validEthereumAddress}\n`;
      const result = pipe.transform(addressWithWhitespace, mockMetadata);
      expect(result).toBe(validEthereumAddress);
    });
  });

  describe('Error Message Context', () => {
    it('should use field name from metadata in error messages', () => {
      const customMetadata: ArgumentMetadata = {
        type: 'param',
        metatype: String,
        data: 'fromTokenAddress',
      };

      expect(() => pipe.transform(invalidAddress, customMetadata)).toThrow(
        'fromTokenAddress "invalid-address" is not a valid ethereum address',
      );
    });

    it('should use "Address" as default field name when metadata.data is not available', () => {
      const metadataWithoutData: ArgumentMetadata = {
        type: 'param',
        metatype: String,
      };

      expect(() => pipe.transform(invalidAddress, metadataWithoutData)).toThrow(
        'Address "invalid-address" is not a valid ethereum address',
      );
    });

    it('should handle required field errors with proper context', () => {
      const customMetadata: ArgumentMetadata = {
        type: 'param',
        metatype: String,
        data: 'toTokenAddress',
      };

      expect(() => pipe.transform(null, customMetadata)).toThrow(
        'toTokenAddress is required and must be a valid ethereum address',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle object inputs', () => {
      const objectInput = { address: validEthereumAddress };
      expect(() => pipe.transform(objectInput, mockMetadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(objectInput, mockMetadata)).toThrow(
        'testAddress must be a string, received object',
      );
    });

    it('should handle array inputs', () => {
      const arrayInput = [validEthereumAddress];
      expect(() => pipe.transform(arrayInput, mockMetadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(arrayInput, mockMetadata)).toThrow(
        'testAddress must be a string, received object',
      );
    });

    it('should handle boolean inputs', () => {
      expect(() => pipe.transform(true, mockMetadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(true, mockMetadata)).toThrow(
        'testAddress must be a string, received boolean',
      );
    });

    it('should handle zero as input', () => {
      expect(() => pipe.transform(0, mockMetadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(0, mockMetadata)).toThrow(
        'testAddress must be a string, received number',
      );
    });
  });

  describe('Multiple Option Combinations', () => {
    it('should work with both optional and checksum enabled', () => {
      const options: BlockchainAddressPipeOptions = {
        required: false,
      };
      pipe = new ParseBlockchainAddressPipe(options);

      expect(pipe.transform(null, mockMetadata)).toBeUndefined();
      expect(pipe.transform(validEthereumAddress, mockMetadata)).toBe(validEthereumAddress);
    });

    it('should work with all options configured', () => {
      const options: BlockchainAddressPipeOptions = {
        required: true,
        network: BlockchainNetwork.ETHEREUM,
      };
      pipe = new ParseBlockchainAddressPipe(options);

      expect(pipe.transform(validEthereumAddress, mockMetadata)).toBe(validEthereumAddress);
      expect(() => pipe.transform(null, mockMetadata)).toThrow(BadRequestException);
    });
  });
});
