-- Migration: Add new StudentCategory values
-- Date: 2025-10-06
-- Description: Adds WOMEN, MEN, MIXED, LAW_ENFORCEMENT to StudentCategory enum

-- Add new enum values (PostgreSQL allows adding values to existing enums)
ALTER TYPE "StudentCategory" ADD VALUE IF NOT EXISTS 'TEEN';
ALTER TYPE "StudentCategory" ADD VALUE IF NOT EXISTS 'KIDS';
ALTER TYPE "StudentCategory" ADD VALUE IF NOT EXISTS 'WOMEN';
ALTER TYPE "StudentCategory" ADD VALUE IF NOT EXISTS 'MEN';
ALTER TYPE "StudentCategory" ADD VALUE IF NOT EXISTS 'MIXED';
ALTER TYPE "StudentCategory" ADD VALUE IF NOT EXISTS 'LAW_ENFORCEMENT';

-- Verify (optional - for debugging)
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'StudentCategory'::regtype::oid ORDER BY enumsortorder;
