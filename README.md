# Color Backend

This is the backend service for the Color application, built with TypeScript and AWS Lambda. The API is defined using OpenAPI specifications and generates TypeScript types and interfaces automatically.

## Project Structure

```
phoneix-backend/
├── src/
│   ├── functions/          # Lambda function handlers
│   │   ├── submitColor/    # Color submission function
│   │   └── searchColors/   # Color search function
│   ├── generated/         # Auto-generated types and interfaces
│   └── shared/            # Shared types and utilities
├── tests/                 # Test files
├── terraform/            # Infrastructure as code
└── openapi.yaml         # API specification
```

## Prerequisites

- Node.js 18.x
- AWS CLI configured with appropriate credentials
- Terraform 1.x
- AWS account with necessary permissions

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate TypeScript types (requires specs-generation project):
   ```bash
   cd ../specs-generation
   npm run generate:server
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run type checking:
   ```bash
   npm run type-check
   ```

5. Run tests:
   ```bash
   npm test
   ```

## API Endpoints

### Submit Color
- **Method**: POST
- **Path**: `/colors`
- **Request Body**:
  ```json
  {
    "firstName": "string",
    "phoneix": "string"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "firstName": "string",
      "color": "string",
      "timestamp": "string"
    },
    "statusCode": 201
  }
  ```

### Search Colors
- **Method**: GET
- **Path**: `/colors`
- **Query Parameters**:
  - `firstName` (optional): Filter results by first name
- **Response**:
  ```json
  {
    "data": [
      {
        "firstName": "string",
        "color": "string",
        "timestamp": "string"
      }
    ],
    "statusCode": 200
  }
  ```

## Infrastructure

The backend infrastructure is managed using Terraform and includes:

- Lambda Functions for color submission and search
- API Gateway for HTTP endpoints
- DynamoDB table for data storage
- S3 bucket for static website hosting
- CloudFront distribution for CDN
- WAF for security
- ACM certificate for HTTPS
- Route53 DNS configuration

### Infrastructure Deployment

1. Navigate to the Terraform directory:
   ```bash
   cd terraform
   ```

2. Initialize Terraform:
   ```bash
   terraform init
   ```

3. Deploy infrastructure:
   ```bash
   terraform apply \
     -var="environment=dev" \
     -var="project_name=phoneix" \
     -var="route53_zone_id=your-zone-id"
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TABLE_NAME` | DynamoDB table name |
| `WEBSITE_URL` | Frontend URL for CORS |
| `DEBUG` | Set to enable debug logging (e.g., `DEBUG=*app*`) |

## CI/CD Pipeline

The backend uses GitHub Actions for CI/CD:

1. **Test Job**:
   - Type checking
   - Unit tests
   - Integration tests
   - OpenAPI specification validation

2. **Deploy Job** (main branch only):
   - Generate TypeScript types
   - Build TypeScript
   - Deploy infrastructure with Terraform
   - Update API Gateway

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Debugging

The application uses the [debug](https://www.npmjs.com/package/debug) package for conditional debugging:

- Set `DEBUG=*app*` environment variable to enable debug logs
- Debug output includes timestamps and formatted data
- Works in both local development and Lambda environments

Example local development with debug enabled:
```bash
DEBUG=* npm run dev
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checking
4. Submit a pull request

## License

MIT