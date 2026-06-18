#!/bin/bash
set -e

echo "=============================="
echo "  Nimonspedia Database Seeder"
echo "=============================="

until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-nimonspedia_user}" -d "${POSTGRES_DB:-nimonspedia}" > /dev/null 2>&1; do
  sleep 1
done

until docker compose exec -T node-server node -e "process.exit(0)" > /dev/null 2>&1; do
  sleep 1
done

echo "[1/2] Seeding admin..."
docker compose exec -T node-server npm run seed:admin

echo "[2/2] Seeding dummy data..."
docker compose exec -T php php src/scripts/seed_data.php

echo ""
echo "=============================="
echo "  Done!"
echo "  Admin:  admin@nimonspedia.com / admin123"
echo "  Buyer:  buyer1@example.com   / i23A567@"
echo "  Seller: seller1@example.com  / i23A567@"
echo "=============================="
