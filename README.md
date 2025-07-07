# 1inch Task - Blockchain API

A NestJS application that provides two main endpoints for Ethereum blockchain interaction:

- Gas Price information with sub-50ms response time
- UniswapV2 return amount calculation using off-chain mathematics

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Ethereum RPC endpoint (Infura, Alchemy, or QuickNode)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

```bash
# Ethereum RPC Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Application Configuration
NODE_ENV=development
APP_PORT=3000
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 📊 API Endpoints

### 1. Gas Price Endpoint

**GET** `/gasPrice`

Returns current Ethereum gas price information with guaranteed response time under 50ms.

#### Response Example

```json
{
  "gasPrice": "20000000000",
  "maxFeePerGas": "30000000000",
  "maxPriorityFeePerGas": "2000000000",
  "timestamp": 1704067200000
}
```

#### Performance Features

- **Caching**: Gas prices are cached and updated every 10 seconds in the background
- **Fallback**: Returns cached data if the blockchain request fails
- **Response Time**: Guaranteed sub-50ms response due to cached data

### 2. UniswapV2 Return Calculation

**GET** `/return/:fromTokenAddress/:toTokenAddress/:amountIn`

Calculates the estimated output amount for a UniswapV2 swap using off-chain mathematics.

#### Parameters

- `fromTokenAddress`: ERC-20 token address (input token)
- `toTokenAddress`: ERC-20 token address (output token)
- `amountIn`: Input amount in human-readable format

#### Example Request

```
GET /return/0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/1.5
```

#### Response Example

```json
{
  "fromTokenAddress": "0xA0b86a33E6441A8E2B34B1c43b3623A20cB5cA20",
  "toTokenAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "amountIn": "1.5",
  "amountOut": "0.000123456789",
  "priceImpact": "0.15",
  "timestamp": 1704067200000
}
```

#### Implementation Details

- **Off-chain Calculation**: Uses UniswapV2 mathematical formula without on-chain calls
- **Accurate Reserves**: Fetches current pair reserves from blockchain
- **Token Decimals**: Handles different token decimal configurations automatically
- **Price Impact**: Calculates and returns price impact percentage
- **Validation**: Comprehensive input validation and error handling

## 🏗️ Architecture

### Core Components

#### BlockchainService

- Manages ethers.js provider connection
- Provides contract interaction utilities
- Handles blockchain connectivity

#### GasPriceService

- Implements caching strategy for gas price data
- Background refresh mechanism
- Fallback handling for network issues

#### UniswapV2Service

- Implements UniswapV2 mathematical calculations
- Handles token pair discovery
- Manages token decimal conversion
- Calculates price impact

#### BlockchainController

- REST API endpoints
- Request validation
- Error handling and logging
- Swagger documentation

### Design Patterns

- **Dependency Injection**: Full NestJS DI container usage
- **Caching Strategy**: Background refresh with fallback
- **Error Handling**: Comprehensive error boundaries
- **Validation**: DTO-based request validation
- **Logging**: Structured logging with context

## 🧮 UniswapV2 Mathematics

The application implements the exact UniswapV2 formula for calculating output amounts:

```
amountOut = (amountIn × 997 × reserveOut) / (reserveIn × 1000 + amountIn × 997)
```

Where:

- `997/1000` factor accounts for the 0.3% trading fee
- `reserveIn`/`reserveOut` are the current token reserves in the pair
- `amountIn` is the input amount (adjusted for token decimals)

### Price Impact Calculation

Price impact is calculated as the percentage change in price caused by the trade:

```
priceImpact = ((priceBefore - priceAfter) / priceBefore) × 100
```

## 🔒 Error Handling

The API includes comprehensive error handling:

- **Invalid Addresses**: Validates Ethereum address format
- **Pair Not Found**: Handles non-existent trading pairs
- **Insufficient Liquidity**: Detects zero reserves
- **Network Errors**: Graceful degradation with cached data
- **Validation Errors**: Clear error messages for invalid inputs

## 📚 API Documentation

When running in development mode, Swagger documentation is available at:

```
http://localhost:3000/api
```

The documentation includes:

- Complete endpoint specifications
- Request/response schemas
- Parameter validation rules
- Example requests and responses

## 🧪 Testing

The application includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run specific test files
npm test -- --testPathPattern=blockchain
```

### Test Categories

- **Unit Tests**: Individual service and controller testing
- **Integration Tests**: Full request/response cycle testing
- **Mock Tests**: Blockchain interaction mocking
- **Performance Tests**: Response time validation

## 🛠️ Development

### Project Structure

```
src/
├── modules/
│   └── blockchain/
│       ├── dto/                    # Data Transfer Objects
│       ├── blockchain.controller.ts # REST API endpoints
│       ├── blockchain.service.ts   # Core blockchain service
│       ├── gas-price.service.ts    # Gas price caching
│       ├── uniswap-v2.service.ts   # UniswapV2 calculations
│       └── blockchain.module.ts    # Module configuration
├── config/
│   └── configuration.ts           # Environment configuration
└── app.module.ts                  # Main application module
```

### Key Dependencies

- **ethers.js**: Ethereum blockchain interaction
- **bignumber.js**: Precise decimal arithmetic
- **class-validator**: Request validation
- **@nestjs/swagger**: API documentation

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Testing framework

## 🚀 Deployment

### Docker Support

```bash
# Build Docker image
docker build -t blockchain-api .

# Run container
docker run -p 3000:3000 --env-file .env blockchain-api
```

### Environment Considerations

- **Production**: Use reliable RPC providers with redundancy
- **Monitoring**: Monitor gas price cache performance
- **Scaling**: Consider Redis for distributed caching
- **Security**: Validate all inputs and rate-limit endpoints

## 📝 Technical Decisions

### Why Off-chain Calculations?

1. **Performance**: No network latency for calculations
2. **Reliability**: Not dependent on blockchain availability
3. **Cost**: No gas fees for read operations
4. **Accuracy**: Uses current reserves for precise calculations

### Why Caching for Gas Prices?

1. **Speed**: Guaranteed sub-50ms response time
2. **Reliability**: Service continues during network issues
3. **Efficiency**: Reduces RPC provider load
4. **User Experience**: Consistent performance

### Technology Choices

- **NestJS**: Enterprise-grade Node.js framework
- **ethers.js**: Modern, well-maintained Ethereum library
- **BigNumber.js**: Prevents floating-point precision issues
- **TypeScript**: Type safety and development productivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
