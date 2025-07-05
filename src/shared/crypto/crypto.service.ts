import crypto from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptoService {
  privateKeyDecrypt(privateKey: string, encryptedData: Buffer): Buffer | null {
    try {
      return crypto.privateDecrypt(
        {
          key: privateKey,
        },
        encryptedData,
      );
    } catch (e) {
      return null;
    }
  }

  parseDeviceDecryptedData(data: Buffer) {
    try {
      return JSON.parse(data.toString());
    } catch (e) {
      return null;
    }
  }
}
