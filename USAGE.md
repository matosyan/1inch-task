# Usage Guide

## Setting Up the Application

1. **Install dependencies**:

```bash
npm install
```

2. **Configure environment variables**:
   Create a `.env` file in the root directory:

```bash
NODE_ENV=development
APP_PORT=3000
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
GAS_PRICE_CACHE_DURATION=10000
```

3. **Start the application**:

```bash
npm run start:dev
```

## API Examples

### 1. Gas Price Endpoint

**Request**:

```bash
curl -X GET "http://localhost:3000/gasPrice" \
  -H "Content-Type: application/json"
```

**Response**:

```json
{
  "gasPrice": "20000000000",
  "maxFeePerGas": "30000000000",
  "maxPriorityFeePerGas": "2000000000",
  "timestamp": 1704067200000
}
```

### 2. UniswapV2 Return Calculation

**Example 1: USDC to WETH**

```bash
curl -X GET "http://localhost:3000/return/0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/1000" \
  -H "Content-Type: application/json"
```

**Example 2: WETH to USDC**

```bash
curl -X GET "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20/1.5" \
  -H "Content-Type: application/json"
```

**Response**:

```json
{
  "fromTokenAddress": "0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20",
  "toTokenAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "amountIn": "1000",
  "amountOut": "0.456789123456",
  "priceImpact": "0.12",
  "timestamp": 1704067200000
}
```

## Common Token Addresses

### Mainnet Tokens

- **WETH**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **USDC**: `0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20`
- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **DAI**: `0x6B175474E89094C44Da98b954EedeAC495271d0F`
- **WBTC**: `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599`

## Testing with Popular Pairs

### High Liquidity Pairs

1. **WETH/USDC**: Very liquid, low slippage
2. **WETH/USDT**: High volume pair
3. **WETH/DAI**: Stable pair for testing

### Example Commands

```bash
# Test WETH to USDC swap
curl "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20/1.0"

# Test USDC to WETH swap
curl "http://localhost:3000/return/0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/1000"

# Test gas price
curl "http://localhost:3000/gasPrice"
```

## Error Handling Examples

### Invalid Address

```bash
curl "http://localhost:3000/return/invalid-address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/1.0"
```

Response: `400 Bad Request - Invalid token addresses`

### Pair Not Found

```bash
curl "http://localhost:3000/return/0x1234567890123456789012345678901234567890/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/1.0"
```

Response: `400 Bad Request - Pair does not exist`

### Invalid Amount

```bash
curl "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20/0"
```

Response: `400 Bad Request - Amount in must be greater than 0`

## Performance Testing

### Gas Price Response Time

```bash
# Time the gas price endpoint
time curl -s "http://localhost:3000/gasPrice" > /dev/null
```

Should consistently return in under 50ms due to caching.

### Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test gas price endpoint
ab -n 1000 -c 10 "http://localhost:3000/gasPrice"

# Test UniswapV2 calculation
ab -n 100 -c 5 "http://localhost:3000/return/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20/1.0"
```

## Monitoring

### Health Check

```bash
curl "http://localhost:3000/health"
```

### Logs

```bash
# View application logs
npm run start:dev

# Check gas price cache updates
tail -f logs/application.log | grep "Gas price updated"
```

## Development Mode

### Swagger Documentation

Visit `http://localhost:3000/api` to access the interactive API documentation.

### Debug Mode

```bash
DEBUG=* npm run start:dev
```

## Production Deployment

### Docker

```bash
# Build image
docker build -t blockchain-api .

# Run container
docker run -p 3000:3000 --env-file .env blockchain-api
```

### Environment Variables for Production

```bash
NODE_ENV=production
APP_PORT=3000
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PRODUCTION_KEY
GAS_PRICE_CACHE_DURATION=10000
```

## Troubleshooting

### Common Issues

1. **RPC Connection Failed**
   - Check ETHEREUM_RPC_URL is correct
   - Verify API key is active
   - Test RPC endpoint directly

2. **Pair Not Found**
   - Ensure both tokens exist on Ethereum mainnet
   - Check if UniswapV2 pair exists
   - Verify token addresses are correct

3. **Slow Response Times**
   - Check network connectivity
   - Verify RPC provider performance
   - Monitor gas price cache status

4. **Build Errors**
   - Run `npm install` to ensure dependencies
   - Check Node.js version (v18+ required)
   - Verify TypeScript configuration
