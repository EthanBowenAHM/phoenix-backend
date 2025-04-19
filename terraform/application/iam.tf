# Tenant-specific IAM role
resource "aws_iam_role" "tenant_role" {
  name = "${var.project_name}-${var.environment}-tenant-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Tenant-specific DynamoDB access policy
resource "aws_iam_policy" "tenant_dynamodb_policy" {
  name = "${var.project_name}-${var.environment}-tenant-dynamodb-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.app_table.arn,
          "${aws_dynamodb_table.app_table.arn}/index/*"
        ]
        Condition = {
          "ForAllValues:StringLike" = {
            "dynamodb:LeadingKeys" = ["TENANT#${aws_cognito_user_pool.user_pool.id}*"]
          }
        }
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "tenant_dynamodb" {
  role       = aws_iam_role.tenant_role.name
  policy_arn = aws_iam_policy.tenant_dynamodb_policy.arn
}

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-${var.environment}-lambda-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Lambda execution policy
resource "aws_iam_policy" "lambda_execution" {
  name = "${var.project_name}-${var.environment}-lambda-execution"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sts:AssumeRole"
        ]
        Resource = aws_iam_role.tenant_role.arn
      }
    ]
  })
}

# Attach execution policy to role
resource "aws_iam_role_policy_attachment" "lambda_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_execution.arn
} 