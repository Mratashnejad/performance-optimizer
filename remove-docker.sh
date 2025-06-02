#!/bin/bash

# Script to remove all Docker containers, images, and data for Cannonbet application
# Use with caution - this will delete all data!

set -e

echo "🚨 WARNING: This will remove ALL Docker containers, images, and data for Cannonbet!"
echo "This action cannot be undone and will delete all database data."
echo ""

# Ask for confirmation
read -p "Are you sure you want to continue? Type 'YES' to confirm: " confirmation

if [ "$confirmation" != "YES" ]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo "🛑 Stopping all containers..."
docker-compose down --remove-orphans || true

echo "🗑️ Removing containers..."
docker rm -f $(docker ps -aq --filter "name=cannonbet") 2>/dev/null || true

echo "🗑️ Removing images..."
docker rmi -f $(docker images --filter "reference=*cannonbet*" -q) 2>/dev/null || true
docker rmi -f $(docker images --filter "reference=docker-app*" -q) 2>/dev/null || true

echo "🗑️ Removing volumes..."
docker volume rm $(docker volume ls --filter "name=cannonbet" -q) 2>/dev/null || true
docker volume rm $(docker volume ls --filter "name=newsite" -q) 2>/dev/null || true

echo "🗑️ Removing networks..."
docker network rm $(docker network ls --filter "name=cannonbet" -q) 2>/dev/null || true

echo "🧹 Cleaning up Docker system..."
docker system prune -f --volumes

echo "🗑️ Removing local data directories..."
sudo rm -rf data/postgres/* 2>/dev/null || true
sudo rm -rf data/redis/* 2>/dev/null || true
sudo rm -rf logs/* 2>/dev/null || true

echo "✅ Docker cleanup completed!"
echo ""
echo "📝 To start fresh:"
echo "1. Copy your SSL certificates to ssl/ directory"
echo "2. Copy env.production to .env and configure"
echo "3. Run: docker-compose up -d"
echo ""
echo "🔧 To enter maintenance mode:"
echo "1. Ensure maintenance/index.html exists"
echo "2. Stop app container: docker-compose stop app"
echo "3. Nginx will automatically serve maintenance page" 