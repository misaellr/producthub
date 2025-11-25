#!/bin/bash

# Database Reset Script for Liferay PaaS
# This script wipes and recreates the lportal database on startup
#
# Place in: database/configs/<env>/scripts/ or database/configs/common/scripts/
# Scripts are executed in alphabetical order

set -e

echo "[DATABASE RESET] Starting database reset..."

# Database connection parameters (provided by Liferay Cloud)
DB_HOST="${LCP_DATABASE_HOST:-localhost}"
DB_PORT="${LCP_DATABASE_PORT:-3306}"
DB_USER="${LCP_DATABASE_USER:-dxpcloud}"
DB_PASS="${LCP_DATABASE_PASSWORD:-dxpcloud}"
DB_NAME="${LCP_DATABASE_NAME:-lportal}"

# Wait for MySQL to be ready
echo "[DATABASE RESET] Waiting for MySQL to be ready..."
max_attempts=30
attempt=0
until mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" &>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "[DATABASE RESET] ERROR: MySQL not ready after $max_attempts attempts"
        exit 1
    fi
    echo "[DATABASE RESET] Waiting for MySQL... (attempt $attempt/$max_attempts)"
    sleep 2
done

echo "[DATABASE RESET] MySQL is ready"

# Drop and recreate the database
echo "[DATABASE RESET] Dropping database '$DB_NAME' if exists..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS $DB_NAME;"

echo "[DATABASE RESET] Creating fresh database '$DB_NAME'..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "[DATABASE RESET] Database reset complete!"
