import { createClient, SupabaseClient } from '@supabase/supabase-js';
import prisma from './prisma'; // Default import

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseKey;

// ✅ Cliente público com persistência de sessão ATIVADA
export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,     // ✅ Renovar token automaticamente
        persistSession: true,        // ✅ Manter sessão após F5
        detectSessionInUrl: true,    // ✅ Detectar session após OAuth redirect
        flowType: 'pkce'            // ✅ Flow seguro para OAuth
      }
    })
  : null;

// Cliente servidor (sem persistência - apenas para operações admin)
// Only create if service key is provided
export const serverSupabase: SupabaseClient | null = isSupabaseConfigured && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured. Auth features will be disabled.');
}

export async function signUp(email: string, password: string, orgId: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password, 
    options: { data: { orgId } } 
  });
  if (error) throw error;

  const supabaseUserId = data.user!.id;

  // Check if user already exists in Prisma by email
  const existingUser = await prisma.user.findFirst({
    where: { email },
  });

  if (existingUser) {
    // Update existing
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { 
        id: supabaseUserId, // Sync ID if needed, but typically keep separate or map
        organizationId: orgId,
      },
    });
  } else {
    // Create new Prisma user with Supabase ID
    await prisma.user.create({ 
      data: { 
        id: supabaseUserId,
        email, 
        organization: {
          connect: { id: orgId }
        },
        firstName: email.split('@')[0], // Default, update later
        lastName: '', // Default, update later
        password: '', // Supabase handles auth
        role: 'STUDENT', // Default, update via metadata if needed
      },
    });
  }
  return data;
}

export async function signIn(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function getUser(token: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  return data.user;
}