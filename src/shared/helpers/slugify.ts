import unicodeReplacements from './unicode-replacements';

const builtinOverridableReplacements: Array<[string, string]> = [
  ['&', ' and '],
  ['🦄', ' unicorn '],
  ['♥', ' love '],
];

interface SlugifyOptions {
  separator: string;
  lowercase: boolean;
  decamelize: boolean;
  customReplacements: Array<[string, string]>;
  preserveLeadingUnderscore: boolean;
  preserveTrailingDash: boolean;
  preserveCharacters: string[];
}

export class Slugify {
  private escapeStringRegexp(string: string): string {
    if (typeof string !== 'string') {
      throw new TypeError('Expected a string');
    }

    // Escape characters with special meaning either inside or outside character sets.
    // Use a simple backslash escape when it's always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns' stricter grammar.
    return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
  }

  private doCustomReplacements(string: string, replacements: Map<string, string>): string {
    for (const [key, value] of replacements) {
      // TODO: Use `String#replaceAll()` when targeting Node.js 16.
      string = string.replace(new RegExp(this.escapeStringRegexp(key), 'g'), value);
    }

    return string;
  }

  private transliterate(string: string, options?: any): string {
    if (typeof string !== 'string') {
      throw new TypeError(`Expected a string, got \`${typeof string}\``);
    }

    options = {
      customReplacements: [],
      ...options,
    };

    const customReplacements = new Map<string, string>([
      ...unicodeReplacements,
      ...options.customReplacements,
    ]);

    string = string.normalize();
    string = this.doCustomReplacements(string, customReplacements);
    string = string
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .normalize();

    return string;
  }

  private decamelize(string: string): string {
    return (
      string
        // Separate capitalized words.
        .replace(/([A-Z]{2,})(\d+)/g, '$1 $2')
        .replace(/([a-z\d]+)([A-Z]{2,})/g, '$1 $2')

        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        // `[a-rt-z]` matches all lowercase characters except `s`.
        // This avoids matching plural acronyms like `APIs`.
        .replace(/([A-Z]+)([A-Z][a-rt-z\d]+)/g, '$1 $2')
    );
  }

  private removeMootSeparators(string: string, separator: string): string {
    const escapedSeparator = this.escapeStringRegexp(separator);

    return string
      .replace(new RegExp(`${escapedSeparator}{2,}`, 'g'), separator)
      .replace(new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, 'g'), '');
  }

  private buildPatternSlug(options: SlugifyOptions): RegExp {
    let negationSetPattern = 'a-z\\d';
    negationSetPattern += options.lowercase ? '' : 'A-Z';

    if (options.preserveCharacters.length > 0) {
      for (const character of options.preserveCharacters) {
        if (character === options.separator) {
          throw new Error(
            `The separator character \`${options.separator}\` cannot be included in preserved characters: ${options.preserveCharacters}`,
          );
        }

        negationSetPattern += this.escapeStringRegexp(character);
      }
    }

    return new RegExp(`[^${negationSetPattern}]+`, 'g');
  }

  slugify(string: string, customOptions?: Partial<SlugifyOptions>): string {
    if (typeof string !== 'string') {
      throw new TypeError(`Expected a string, got \`${typeof string}\``);
    }

    const options: SlugifyOptions = {
      separator: '-',
      lowercase: true,
      decamelize: true,
      customReplacements: [],
      preserveLeadingUnderscore: false,
      preserveTrailingDash: false,
      preserveCharacters: [],
      ...customOptions,
    };

    const shouldPrependUnderscore = options.preserveLeadingUnderscore && string.startsWith('_');
    const shouldAppendDash = options.preserveTrailingDash && string.endsWith('-');

    const customReplacements = new Map<string, string>([
      ...builtinOverridableReplacements,
      ...options.customReplacements,
    ]);

    string = this.transliterate(string, { customReplacements });

    if (options.decamelize) {
      string = this.decamelize(string);
    }

    const patternSlug = this.buildPatternSlug(options);

    if (options.lowercase) {
      string = string.toLowerCase();
    }

    // Detect contractions/possessives by looking for any word followed by a `'t`
    // or `'s` in isolation and then remove it.
    string = string.replace(/([a-zA-Z\d]+)'([ts])(\s|$)/g, '$1$2$3');

    string = string.replace(patternSlug, options.separator);
    string = string.replace(/\\/g, '');

    if (options.separator) {
      string = this.removeMootSeparators(string, options.separator);
    }

    if (shouldPrependUnderscore) {
      string = `_${string}`;
    }

    if (shouldAppendDash) {
      string = `${string}-`;
    }

    return string;
  }

  slugifyWithCounter(): {
    (string: string, options?: Partial<SlugifyOptions>): string;
    reset: () => void;
  } {
    const occurrences = new Map<string, number>();

    const countable = (string: string, options?: Partial<SlugifyOptions>): string => {
      string = this.slugify(string, options);

      if (!string) {
        return '';
      }

      const stringLower = string.toLowerCase();
      const numberless = occurrences.get(stringLower.replace(/(?:-\d+?)+?$/, '')) || 0;
      const counter = occurrences.get(stringLower);
      occurrences.set(stringLower, typeof counter === 'number' ? counter + 1 : 1);
      const newCounter = occurrences.get(stringLower) || 2;

      if (newCounter >= 2 || numberless > 2) {
        string = `${string}-${newCounter}`;
      }

      return string;
    };

    countable.reset = () => {
      occurrences.clear();
    };

    return countable;
  }
}
