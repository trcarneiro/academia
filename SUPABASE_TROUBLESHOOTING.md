# 🔧 Supabase Connection Troubleshooting

## 🚨 Current Issue
Database connection failing with both direct and pooler connections.

## ✅ What We've Fixed
- Prisma schema is clean and valid
- Environment variables are configured 
- Dependencies are installed
- System is ready to run

## 🔍 Database Connection Debug

### Your Current Configuration:
```
Project URL: https://yawfuymgwukericlhgxh.supabase.co
Project Ref: yawfuymgwukericlhgxh
Password: KjO2H2DFg2fFw9RS
```

## 🛠 Steps to Fix Connection

### 1. Check Supabase Project Status
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Find your project with reference `yawfuymgwukericlhgxh`
3. Check project status - it might be **PAUSED** or **INACTIVE**
4. If paused, click **"Resume Project"** or **"Restore"**

### 2. Verify Database Settings
In your Supabase Dashboard:
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (it should look like):
   ```
   postgresql://postgres.yawfuymgwukericlhgxh:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres
   ```
3. Replace `[PASSWORD]` with your actual password

### 3. Get Fresh Connection Details
In Supabase Dashboard → Settings → Database:
- **Host**: Should be `aws-0-us-east-2.pooler.supabase.com` or `db.yawfuymgwukericlhgxh.supabase.co`
- **Port**: `6543` (pooler) or `5432` (direct)
- **Database**: `postgres`
- **Username**: `postgres.yawfuymgwukericlhgxh`
- **Password**: `KjO2H2DFg2fFw9RS`

### 4. Test These Connection Strings

**Option A: Pooler Connection (Recommended)**
```bash
DATABASE_URL="postgresql://postgres.yawfuymgwukericlhgxh:KjO2H2DFg2fFw9RS@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Option B: Direct Connection**
```bash  
DATABASE_URL="postgresql://postgres.yawfuymgwukericlhgxh:KjO2H2DFg2fFw9RS@db.yawfuymgwukericlhgxh.supabase.co:5432/postgres"
```

**Option C: Alternative Format**
```bash
DATABASE_URL="postgresql://postgres:KjO2H2DFg2fFw9RS@db.yawfuymgwukericlhgxh.supabase.co:5432/postgres"
```

## 🔄 Quick Test Commands

After updating `.env` with correct connection:

```bash
# Test connection
npx prisma db push

# If successful, start server
npm run dev
```

## 📝 Common Issues & Solutions

### Issue: "Can't reach database server"
**Solution**: Project might be paused. Resume it in Supabase Dashboard.

### Issue: "Connection timeout"
**Solution**: Try different connection string format or check firewall.

### Issue: "Authentication failed"
**Solution**: Verify password and username format.

## 🎯 Once Connected Successfully

The system will:
1. Create all database tables (20+ models)
2. Start the API server on port 3000
3. Provide Swagger docs at `/docs`
4. Be ready for student enrollment and course management

## 📞 Next Steps After DB Connection

1. **Test API**: Visit `http://localhost:3000/docs`
2. **Create Organization**: Use the registration endpoint
3. **Add Sample Data**: Run the seed scripts
4. **Start Managing**: Begin adding students and courses

**The entire Krav Maga academy system is ready - just needs the database connection! 🥋**