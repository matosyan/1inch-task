export enum Environment {
  /**
   * Use cases:
   * - local development
   * - EC2 development server
   */
  DEV = 'development',

  /**
   * Use cases:
   * - live only
   */
  PROD = 'production',

  /**
   * Use cases:
   * - test environment (unit tests, e2e tests)
   * - email templates (ex. some-meaningful-template-test)
   */
  TEST = 'test',
}
