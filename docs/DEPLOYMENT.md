# Deployment guide (AWS)

Two ways to deploy, pick one:

- **A. Manual / AWS CLI** (recommended first pass — fastest to reason about, uses the AWS
  free tier).
- **B. Terraform** (see [`infra/terraform`](../infra/terraform)) — provisions the same
  resources as code, but was not applied/validated in this environment; review it before
  running `apply`.

Either way, the target architecture is:

```
                       ┌─────────────────────┐
  Browser ───HTTPS───► │ CloudFront + S3      │  (frontend static build)
                       └─────────┬────────────┘
                                 │ REST calls (VITE_API_BASE_URL)
                                 ▼
                       ┌─────────────────────┐
                       │ ALB → ECS Fargate    │  (backend NestJS API)
                       │ (or a single EC2 /   │
                       │  Lambda, see notes)  │
                       └─────────┬────────────┘
                                 │
                                 ▼
                       ┌─────────────────────┐
                       │ RDS PostgreSQL       │
                       └─────────────────────┘
```

## A. Manual deployment

### 1. Database — RDS PostgreSQL

1. RDS console → **Create database** → PostgreSQL → **Free tier** template.
2. DB instance identifier: `checkout-flow-db`. Master username `checkout`, set a password.
3. Public access: **No**. Create/attach a security group that allows port `5432` only from
   the backend's security group (created in step 2).
4. Once available, note the endpoint — this is `DB_HOST`.
5. Run the migration from your machine (with the RDS security group temporarily open to
   your IP, or via a bastion/ECS one-off task):
   ```bash
   cd backend
   DB_HOST=<rds-endpoint> DB_USERNAME=checkout DB_PASSWORD=*** DB_DATABASE=checkout_db \
     npm run migration:run
   DB_HOST=<rds-endpoint> DB_USERNAME=checkout DB_PASSWORD=*** DB_DATABASE=checkout_db \
     npm run seed
   ```

### 2. Backend — ECR + ECS Fargate

1. Create an ECR repo and push the image:
   ```bash
   aws ecr create-repository --repository-name checkout-flow-backend
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker build -t checkout-flow-backend ./backend
   docker tag checkout-flow-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/checkout-flow-backend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/checkout-flow-backend:latest
   ```
2. ECS console → **Create cluster** (Fargate).
3. **Task definition**: Fargate, 0.25 vCPU / 0.5 GB, container port `3000`, image = the ECR
   URI above. Environment variables: `PORT`, `NODE_ENV=production`, `DB_HOST`, `DB_PORT`,
   `DB_USERNAME`, `DB_DATABASE`, `FRONTEND_ORIGIN` (the CloudFront URL from step 3),
   `WOMPI_SANDBOX_URL`, `WOMPI_PUBLIC_KEY`, `BASE_FEE_CENTS`. Put `DB_PASSWORD`,
   `WOMPI_PRIVATE_KEY` and `WOMPI_INTEGRITY_KEY` in **Secrets Manager** and reference them
   as *secrets* on the task definition, not as plain env vars.
4. **Service**: Fargate, desired count 1, attach to an **Application Load Balancer**
   (target group health check path `/health`). Security group: inbound 3000 from the ALB's
   security group only.
5. Confirm `http://<alb-dns-name>/health` returns `{"status":"ok"}`; that ALB DNS name (or
   a custom domain pointed at it) is your `VITE_API_BASE_URL`.
6. (Bonus points) Put HTTPS in front: request an ACM certificate for your domain, add an
   HTTPS listener on the ALB, redirect HTTP → HTTPS.

### 3. Frontend — S3 + CloudFront

1. Build with the real API URL baked in:
   ```bash
   cd frontend
   VITE_API_BASE_URL=http://<alb-dns-name> \
   VITE_WOMPI_SANDBOX_URL=https://api-sandbox.co.uat.wompi.dev/v1 \
   VITE_WOMPI_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7 \
     npm run build
   ```
2. Create a **private** S3 bucket, upload `dist/`:
   ```bash
   aws s3 sync dist/ s3://checkout-flow-frontend --delete
   ```
3. Create a **CloudFront** distribution with the bucket as origin (Origin Access Control,
   not a public bucket policy), default root object `index.html`, and a custom error
   response mapping `404 → /index.html` with status `200` (SPA fallback for a refresh on
   any step).
4. Once deployed, the CloudFront domain (`https://dxxxxx.cloudfront.net`) is your app URL.
   Go back and set that as the backend's `FRONTEND_ORIGIN` (for CORS) and redeploy the
   backend task if it changed.

### 4. Smoke test

- Open the CloudFront URL, confirm the product loads with real stock.
- Run the full checkout with a Wompi sandbox test card (see `README.md` → "Sandbox test
  cards") and confirm the transaction reaches a final state and stock decreases.

## B. Terraform

See [`infra/terraform/README.md`](../infra/terraform/README.md) for the equivalent stack
as code, and the honesty note there about it not having been applied in this environment.

## Notes on alternative compute options

- **AWS Lambda**: NestJS can run on Lambda via `@vendia/serverless-express` or the
  `@nestjs/platform-express` + `serverless-http` combo; consider it if you want to stay
  fully within the free tier with near-zero idle cost. Left out of this scaffold because
  it needs its own API Gateway wiring and cold-start handling, which is a meaningfully
  different task definition from the Fargate service above.
- **A single EC2 instance** running `docker compose up` (the root `docker-compose.yml`) is
  the fastest way to get something live for a demo, at the cost of no auto-scaling / HA.
