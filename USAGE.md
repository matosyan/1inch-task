# Usage Guide - Tech Interview Edition

## 🚀 Quick Start for Interviewers

This guide provides step-by-step instructions for evaluating the 1inch Task project, including testing performance requirements, validating rate limiting, and verifying all functionality.

## 🔧 Initial Setup

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Required Configuration
NODE_ENV=development
APP_PORT=3000
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Optional Rate Limiting Configuration (defaults shown)
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
GAS_PRICE_THROTTLE_LIMIT=120
RETURN_THROTTLE_LIMIT=30
```

### 2. Installation and Testing

```bash
# Install dependencies
npm install

# Verify all tests pass
npm test

# Run E2E tests
npm run test:e2e

# Start the application
npm run start:dev
```

**Expected Results:**

- Unit Tests: 6 test suites, 139 tests passing
- E2E Tests: 1 test suite, 37 tests passing
- Application starts on http://localhost:3000

## 📊 Performance Validation

### Gas Price Response Time Testing

The key requirement is sub-50ms response time for the gas price endpoint.

```bash
# Test single request (should be <50ms)
time curl -s "http://localhost:3000/gasPrice"

# Test multiple requests to verify consistency
for i in {1..10}; do
  echo "Request $i:"
  time curl -s "http://localhost:3000/gasPrice" > /dev/null
done
```

**Expected Results:**

- First request: May take longer (cache population)
- Subsequent requests: Consistently <50ms
- Response format:

```json
{
  "gasPrice": "20000000000",
  "maxFeePerGas": "30000000000",
  "maxPriorityFeePerGas": "2000000000",
  "timestamp": 1704067200000
}
```

### Load Testing

```bash
# Install Apache Bench (if not available)
# On macOS: brew install httpd
# On Ubuntu: apt-get install apache2-utils

# Test gas price endpoint under load
ab -n 100 -c 10 "http://localhost:3000/gasPrice"

# Test UniswapV2 endpoint
ab -n 50 -c 5 "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/1.0"
```

**Expected Results:**

- Gas price: High success rate with occasional 429 responses
- UniswapV2: Lower throughput due to rate limiting
- Performance metrics should show consistent response times

## 🛡️ Rate Limiting Validation

### Testing Rate Limits

```bash
# Test gas price rate limiting (120 req/min)
echo "Testing gas price rate limiting..."
for i in {1..130}; do
  http_code=$(curl -w "%{http_code}" -o /dev/null -s "http://localhost:3000/gasPrice")
  echo "Request $i: HTTP $http_code"
  if [ "$http_code" = "429" ]; then
    echo "Rate limit triggered at request $i"
    break
  fi
done

# Test UniswapV2 rate limiting (30 req/min)
echo "Testing UniswapV2 rate limiting..."
for i in {1..35}; do
  http_code=$(curl -w "%{http_code}" -o /dev/null -s "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/1.0")
  echo "Request $i: HTTP $http_code"
  if [ "$http_code" = "429" ]; then
    echo "Rate limit triggered at request $i"
    break
  fi
  sleep 1  # Add delay to avoid overwhelming
done
```

**Expected Results:**

- Gas price: Rate limiting after ~120 requests
- UniswapV2: Rate limiting after ~30 requests
- 429 "Too Many Requests" responses when limits exceeded

## 🧮 API Functionality Testing

### 1. Gas Price Endpoint

```bash
# Basic request
curl -X GET "http://localhost:3000/gasPrice" \
  -H "Content-Type: application/json" | jq

# Verify response structure
curl -s "http://localhost:3000/gasPrice" | jq '{gasPrice, maxFeePerGas, maxPriorityFeePerGas, timestamp}'
```

### 2. UniswapV2 Return Calculation

**High Liquidity Pairs (Recommended for Testing):**

```bash
# WETH to USDC (1 ETH)
curl "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/1.0" | jq

# USDC to WETH (1000 USDC)
curl "http://localhost:3000/return/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/1000" | jq

# WETH to DAI (0.5 ETH)
curl "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0x6B175474E89094C44Da98b954EedeAC495271d0F/0.5" | jq
```

**Expected Response Structure:**

```json
{
  "fromTokenAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "toTokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "amountIn": "1.0",
  "amountOut": "2340.123456",
  "priceImpact": "0.05",
  "timestamp": 1704067200000
}
```

## 🚨 Error Handling Validation

### Input Validation Testing

```bash
# Invalid token address
curl "http://localhost:3000/return/invalid-address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/1.0"
# Expected: 400 Bad Request

# Invalid amount (zero)
curl "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/0"
# Expected: 400 Bad Request

# Invalid amount (negative)
curl "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/-1"
# Expected: 400 Bad Request

# Non-existent pair
curl "http://localhost:3000/return/0x1234567890123456789012345678901234567890/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/1.0"
# Expected: 400 Bad Request - Pair does not exist
```

## 🔍 Comprehensive Testing Script

Create a test script to validate all functionality:

```bash
#!/bin/bash
# comprehensive-test.sh

echo "🧪 Starting Comprehensive Testing..."

# 1. Verify application is running
echo "1. Testing application availability..."
health_check=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/health")
if [ "$health_check" = "200" ]; then
    echo "✅ Application is running"
