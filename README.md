# 🥋 Krav Maga Academy Management System

A comprehensive multi-tenant SaaS platform for martial arts academy management with AI-powered features, gamification, and pedagogical modules.

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
Supabase account (free tier available)
Git
```

### Installation Steps

1. **Clone & Setup**
```bash
git clone <your-repo>
cd academia
npm install
```

2. **Supabase Setup**
```bash
# Create free Supabase project at https://app.supabase.com
# Get your credentials and update .env
cp .env.example .env
# See SUPABASE_SETUP.md for detailed instructions
```

3. **Database Setup**
```bash
# Setup Prisma with Supabase
npx prisma generate
npx prisma db push
```

4. **Start Development Server**
```bash
npm run dev
```

Server runs at: `http://localhost:3000`
API docs at: `http://localhost:3000/docs`

## 🛠 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
npm run db:studio    # Open Prisma Studio
npm test             # Run tests
```

## 🌟 Key Features

### 📚 Pedagogical Module
- **Course Management**: 24-week Krav Maga progression
- **Progress Tracking**: Individual technique mastery
- **Weekly Challenges**: Age/gender-adjusted targets
- **Evaluation System**: Mini-tests and final exams
- **Gamification**: XP, levels, achievements

### 👥 Multi-Tenant Management
- **Organizations**: Unlimited academies support
- **Students**: Categories (Adult, Master, Hero) with progress tracking
- **Instructors**: Specializations and class management
- **Classes**: QR code check-ins, attendance tracking

### 🤖 AI Integration
- **Multi-Provider**: Claude, OpenAI, Gemini, OpenRouter
- **Analytics**: Dropout risk analysis, personalized recommendations
- **Video Analysis**: Ready for technique assessment

## 📋 Quick API Examples

### Authentication
```bash
# Register new academy
POST /api/auth/register
{
  "email": "admin@academy.com",
  "password": "secure123",
  "firstName": "John", 
  "lastName": "Doe",
  "organizationName": "Elite Krav Maga"
}

# Login
POST /api/auth/login
{
  "email": "admin@academy.com",
  "password": "secure123"
}
```

### Student Enrollment
```bash
# Create student
POST /api/students
{
  "email": "student@email.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "category": "ADULT"
}

# Enroll in course
POST /api/pedagogical/enrollments
{
  "studentId": "uuid",
  "courseId": "uuid",
  "category": "ADULT", 
  "gender": "F"
}
```

### Progress Tracking
```bash
# Update technique progress
POST /api/pedagogical/technique-progress
{
  "enrollmentId": "uuid",
  "techniqueId": "uuid", 
  "status": "PROFICIENT",
  "accuracy": 85
}

# Submit challenge
POST /api/pedagogical/challenges/submit
{
  "enrollmentId": "uuid",
  "challengeId": "uuid",
  "actualMetric": 35,
  "actualTime": 55
}
```

## 🔧 Environment Setup

### Minimal Configuration (Supabase)
```bash
DATABASE_URL="postgresql://postgres:password@db.yourproject.supabase.co:5432/postgres"
JWT_SECRET="your-secret-key-here"
SUPABASE_URL="https://yourproject.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

### Optional AI Integration
```bash
ANTHROPIC_API_KEY="your-claude-key"    # Recommended
OPENAI_API_KEY="your-openai-key"
```

## 🏗 Project Structure

```
src/
├── config/           # App configuration
├── middlewares/      # Auth, tenant, validation
├── routes/          # API endpoints
├── services/        # Business logic
├── schemas/         # Zod validation
├── types/           # TypeScript types
└── utils/           # Helper functions

prisma/
├── schema.prisma    # Database schema
└── seeds/           # Sample data
```

## 📊 Core Services

- **ProgressionService**: Student progress analysis
- **GamificationService**: XP, levels, achievements
- **ChallengeService**: Weekly challenge system
- **EvaluationService**: Testing and assessment
- **AchievementService**: Achievement management
- **MultiAIService**: AI provider abstraction

## 🔐 Security Features

- JWT authentication with role-based access
- Multi-tenant data isolation
- Rate limiting and input validation
- SQL injection protection via Prisma ORM

## 📈 Built-in Analytics

- Student progress tracking
- Challenge completion rates
- Evaluation performance metrics
- Gamification leaderboards
- Instructor effectiveness reports

## 🚀 Deployment Options

### Docker (Recommended)
```bash
docker-compose up -d
docker-compose exec api npx prisma db push
```

### Traditional Deployment
```bash
npm run build
NODE_ENV=production npm start
```

## 🆘 Need Help?

1. **API Documentation**: Visit `/docs` when server is running
2. **Database Browser**: Run `npm run db:studio`
3. **Sample Data**: Run `npm run db:seed` (when available)

## 🗺 What's Included

✅ **Complete Backend API** (25+ endpoints)  
✅ **Database Schema** (20+ models)  
✅ **Authentication & Authorization**  
✅ **Multi-tenant Architecture**  
✅ **Pedagogical Module** (courses, progress, challenges)  
✅ **Gamification System** (XP, achievements, leaderboards)  
✅ **Evaluation Framework** (mini-tests, final exams)  
✅ **AI Integration Ready** (multiple providers)  
✅ **Comprehensive Validation** (Zod schemas)  

## 📄 License

MIT License - see LICENSE file for details.

---

🥋 **Ready to revolutionize martial arts academy management!**