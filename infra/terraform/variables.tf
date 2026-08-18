variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type        = string
  default     = "checkout-flow"
  description = "Prefix used for naming every AWS resource created by this stack."
}

variable "instance_type" {
  type        = string
  default     = "t3.micro" # free-tier eligible on most accounts; use t2.micro if yours requires it
}

variable "ssh_public_key_path" {
  type        = string
  description = "Path to the public half of a dedicated SSH key for this instance (see README: ssh-keygen)."
  default     = "~/.ssh/checkout-flow-ec2.pub"
}

variable "ssh_allowed_cidr" {
  type        = string
  default     = "0.0.0.0/0"
  description = "CIDR allowed to SSH into the instance. Restrict to your own IP/32 once you know it."
}

variable "repo_url" {
  type        = string
  description = "Public Git URL the instance clones on boot."
  default     = "https://github.com/vicente-silva/checkout-flow.git"
}

variable "wompi_sandbox_url" {
  type    = string
  default = "https://api-sandbox.co.uat.wompi.dev/v1"
}

variable "wompi_public_key" {
  type = string
}

variable "wompi_private_key" {
  type      = string
  sensitive = true
}

variable "wompi_events_key" {
  type      = string
  sensitive = true
}

variable "wompi_integrity_key" {
  type      = string
  sensitive = true
}
