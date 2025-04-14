variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "color"
}

variable "service_name" {
  description = "Name of the service"
  type        = string
  default     = "color-service"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be one of: dev, test, prod"
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Terraform   = "true"
    Environment = "dev"
    Project     = "Color"
  }
}

# Add data source for AWS account ID if not already present
data "aws_caller_identity" "current" {} 


# Terraform remove state bucket name (ex. networking, application, cicd, etc.)
variable "terraform_state_bucket" {
  description = "Name of the S3 bucket used for Terraform state storage"
  type        = string
  default     = "color-service-terraform-state"
}