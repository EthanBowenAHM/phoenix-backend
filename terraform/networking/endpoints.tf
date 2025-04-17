# Gateway endpoints for private access to AWS services
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.dynamodb"
  vpc_endpoint_type = "Gateway"

  route_table_ids = aws_route_table.private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-dynamodb-endpoint"
    }
  )
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = aws_route_table.private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-s3-endpoint"
    }
  )
} 