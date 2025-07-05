import { Environment, ResourceSettingValueCast } from '../types';
import { Slugify } from './slugify';

export class StringHelper {
  static appendEnvironmentName(name) {
    const env = process.env.NODE_ENV;
    if (env !== Environment.PROD) {
      return `${name}-${env || Environment.DEV}`;
    }

    return name;
  }

  static castSettingValue(value: string, cast: string) {
    if (!value || !cast) {
      return undefined;
    }

    switch (cast) {
      case ResourceSettingValueCast.BOOLEAN:
        return value === 'true';
      case ResourceSettingValueCast.INTEGER:
        return parseInt(value);
      case ResourceSettingValueCast.NUMBER:
        return Number(value);
      case ResourceSettingValueCast.STRING:
        return value;
      case ResourceSettingValueCast.OBJECT:
        return JSON.parse(value);
      default:
        return undefined;
    }
  }

  static slugify(string: string) {
    return new Slugify().slugify(string);
  }

  static mimeTypeToFormatConverter(
    mimeType: string,
  ): 'jpg' | 'png' | 'gif' | 'webp' | 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | null {
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/gif':
        return 'gif';
      case 'image/webp':
        return 'webp';
      case 'application/pdf':
        return 'pdf';
      case 'application/msword':
        return 'doc';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      case 'application/vnd.ms-excel':
        return 'xls';
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'xlsx';
      default:
        return null;
    }
  }
}
