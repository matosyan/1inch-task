import googlePhone from 'google-libphonenumber';

export class PhoneNumber {
  private _util: googlePhone.PhoneNumberUtil;

  regionCode: string;

  parsedNumber: googlePhone.PhoneNumber;

  constructor(protected _number: string) {
    this._util = googlePhone.PhoneNumberUtil.getInstance();

    this.normalize();
    this.parse();
  }

  get countryCode(): string {
    return this.regionCode;
  }

  toString(): string {
    return this._util.format(this.parsedNumber, googlePhone.PhoneNumberFormat.E164);
  }

  normalize(): void {
    this._number = this._number.trim();

    if (this._number.indexOf('00') === 0) {
      this._number = `+${this._number.substring(2)}`;
    } else if (this._number.substring(0, 1) !== '+') {
      this._number = `+${this._number}`;
    }
  }

  parse(): void {
    try {
      const parsedNumber = this._util.parse(this._number);

      this.regionCode = this._util.getRegionCodeForNumber(parsedNumber);
      this.parsedNumber = this._util.parse(this._number, this.regionCode);
    } catch (e) {
      this.parsedNumber = undefined;
    }
  }

  isValid(): boolean {
    try {
      return this._util.isValidNumber(this.parsedNumber);
    } catch (e) {
      return false;
    }
  }

  format(): string {
    return this._util.format(this.parsedNumber, googlePhone.PhoneNumberFormat.E164);
  }
}
