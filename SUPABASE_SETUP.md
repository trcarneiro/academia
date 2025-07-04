# 🔧 **Supabase Configuration Guide**

## **Step 1: Get Your Supabase Credentials**

### **1.1 Database Connection String**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database** 
4. Copy the **Connection String** → **URI**
5. Replace `[YOUR-PASSWORD]` with your database password

**Example:**
```bash
DATABASE_URL="postgresql://postgres:your_password@db.abcdefghijklmnop.supabase.co:5432/postgres"
```

### **1.2 API Keys**
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## **Step 2: Update Your .env File**

```bash
# Copy example file
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# JWT Secret (generate a secure one)
JWT_SECRET="your-super-secret-jwt-key-256-bits-long"

# Supabase Configuration
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Server
PORT=3000
NODE_ENV="development"
```

## **Step 3: Setup Database Schema**

```bash
# Generate Prisma client
npx prisma generate

# Create all tables in Supabase
npx prisma db push
```

This will create 20+ tables in your Supabase database:
- ✅ Organizations (multi-tenant)
- ✅ Users, Students, Instructors
- ✅ Courses, Techniques, Lesson Plans
- ✅ Enrollments, Progress Tracking
- ✅ Challenges, Evaluations
- ✅ Achievements, Gamification
- ✅ And more...

## **Step 4: Run the Project**

```bash
# Start development server
npm run dev
```

## **Step 5: Verify Connection**

```bash
# Test database connection
curl http://localhost:3000/health

# Should return:
# {"status":"healthy","timestamp":"...","database":"connected"}
```

## **🔍 Optional: Browse Your Database**

```bash
# Open Prisma Studio to see your data
npm run db:studio
```

Or use Supabase Dashboard → **Table Editor**

## **🚀 Quick Test with Supabase**

Create your first organization:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myacademy.com",
    "password": "secure123",
    "firstName": "John",
    "lastName": "Doe", 
    "organizationName": "Elite Krav Maga"
  }'
```

## **💡 Supabase Benefits**

✅ **Managed PostgreSQL** - No server maintenance  
✅ **Automatic Backups** - Built-in data protection  
✅ **Real-time subscriptions** - Perfect for live updates  
✅ **Built-in Auth** - Can integrate with Supabase Auth later  
✅ **Edge Functions** - Serverless functions available  
✅ **Storage** - File uploads built-in  
✅ **Dashboard** - Visual database management  

## **🔐 Security Notes**

- ✅ **service_role** key has full database access (keep secret)
- ✅ **anon** key is safe for frontend use
- ✅ Row Level Security (RLS) is automatically handled by our multi-tenant middleware
- ✅ All queries are filtered by organization ID

## **📊 Monitoring**

Check your Supabase Dashboard for:
- **Database usage**
- **API requests**
- **Real-time connections**
- **Storage usage**

---

**Your Krav Maga Academy is now powered by Supabase!** 🥋✨