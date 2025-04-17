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
  # # Number of NAT Gateways: 1 for dev/test, 2 for prod
  # nat_gateway_count = var.environment == "prod" ? 2 : 1
}

data "aws_region" "current" {}

# VPC with DNS support for private DNS resolution
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true # required for VPC endpoints
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-vpc"
    }
  )
}

# # Internet Gateway for public subnets
# resource "aws_internet_gateway" "main" {
#   vpc_id = aws_vpc.main.id

#   tags = merge(
#     local.common_tags,
#     {
#       Name = "${var.project_name}-igw"
#     }
#   )
# }

# # Public subnets for NAT Gateway
# resource "aws_subnet" "public" {
#   count             = length(var.public_subnet_cidrs)
#   vpc_id            = aws_vpc.main.id
#   cidr_block        = var.public_subnet_cidrs[count.index]
#   availability_zone = var.availability_zones[count.index]
  
#   # Required for NAT Gateway
#   map_public_ip_on_launch = true

#   tags = merge(
#     local.common_tags,
#     {
#       Name = "${var.project_name}-public-subnet-${count.index + 1}"
#     }
#   )
# }

# # NAT Gateway with Elastic IP
# resource "aws_eip" "nat" {
#   count  = local.nat_gateway_count
#   domain = "vpc"
#   tags = merge(
#     local.common_tags,
#     {
#       Name = "${var.project_name}-nat-eip-${count.index + 1}"
#     }
#   )
# }

# resource "aws_nat_gateway" "main" {
#   count         = local.nat_gateway_count
#   allocation_id = aws_eip.nat[count.index].id
#   subnet_id     = aws_subnet.public[count.index].id

#   tags = merge(
#     local.common_tags,
#     {
#       Name = "${var.project_name}-nat-${count.index + 1}"
#     }
#   )

#   depends_on = [aws_internet_gateway.main]
# }

# # Public Route Table
# resource "aws_route_table" "public" {
#   vpc_id = aws_vpc.main.id

#   route {
#     cidr_block = "0.0.0.0/0"
#     gateway_id = aws_internet_gateway.main.id
#   }

#   tags = merge(
#     local.common_tags,
#     {
#       Name = "${var.project_name}-public-rt"
#     }
#   )
# }

# # Associate public subnets with public route table
# resource "aws_route_table_association" "public" {
#   count          = length(var.public_subnet_cidrs)
#   subnet_id      = aws_subnet.public[count.index].id
#   route_table_id = aws_route_table.public.id
# }

# Private subnets in multi-AZ for high availability
# No public IPs to minimize attack surface
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-private-subnet-${count.index + 1}"
    }
  )
}

# Explicit route tables for better control and auditability
# Add route through NAT Gateway for internet access
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  # route {
  #   cidr_block     = "0.0.0.0/0"
  #   # If we're in prod and this is the second subnet, use second NAT Gateway, otherwise use the first
  #   nat_gateway_id = count.index == 1 && var.environment == "prod" ? aws_nat_gateway.main[1].id : aws_nat_gateway.main[0].id
  # }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-private-rt-${count.index + 1}"
    }
  )
}

# Route Table Associations
# Associates each private subnet with its corresponding route table
resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Lambda SG: all outbound required for serverless
# No ingress as Lambda is invoked by AWS services
resource "aws_security_group" "lambda" {
  name        = "phoneix-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic from Lambda functions"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-lambda-sg"
    }
  )
}

# VPC Endpoint SG: HTTPS only from Lambda
# Gateway endpoints don't need security groups, but we add them for consistency
resource "aws_security_group" "vpc_endpoint" {
  name        = "phoneix-vpc-endpoint-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow HTTPS access from Lambda functions"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-vpc-endpoint-sg"
    }
  )
}