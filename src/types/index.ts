// Import Prisma enums first to use them in this file
import {
  UserRole,
  StudentCategory,
  CourseLevel,
  TechniqueCategory,
  TechniqueProficiency,
  ClassStatus,
  AttendanceStatus,
  CheckInMethod,
  EnrollmentStatus,
  EvaluationType,
  EvaluationStatus,
  AchievementCategory,
  AchievementRarity,
  ChallengeType,
  ChallengeDifficulty,
  RecurringType,
  BillingType,
  SubscriptionStatus,
  PaymentStatus,
  PaymentMethod,
  CourseCategory,
  AttendanceTrend,
  DropoutRisk,
  AIProvider
} from '@prisma/client';

// Re-export them
export {
  UserRole,
  StudentCategory,
  CourseLevel,
  TechniqueCategory,
  TechniqueProficiency,
  ClassStatus,
  AttendanceStatus,
  CheckInMethod,
  EnrollmentStatus,
  EvaluationType,
  EvaluationStatus,
  AchievementCategory,
  AchievementRarity,
  ChallengeType,
  ChallengeDifficulty,
  RecurringType,
  BillingType,
  SubscriptionStatus,
  PaymentStatus,
  PaymentMethod,
  CourseCategory,
  AttendanceTrend,
  DropoutRisk,
  AIProvider
};

// Authentication Types
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string;
  iat?: number;
  exp?: number;
}

// Multi-tenant Types
export interface TenantContext {
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    settings?: OrganizationSettings;
  };
}

export interface OrganizationSettings {
  enableGamification: boolean;
  enableVideoAnalysis: boolean;
  enableAIRecommendations: boolean;
  enableMultipleArts: boolean;
  aiProvider: AIProvider;
  checkinWindowStart: number;
  checkinWindowEnd: number;
}

// Gamification Types
export interface StudentXP {
  totalXP: number;
  globalLevel: number;
  artSpecificXP: { [artId: string]: number };
  artSpecificLevels: { [artId: string]: number };
}

export interface XPTransaction {
  type: 'ATTENDANCE' | 'TECHNIQUE_MASTERY' | 'ACHIEVEMENT' | 'CHALLENGE' | 'EVALUATION';
  amount: number;
  description: string;
  source?: string; // classId, techniqueId, achievementId, etc.
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  criteria: AchievementCriteria;
  xpReward: number;
  badgeImageUrl?: string;
  rarity: AchievementRarity;
  isHidden: boolean;
}

export interface AchievementCriteria {
  type: 'attendance' | 'technique' | 'progression' | 'social' | 'custom';
  condition: string; // e.g., 'classes_attended >= 10'
  targetValue?: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  martialArtId?: string;
}

// Progression Types
export interface ProgressionStep {
  level: number;
  grade: string;
  requiredXP: number;
  requiredTechniques: string[];
  requiredClasses: number;
  requiredEvaluations: number;
  estimatedTimeMonths: number;
}

export interface StudentProgress {
  currentLevel: number;
  currentGrade: string;
  totalXP: number;
  progressToNext: number; // 0-100%
  nextStep: ProgressionStep;
  techniquesLearned: number;
  techniquesTotal: number;
}

// Technique Analysis Types
export interface TechniqueAnalysis {
  techniqueId: string;
  techniqueName: string;
  proficiency: TechniqueProficiency;
  masteryScore: number; // 0-100
  practiceCount: number;
  avgAccuracy?: number;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
}

export interface VideoAnalysisResult {
  accuracy: number; // 0-100
  form: number; // 0-100
  timing: number; // 0-100
  power: number; // 0-100
  feedback: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  keyPoints: Array<{
    timestamp: number;
    comment: string;
    type: 'good' | 'improvement' | 'error';
  }>;
}

// Lesson Plan Types
export interface LessonActivity {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  instructions: string[];
  equipment?: string[];
  difficulty: number; // 1-5
  techniques?: string[]; // technique IDs
  objectives?: string[];
}

export interface LessonPhase {
  warmup: LessonActivity[];
  technique: LessonActivity[];
  sparring: LessonActivity[];
  cooldown: LessonActivity[];
}

// AI Analysis Types
export interface AIAnalysisRequest {
  type: 'dropout_risk' | 'progress_analysis' | 'recommendations' | 'technique_feedback' | 'video_analysis';
  studentId: string;
  data: any;
  context?: TenantContext;
}

