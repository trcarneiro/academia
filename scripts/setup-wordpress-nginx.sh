#!/bin/bash

# 1. Install PHP-FPM
echo "📦 Installing PHP-FPM..."
apt-get update
apt-get install -y php7.4-fpm php7.4-mysql php7.4-curl php7.4-gd php7.4-mbstring php7.4-xml php7.4-xmlrpc php7.4-zip

# 2. Update Nginx Config
echo "⚙️ Updating Nginx Configuration..."
cat > /etc/nginx/sites-available/academia << 'EOF'
server {
    listen 80;
    server_name smartdefence.com.br www.smartdefence.com.br;
    
    # Root for WordPress
    root /var/www/html;
    index index.php index.html index.htm;

    # WordPress Location
    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    # PHP Handling for WordPress
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }

    # Node.js App (Frontend) - Served as Static Files
    location /academia {
        alias /var/www/academia/public;
        try_files $uri $uri/ /academia/index.html;
    }

    # Node.js App (API) - Proxied to Node.js
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Node.js App (Docs)
    location /docs {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
EOF

# 3. Reload Nginx
echo "🔄 Reloading Nginx..."
nginx -t && systemctl reload nginx

echo "✅ WordPress + Node.js Setup Complete!"
