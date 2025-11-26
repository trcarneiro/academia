#!/bin/bash
# Script de Configuração SSL Automática - Academia Krav Maga
# Executar como root: sudo ./scripts/setup-ssl.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 Configurando SSL para smartdefence.com.br"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Parar e desabilitar OpenLiteSpeed (conflito na porta 80/443)
echo ""
echo "🛑 Parando OpenLiteSpeed..."
if systemctl is-active --quiet lsws; then
    systemctl stop lsws
    systemctl disable lsws
    echo "   ✅ OpenLiteSpeed parado e desabilitado"
else
    echo "   ℹ️  OpenLiteSpeed já estava parado"
fi

# 2. Instalar Nginx e Certbot
echo ""
echo "📦 Instalando Nginx e Certbot..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
echo "   ✅ Pacotes instalados"

# 3. Configurar Nginx
echo ""
echo "⚙️ Configurando Nginx..."
# Remover default se existir
rm -f /etc/nginx/sites-enabled/default

# Copiar configuração do projeto
cp /var/www/academia/nginx-academia.conf /etc/nginx/sites-available/academia

# Criar link simbólico
ln -sf /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/

# Testar configuração
echo "   🧪 Testando configuração do Nginx..."
nginx -t

# Recarregar Nginx
systemctl reload nginx
echo "   ✅ Nginx configurado e recarregado"

# 4. Obter Certificado SSL
echo ""
echo "🔐 Obtendo certificado SSL via Let's Encrypt..."
# --non-interactive: não perguntar nada
# --agree-tos: concordar com termos
# --redirect: forçar HTTPS
# -m: email para renovação
certbot --nginx \
    -d smartdefence.com.br \
    -d www.smartdefence.com.br \
    --non-interactive \
    --agree-tos \
    -m contato@smartdefence.com.br \
    --redirect

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SSL Configurado com Sucesso!"
echo "🌐 Acesse: https://smartdefence.com.br"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