export interface AIAnalysisResponse {
  success: boolean;
  data: any;
  confidence: number; // 0-1
  provider: AIProvider;
  processingTime: number;
  error?: string;
}

export interface DropoutRiskAnalysis {
  studentId: string;
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  recommendations: string[];
  confidence: number;
  trend: AttendanceTrend;
  estimatedChurnDate?: string;
}

export interface RecommendationSet {
  classRecommendations: ClassRecommendation[];
  techniqueRecommendations: TechniqueRecommendation[];
  generalRecommendations: string[];
  insights: {
    preferredDays: string[];
    preferredTimes: string[];
    recommendedFrequency: string;
    strengths: string[];
    improvementAreas: string[];
  };
}

export interface ClassRecommendation {
  classId: string;
  score: number; // 0-100
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  distance?: number; // if geolocation is available
  instructor?: {
    name: string;
    rating?: number;
  };
}

export interface TechniqueRecommendation {
  techniqueId: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedMasteryTime: string;
  prerequisites: string[];
}

// Challenge Types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  startDate: Date;
  endDate: Date;
  isRecurring: boolean;
  recurringType?: RecurringType;
  criteria: ChallengeCriteria;
  rewards: ChallengeReward;
  isActive: boolean;
}

export interface ChallengeCriteria {
  type: 'attendance' | 'technique' | 'streak' | 'social' | 'fitness' | 'custom';
  targetValue: number;
  condition: string; // e.g., 'attend 5 classes this week'
  measurementUnit: string; // e.g., 'classes', 'techniques', 'days'
}

export interface ChallengeReward {
  xp: number;
  achievement?: string; // achievement ID
  badge?: string; // badge image URL
  discount?: number; // percentage discount
  custom?: string; // custom reward description
}

export interface ChallengeProgress {
  challengeId: string;
  currentValue: number;
  targetValue: number;
  progress: number; // 0-100%
  isCompleted: boolean;
  completedAt?: Date;
  daysRemaining: number;
}

// Analytics Types
export interface AttendancePattern {
  studentId: string;
  totalClasses: number;
  attendedClasses: number;
  attendanceRate: number;
  consecutiveAbsences: number;
  averageCheckInTime?: string;
  preferredDays: string[];
  preferredTimeSlots: string[];
  recentTrend: AttendanceTrend;
  dropoutRisk: DropoutRisk;
  riskFactors: string[];
  recommendations: string[];
  aiInsights?: any;
}

export interface OrganizationAnalytics {
  totalStudents: number;
  activeStudents: number;
  avgAttendanceRate: number;
  topPerformingClasses: Array<{
    classId: string;
    className: string;
    attendanceRate: number;
  }>;
  atRiskStudents: Array<{
    studentId: string;
    studentName: string;
    riskScore: number;
  }>;
  revenueMetrics: {
    monthlyRevenue: number;
    avgRevenuePerStudent: number;
    churnRate: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  organizationId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// File Upload Types
export interface FileUpload {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Video Analysis Types
export interface VideoUpload extends UploadedFile {
  duration?: number;
  resolution?: string;
  frameRate?: number;
  processed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  analysisResults?: VideoAnalysisResult;
}

// Notification Types
export interface NotificationPayload {
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  imageUrl?: string;
  data?: any;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  categories: {
    classReminders: boolean;
    achievements: boolean;
    challenges: boolean;
    progress: boolean;
    promotions: boolean;
  };
}

// MCP (Model Context Protocol) Types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (input: any) => Promise<any>;
}

export interface MCPRequest {
  tool: string;
  input: any;
  context: TenantContext;
  userId: string;
}

export interface MCPResponse {
  success: boolean;
  data: any;
  error?: string;
  executionTime: number;
}

// Webhook Types
export interface WebhookEvent {
  type: string;
  organizationId: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

// Integration Types
export interface PaymentGatewayConfig {
  type: 'stripe' | 'asaas' | 'paypal';
  credentials: {
    [key: string]: string;
  };
  webhookUrl: string;
  isActive: boolean;
}

export interface EmailProvider {
  type: 'sendgrid' | 'ses' | 'mailgun';
  credentials: {
    [key: string]: string;
  };
  isActive: boolean;
}

// Facial Recognition Types
export interface FaceRecognitionResult {
  confidence: number;
  studentId?: string;
  isMatch: boolean;
  landmarks?: Array<{ x: number; y: number }>;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface FaceProfile {
  studentId: string;
  encodings: number[][];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}