import { ethers } from 'ethers';
import { isEthereumAddress } from 'class-validator';
import {
  Optional,
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * Supported blockchain networks
 */
export enum BlockchainNetwork {
  ETHEREUM = 'ethereum',
  // Future networks can be added here
  // BITCOIN = 'bitcoin',
  // POLYGON = 'polygon',
  // BSC = 'bsc',
}

/**
 * Configuration options for the blockchain address pipe
 */
export interface BlockchainAddressPipeOptions {
  required?: boolean;
  network?: BlockchainNetwork;
}

@Injectable()
export class ParseBlockchainAddressPipe implements PipeTransform {
  private readonly required: boolean;
  private readonly network: BlockchainNetwork;
  private readonly allowChecksum: boolean;

  constructor(@Optional() options?: BlockchainAddressPipeOptions) {
    this.required = options?.required !== false;
    this.network = options?.network || BlockchainNetwork.ETHEREUM;
  }

  /**
   * Transforms and validates blockchain address
   * @param value - The address value to validate
   * @param metadata - Argument metadata from NestJS
   * @returns Validated and normalized address
   * @throws BadRequestException if address is invalid
   */
  transform(value: any, metadata: ArgumentMetadata): string | undefined {
    // Handle optional addresses
    if (!this.required && this.isEmptyValue(value)) {
      return undefined;
    }

    // Validate required addresses
    if (this.required && this.isEmptyValue(value)) {
      throw new BadRequestException(
        `${this.getFieldName(metadata)} is required and must be a valid ${this.network} address`,
      );
    }

    // Type validation
    if (typeof value !== 'string') {
      throw new BadRequestException(
        `${this.getFieldName(metadata)} must be a string, received ${typeof value}`,
      );
    }

    // Normalize address
    const normalizedAddress = this.normalizeAddress(value);

    // Validate based on network
    if (!this.isValidAddressForNetwork(normalizedAddress)) {
      throw new BadRequestException(
        `${this.getFieldName(metadata)} "${value}" is not a valid ${this.network} address`,
      );
    }

    return normalizedAddress;
  }

  /**
   * Checks if value is empty (null, undefined, or empty string)
   * @param value - Value to check
   * @returns true if value is empty
   */
  private isEmptyValue(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  /**
   * Gets field name from metadata for better error messages
   * @param metadata - Argument metadata
   * @returns Field name or 'Address'
   */
  private getFieldName(metadata: ArgumentMetadata): string {
    return metadata?.data || 'Address';
  }

  /**
   * Normalizes address by trimming whitespace
   * @param address - Raw address string
   * @returns Normalized address
   */
  private normalizeAddress(address: string): string {
    return address.trim();
  }

  /**
   * Validates address based on the configured network
   * @param address - Address to validate
   * @returns true if address is valid for the network
   */
  private isValidAddressForNetwork(address: string): boolean {
    switch (this.network) {
      case BlockchainNetwork.ETHEREUM:
        return this.isValidEthereumAddress(address) && ethers.isAddress(address);

      // Future networks can be added here
      // case BlockchainNetwork.BITCOIN:
      //   return this.isValidBitcoinAddress(address);

      default:
        throw new Error(`Unsupported blockchain network: ${this.network}`);
    }
  }

  /**
   * Validates Ethereum address format
   * @param address - Address to validate
   * @returns true if valid Ethereum address
   */
  private isValidEthereumAddress(address: string): boolean {
    // Use class-validator for basic validation
    if (!isEthereumAddress(address)) {
      return false;
    }

    // Additional Ethereum-specific validations
    if (!address.startsWith('0x')) {
      return false;
    }

    // Validate length (42 characters: 0x + 40 hex chars)
    if (address.length !== 42) {
      return false;
    }

    // Validate hex characters
    const hexPattern = /^0x[a-fA-F0-9]{40}$/;
    if (!hexPattern.test(address)) {
      return false;
    }

    return true;
  }
}
