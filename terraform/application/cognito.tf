# resource "aws_cognito_user_pool" "user_pool" {
#   name = "${var.project_name}-${var.environment}-user-pool"

#   alias_attributes = ["email", "preferred_username"]
#   auto_verified_attributes = ["email"]

#   password_policy {
#     minimum_length    = 8
#     require_lowercase = true
#     require_numbers   = true
#     require_symbols   = true
#     require_uppercase = true
#   }

#   schema {
#     attribute_data_type = "String"
#     name                = "email"
#     required            = true
#     mutable             = true

#     string_attribute_constraints {
#       min_length = 3
#       max_length = 256
#     }
#   }

#   schema {
#     attribute_data_type = "String"
#     name                = "given_name"
#     required            = true
#     mutable             = true

#     string_attribute_constraints {
#       min_length = 1
#       max_length = 50
#     }
#   }

#   schema {
#     attribute_data_type = "String"
#     name                = "family_name"
#     required            = true
#     mutable             = true

#     string_attribute_constraints {
#       min_length = 1
#       max_length = 50
#     }
#   }

#   schema {
#     attribute_data_type = "String"
#     name                = "preferred_username"
#     required            = true
#     mutable             = true

#     string_attribute_constraints {
#       min_length = 3
#       max_length = 50
#     }
#   }

#   schema {
#     attribute_data_type = "String"
#     name                = "custom:tenant_id"
#     required            = true
#     mutable             = false

#     string_attribute_constraints {
#       min_length = 1
#       max_length = 50
#     }
#   }

#   schema {
#     attribute_data_type = "String"
#     name                = "custom:tenant_name"
#     required            = true
#     mutable             = false

#     string_attribute_constraints {
#       min_length = 1
#       max_length = 100
#     }
#   }

#   schema {
#     attribute_data_type = "String"
#     name                = "custom:tenant_role"
#     required            = true
#     mutable             = true

#     string_attribute_constraints {
#       min_length = 1
#       max_length = 50
#     }
#   }

#   tags = merge(local.common_tags, {
#     Name = "${var.project_name}-${var.environment}-user-pool"
#   })
# }

# resource "aws_cognito_user_pool_client" "client" {
#   name = "${var.project_name}-${var.environment}-client"

#   user_pool_id = aws_cognito_user_pool.user_pool.id

#   generate_secret     = false
#   explicit_auth_flows = [
#     "ALLOW_USER_PASSWORD_AUTH",
#     "ALLOW_REFRESH_TOKEN_AUTH",
#     "ALLOW_USER_SRP_AUTH",
#     "ALLOW_CUSTOM_AUTH"
#   ]

#   allowed_oauth_flows = ["code", "implicit"]
#   allowed_oauth_flows_user_pool_client = true
#   allowed_oauth_scopes = ["email", "openid", "profile"]

#   callback_urls = var.environment == "dev" ? [
#     "http://localhost:5173",
#     "https://${aws_cloudfront_distribution.website.domain_name}"
#   ] : [
#     "https://${aws_cloudfront_distribution.website.domain_name}"
#   ]

#   logout_urls = var.environment == "dev" ? [
#     "http://localhost:5173",
#     "https://${aws_cloudfront_distribution.website.domain_name}"
#   ] : [
#     "https://${aws_cloudfront_distribution.website.domain_name}"
#   ]

#   supported_identity_providers = ["COGNITO"]

#   token_validity_units {
#     access_token  = "hours"
#     id_token      = "hours"
#     refresh_token = "days"
#   }

#   access_token_validity  = 12
#   id_token_validity      = 12
#   refresh_token_validity = 7
# }

# resource "aws_cognito_user_pool_domain" "domain" {
#   domain       = "${var.project_name}-${var.environment}-auth"
#   user_pool_id = aws_cognito_user_pool.user_pool.id
# } 