# Terraform: single EC2 deployment

Provisions the AWS infrastructure this project actually runs on: **one EC2 `t3.micro`
instance** running the repo's `docker-compose.yml` (Postgres + backend + frontend), with an
Elastic IP so the address is stable across stops/restarts.

Resources created: the instance, a security group (22/80/3000), a dedicated SSH key pair,
an Elastic IP + association. That's it — no ALB, no RDS, no ECS. See
[`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) for the full step-by-step
(IAM user setup, applying, redeploying after a code change, smoke test, teardown) and for
the ECS/ALB/RDS alternative if this ever needs to handle real traffic.

## Quick reference

```bash
ssh-keygen -t ed25519 -f ~/.ssh/checkout-flow-ec2 -N ""
terraform init
cp terraform.tfvars.example terraform.tfvars   # fill in Wompi sandbox keys
AWS_PROFILE=checkout-flow terraform plan -out=tfplan
AWS_PROFILE=checkout-flow terraform apply "tfplan"
```

IAM permissions needed for the `checkout-flow` profile: see
[`../iam-policy-checkout-flow-deployer.json`](../iam-policy-checkout-flow-deployer.json) —
scoped to EC2 instance/security-group/key-pair/EIP lifecycle only, nothing else.

## What's intentionally left out

- **HTTPS**: the instance is reachable over plain HTTP on its Elastic IP; there's no domain
  to issue a certificate for. See the "Known gap" section in `docs/DEPLOYMENT.md`.
- **Secrets Manager**: the Wompi private/integrity keys are written into
  `backend/.env` on the instance via `user_data` (from Terraform variables, themselves from
  the gitignored `terraform.tfvars`) rather than pulled from Secrets Manager/SSM at runtime.
  Fine for a sandbox-only demo; wouldn't be for a production deployment with real secrets.
- **Auto-deploy on push**: redeploying after a code change is a manual `git pull` + rebuild
  over SSH (documented in `docs/DEPLOYMENT.md`), not a CI/CD pipeline.