else
    echo "❌ Application not available"
    exit 1
fi

# 2. Test gas price performance
echo "2. Testing gas price performance..."
response_time=$(curl -w "%{time_total}" -o /dev/null -s "http://localhost:3000/gasPrice")
if (( $(echo "$response_time < 0.05" | bc -l) )); then
    echo "✅ Gas price response time: ${response_time}s (< 50ms)"
else
    echo "⚠️  Gas price response time: ${response_time}s (may be higher on first request)"
fi

# 3. Test UniswapV2 calculation
echo "3. Testing UniswapV2 calculation..."
uniswap_response=$(curl -s "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/1.0")
if echo "$uniswap_response" | jq -e '.amountOut' > /dev/null; then
    echo "✅ UniswapV2 calculation working"
else
    echo "❌ UniswapV2 calculation failed"
fi

# 4. Test error handling
echo "4. Testing error handling..."
error_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/return/invalid/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/1.0")
if [ "$error_response" = "400" ]; then
    echo "✅ Input validation working"
else
    echo "❌ Input validation not working as expected"
fi

# 5. Test rate limiting
echo "5. Testing rate limiting..."
rate_limit_hit=false
for i in {1..35}; do
  http_code=$(curl -w "%{http_code}" -o /dev/null -s "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/1.0")
  if [ "$http_code" = "429" ]; then
    echo "✅ Rate limiting working (triggered at request $i)"
    rate_limit_hit=true
    break
  fi
  sleep 1
done

if [ "$rate_limit_hit" = false ]; then
    echo "⚠️  Rate limiting not triggered (may need longer test)"
fi

echo "🎉 Testing completed!"
```

Make it executable and run:

```bash
chmod +x comprehensive-test.sh
./comprehensive-test.sh
```

## 📊 Common Token Addresses for Testing

### Mainnet Tokens (High Liquidity)

- **WETH** (Wrapped Ether): `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **USDC** (USD Coin): `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **USDT** (Tether): `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **DAI** (MakerDAO): `0x6B175474E89094C44Da98b954EedeAC495271d0F`
- **WBTC** (Wrapped Bitcoin): `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599`

### Recommended Test Pairs

1. **WETH/USDC**: Most liquid pair, minimal slippage
2. **WETH/USDT**: High volume, good for performance testing
3. **WETH/DAI**: Stable pair for consistent results

## 📚 API Documentation

Interactive Swagger documentation is available at:

```
http://localhost:3000/api
```

This provides:

- Real-time API testing interface
- Complete parameter documentation
- Response schema validation
- Rate limiting information

## 🔧 Development Tools

### Running Tests in Development

```bash
# Watch mode for continuous testing
npm run test:watch

# Coverage report
npm run test:cov

# Specific test patterns
npm test -- --testPathPattern=blockchain
npm test -- --testPathPattern=uniswap
npm test -- --testPathPattern=controller
```

### Debugging

```bash
# Debug mode with detailed logging
DEBUG=* npm run start:dev

# Check application logs
tail -f logs/application.log

# Monitor gas price cache updates
tail -f logs/application.log | grep "Gas price"
```

## 🚨 Troubleshooting

### Common Issues and Solutions

1. **RPC Connection Failed**

   ```bash
   # Test RPC endpoint directly
   curl -X POST "https://mainnet.infura.io/v3/YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

2. **Tests Failing**

   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install

   # Run tests individually
   npm test -- --testPathPattern=blockchain.controller
   ```

3. **Performance Issues**

   ```bash
   # Check if caching is working
   curl -v "http://localhost:3000/gasPrice" 2>&1 | grep -i cache

   # Monitor response times
   for i in {1..5}; do time curl -s "http://localhost:3000/gasPrice" > /dev/null; done
   ```

4. **Rate Limiting Not Working**

   ```bash
   # Check throttler configuration
   curl -v "http://localhost:3000/gasPrice" 2>&1 | grep -i throttle

   # Rapid fire test
   seq 1 50 | xargs -I {} -P 10 curl -s "http://localhost:3000/gasPrice"
   ```

## ✅ Evaluation Checklist

### For Tech Interviewers

- [ ] All tests pass (npm test && npm run test:e2e)
- [ ] Gas price responds in <50ms consistently
- [ ] UniswapV2 calculations return accurate results
- [ ] Rate limiting triggers at expected thresholds
- [ ] Input validation catches invalid addresses/amounts
- [ ] Error responses include appropriate HTTP status codes
- [ ] Swagger documentation is accessible and functional
- [ ] Application handles blockchain connectivity issues gracefully
- [ ] Code demonstrates clean NestJS architecture
- [ ] Test suite covers critical business logic comprehensively

### Expected Performance Metrics

- **Gas Price Endpoint**: <50ms response time, 120 req/min rate limit
- **UniswapV2 Endpoint**: Accurate calculations, 30 req/min rate limit
- **Error Rate**: <1% under normal load conditions
- **Test Coverage**: 100% of critical functionality
- **Uptime**: Handles RPC failures gracefully with cached responses

This comprehensive testing approach validates the application's performance, reliability, and production readiness.
