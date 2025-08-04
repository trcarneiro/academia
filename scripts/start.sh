#!/bin/bash

# 🥋 Krav Maga Academy - Quick Start Script

echo "🥋 Krav Maga Academy Management System"
echo "====================================="
echo

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Setting up environment..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo
    echo "🔧 NEXT STEPS:"
    echo "1. Edit .env with your Supabase credentials:"
    echo "   - DATABASE_URL (from Supabase Dashboard → Settings → Database)"
    echo "   - SUPABASE_URL and SUPABASE_ANON_KEY (from Settings → API)"
    echo "2. See SUPABASE_SETUP.md for detailed instructions"
    echo
    echo "⚠️  Please configure .env before continuing..."
    read -p "Press Enter when .env is configured, or Ctrl+C to exit..."
    echo
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo
fi

# Check if Prisma client is generated
echo "🔧 Setting up database..."
npx prisma generate
echo "✅ Prisma client generated"

# Check if database is accessible
echo "🗄️  Connecting to Supabase database..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Database schema synchronized with Supabase"
else
    echo "❌ Supabase connection failed!"
    echo
    echo "🔧 Troubleshooting:"
    echo "1. Check your DATABASE_URL in .env"
    echo "2. Verify Supabase project is active"
    echo "3. Check your database password"
    echo "4. See SUPABASE_SETUP.md for help"
    echo
    exit 1
fi

echo
echo "🚀 Starting development server..."
echo "Server will be available at: http://localhost:3000"
echo "API documentation: http://localhost:3000/docs"
echo "Database studio: Run 'npm run db:studio' in another terminal"
echo "Supabase Dashboard: https://app.supabase.com"
echo

# Start the development server
npm run dev