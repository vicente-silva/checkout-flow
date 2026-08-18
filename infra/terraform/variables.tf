variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type        = string
  default     = "checkout-flow"
  description = "Prefix used for naming every AWS resource created by this stack."
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro" # AWS free-tier eligible
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "backend_image_tag" {
  type    = string
  default = "latest"
}

variable "frontend_origin" {
  type        = string
  description = "CORS origin allowed on the backend, e.g. the CloudFront domain (https://dxxxx.cloudfront.net)."
}

variable "wompi_sandbox_url" {
  type    = string
  default = "https://api-sandbox.co.uat.wompi.dev/v1"
}

variable "wompi_public_key" {
  type = string
}
