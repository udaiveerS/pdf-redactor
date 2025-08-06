#!/bin/bash

# ClickHouse Setup Script for PDF Scanner App
set -e

echo "🚀 Setting up ClickHouse for PDF Scanner App..."

# Create infrastructure directories if they don't exist
mkdir -p infra/clickhouse/{data,logs}

# Start ClickHouse using Docker Compose
echo "📦 Starting ClickHouse container..."
cd infra/clickhouse
docker compose up -d

# Wait for ClickHouse to be ready
echo "⏳ Waiting for ClickHouse to be ready..."
sleep 10

# Test connection
echo "🔍 Testing ClickHouse connection..."
docker exec -it clickhouse \
  clickhouse-client -u app --password secret --database pdf_scan \
  -q "SELECT '🎉 ClickHouse is alive!' as status"

# Initialize database schema
echo "🗄️  Initializing database schema..."
docker exec -i clickhouse \
  clickhouse-client -u app --password secret --database pdf_scan \
  < ../../infra/clickhouse/init.sql

echo "✅ ClickHouse setup complete!"
echo ""
echo "📊 ClickHouse is running on:"
echo "   - HTTP API: http://localhost:8123"
echo "   - Native TCP: localhost:9000"
echo "   - Database: pdf_scan"
echo "   - Username: app"
echo "   - Password: secret"
echo ""
echo "🔗 Test the connection:"
echo "   curl -s -u app:secret 'http://localhost:8123/?query=SELECT%20version()'"
echo ""
echo "📋 View scan results:"
echo "   docker exec -it clickhouse clickhouse-client -u app --password secret -d pdf_scan -q 'SELECT * FROM scan_results'" 