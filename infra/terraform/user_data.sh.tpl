#!/bin/bash
set -euxo pipefail

# --- Swap: t3.micro only has ~1GB RAM, not enough headroom for `docker
# build`-ing both the backend and frontend without this. ---
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# --- Docker + Compose plugin ---
apt-get update -y
apt-get install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker

# --- App code ---
git clone --depth 1 ${repo_url} /opt/checkout-flow
cd /opt/checkout-flow

# Backend runtime env (server-side only; never shipped to the browser).
cat > backend/.env <<EOF
PORT=3000
NODE_ENV=production
FRONTEND_ORIGIN=http://${public_ip}
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=checkout
DB_PASSWORD=checkout
DB_DATABASE=checkout_db
DB_SYNCHRONIZE=false
WOMPI_SANDBOX_URL=${wompi_sandbox_url}
WOMPI_PUBLIC_KEY=${wompi_public_key}
WOMPI_PRIVATE_KEY=${wompi_private_key}
WOMPI_EVENTS_KEY=${wompi_events_key}
WOMPI_INTEGRITY_KEY=${wompi_integrity_key}
BASE_FEE_CENTS=500000
EOF

# Root-level .env: consumed by docker-compose.yml for the frontend build
# args and its published port (see docker-compose.yml var substitution).
cat > .env <<EOF
VITE_API_BASE_URL=http://${public_ip}:3000
VITE_WOMPI_SANDBOX_URL=${wompi_sandbox_url}
VITE_WOMPI_PUBLIC_KEY=${wompi_public_key}
FRONTEND_HOST_PORT=80
EOF

docker compose build
docker compose up -d

# Give Postgres a moment to become healthy, then set up the schema + seed.
sleep 25
docker compose exec -T backend npm run migration:run:prod
docker compose exec -T backend npm run seed:prod

echo "Deployment finished" > /var/log/checkout-flow-deploy-done
