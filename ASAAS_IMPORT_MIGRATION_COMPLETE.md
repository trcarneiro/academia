# Asaas Import Script - Prisma Migration Complete ✅

## Overview
Successfully migrated `scripts/asaas-import.js` from Supabase to Prisma ORM for importing Asaas customers into the Academia system.

## Changes Made

### 1. Database Client Migration
**Before (Supabase):**
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

**After (Prisma):**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

### 2. Configuration Updates
- Changed API from sandbox to **production**: `https://api.asaas.com/v3`
- Updated default organization ID to production org
- Removed Supabase environment variable requirements
- Added Prisma disconnect on completion and errors

### 3. Database Operations Converted

#### `userExists(email, cpf)`
**Before:** `supabase.from('User').select('id').eq('email', email)`
**After:** `prisma.user.findFirst({ where: { OR: [{ email }, { cpf }] } })`

**Improvements:**
- Now checks both email AND CPF for duplicates
- Handles null/undefined values gracefully
- Uses Prisma's type-safe query builder
- Better performance with compound OR conditions

#### `createUser(customerData)`
**Before:** `supabase.from('User').insert(userData).select().single()`
**After:** `prisma.user.create({ data: userData })`

**Added fields:**
- `birthDate`: Imported from Asaas `dateOfBirth`
- `password`: Generated temporary password (12 chars)
- `organizationId`: Links to default organization

**Email handling:**
- If customer has email: uses it directly
- If no email: generates temporary email in format `{asaasCustomerId}@asaas-import.temp`
- Requires `--allow-no-email` flag to import customers without email

#### `createStudent(userId, customerData, organizationId)`
**Before:** `supabase.from('Student').insert(studentData).select().single()`
**After:** `prisma.student.create({ data: { userId, organizationId, ... } })`

**Schema compliance:**
- Uses `isActive` instead of `status` field
- Stores import metadata in `medicalConditions` (includes Asaas customer ID + import date)
- Properly links to User and Organization

#### `enrollStudent(studentId, courseId, classId)`
**Before:** `supabase.from('StudentCourse').insert(enrollmentData).select().single()`
**After:** `prisma.studentCourse.create({ data: { studentId, courseId, ... } })`

**Fixed fields:**
- Changed `enrollmentDate` to `startDate` (schema field name)
- Added `isActive: true` flag
- Handles optional `classId` properly

### 4. Error Handling Improvements
- Added Prisma disconnect in catch blocks
- Removed Supabase-specific error checking
- Cleaner async/await patterns

## Usage

### Prerequisites
```bash
# Ensure Prisma client is generated
npx prisma generate

# Verify environment variables
# Required: ASAAS_API_KEY (production key)
# Database URL configured in .env
```

### Command Examples

```bash
# Dry run - see what would be imported without actually importing
node scripts/asaas-import.js --dry-run

# Import first 10 customers
node scripts/asaas-import.js --limit=10

# Import 50 customers without auto-enrolling in course
node scripts/asaas-import.js --limit=50 --no-enroll

# Import customers even if they don't have email (generates temp email)
node scripts/asaas-import.js --limit=20 --allow-no-email

# Full import (default: 100 customers)
node scripts/asaas-import.js
```

### CLI Options
- `--limit=N`: Import at most N customers (default: 100)
- `--dry-run`: Preview customers without importing
- `--no-enroll`: Create users/students but skip course enrollment
- `--allow-no-email`: Import customers even without email (generates temporary email format: `{asaasId}@asaas-import.temp`)
- `--help`: Display usage information

## Database Schema Requirements

### User Table
- `id` (String, UUID)
- `organizationId` (String, required)
- `email` (String, nullable)
- `password` (String, required)
- `firstName` (String, required)
- `lastName` (String, required)
- `phone` (String, nullable)
- `cpf` (String, nullable)
- `birthDate` (DateTime, nullable)
- `role` (UserRole enum, defaults to STUDENT)
- `isActive` (Boolean, defaults to true)

### Student Table
- `id` (String, UUID)
- `organizationId` (String, required)
- `userId` (String, unique, required)
- `enrollmentDate` (DateTime, defaults to now)
- `isActive` (Boolean, defaults to true)
- `medicalConditions` (String, nullable) - stores import metadata

### StudentCourse Table
- `id` (String, UUID)
- `studentId` (String, required)
- `courseId` (String, required)
- `classId` (String, nullable)
- `startDate` (DateTime, defaults to now)
- `status` (EnrollmentStatus enum, defaults to ACTIVE)
- `isActive` (Boolean, defaults to true)

