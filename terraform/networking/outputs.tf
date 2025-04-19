output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

# Private subnet IDs for Lambda placement
output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

# # Public subnet IDs for internet access
# output "public_subnet_ids" {
#   description = "IDs of the public subnets"
#   value       = aws_subnet.public[*].id
# }

# # NAT Gateway IDs for internet access
# output "nat_gateway_ids" {
#   description = "IDs of the NAT Gateways (1 for dev/test, 2 for prod)"
#   value       = aws_nat_gateway.main[*].id
# }

# output "nat_gateway_count" {
#   description = "Number of NAT Gateways deployed (1 for dev/test, 2 for prod)"
#   value       = local.nat_gateway_count
# }

# # Internet Gateway ID for internet access
# output "internet_gateway_id" {
#   description = "ID of the Internet Gateway"
#   value       = aws_internet_gateway.main.id
# }

# Lambda security group ID for function configuration
output "lambda_security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

# VPC endpoint security group ID for additional endpoints
output "vpc_endpoint_security_group_id" {
  description = "ID of the VPC endpoint security group"
  value       = aws_security_group.vpc_endpoint.id
}

# DynamoDB endpoint ID for service integration
output "dynamodb_endpoint_id" {
  description = "ID of the DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}

# S3 endpoint ID for service integration
output "s3_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

# Private route table IDs for additional routing
output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}