# IAM user for GitHub Actions
resource "aws_iam_user" "github_actions" {
  name = "github-actions-deployer"
  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for GitHub Actions
resource "aws_iam_policy" "github_actions" {
  name = "github-actions-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # AWS Gateway
          "apigateway:DELETE",
          "apigateway:GET",
          "apigateway:PATCH",
          "apigateway:POST",
          "apigateway:PUT",
          
          # CloudFront
          "cloudfront:GetCachePolicy",
          "cloudfront:GetDistribution",
          "cloudfront:GetOriginAccessControl",
          "cloudfront:GetResponseHeadersPolicy",
          "cloudfront:ListTagsForResource",
          
          # DynamoDB - Terraform state locks + App Tables
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:CreateTable", 
          "dynamodb:DeleteItem",
          "dynamodb:DeleteTable",
          "dynamodb:DescribeContinuousBackups",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeTableReplicaAutoScaling",
          "dynamodb:DescribeTimeToLive",
          "dynamodb:GetItem",
          "dynamodb:ListTagsOfResource",
          "dynamodb:ListTables",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
				  "dynamodb:TagResource",
				  "dynamodb:UpdateContinuousBackups",
          "dynamodb:UpdateItem",
          "dynamodb:UpdateTable",
          
          # IAM
          "iam:CreatePolicy",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicyVersion",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:GetUser",
          "iam:GetUserPolicy",
          "iam:ListAccessKeys",
          "iam:ListAttachedRolePolicies",
          "iam:ListAttachedUserPolicies",
          "iam:ListPolicyVersions",
          "iam:ListRolePolicies",
          "iam:ListRoles",
          "iam:ListUsers",
          "iam:PassRole",
          
          # Lambda functions
          "lambda:GetFunction",
          "lambda:GetFunctionCodeSigningConfig",
          "lambda:GetFunctionConfiguration",
          "lambda:GetPolicy",
          "lambda:ListFunctions",
          "lambda:ListVersionsByFunction",
          "lambda:PublishVersion",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          
          # S3 - Terraform state bucket + App buckets
          "s3:DeleteObject",
          "s3:GetAccelerateConfiguration",
          "s3:GetBucketAcl",
          "s3:GetBucketCORS",
          "s3:GetBucketLocation",
          "s3:GetBucketLogging",
          "s3:GetBucketObjectLockConfiguration",
          "s3:GetBucketPolicy",
          "s3:GetBucketPublicAccessBlock",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketTagging",
          "s3:GetBucketVersioning",
          "s3:GetBucketWebsite",
          "s3:GetEncryptionConfiguration",
          "s3:GetLifecycleConfiguration",
          "s3:GetObject",
          "s3:GetReplicationConfiguration",
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = [
          # Api Gateway
          aws_api_gateway_rest_api.api.arn,
          "${aws_api_gateway_rest_api.api.arn}/*",
          "${aws_api_gateway_rest_api.api.execution_arn}/*",
          "arn:aws:apigateway:${var.aws_region}::/account",
          # CloudFront
          aws_cloudfront_cache_policy.website.arn,
          aws_cloudfront_distribution.website.arn,
          aws_cloudfront_origin_access_control.website.arn,
          aws_cloudfront_response_headers_policy.website.arn,
          # DynamoDB table
          aws_dynamodb_table.app_table.arn,
          "${aws_dynamodb_table.app_table.arn}/index/*",
          # Frontend
          aws_iam_policy.frontend_deployment.arn,
          aws_iam_user.frontend_ci.arn,
          # IAM resources
          aws_iam_role.api_gateway_cloudwatch.arn,
          aws_iam_role.lambda_role.arn,
          aws_iam_user.github_actions.arn,
          "arn:aws:iam::${var.aws_account_id}:policy/github-actions-policy",
          # Lambda functions + role
          aws_lambda_function.color_service.arn,
          "${aws_lambda_function.color_service.arn}:*",
          # Lambda functions bucket
          aws_s3_bucket.functions_bucket.arn,
          "${aws_s3_bucket.functions_bucket.arn}/*",
          # Terraform state bucket
          "arn:aws:s3:::awsplayground-terraform-state",
          "arn:aws:s3:::awsplayground-terraform-state/*",
          # Terraform state locking table
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/awsplayground-terraform-locks",
          # Website bucket
          aws_s3_bucket.website.arn,
          "${aws_s3_bucket.website.arn}/*"
        ]
      }
    ]
  })
}

# Attach policy to user
resource "aws_iam_user_policy_attachment" "github_actions" {
  user       = aws_iam_user.github_actions.name
  policy_arn = aws_iam_policy.github_actions.arn
}

# Create access key for the user
resource "aws_iam_access_key" "github_actions" {
  user = aws_iam_user.github_actions.name
}

# Output the access key and secret (only shown once when created)
output "github_actions_access_key" {
  description = "The access key for GitHub Actions"
  value       = aws_iam_access_key.github_actions.id
  sensitive   = true
}

output "github_actions_secret_key" {
  description = "The secret key for GitHub Actions"
  value       = aws_iam_access_key.github_actions.secret
  sensitive   = true
} 