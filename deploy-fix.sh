#!/bin/bash
# Script to deploy fixes and rebuild the application
# Run this on the server

echo "🚀 Starting deployment of fixes..."

# Navigate to project directory
cd /var/www/academia || exit 1

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin master

# Install dependencies (just in case)
echo "📦 Installing dependencies..."
npm install

# Rebuild the application
echo "🔨 Building application..."
npm run build

# Restart the application via PM2
echo "🔄 Restarting application..."
pm2 restart academia

echo "✅ Deployment complete!"
echo "Please refresh your browser (Ctrl+F5) to see the changes."
