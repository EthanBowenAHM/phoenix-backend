# Get current region
data "aws_region" "current" {}

# Reference networking stack outputs
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = var.terraform_state_bucket
    key    = "phoneix/networking/terraform.tfstate"
    region = var.aws_region
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  )
  # Access keys will expire after 90 days
  access_key_expiration = timeadd(timestamp(), "2160h") # 90 days
  s3_origin_id = "${local.name_prefix}-website-origin"
}