#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/5ml-agenticai-v1}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
IMAGE_REPO="${IMAGE_REPO:-}"
IMAGE_TAG="${IMAGE_TAG:-}"

if [[ -z "${IMAGE_REPO}" || -z "${IMAGE_TAG}" ]]; then
  echo "Usage: IMAGE_REPO=ghcr.io/owner/repo IMAGE_TAG=sha ${0}"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the host"
  exit 1
fi

COMPOSE_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
fi

cd "${APP_DIR}"

mkdir -p runtime
if [[ ! -f runtime/upstream.conf ]]; then
  cp nginx/upstream.conf.template runtime/upstream.conf
fi

ACTIVE_COLOR="blue"
if grep -q "app_green" runtime/upstream.conf; then
  ACTIVE_COLOR="green"
fi

INACTIVE_COLOR="green"
if [[ "${ACTIVE_COLOR}" == "green" ]]; then
  INACTIVE_COLOR="blue"
fi

export IMAGE_REPO IMAGE_TAG

echo "Deploying ${IMAGE_REPO}:${IMAGE_TAG} to app_${INACTIVE_COLOR}"
${COMPOSE_CMD} -f "${COMPOSE_FILE}" pull "app_${INACTIVE_COLOR}"
${COMPOSE_CMD} -f "${COMPOSE_FILE}" up -d "app_${INACTIVE_COLOR}"
${COMPOSE_CMD} -f "${COMPOSE_FILE}" up -d nginx

echo "Waiting for app_${INACTIVE_COLOR} to be healthy..."
status="unknown"
for _ in $(seq 1 30); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "app_${INACTIVE_COLOR}" 2>/dev/null || echo "unknown")"
  if [[ "${status}" == "healthy" ]]; then
    echo "app_${INACTIVE_COLOR} is healthy"
    break
  fi
  if [[ "${status}" == "unhealthy" ]]; then
    echo "app_${INACTIVE_COLOR} is unhealthy"
    docker logs --tail 200 "app_${INACTIVE_COLOR}"
    exit 1
  fi
  sleep 5
done

if [[ "${status}" != "healthy" ]]; then
  echo "Timed out waiting for app_${INACTIVE_COLOR} to be healthy"
  exit 1
fi

cat > runtime/upstream.conf <<EOF
upstream app_upstream {
  server app_${INACTIVE_COLOR}:8080;
}
EOF

docker exec app_nginx nginx -s reload

echo "Stopping app_${ACTIVE_COLOR}"
${COMPOSE_CMD} -f "${COMPOSE_FILE}" stop "app_${ACTIVE_COLOR}"
echo "Deployment complete"
