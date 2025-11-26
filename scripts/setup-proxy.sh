#!/bin/bash
set -e

echo "🔄 Configurando Proxy Reverso (Nginx -> OLS + Node)..."

# 1. Backup OLS Config
cp /usr/local/lsws/conf/httpd_config.conf /usr/local/lsws/conf/httpd_config.conf.bak.$(date +%s)

# 2. Change OLS Ports
# Change *:80 to *:8080
sed -i 's/address.*:80$/address                 *:8080/g' /usr/local/lsws/conf/httpd_config.conf
# Change *:443 to *:8443
sed -i 's/address.*:443$/address                 *:8443/g' /usr/local/lsws/conf/httpd_config.conf

echo "✅ Portas do OpenLiteSpeed alteradas (80->8080, 443->8443)"

# 3. Configure Nginx
cp nginx-proxy.conf /etc/nginx/sites-available/proxy
ln -sf /etc/nginx/sites-available/proxy /etc/nginx/sites-enabled/proxy
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/academia

echo "✅ Configuração do Nginx aplicada"

# 4. Restart Services
systemctl stop lsws || systemctl stop openlitespeed
systemctl start lsws || systemctl start openlitespeed
systemctl enable nginx
systemctl restart nginx

echo "🚀 Serviços reiniciados!"
echo "   - Nginx ouvindo em 80/443"
echo "   - OpenLiteSpeed ouvindo em 8080/8443"
echo "   - Node.js ouvindo em 3000"
