# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

# Vite bakes VITE_* variables into the bundle at build time, so they must
# arrive as build args (see docker-compose.yml / your CI pipeline), not
# just as runtime env vars.
ARG VITE_API_BASE_URL=http://localhost:3000
ARG VITE_WOMPI_SANDBOX_URL=https://api-sandbox.co.uat.wompi.dev/v1
ARG VITE_WOMPI_PUBLIC_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WOMPI_SANDBOX_URL=$VITE_WOMPI_SANDBOX_URL
ENV VITE_WOMPI_PUBLIC_KEY=$VITE_WOMPI_PUBLIC_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
