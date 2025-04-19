terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# AWS Provider Configuration
# Defines the AWS region where resources will be created
provider "aws" {
  region = var.aws_region
}