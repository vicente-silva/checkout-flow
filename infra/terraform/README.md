# Terraform scaffold (AWS)

Provisions the core infrastructure to run this project on AWS free-tier-eligible resources:

- **ECR**: one repository each for the backend and frontend Docker images.
- **RDS PostgreSQL** (`db.t4g.micro`) in the account's default VPC.
- **ECS Fargate** running the backend behind an Application Load Balancer.
- **S3 + CloudFront** serving the frontend static build (SPA fallback to `index.html`).

> **Honesty note:** this scaffold was written by hand and has **not** been run through
> `terraform plan`/`apply` in this environment (no AWS credentials or Terraform CLI were
> available here). Treat it as a solid, reviewed starting point — run `terraform validate`
> and `terraform plan` yourself before applying, and review the security groups / IAM
> policies for your account's requirements.

## Usage

```bash
cd infra/terraform
terraform init
terraform plan -var="db_password=CHANGE_ME" \
  -var="frontend_origin=https://your-cloudfront-domain.cloudfront.net" \
  -var="wompi_public_key=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7"
terraform apply
```

Then build/push the images to the ECR repos the stack created, and deploy the frontend
build (`dist/`) to the S3 bucket. See [`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md)
for the full step-by-step, including the manual-console alternative if you'd rather not use
Terraform at all.

## What's intentionally left out

- **Secrets**: the DB password and Wompi private/integrity keys should be pulled from AWS
  Secrets Manager or SSM Parameter Store into the task definition's `secrets` block, not
  passed as plain environment variables. The scaffold wires the *public* values only.
- **Custom domain + HTTPS on the ALB**: add an ACM certificate + Route 53 record and an
  HTTPS listener once you have a domain.
- **Dedicated VPC**: this reuses the default VPC/subnets to keep the scaffold small; a
  production setup should isolate RDS/ECS in private subnets.
