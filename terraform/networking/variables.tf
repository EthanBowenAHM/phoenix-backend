variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "phoneix"
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
  description = "The AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

# VPC CIDR block with validation
# /16 provides room for future expansion and service requirements
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Private subnet CIDRs with validation
# /24 provides 256 IPs per subnet, sufficient for Lambda concurrency
variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

# # Public subnet CIDRs for NAT Gateway
# variable "public_subnet_cidrs" {
#   description = "CIDR blocks for public subnets (for NAT Gateway)"
#   type        = list(string)
#   default     = ["10.0.101.0/24", "10.0.102.0/24"]  # Different range from private subnets
# }

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]  # Just the suffix, we'll combine with region
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Terraform   = "true"
    Environment = "dev"
    Project     = "phoneix"
  }
}

# Add data source for AWS account ID if not already present
data "aws_caller_identity" "current" {}

# Add data source for available AZs
data "aws_availability_zones" "available" {
  state = "available"
} 