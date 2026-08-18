output "backend_url" {
  value       = "http://${aws_lb.backend.dns_name}"
  description = "Public URL of the backend API (put a real domain + ACM cert in front for HTTPS)."
}

output "frontend_url" {
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  description = "Public URL of the frontend SPA."
}

output "ecr_backend_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "rds_endpoint" {
  value     = aws_db_instance.postgres.address
  sensitive = false
}
