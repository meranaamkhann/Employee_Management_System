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
