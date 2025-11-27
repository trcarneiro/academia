#!/bin/bash
# Script to update .env on the server

cat > .env << 'EOF'
# Connect to Supabase PostgreSQL database (Connection Pooling via PgBouncer)
# Optimized parameters: connection_limit=5 (low for PgBouncer), pool_timeout=10s, connect_timeout=5s
DATABASE_URL="postgresql://postgres.yawfuymgwukericlhgxh:C3po007%2Aa12@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=10&connect_timeout=5"

# Direct connection to the database. Used for migrations (Direct Connection - no pooling)
# Using standard DB URL as pooler port 5432 might be unreachable
DIRECT_URL="postgresql://postgres:C3po007%2Aa12@db.yawfuymgwukericlhgxh.supabase.co:5432/postgres"
# DIRECT_URL="postgresql://postgres.yawfuymgwukericlhgxh:C3po007%2Aa12@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# Shadow database for migrations (opcional)
SHADOW_DATABASE_URL="postgresql://postgres:C3po007%2Aa12@db.yawfuymgwukericlhgxh.supabase.co:5432/postgres"

# JWT Secret (generate a secure random string)
JWT_SECRET="krav-maga-academy-super-secret-jwt-key-change-in-production-256-bits"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
HOST="0.0.0.0"
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://64.227.28.147:3001,http://64.227.28.147"

# Rate Limiting
RATE_LIMIT_MAX=100

# AI Provider Configuration (usar Gemini prioritariamente)
AI_PROVIDER=GEMINI
GEMINI_API_KEY=AIzaSyCkyqslUzkL0F5CTT9uzHb-Fxik0-nuZkE#AIzaSyBURQeVbJ0NCCEZVMNs82u9PNWbAvRWu54

# OpenRouter como fallback (modelo gratuito)
OPENROUTER_API_KEY=sk-or-v1-d4f8c2a1b5e3f9d7a2c8b4e6f1a9d3c7b2e5f8a4c1d6b9e2f7a3c8d5b1e4f7a0c3

# Configurações do RAG (models/gemini-1.5-flash é o único estável na v1/v1beta)
RAG_MODEL=models/gemini-2.5-flash
RAG_MAX_TOKENS=2048
RAG_TEMPERATURE=0.7
RATE_LIMIT_WINDOW="15m"

# Supabase Configuration
SUPABASE_URL="https://yawfuymgwukericlhgxh.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA5NTYsImV4cCI6MjA2NjUzNjk1Nn0.sqm8ZAVJoS_tUGSGFuQapJYFTjfdAa7dkLs437A5bUs"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk2MDk1NiwiZXhwIjoyMDY2NTM2OTU2fQ.f_tR7vBgwf8kLqy2-Z6vWJI4cGVjy4P3xQLemGjDqbM"
NEXT_PUBLIC_SUPABASE_URL="https://yawfuymgwukericlhgxh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA5NTYsImV4cCI6MjA2NjUzNjk1Nn0.sqm8ZAVJoS_tUGSGFuQapJYFTjfdAa7dkLs437A5bUs"
ASAAS_API_KEY="$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ2MzZjY2UzLTAzNTEtNDc1Ny1hNGUyLWE2NmUyOWFlNjUwMTo6JGFhY2hfZGFjYzkzYmEtYzNmMC00Zjk2LThjNzYtMTkyMjM3NGZhZDVk"
ASAAS_IS_SANDBOX=false
ASAAS_BASE_URL="https://www.asaas.com/api/v3"

# Supabase Service Key (for admin operations)
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk2MDk1NiwiZXhwIjoyMDY2NTM2OTU2fQ.f_tR7vBgwf8kLqy2-Z6vWJI4cGVjy4P3xQLemGjDqbM"

# Kiosk Configuration
KIOSK_PORT=3001
EOF

echo ".env file updated successfully."
