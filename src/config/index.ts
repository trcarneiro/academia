import { config } from 'dotenv';

config();

interface Config {
  server: {
    port: number;
    host: string;
    nodeEnv: string;
  };
  database: {
    url: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  ai: {
    provider: 'CLAUDE' | 'GEMINI' | 'OPENAI' | 'OPENROUTER';
    anthropicApiKey: string;
    openaiApiKey: string;
    geminiApiKey: string;
    openRouterApiKey: string;
  };
  video: {
    cloudflareStreamToken: string;
    cloudflareAccountId: string;
  };
  redis: {
    url: string;
  };
  email: {
    sendgridApiKey: string;
  };
  sms: {
    twilioAccountSid: string;
    twilioAuthToken: string;
  };
  payment: {
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    asaasApiKey: string;
  };
  mcp: {
    serverUrl: string;
    apiKey: string;
  };
  analytics: {
    posthogApiKey: string;
    posthogHost: string;
  };
  storage: {
    awsAccessKeyId: string;
    awsSecretAccessKey: string;
    awsRegion: string;
    awsS3Bucket: string;
  };
  logging: {
    level: string;
  };
  rateLimit: {
    max: number;
    window: number;
  };
  cors: {
    origin: string;
  };
}

const getConfig = (): Config => {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    database: {
      url: process.env.DATABASE_URL!,
    },
    supabase: {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    ai: {
      provider: (process.env.AI_PROVIDER as any) || 'CLAUDE',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    },
    video: {
      cloudflareStreamToken: process.env.CLOUDFLARE_STREAM_API_TOKEN || '',
      cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    email: {
      sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    },
    sms: {
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    },
    payment: {
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      asaasApiKey: process.env.ASAAS_API_KEY || '',
    },
    mcp: {
      serverUrl: process.env.MCP_SERVER_URL || '',
      apiKey: process.env.MCP_API_KEY || '',
    },
    analytics: {
      posthogApiKey: process.env.POSTHOG_API_KEY || '',
      posthogHost: process.env.POSTHOG_HOST || 'https://app.posthog.com',
    },
    storage: {
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      awsS3Bucket: process.env.AWS_S3_BUCKET || '',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
    },
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      window: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    },
  };
};

export const appConfig = getConfig();