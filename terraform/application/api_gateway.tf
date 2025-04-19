# Data source for the OpenAPI spec
locals {
  api_spec = templatefile("${path.module}/../../openapi.yaml", {
    lambda_invoke_arn = aws_lambda_function.color_service.invoke_arn
  })
}

# REST API Gateway with OpenAPI spec
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "Color API Gateway"
}

resource "aws_api_gateway_authorizer" "cognito" {
  name          = "cognito"
  rest_api_id   = aws_api_gateway_rest_api.api.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.user_pool.arn]
}

resource "aws_api_gateway_resource" "colors" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "colors"
}

resource "aws_api_gateway_method" "submit_color" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.colors.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = [
    "email",
    "openid",
    "profile",
    "custom:tenant_id"
  ]
}

resource "aws_api_gateway_method" "search_colors" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.colors.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = [
    "email",
    "openid",
    "profile",
    "custom:tenant_id"
  ]
}

resource "aws_api_gateway_integration" "submit_color" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.colors.id
  http_method             = aws_api_gateway_method.submit_color.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.submit_color.invoke_arn
}

resource "aws_api_gateway_integration" "search_colors" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.colors.id
  http_method             = aws_api_gateway_method.search_colors.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.search_colors.invoke_arn
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [
    aws_api_gateway_integration.submit_color,
    aws_api_gateway_integration.search_colors
  ]

  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = var.environment
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "api" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    # Trigger redeployment when the API spec changes
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.api.body))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "api" {
  deployment_id = aws_api_gateway_deployment.api.id
  rest_api_id  = aws_api_gateway_rest_api.api.id
  stage_name   = var.environment

  tags = local.common_tags
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.color_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# # Auth Service Lambda Permission for API Gateway
# resource "aws_lambda_permission" "auth_service" {
#   statement_id  = "AllowAPIGatewayInvoke"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.auth_service.function_name
#   principal     = "apigateway.amazonaws.com"
#   source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
# }

# CloudWatch logging for API Gateway
resource "aws_api_gateway_account" "api" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-${var.environment}-api-gateway-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "api_gateway_cloudwatch" {
  name = "${var.project_name}-${var.service_name}-${var.environment}-api-gateway-cloudwatch"
  role = aws_iam_role.api_gateway_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Enable CloudWatch logging for the stage
resource "aws_api_gateway_method_settings" "api" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = aws_api_gateway_stage.api.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "INFO"
  }
} 