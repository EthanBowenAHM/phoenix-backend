output "functions_bucket_name" {
  description = "Name of the Lambda functions bucket"
  value       = aws_s3_bucket.functions_bucket.id
}

output "functions_bucket_arn" {
  description = "ARN of the Lambda functions bucket"
  value       = aws_s3_bucket.functions_bucket.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.app_table.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.app_table.arn
}

output "api_url" {
  value       = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${var.environment}"
  description = "URL of the API Gateway endpoint"
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.api.arn
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.api.id
}

output "color_service_function_name" {
  description = "Name of the color service Lambda function"
  value       = aws_lambda_function.color_service.function_name
}

output "color_service_function_arn" {
  description = "ARN of the color service Lambda function"
  value       = aws_lambda_function.color_service.arn
}

output "website_url" {
  description = "URL of the website"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "website_bucket" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.bucket
}

output "website_bucket_name" {
  value       = aws_s3_bucket.website.id
  description = "Name of the S3 bucket hosting the frontend website"
}


output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_cache_policy_id" {
  description = "ID of the CloudFront cache policy"
  value       = aws_cloudfront_cache_policy.website.id
}

output "cloudfront_origin_access_control_id" {
  description = "ID of the CloudFront origin access control"
  value       = aws_cloudfront_origin_access_control.website.id
}

output "cloudfront_response_headers_policy_id" {
  description = "ID of the CloudFront response headers policy"
  value       = aws_cloudfront_response_headers_policy.website.id
}

output "color_service_lambda_role_arn" {
  description = "ARN of the Lambda role"
  value       = aws_iam_role.color_service_lambda_role.arn
} 

# output "auth_service_lambda_role_arn" {
#   description = "ARN of the Lambda role"
#   value       = aws_iam_role.auth_service_lambda_role.arn
# } 

output "api_gateway_cloudwatch_role_arn" {
  description = "ARN of the API Gateway CloudWatch role"
  value       = aws_iam_role.api_gateway_cloudwatch.arn
}

# output "cognito_user_pool_id" {
#   description = "The ID of the Cognito User Pool"
#     value       = aws_cognito_user_pool.user_pool.id
# }

# output "cognito_client_id" {
#   description = "The ID of the Cognito User Pool Client"
#   value       = aws_cognito_user_pool_client.client.id
# }

# output "cognito_domain" {
#   description = "The domain of the Cognito User Pool"
#   value       = aws_cognito_user_pool_domain.domain.domain
# }