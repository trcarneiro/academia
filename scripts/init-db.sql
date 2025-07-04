-- Initial database setup script
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (PostgreSQL automatically creates the database from POSTGRES_DB env var)
-- This file can be used for additional setup if needed

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance (will be created by Prisma, but we can add custom ones here)
-- Note: Prisma will handle most of the database schema creation

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Krav Maga Academy database initialized successfully';
END $$;