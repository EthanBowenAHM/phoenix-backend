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
          # IAM
          "iam:GetRole",
          "iam:GetUser",
          # S3 - Terraform state bucket + App buckets
          "s3:DeleteObject",
          "s3:GetBucketPolicy",
          "s3:GetBucketVersioning",
          "s3:GetEncryptionConfiguration",
          "s3:GetObject",
          "s3:GetBucketPublicAccessBlock",
          "s3:ListBucket",
          "s3:PutObject",
          # Lambda functions  
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          # DynamoDB - Terraform state locks + App Tables
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          # Terraform state bucket
          "arn:aws:s3:::awsplayground-terraform-state",
          "arn:aws:s3:::awsplayground-terraform-state/*",
          # Terraform state locking table
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/awsplayground-terraform-locks",
          # Website bucket
          "${aws_s3_bucket.website.arn}/*",
          aws_s3_bucket.website.arn,
          # Api Gateway
          "${aws_apigatewayv2_api.lambda_api.arn}",
          "${aws_apigatewayv2_api.lambda_api.arn}/*",
          "${aws_apigatewayv2_api.lambda_api.execution_arn}/*",
          # Lambda functions + role
          "${aws_lambda_function.submit_color.arn}",
          "${aws_lambda_function.search_colors.arn}",
          "${aws_iam_role.lambda_exec.arn}"

          # DynamoDB table
          aws_dynamodb_table.app_table.arn
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