## Import Flow

1. **Fetch Asaas Customers**
   - Calls Asaas API `/customers` endpoint
   - Paginates through all customers (100 per page)
   - Respects `--limit` parameter

2. **Check for Duplicates**
   - Queries database for existing email OR CPF
   - Skips customer if already exists
   - Handles customers without email if `--allow-no-email` flag is set

3. **Create User Account**
   - Parses full name into firstName/lastName
   - Generates temporary password
   - Links to organization
   - Imports contact info (email, phone, CPF)
   - **Email handling**: Uses actual email if provided, generates `{asaasId}@asaas-import.temp` if missing

4. **Create Student Record**
   - Links to created user
   - Sets enrollment date to today
   - Stores Asaas customer ID in medicalConditions field

5. **Enroll in Course** (optional)
   - Links student to default Krav Maga course
   - Optionally assigns to specific class
   - Sets active enrollment status

## Output Example

```
🚀 Starting Asaas customer import...
📊 Options: limit=10, dryRun=false, enrollInCourse=true, allowWithoutEmail=true

📊 Fetched 350 customers from Asaas
📦 Processing batch 1/4 (customers 1-100)...

👤 Processing: João Silva (joao@email.com)
👤 Created user: João Silva
🎓 Created student record for: João
📚 Enrolled João in Krav Maga course
✅ Successfully imported: João Silva

👤 Processing: Maria Santos (no email)
👤 Created user: Maria Santos (temp email: cus_abc123@asaas-import.temp)
🎓 Created student record for: Maria
📚 Enrolled Maria in Krav Maga course
✅ Successfully imported: Maria Santos

⏭️ Skipped (already exists): Pedro Costa

...

============================================================
📊 IMPORT SUMMARY
============================================================
Total processed: 10
✅ Successfully imported: 7 (2 with temporary emails)
⏭️ Skipped (already exist): 2
❌ Errors: 1

❌ ERRORS:
  - Ana Silva: No name provided

🎉 Import process completed!
```

## Testing Checklist

✅ Script syntax updated (no Supabase references)
✅ Prisma client initialization
✅ User creation with required fields
✅ Student creation with schema compliance
✅ StudentCourse enrollment with correct field names
✅ Duplicate detection (email + CPF)
✅ Error handling with Prisma disconnect
✅ CLI help text updated
⚠️ **Pending:** Run actual import test with production data

## Next Steps

1. **Test with Dry Run First**
   ```bash
   node scripts/asaas-import.js --limit=5 --dry-run
   ```

2. **Import Small Batch**
   ```bash
   node scripts/asaas-import.js --limit=5
   ```

3. **Verify in Database**
   ```bash
   npm run db:studio
   ```
   Check that:
   - Users created with correct data
   - Students linked to users
   - StudentCourse records created
   - No duplicate entries

4. **Full Import**
   ```bash
   node scripts/asaas-import.js
   ```

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"
**Solution:** Run `npx prisma generate` and `npm install`

### Error: "Foreign key constraint failed"
**Possible causes:**
- Default organization ID doesn't exist in database
- Default course ID doesn't exist
- User/Student relationship issue

**Solution:** Verify DEFAULT_ORG_ID and DEFAULT_COURSE_ID exist in database

### Error: "Unique constraint failed on email"
**Cause:** Customer already imported
**Solution:** Script automatically skips - this is expected behavior

### Error: "No email provided (use --allow-no-email to import anyway)"
**Cause:** Customer doesn't have email and `--allow-no-email` flag not set
**Solution:** 
- Add `--allow-no-email` flag to import customers without email
- Temporary email will be generated in format: `{asaasCustomerId}@asaas-import.temp`
- Example: `node scripts/asaas-import.js --limit=10 --allow-no-email`

### Error: "ASAAS_API_KEY not configured"
**Solution:** Add production Asaas API key to `.env` file

## Migration Summary

| Aspect | Status |
|--------|--------|
| Database Client | ✅ Prisma |
| API Configuration | ✅ Production |
| User Creation | ✅ Schema Compliant |
| Student Creation | ✅ Schema Compliant |
| Course Enrollment | ✅ Schema Compliant |
| Duplicate Detection | ✅ Enhanced (email + CPF) |
| Error Handling | ✅ Prisma-compatible |
| CLI Interface | ✅ Updated |
| Documentation | ✅ Complete |

**Migration Date:** January 2025
**Script Location:** `scripts/asaas-import.js`
**Documentation:** `ASAAS_IMPORT_MIGRATION_COMPLETE.md`
