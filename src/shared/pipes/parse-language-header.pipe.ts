import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { UserLanguage } from '../types';

@Injectable()
export class ParseLanguageHeaderPipe implements PipeTransform {
  protected languageObject = {};

  constructor() {
    for (const language of Object.values(UserLanguage)) {
      this.languageObject[language.toLowerCase()] = true;
    }
  }

  transform(value: any, metadata: ArgumentMetadata) {
    if (this.isValidLanguage(value)) {
      return this.getExactLanguage(value);
    }

    return UserLanguage.EN;
  }

  isValidLanguage(lang: any) {
    return typeof lang === 'string' && this.languageObject[lang.toLowerCase()];
  }

  getExactLanguage(lang: string) {
    return lang.toLowerCase();
  }
}
