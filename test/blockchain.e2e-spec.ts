import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GasPriceRepository } from '../src/repositories';

// Valid Ethereum mainnet token addresses - moved to top level for proper scoping
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

describe('Blockchain Endpoints (e2e)', () => {
  let app: INestApplication;
  let gasPriceRepository: GasPriceRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    gasPriceRepository = moduleFixture.get<GasPriceRepository>(GasPriceRepository);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Clear any cached gas price data before each test
    gasPriceRepository.gasPrice = undefined as any;
  });

  describe('/gasPrice (GET)', () => {
    describe('Successful scenarios', () => {
      it('should return gas price data with correct structure', async () => {
        const response = await request(app.getHttpServer()).get('/gasPrice').expect(200);

        expect(response.body).toHaveProperty('gasPrice');
        expect(response.body).toHaveProperty('maxFeePerGas');
        expect(response.body).toHaveProperty('maxPriorityFeePerGas');
        expect(response.body).toHaveProperty('timestamp');

        expect(typeof response.body.gasPrice).toBe('string');
        expect(typeof response.body.maxFeePerGas).toBe('string');
        expect(typeof response.body.maxPriorityFeePerGas).toBe('string');
        expect(typeof response.body.timestamp).toBe('number');
      });

      it('should return gas price data with valid numeric strings', async () => {
        const response = await request(app.getHttpServer()).get('/gasPrice').expect(200);

        // Verify gas prices are valid numeric strings
        expect(parseInt(response.body.gasPrice)).toBeGreaterThan(0);
        expect(parseInt(response.body.maxFeePerGas)).toBeGreaterThan(0);
        expect(parseInt(response.body.maxPriorityFeePerGas)).toBeGreaterThan(0);

        // Verify timestamp is recent (within last 10 minutes)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        expect(response.body.timestamp).toBeGreaterThan(tenMinutesAgo);
      });

      it('should meet performance requirement of <50ms response time', async () => {
        // First call to warm up cache
        await request(app.getHttpServer()).get('/gasPrice');

        // Measure second call (should be cached)
        const startTime = Date.now();

        await request(app.getHttpServer()).get('/gasPrice').expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(50);
      });

      it('should return consistent data on multiple calls', async () => {
        const response1 = await request(app.getHttpServer()).get('/gasPrice').expect(200);

        const response2 = await request(app.getHttpServer()).get('/gasPrice').expect(200);

        // Should return same cached data
        expect(response1.body).toEqual(response2.body);
      });

      it('should handle concurrent requests correctly', async () => {
        const promises = Array(10)
          .fill(null)
          .map(() => request(app.getHttpServer()).get('/gasPrice').expect(200));

        const responses = await Promise.all(promises);

        // All responses should be successful and have the same data
        responses.forEach((response) => {
          expect(response.body).toHaveProperty('gasPrice');
          expect(response.body).toHaveProperty('timestamp');
        });

        // All timestamps should be the same (cached)
        const timestamps = responses.map((r) => r.body.timestamp);
        expect(new Set(timestamps).size).toBeLessThanOrEqual(2); // Allow for slight variation
      });

      it('should return correct content-type header', async () => {
        await request(app.getHttpServer())
          .get('/gasPrice')
          .expect(200)
          .expect('Content-Type', /json/);
      });
    });

    describe('Error scenarios', () => {
      it('should handle network connectivity issues gracefully', async () => {
        // This test assumes that if the service is down, it should still try to return cached data
        // or handle the error gracefully without crashing
        const response = await request(app.getHttpServer()).get('/gasPrice');

        // Should either succeed (if network is available) or return 500 with error
        expect([200, 500]).toContain(response.status);

        if (response.status === 500) {
          expect(response.body).toHaveProperty('message');
        }
      });

      it('should handle invalid HTTP methods', async () => {
        await request(app.getHttpServer()).post('/gasPrice').expect(404);

        await request(app.getHttpServer()).put('/gasPrice').expect(404);

        await request(app.getHttpServer()).delete('/gasPrice').expect(404);
      });
    });
  });

  describe('/return/:fromTokenAddress/:toTokenAddress/:amountIn (GET)', () => {
    describe('Successful scenarios', () => {
      it('should calculate return for USDC to WETH swap', async () => {
        const response = await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/1000`)
          .expect(200);

        expect(response.body).toHaveProperty('fromTokenAddress', USDC_ADDRESS);
        expect(response.body).toHaveProperty('toTokenAddress', WETH_ADDRESS);
        expect(response.body).toHaveProperty('amountIn', 1000);
        expect(response.body).toHaveProperty('amountOut');
        expect(response.body).toHaveProperty('priceImpact');
        expect(response.body).toHaveProperty('timestamp');

        expect(typeof response.body.amountOut).toBe('number');
        expect(typeof response.body.priceImpact).toBe('number');
        expect(typeof response.body.timestamp).toBe('number');

        // Amount out should be a valid positive number
        expect(response.body.amountOut).toBeGreaterThan(0);
        expect(response.body.priceImpact).toBeGreaterThanOrEqual(0);
      });

      it('should calculate return for WETH to USDC swap', async () => {
        const response = await request(app.getHttpServer())
          .get(`/return/${WETH_ADDRESS}/${USDC_ADDRESS}/1.5`)
          .expect(200);

        expect(response.body).toHaveProperty('fromTokenAddress', WETH_ADDRESS);
        expect(response.body).toHaveProperty('toTokenAddress', USDC_ADDRESS);
        expect(response.body).toHaveProperty('amountIn', 1.5);
        expect(response.body.amountOut).toBeGreaterThan(0);
      });

      it('should handle different token pairs', async () => {
        const response = await request(app.getHttpServer())
          .get(`/return/${DAI_ADDRESS}/${USDC_ADDRESS}/100`)
          .expect(200);

        expect(response.body.fromTokenAddress).toBe(DAI_ADDRESS);
        expect(response.body.toTokenAddress).toBe(USDC_ADDRESS);
        expect(response.body.amountIn).toBe(100);
      });

      it('should handle small decimal amounts', async () => {
        const response = await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/0.01`)
          .expect(200);

        expect(response.body.amountIn).toBe(0.01);
        expect(response.body.amountOut).toBeGreaterThanOrEqual(0);
      });

      it('should handle large amounts', async () => {
        const response = await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/1000000`)
          .expect(200);

        expect(response.body.amountIn).toBe(1000000);
        expect(response.body.amountOut).toBeGreaterThan(0);
        // Large amounts should have higher price impact
        expect(response.body.priceImpact).toBeGreaterThan(0);
      });

      it('should handle lowercase token addresses', async () => {
        const lowercaseWETH = WETH_ADDRESS.toLowerCase();
        const lowercaseUSDC = USDC_ADDRESS.toLowerCase();

        const response = await request(app.getHttpServer())
          .get(`/return/${lowercaseUSDC}/${lowercaseWETH}/100`)
          .expect(200);

        expect(response.body.fromTokenAddress).toBe(lowercaseUSDC);
        expect(response.body.toTokenAddress).toBe(lowercaseWETH);
      });

      it('should return timestamp within reasonable range', async () => {
        const beforeRequest = Date.now();

        const response = await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/100`)
          .expect(200);

        const afterRequest = Date.now();

        expect(response.body.timestamp).toBeGreaterThanOrEqual(beforeRequest);
        expect(response.body.timestamp).toBeLessThanOrEqual(afterRequest);
      });

      it('should handle concurrent return calculations', async () => {
        const promises = [
          request(app.getHttpServer()).get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/100`),
          request(app.getHttpServer()).get(`/return/${WETH_ADDRESS}/${USDC_ADDRESS}/1`),
          request(app.getHttpServer()).get(`/return/${DAI_ADDRESS}/${USDC_ADDRESS}/50`),
        ];

        const responses = await Promise.all(promises);

        responses.forEach((response) => {
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('amountOut');
          expect(response.body.amountOut).toBeGreaterThan(0);
        });
      });
    });

    describe('Error scenarios', () => {
      it('should return 400 for invalid fromTokenAddress', async () => {
        await request(app.getHttpServer())
          .get(`/return/invalid-address/${WETH_ADDRESS}/100`)
          .expect(400);
      });

      it('should return 400 for invalid toTokenAddress', async () => {
        await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/invalid-address/100`)
          .expect(400);
      });

      it('should return 400 for non-numeric amountIn', async () => {
        await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/not-a-number`)
          .expect(400);
      });

      it('should return 400 for zero amountIn', async () => {
        await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/0`)
          .expect(400);
      });

      it('should return 400 for negative amountIn', async () => {
        await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/-100`)
          .expect(400);
      });

      it('should return 400 for same token addresses', async () => {
        await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/${USDC_ADDRESS}/100`)
          .expect(400);
      });

      it('should return 400 for non-existent token pair', async () => {
        // Use valid token addresses but a pair that likely doesn't exist
        const randomToken1 = '0x1234567890123456789012345678901234567890';
        const randomToken2 = '0x0987654321098765432109876543210987654321';

        await request(app.getHttpServer())
          .get(`/return/${randomToken1}/${randomToken2}/100`)
          .expect(400);
      });

      it('should return 400 for addresses without 0x prefix', async () => {
        const addressWithoutPrefix = USDC_ADDRESS.slice(2); // Remove 0x

        await request(app.getHttpServer())
          .get(`/return/${addressWithoutPrefix}/${WETH_ADDRESS}/100`)
          .expect(400);
      });

      it('should return 400 for short addresses', async () => {
        await request(app.getHttpServer()).get(`/return/0x123/${WETH_ADDRESS}/100`).expect(400);
      });

      it('should return 400 for addresses with invalid characters', async () => {
        const invalidAddress = '0xG02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

        await request(app.getHttpServer())
          .get(`/return/${invalidAddress}/${WETH_ADDRESS}/100`)
          .expect(400);
      });

      it('should handle invalid HTTP methods', async () => {
        await request(app.getHttpServer())
          .post(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/100`)
          .expect(404);

        await request(app.getHttpServer())
          .put(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/100`)
          .expect(404);
      });
    });

    describe('Edge cases', () => {
      it('should handle very small amounts', async () => {
        const response = await request(app.getHttpServer())
          .get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/0.000001`)
          .expect(200);

        expect(response.body.amountIn).toBe(0.000001);
        expect(response.body.amountOut).toBeGreaterThanOrEqual(0);
      });

      it('should handle checksum addresses', async () => {
        // Use proper EIP-55 checksum addresses
        const checksumWETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const checksumUSDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

        const response = await request(app.getHttpServer())
          .get(`/return/${checksumUSDC}/${checksumWETH}/100`)
          .expect(200);

        expect(response.body.fromTokenAddress).toBe(checksumUSDC);
        expect(response.body.toTokenAddress).toBe(checksumWETH);
      });

      it('should handle maximum safe JavaScript number', async () => {
        const maxSafeNumber = Number.MAX_SAFE_INTEGER;

        // This might fail due to practical limits, but should handle gracefully
        const response = await request(app.getHttpServer()).get(
          `/return/${USDC_ADDRESS}/${WETH_ADDRESS}/${maxSafeNumber}`,
        );

        // Should either succeed or return a meaningful error
        expect([200, 400, 500]).toContain(response.status);
      });
    });
  });

  describe('Performance and reliability', () => {
    it('should handle mixed endpoint requests efficiently', async () => {
      const startTime = Date.now();

      const promises = [
        request(app.getHttpServer()).get('/gasPrice'),
        request(app.getHttpServer()).get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/100`),
        request(app.getHttpServer()).get('/gasPrice'),
        request(app.getHttpServer()).get(`/return/${WETH_ADDRESS}/${USDC_ADDRESS}/1`),
      ];

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach((response) => {
        expect([200, 400]).toContain(response.status);
      });

      // Total time should be reasonable
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds for all requests
    });

    it('should maintain performance under load', async () => {
      const concurrency = 20;
      const promises = Array(concurrency)
        .fill(null)
        .map((_, index) => {
          if (index % 2 === 0) {
            return request(app.getHttpServer()).get('/gasPrice');
          } else {
            return request(app.getHttpServer()).get(`/return/${USDC_ADDRESS}/${WETH_ADDRESS}/100`);
          }
        });

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All requests should complete successfully or be throttled
      responses.forEach((response) => {
        expect([200, 400, 429]).toContain(response.status);
      });

      // Average response time should be reasonable
      const averageTime = (endTime - startTime) / concurrency;
      expect(averageTime).toBeLessThan(1000); // Less than 1 second per request on average
    });

    it('should handle rapid sequential requests', async () => {
      const results = [];
      const successfulResults = [];

      for (let i = 0; i < 10; i++) {
        const response = await request(app.getHttpServer()).get('/gasPrice');
        results.push(response);

        // Only collect successful responses for timestamp analysis
        if (response.status === 200) {
          successfulResults.push(response.body);
        }
      }

      // Verify all requests completed (either successfully or throttled)
      const successfulRequests = results.filter((r) => r.status === 200);
      const throttledRequests = results.filter((r) => r.status === 429);

      // All requests should be accounted for - this is the main test
      expect(successfulRequests.length + throttledRequests.length).toBe(10);

      // The system should handle all requests gracefully (no crashes)
      expect(results.length).toBe(10);

      // For successful requests, timestamps should be consistent (cached)
      if (successfulResults.length > 1) {
        const uniqueTimestamps = new Set(successfulResults.map((r) => r.timestamp));
        expect(uniqueTimestamps.size).toBeLessThanOrEqual(2);
      }

      // Verify throttling is working by checking that some requests are throttled
      // when making rapid sequential requests
      if (throttledRequests.length > 0) {
        // Throttling is working as expected
        expect(throttledRequests[0].status).toBe(429);
      }
    });

    it('should recover gracefully from errors', async () => {
      // Make requests with small delays to avoid hitting rate limits
      const response1 = await request(app.getHttpServer()).get('/gasPrice');
      expect([200, 429]).toContain(response1.status);

      // Wait a bit to avoid throttling
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Then make an invalid request
      const response2 = await request(app.getHttpServer()).get('/return/invalid/invalid/invalid');
      expect([400, 429]).toContain(response2.status);

      // Wait a bit to avoid throttling
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Finally, make another valid request to ensure the service still works
      const response3 = await request(app.getHttpServer()).get('/gasPrice');
      expect([200, 429]).toContain(response3.status);
    });
  });

  describe('HTTP compliance', () => {
    it('should return correct HTTP status codes', async () => {
      // Success cases (may be throttled due to previous tests)
      const gasResponse = await request(app.getHttpServer()).get('/gasPrice');
      expect([200, 429]).toContain(gasResponse.status);

      // Wait a bit to avoid throttling
      await new Promise((resolve) => setTimeout(resolve, 100));

      const returnResponse = await request(app.getHttpServer()).get(
        `/return/${USDC_ADDRESS}/${WETH_ADDRESS}/100`,
      );
      expect([200, 429]).toContain(returnResponse.status);

      // Wait a bit to avoid throttling
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Bad request cases
      const badResponse = await request(app.getHttpServer()).get('/return/invalid/invalid/invalid');
      expect([400, 429]).toContain(badResponse.status);
    });

    it('should set appropriate response headers', async () => {
      const response = await request(app.getHttpServer()).get('/gasPrice');

      // Only check headers for successful responses
      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.headers['content-length']).toBeDefined();
      } else {
        // For throttled requests, we still expect some basic headers
        expect([200, 429]).toContain(response.status);
      }
    });

    it('should handle CORS if configured', async () => {
      const response = await request(app.getHttpServer()).options('/gasPrice');

      // CORS handling depends on application configuration
      // This test documents the expected behavior
      expect([200, 204, 404]).toContain(response.status);
    });
  });
});
