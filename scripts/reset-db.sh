#!/usr/bin/env bash
# Wipes the local Postgres volume and re-initializes it from docker-compose.yml.
#
# Why this exists: Postgres only applies POSTGRES_USER / POSTGRES_PASSWORD /
# POSTGRES_DB the *first* time it initializes an empty data directory. If the
# "postgres_data" volume was ever created under different credentials (an
# earlier run, a different .env, before values were finalized), the container
# keeps using those old credentials forever — editing docker-compose.yml or
# application.yml afterward has no effect, because the volume never re-reads
# them. That mismatch is what produces:
#
#   FATAL: password authentication failed for user "hr_platform"
#
# This script is destructive to local dev data only (not any real deployment).
set -euo pipefail

echo "Stopping stack and removing volumes (including postgres_data)..."
docker compose down -v

echo "Recreating postgres with credentials from docker-compose.yml..."
docker compose up -d postgres

echo "Waiting for postgres to report healthy..."
until [ "$(docker compose ps -q postgres | xargs docker inspect -f '{{.State.Health.Status}}')" = "healthy" ]; do
  sleep 1
done

echo "Done. Postgres is now initialized with matching credentials."
echo "You can now run: mvn -f backend/pom.xml spring-boot:run"
