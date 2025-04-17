# Multi-Tenant Architecture in AWS Serverless

This document outlines the multi-tenant architecture implemented in this project using AWS serverless services. It explains not just what we did, but why we made these specific choices.

## Overview

Our multi-tenant solution uses a combination of AWS services to provide secure, isolated data access for different tenants while maintaining operational efficiency and cost-effectiveness.

### Why Serverless?
- **Cost Efficiency**: Pay only for what you use. No idle resources.
- **Scalability**: Automatic scaling per tenant without manual intervention.
- **Reduced Operational Overhead**: AWS manages the infrastructure.
- **Security**: Built-in AWS security features and isolation.

## Core Components

### 1. Authentication & Authorization

#### Cognito User Pools
- **Why Cognito?**: It's AWS's managed authentication service, handling complex security concerns like token management, password policies, and MFA.
- **Tenant-Specific Pools**: Each tenant gets their own user pool for complete isolation.
- **Custom Attributes**: We use `custom:tenant_id` to identify tenant membership because:
  - It's secure (can't be modified by users)
  - It's automatically included in tokens
  - It's easily accessible in Lambda functions

```yaml
securitySchemes:
  CognitoUserPool:
    type: oauth2
    flows:
      implicit:
        scopes:
          email: Access email
          openid: Access OpenID Connect
          profile: Access profile
          custom:tenant_id: Access tenant ID
```

#### API Gateway Authorizer
- **Why Built-in Authorizer?**: 
  - Validates tokens before they reach your Lambda
  - Reduces Lambda invocations for invalid requests
  - Handles token validation securely
  - Automatically extracts claims into the event object

### 2. Data Isolation

#### DynamoDB
- **Why DynamoDB?**: 
  - Serverless, scales automatically
  - Predictable performance
  - Pay-per-request pricing
  - Strong consistency when needed

- **Key Design**:
  - Partition key: `TENANT#{tenantId}#USER#{userId}`
    - Why? Enables efficient querying of a tenant's data
    - Why the format? Makes it clear in the data what belongs to whom
  - Sort key: `COLOR#{timestamp}`
    - Why? Allows time-based queries within a tenant
    - Why the format? Maintains sort order and query efficiency

- **GSI Usage**:
  - Why use GSIs? Enables efficient querying by tenant without scanning
  - Why not scan? Scans are expensive and slow at scale

#### IAM Roles & Policies
- **Why Tenant-Specific Roles?**
  - Principle of least privilege
  - Prevents cross-tenant access at the IAM level
  - Enables audit logging per tenant

- **Why STS AssumeRole?**
  - Temporary credentials are more secure
  - Can be revoked if needed
  - Limits exposure time of credentials

```hcl
resource "aws_iam_policy" "tenant_dynamodb_policy" {
  policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Action = ["dynamodb:*"]
      Resource = [aws_dynamodb_table.app_table.arn]
      Condition = {
        "ForAllValues:StringLike" = {
          "dynamodb:LeadingKeys" = ["TENANT#${aws_cognito_user_pool.user_pool.id}*"]
        }
      }
    }]
  })
}
```

### 3. Application Layer

#### Lambda Functions
- **Why Stateless?**
  - Better scalability
  - No shared state between tenants
  - Easier to debug and maintain

- **Why Assume Role in Lambda?**
  - Each request gets fresh credentials
  - Credentials are scoped to the specific tenant
  - Follows security best practices

```typescript
async function getTenantCredentials(tenantId: string) {
  const command = new AssumeRoleCommand({
    RoleArn: process.env.TENANT_ROLE_ARN!,
    RoleSessionName: `tenant-${tenantId}`,
    DurationSeconds: 900,  // Why 900? AWS STS minimum session duration
    Tags: [{ Key: 'tenantId', Value: tenantId }]  // For auditing
  });
  // ...
}
```

## Security Considerations

### 1. Tenant Isolation
- **Why Multiple Layers?**
  - Defense in depth
  - IAM prevents accidental access
  - Application code prevents intentional abuse
  - DynamoDB design prevents data leakage

### 2. Error Handling
- **Why Specific Error Types?**
  - Better debugging
  - Clearer error messages for clients
  - Enables specific handling in the UI
  - Helps with monitoring and alerting

```typescript
interface AuthorizationError {
  statusCode: number;
  message: string;
  errorType: 'INVALID_TENANT_ID' | 'MISSING_TENANT_ID' | 'UNAUTHORIZED_ACCESS';
}
```

### 3. Best Practices
- **Why These Practices?**
  - Security: Never trust client input
  - Reliability: Validate everything
  - Maintainability: Clear error handling
  - Auditability: Proper logging

## Implementation Patterns

### 1. Request Flow
1. User authenticates with Cognito
   - Why first? Prevents unauthorized access early
2. API Gateway validates token
   - Why here? Reduces Lambda invocations
3. Lambda extracts tenant context
   - Why extract? Single source of truth
4. STS assumes tenant role
   - Why here? Just-in-time credentials
5. DynamoDB operations with tenant isolation
   - Why last? All security checks complete

### 2. Data Access Pattern
```typescript
class DynamoDbConnector {
  private generatePartitionKey(tenantId: string, userId: string): string {
    return `TENANT#${tenantId}#USER#${userId}`;
    // Why this method? Centralizes key generation
    // Why private? Prevents accidental misuse
  }
}
```

## Scaling Considerations

### 1. Performance
- **Why GSIs?**
  - Efficient querying
  - No table scans
  - Predictable performance

- **Why Partitioning?**
  - Even data distribution
  - Prevents hot partitions
  - Better scalability

### 2. Cost Optimization
- **Why Shared Infrastructure?**
  - Lower costs
  - Easier management
  - Better resource utilization

### 3. Operational Excellence
- **Why Tenant Context in Logs?**
  - Easier debugging
  - Better monitoring
  - Compliance requirements

## Future Considerations

### 1. Feature Enhancements
- **Why These Features?**
  - Tenant-specific needs
  - Administrative requirements
  - Operational efficiency

### 2. Scaling Strategies
- **Why These Strategies?**
  - Handle growth
  - Maintain performance
  - Control costs

### 3. Security Enhancements
- **Why These Enhancements?**
  - Evolving threats
  - Compliance requirements
  - Better visibility

## Conclusion

This architecture was chosen because it:
- Provides strong security through multiple layers
- Scales efficiently with tenant growth
- Maintains clear separation of concerns
- Follows AWS best practices
- Enables future growth and enhancements

Each decision was made considering:
- Security implications
- Performance impact
- Cost effectiveness
- Operational overhead
- Future maintainability