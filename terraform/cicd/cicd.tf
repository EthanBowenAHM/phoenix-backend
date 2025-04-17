# IAM user for GitHub Actions
resource "aws_iam_user" "github_actions" {
  name = "github-actions-deployer"
  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for GitHub Actions - Consider applying principal of least privilege
resource "aws_iam_policy" "github_actions" {
  name = "github-actions-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # AWS Gateway
          "apigateway:*", # TODO: apply principal of least privilege
          
          # CloudFront
          "cloudfront:Get*",
          "cloudfront:List*",
          "cloudfront:Create*",
          "cloudfront:Delete*",
          "cloudfront:TagResource",

          # Cognito
          # "cognito-idp:*", # TODO: apply principal of least privilege

          # DynamoDB - Terraform state locks + App Tables
          "dynamodb:*", # TODO: apply principal of least privilege
          
          # IAM
          "iam:CreateRole",
          "iam:CreatePolicy",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicyVersion",
          "iam:Get*",
          "iam:List*",
          "iam:PassRole",
          "iam:PutRolePolicy",
          "iam:TagRole",
          
          # Lambda functions
          "lambda:AddPermission",
          "lambda:CreateAlias",
          "lambda:CreateFunction",
          "lambda:Get*",
          "lambda:List*",
          "lambda:PublishVersion",
          "lambda:TagResource",
          "lambda:UpdateAlias",
          "lambda:UpdateFunction*",
          
          # S3 - Terraform state bucket + App buckets
          "s3:Create*",
          "s3:Get*",
          "s3:List*",
          "s3:PutBucketTagging",
          "s3:PutEncryptionConfiguration",
          "s3:PutObject",
          "s3:PutBucketPublicAccessBlock",
          "s3:PutBucketVersioning",
          "s3:PutBucketPolicy",
          "s3:PutBucketWebsite",
        ]
        Resource = [
          # Api Gateway
          data.terraform_remote_state.application.outputs.api_gateway_arn,
          "${data.terraform_remote_state.application.outputs.api_gateway_arn}/*",
          "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${data.terraform_remote_state.application.outputs.api_gateway_id}/*",
          "arn:aws:apigateway:${data.aws_region.current.name}::/account",
          # Cognito
          # data.terraform_remote_state.application.outputs.cognito_user_pool_arn,
          # "${data.terraform_remote_state.application.outputs.cognito_user_pool_arn}/*",
          # data.terraform_remote_state.application.outputs.cognito_client_id,
          # "${data.terraform_remote_state.application.outputs.cognito_client_id}/*",
          # CloudFront
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${data.terraform_remote_state.application.outputs.cloudfront_distribution_id}",
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:cache-policy/${data.terraform_remote_state.application.outputs.cloudfront_cache_policy_id}",
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:origin-access-control/${data.terraform_remote_state.application.outputs.cloudfront_origin_access_control_id}",
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:response-headers-policy/${data.terraform_remote_state.application.outputs.cloudfront_response_headers_policy_id}",
          # DynamoDB table
          data.terraform_remote_state.application.outputs.dynamodb_table_arn,
          "${data.terraform_remote_state.application.outputs.dynamodb_table_arn}/index/*",
          # Frontend
          aws_iam_policy.frontend_deployment.arn,
          aws_iam_user.frontend_ci.arn,
          # IAM resources
          data.terraform_remote_state.application.outputs.api_gateway_cloudwatch_role_arn,
          data.terraform_remote_state.application.outputs.color_service_lambda_role_arn,
          # data.terraform_remote_state.application.outputs.auth_service_lambda_role_arn,
          aws_iam_user.github_actions.arn,
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/github-actions-policy",
          # Lambda functions + role
          data.terraform_remote_state.application.outputs.color_service_function_arn,
          "${data.terraform_remote_state.application.outputs.color_service_function_arn}:*",
          # Lambda functions bucket
          data.terraform_remote_state.application.outputs.functions_bucket_arn,
          "${data.terraform_remote_state.application.outputs.functions_bucket_arn}/*",
          # Terraform state bucket
          "arn:aws:s3:::phoneix-terraform-state",
          "arn:aws:s3:::phoneix-terraform-state/*",
          # Terraform state locking table
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/phoneix-terraform-locks",
          # Website bucket
          "arn:aws:s3:::${data.terraform_remote_state.application.outputs.website_bucket_name}",
          "arn:aws:s3:::${data.terraform_remote_state.application.outputs.website_bucket_name}/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          # VPC Management
          "ec2:CreateVpc",
          "ec2:DeleteVpc",
          "ec2:ModifyVpcAttribute",
          
          # Subnet Management
          "ec2:CreateSubnet",
          "ec2:DeleteSubnet",
          "ec2:ModifySubnetAttribute",
          
          # Security Group Management
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress",
          
          # Route Table Management
          "ec2:CreateRouteTable",
          "ec2:DeleteRouteTable",
          "ec2:CreateRoute",
          "ec2:DeleteRoute",
          "ec2:AssociateRouteTable",
          "ec2:DisassociateRouteTable",
          
          # Internet Gateway Management
          "ec2:CreateInternetGateway",
          "ec2:DeleteInternetGateway",
          "ec2:AttachInternetGateway",
          "ec2:DetachInternetGateway",
          
          # NAT Gateway & Elastic IP Management
          "ec2:CreateNatGateway",
          "ec2:DeleteNatGateway",
          "ec2:AllocateAddress",
          "ec2:ReleaseAddress",
          
          # VPC Endpoint Management
          "ec2:CreateVpcEndpoint",
          "ec2:DeleteVpcEndpoints",
          "ec2:ModifyVpcEndpoint",
          
          # Resource Tagging
          "ec2:CreateTags",
          "ec2:DeleteTags",
          
          # Read Operations (Describe)
          "ec2:Describe*",
        ]
        Resource = ["*"] # Required for EC2 network actions
        # Wasn't working - TODO: Fix
        # Condition = {
        #   StringEquals = {
        #     "aws:RequestTag/ManagedBy" = "terraform"
        #   }
        # }
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