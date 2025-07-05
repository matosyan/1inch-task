export interface ContactMethod {
  init(value: string): void;

  normalize(): void;

  isValid(): Promise<boolean> | boolean;

  toString(): string;
}
