#!/bin/sh

echo "Waiting for PostgreSQL to be ready..."
until node -e "const { Pool } = require('pg'); const pool = new Pool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME }); pool.query('SELECT 1').then(() => { console.log('DB ready'); process.exit(0); }).catch(() => process.exit(1));" > /dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - seeding admin user..."
node src/scripts/seedAdmin.js

echo "Starting Node.js server..."
exec node index.js
