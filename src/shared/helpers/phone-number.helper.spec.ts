import { PhoneNumber } from '../helpers';

const examples = {
  tr: '+905556001869',
  uae: '+971553019871',
};

describe('Phone Number Helper methods', () => {
  it('init correct numbers', () => {
    const [tr, uae] = [new PhoneNumber(examples.tr), new PhoneNumber(examples.uae)];

    expect(tr.countryCode).toBe('TR');
    expect(tr.isValid()).toBe(true);
    expect(uae.countryCode).toBe('AE');
    expect(uae.isValid()).toBe(true);
  });

  it('init incorrect numbers', () => {
    const x = new PhoneNumber(examples.tr + 1);
    const isValid = x.isValid();
    expect(isValid).toBe(false);
  });

  it('format', () => {
    const uae = new PhoneNumber(examples.uae.slice(1));
    expect(uae.format()).toBe(examples.uae);
  });

  it('format2', () => {
    const uae = new PhoneNumber('00' + examples.uae.slice(1));
    expect(uae.format()).toBe(examples.uae);
  });

  it('format3', () => {
    const uae = new PhoneNumber('++' + examples.uae);
    expect(uae.format()).toBe(examples.uae);
  });
});
