#!/bin/bash
# Script to update nginx configuration on the server
# Run this script on the server: bash update-nginx-server.sh

echo "🔄 Updating nginx configuration..."

# Navigate to project directory
cd /var/www/academia || exit 1

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin master

# Copy config to nginx directory
echo "📋 Copying configuration to nginx..."
cp nginx-proxy.conf /etc/nginx/sites-available/proxy

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration is valid. Reloading nginx..."
    systemctl reload nginx
    echo "✅ Nginx reloaded successfully!"
    echo ""
    echo "🌐 Your sites should now be accessible:"
    echo "   - https://smartdefence.com.br (WordPress)"
    echo "   - https://psicologobelohorizonte.com.br (WordPress)"
    echo ""
    echo "📝 Note: The /academia route has been removed."
    echo "   To access the system, create a subdomain (e.g., app.smartdefence.com.br)"
else
    echo "❌ Configuration test failed! Nginx was NOT reloaded."
    echo "Please check the error messages above."
    exit 1
fi
