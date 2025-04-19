# Lambda Function
# Color Service Lambda Function
resource "aws_lambda_function" "color_service" {
  filename         = data.archive_file.color_service_zip.output_path
  function_name    = "${var.project_name}-${var.service_name}-${var.environment}"
  role            = aws_iam_role.color_service_lambda_role.arn
  handler         = "functions/colorService/handler.handler"
  runtime         = "nodejs20.x"
  source_code_hash = data.archive_file.color_service_zip.output_base64sha256
  timeout         = 30
  memory_size     = 128
  publish         = true

  kms_key_arn = data.aws_kms_alias.lambda.target_key_arn

  vpc_config {
    subnet_ids         = data.terraform_remote_state.networking.outputs.private_subnet_ids
    security_group_ids = [data.terraform_remote_state.networking.outputs.lambda_security_group_id]
  }

  environment {
    variables = {
      TABLE_NAME  = aws_dynamodb_table.app_table.name
      WEBSITE_URL = "https://${aws_cloudfront_distribution.website.domain_name}"
      DEBUG       = "*"
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy.color_service_lambda_policy
  ]
}

# Lambda ZIP Archive
data "archive_file" "color_service_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../dist"
  output_path = "${path.module}/../../dist/${var.service_name}.zip"
  excludes    = ["${var.service_name}.zip"]
}

# Lambda IAM Role
resource "aws_iam_role" "color_service_lambda_role" {
  name = "${var.project_name}-${var.service_name}-${var.environment}-lambda-role"

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

# KMS Key Data Source
data "aws_kms_alias" "lambda" {
  name = "alias/aws/lambda"
}

# Lambda IAM Policy
resource "aws_iam_role_policy" "color_service_lambda_policy" {
  name = "${var.project_name}-${var.service_name}-${var.environment}-lambda-policy"
  role = aws_iam_role.color_service_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.app_table.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.app_table.arn,
          "${aws_dynamodb_table.app_table.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          # Building log group name to prevent circular dependency
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-${var.service_name}-${var.environment}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })
}

# # Auth Service Lambda Function
# resource "aws_lambda_function" "auth_service" {
#   filename         = "auth-service.zip"
#   function_name    = "${var.project_name}-${var.environment}-auth-service"
#   role             = aws_iam_role.auth_service_lambda_role.arn
#   handler          = "auth_service.handler"
#   runtime          = "nodejs20.x"
#   source_code_hash = data.archive_file.auth_service_zip.output_base64sha256
#   timeout          = 30
#   memory_size      = 128
#   publish         = true
#
#   kms_key_arn = data.aws_kms_alias.lambda.target_key_arn
#
#   vpc_config {
#     subnet_ids         = data.terraform_remote_state.networking.outputs.private_subnet_ids
#     security_group_ids = [data.terraform_remote_state.networking.outputs.lambda_security_group_id]
#   }
# 
#   environment {
#     variables = {
#       USER_POOL_ID = aws_cognito_user_pool.user_pool.id
#       CLIENT_ID    = aws_cognito_user_pool_client.client.id
#     }
#   }
#
#   tags = local.common_tags
#
#   depends_on = [
#     aws_iam_role_policy.auth_service_lambda_policy
#   ]
# }

# # Lambda ZIP Archive
# data "archive_file" "auth_service_zip" {
#   type        = "zip"
#   source_dir  = "${path.module}/../../dist"
#   output_path = "${path.module}/../../dist/auth_service.zip"
#   excludes    = ["auth_service.zip"]
# }


# # Lambda IAM Role
# resource "aws_iam_role" "auth_service_lambda_role" {
#   name = "${var.project_name}-auth-service-${var.environment}-lambda-role"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "lambda.amazonaws.com"
#         }
#       }
#     ]
#   })

#   tags = local.common_tags
# }

# # Lambda IAM Policy
# resource "aws_iam_role_policy" "auth_service_lambda_policy" {
#   name = "${var.project_name}-auth-service-${var.environment}-lambda-policy"
#   role = aws_iam_role.color_service_lambda_role.id

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "cognito-idp:*" # TODO: apply principal of least privilege
#         ]
#         Resource = [
#           aws_cognito_user_pool.user_pool.arn,
#           "${aws_cognito_user_pool.user_pool.arn}/*",
#           aws_cognito_user_pool_client.client.arn,
#           "${aws_cognito_user_pool_client.client.arn}/*"
#         ]
#       },
#       {
#         Effect = "Allow"
#         Action = [
#           "logs:CreateLogGroup",
#           "logs:CreateLogStream",
#           "logs:PutLogEvents"
#         ]
#         Resource = [
#           # Building log group name to prevent circular dependency
#           "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-auth-service-${var.environment}:*"
#         ]
#       },
#       {
#         Effect = "Allow"
#         Action = [
#           "ec2:CreateNetworkInterface",
#           "ec2:DescribeNetworkInterfaces",
#           "ec2:DeleteNetworkInterface",
#           "ec2:AssignPrivateIpAddresses",
#           "ec2:UnassignPrivateIpAddresses"
#         ]
#         Resource = "*"
#       }
#     ]
#   })
#}

resource "aws_lambda_function" "submit_color" {
  filename         = "${path.module}/../../dist/functions/submitColor/handler.zip"
  function_name    = "${var.project_name}-${var.environment}-submit-color"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "handler.handler"
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.app_table.name
      TENANT_ROLE_ARN = aws_iam_role.tenant_role.arn
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "search_colors" {
  filename         = "${path.module}/../../dist/functions/searchColors/handler.zip"
  function_name    = "${var.project_name}-${var.environment}-search-colors"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "handler.handler"
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.app_table.name
      TENANT_ROLE_ARN = aws_iam_role.tenant_role.arn
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_permission" "submit_color" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_color.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "search_colors" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_colors.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}