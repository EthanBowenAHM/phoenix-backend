# S3 bucket for application data
resource "aws_s3_bucket" "functions_bucket" {
  bucket = "${local.name_prefix}-functions"

  tags = local.common_tags

  lifecycle {
    prevent_destroy = false
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "functions_bucket_versioning" {
  bucket = aws_s3_bucket.functions_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "functions_bucket_encryption" {
  bucket = aws_s3_bucket.functions_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "functions_bucket_public_access" {
  bucket = aws_s3_bucket.functions_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

## DynamoDB Table
resource "aws_dynamodb_table" "app_table" {
  name         = "${var.project_name}-${var.environment}-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name            = "TenantIndex"
    hash_key        = "tenantId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = local.common_tags
}