#!/bin/sh
# Fly.dev volume seeding entrypoint
#
# On first mount (or after volume wipe), the persistent volume at
# /usr/src/app/frontend/public/tedx-xinyi/ is empty. This script
# copies the static files baked into the image (at /usr/src/app/tedx-xinyi-static/)
# into the volume without overwriting any runtime-generated files already there.

VOLUME_DIR="/usr/src/app/frontend/public/tedx-xinyi"
STATIC_SEED_DIR="/usr/src/app/tedx-xinyi-static"

if [ -d "$STATIC_SEED_DIR" ]; then
  echo "[entrypoint] Seeding volume from static build assets..."
  # Copy only files that do not already exist in the volume
  find "$STATIC_SEED_DIR" -type f | while read -r src; do
    rel="${src#$STATIC_SEED_DIR/}"
    dst="$VOLUME_DIR/$rel"
    if [ ! -f "$dst" ]; then
      mkdir -p "$(dirname "$dst")"
      cp "$src" "$dst"
      echo "[entrypoint] Seeded: $rel"
    fi
  done
  echo "[entrypoint] Volume seed complete."
fi

exec "$@"
