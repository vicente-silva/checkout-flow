# Deployment guide (AWS)

**What's actually running**: a single EC2 `t3.micro` instance running the repo's own
`docker-compose.yml` (Postgres + backend + frontend, same as local dev). Chosen over the
more "textbook" ECS Fargate + ALB + RDS split because this app is reviewed by a couple of
people, not run in production — an Application Load Balancer bills hourly regardless of
traffic (~$16-20/mo) while a `t3.micro` is free-tier eligible (750 hrs/mo for 12 months) or
a couple dollars/month after that.

```
                    ┌───────────────────────────────────────────┐
 Browser ──HTTP───► │ EC2 t3.micro (Elastic IP)                  │
                    │  ┌─────────────┐  ┌──────────┐  ┌────────┐ │
                    │  │ frontend    │  │ backend  │  │postgres│ │
                    │  │ nginx :80   │─►│ Nest :3000│─►│ :5432 │ │
                    │  └─────────────┘  └──────────┘  └────────┘ │
                    │  all three as docker-compose services      │
                    └───────────────────────────────────────────┘
```

If you need to scale this beyond a demo (real traffic, HA, zero-downtime deploys), see
[Alternative: ECS + ALB + RDS](#alternative-ecs--alb--rds) at the bottom — that's the
"textbook" version, not what's deployed today.

## 1. Create a scoped AWS IAM user

Don't reuse a personal/production AWS key. Create a dedicated user with only the
permissions this stack needs:

1. **IAM → Users → Create user** → name it (e.g. `checkout-flow-deployer`), programmatic
   access only.
2. **IAM → Policies → Create policy → JSON** → paste
   [`infra/iam-policy-checkout-flow-deployer.json`](../infra/iam-policy-checkout-flow-deployer.json)
   → attach it to the user.
3. **Security credentials → Create access key** (CLI use case).
4. Locally: `aws configure --profile checkout-flow` with that key.

## 2. Provision the instance with Terraform

```bash
cd infra/terraform
ssh-keygen -t ed25519 -f ~/.ssh/checkout-flow-ec2 -N ""   # dedicated key for this instance
terraform init
cp terraform.tfvars.example terraform.tfvars   # fill in the Wompi sandbox keys
AWS_PROFILE=checkout-flow terraform plan -out=tfplan
AWS_PROFILE=checkout-flow terraform apply "tfplan"
```

Outputs give you `public_ip` / `frontend_url` / `backend_url` / `ssh_command`. The
instance's `user_data` script (see `infra/terraform/user_data.sh.tpl`) runs on first boot
and does everything: installs Docker, adds swap (a `t3.micro` only has ~1GB RAM — builds
will OOM without it), clones this repo, builds the images with the right
`VITE_API_BASE_URL` baked in (the Elastic IP is known before boot, no chicken-and-egg),
starts `docker compose`, then runs migrations + seed. Takes 5-10 minutes; watch it with:

```bash
ssh -i ~/.ssh/checkout-flow-ec2 ubuntu@<public_ip> \
  "tail -f /var/log/cloud-init-output.log"
```

## 3. Redeploying after a code change

The instance doesn't auto-pull. After pushing to GitHub:

```bash
ssh -i ~/.ssh/checkout-flow-ec2 ubuntu@<public_ip>
cd /opt/checkout-flow
git pull
sudo docker compose build <backend|frontend>   # or both, no args
sudo docker compose up -d <backend|frontend>
```

Migrations/seed only need to run once (`sudo docker compose exec backend npm run
migration:run:prod`); re-running the seed script is safe, it skips products that already
exist (matched by SKU).

## 4. Smoke test

```bash
curl -s http://<public_ip>/                    # frontend, expect 200
curl -s http://<public_ip>:3000/products        # backend, expect the seeded products
curl -s http://<public_ip>:3000/docs -o /dev/null -w "%{http_code}\n"   # swagger, expect 200
```

Then run a real checkout in the browser with a Wompi sandbox test card (see the main
[`README.md`](../README.md#sandbox-test-cards)) and confirm stock decreases afterward.

## 5. Known gap: no HTTPS

The app is served over plain HTTP on the Elastic IP — there's no domain name to issue a
certificate for. To add HTTPS: point a domain's A record at the Elastic IP, then either run
Certbot (Let's Encrypt) on the instance in front of nginx, or put a CloudFront distribution
in front of it with an ACM certificate. Left out here since it requires a domain the
grader/reviewer would need to already have.

## 6. Tearing it down

```bash
cd infra/terraform
AWS_PROFILE=checkout-flow terraform destroy
```

Removes the instance, Elastic IP, security group and key pair — stops all billing for this
stack.

---

## Alternative: ECS + ALB + RDS

For a setup meant to actually stay up under real traffic (auto-scaling, zero-downtime
deploys, a managed database with backups), the more conventional shape is:

```
Browser ──HTTPS──► CloudFront + S3 (frontend)
                            │
                            ▼
                  ALB → ECS Fargate (backend)
                            │
                            ▼
                     RDS PostgreSQL
```

This project's `infra/terraform` used to provision exactly that, before being simplified to
the single-EC2 approach above for cost reasons. The rough shape, if you want to rebuild it:
ECR repos for both images, an ECS cluster + Fargate service + task definition (secrets from
Secrets Manager, not plain env vars) behind an ALB (`/health` as the target group check),
and a private S3 bucket + CloudFront distribution (Origin Access Control, SPA fallback
`404 → /index.html`) for the frontend. Budget for the ALB's flat hourly cost regardless of
traffic.
