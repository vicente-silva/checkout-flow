terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------------------------
# Single EC2 instance running the whole stack via the repo's docker-compose.
# Chosen over ECS+ALB+RDS for this deployment: the app will only be used by
# a handful of reviewers, and an Application Load Balancer bills hourly
# regardless of traffic (~$16-20/mo) while a t3.micro is free-tier eligible
# (750 hrs/mo for 12 months) or a couple dollars/month after that. See
# infra/terraform/README.md for the ECS/RDS/ALB alternative if this needs to
# scale later.
# ---------------------------------------------------------------------------

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "app" {
  key_name   = "${var.project_name}-key"
  public_key = file(var.ssh_public_key_path)
}

resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "Frontend (HTTP)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend API + Swagger"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-app" }
}

resource "aws_eip" "app" {
  domain = "vpc"
  tags   = { Name = "${var.project_name}-app" }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.app.id]
  key_name               = aws_key_pair.app.key_name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  # The EIP's address is allocated independently of this instance, so it's
  # already known when user_data is rendered — no chicken-and-egg with the
  # frontend needing to be built against the right backend URL.
  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    repo_url             = var.repo_url
    public_ip             = aws_eip.app.public_ip
    wompi_sandbox_url     = var.wompi_sandbox_url
    wompi_public_key      = var.wompi_public_key
    wompi_private_key     = var.wompi_private_key
    wompi_events_key      = var.wompi_events_key
    wompi_integrity_key   = var.wompi_integrity_key
  })
  user_data_replace_on_change = true

  tags = { Name = "${var.project_name}-app" }
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}
