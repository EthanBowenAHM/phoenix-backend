# Frontend deployment outputs
output "frontend_ci_access_key_id" {
  value       = aws_iam_access_key.frontend_ci.id
  description = "Access Key ID for frontend CI/CD"
  sensitive   = true
}

output "frontend_ci_secret_access_key" {
  value       = aws_iam_access_key.frontend_ci.secret
  description = "Secret Access Key for frontend CI/CD"
  sensitive   = true
} 