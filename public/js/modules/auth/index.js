console.log('🔐 Auth Module (Single-File) - Script loaded');

// Supabase configuration
const supabaseUrl = 'https://yawfuymgwukericlhgxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA5NTYsImV4cCI6MjA2NjUzNjk1Nn0.sqm8ZAVJoS_tUGSGFuQapJYFTjfdAa7dkLs437A5bUs';

// Global supabase client - will be initialized when available
let supabaseClient = null;

// Initialize Supabase when available
function initializeSupabase() {
  if (window.supabase && !supabaseClient) {
    console.log('🔐 Initializing Supabase client...');
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,     // ✅ Renovar token automaticamente
        persistSession: true,        // ✅ Manter sessão após F5
        detectSessionInUrl: true,    // ✅ Detectar session após OAuth redirect
        flowType: 'pkce',           // ✅ Flow seguro para OAuth
        storage: window.localStorage // ✅ Usar localStorage para persistência
      }
    });
    console.log('✅ Supabase client initialized with session persistence');
    return true;
  }
  return false;
}

// Check for Supabase availability periodically
const supabaseCheckInterval = setInterval(() => {
  if (initializeSupabase()) {
    clearInterval(supabaseCheckInterval);
    console.log('🔐 Supabase initialization complete');
  }
}, 100);

const AuthModule = {
  container: document.body,
  initialized: false,
  currentUser: null,
  currentOrgId: null,

  async init() {
    console.log('🔐 Auth Module - Starting init...');
    this.container = document.body;

    // Wait for Supabase to be ready
    console.log('🔐 Auth Module - Waiting for Supabase...');
    let attempts = 0;
    while (!supabaseClient && attempts < 50) { // 5 seconds max
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!supabaseClient) {
      throw new Error('Supabase client not available after timeout');
    }

    console.log('🔐 Auth Module - Rendering login form...');
    this.renderLoginForm();
    console.log('🔐 Auth Module - Setting up events...');
    this.setupEvents();

    // Check current session on initialization
    const checkSession = async () => {
      try {
        console.log('🔐 [DEBUG] Checking session...');
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        console.log('🔐 [DEBUG] Session check result:', { 
          hasSession: !!session, 
          hasError: !!error,
          errorMessage: error?.message 
        });

        if (session && !error) {
          console.log('🔐 ✅ Existing session found!');
          console.log('🔐 [DEBUG] Session details:', {
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: new Date(session.expires_at * 1000).toLocaleString()
          });
          
          this.currentUser = session.user;
          this.currentOrgId = session.user.app_metadata?.orgId || localStorage.getItem('orgId');
          
          // Salvar token no localStorage
          localStorage.setItem('token', session.access_token);
          console.log('🔐 ✅ Token saved to localStorage');

          // If we're on login page and user is already logged in, redirect to dashboard
          const currentPath = window.location.pathname;
          if (currentPath === '/index.html' || currentPath === '/') {
            console.log('🔐 User already logged in, redirecting to dashboard...');
            setTimeout(() => {
              window.location.href = '/dashboard.html';
            }, 1000); // Small delay to show login form briefly
          }
        } else {
          console.log('🔐 ❌ No existing session, showing login form');
          if (error) {
            console.error('🔐 [ERROR] Session check error:', error);
          }
        }
      } catch (error) {
        console.error('🔐 [ERROR] Fatal error checking session:', error);
      }
    };

    // Check session on init
    checkSession();

    console.log('🔐 Auth Module - Setting up auth state change listener...');
    // Session persistence with Supabase onAuthStateChange
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('🔐 ⚡ [AUTH STATE CHANGE]', event, session ? 'with session' : 'no session');

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('🔐 ✅ User signed in or token refreshed!');
        console.log('🔐 [DEBUG] Session data:', {
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'unknown'
        });

        this.currentUser = session.user;
        this.currentOrgId = session.user.app_metadata?.orgId || localStorage.getItem('orgId');
        
        // ⭐ SALVAR TOKEN
        localStorage.setItem('token', session.access_token);
        console.log('🔐 ✅ Token saved to localStorage:', session.access_token.substring(0, 20) + '...');
        
        // Verificar se salvou
        const savedToken = localStorage.getItem('token');
        console.log('🔐 [DEBUG] Token verification:', savedToken ? '✅ Saved successfully' : '❌ FAILED TO SAVE');
        
        // Dispatch for other modules
        document.dispatchEvent(new CustomEvent('auth:statechange', { detail: { event, session } }));

        // Only redirect if we're on the login page and not already going to dashboard
        const currentPath = window.location.pathname;
        if (currentPath === '/index.html' || currentPath === '/') {
          console.log('🔐 Redirecting to dashboard from login page...');
          window.location.href = '/dashboard.html';
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('token');
        this.currentUser = null;
        this.currentOrgId = null;
        document.dispatchEvent(new CustomEvent('auth:statechange', { detail: event }));

        // Only redirect to login if we're not already on the login page
        const currentPath = window.location.pathname;
        if (currentPath !== '/index.html' && currentPath !== '/') {
          console.log('🔐 Redirecting to login from other page...');
          window.location.href = '/index.html';
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        // Handle password reset redirect
        this.showMessage('Senha redefinida com sucesso! Você pode fazer login agora.', 'success');
      }
    });

    console.log('🔐 Auth Module - Registering globally...');
    // Register module globally
    window.authModule = this;

    // Dispatch module loaded event
    if (window.app) {
      window.app.dispatchEvent('module:loaded', { name: 'auth' });
    }

    this.initialized = true;
    console.log('✅ Auth Module - Loaded (Single-File)');

    return this;
  },

  renderLoginForm() {
    // Check if we're in development mode (localhost)
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    this.container.innerHTML = `
      <div class="module-header-premium">
        <div class="breadcrumb">
          <span class="breadcrumb-item active">Login</span>
        </div>
        <h1 class="module-title-premium">🔐 Login</h1>
        <div class="module-subtitle">Acesse sua conta na academia</div>
      </div>

      <div class="data-card-premium">
        ${isDevelopment ? `
        <div class="dev-login-banner" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; color: white;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.2rem;">🔧</span>
            <strong>Modo Desenvolvimento</strong>
          </div>
          <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">
            Auto-login disponível com usuário de desenvolvimento
          </p>
          <button type="button" id="dev-auto-login-btn" class="btn btn-primary" style="margin-top: 1rem; width: 100%; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);">
            ⚡ Login Automático (dev@academia.com)
          </button>
        </div>
        ` : ''}
        
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" name="email" required ${isDevelopment ? 'value="dev@academia.com"' : ''}>
          </div>

          <div class="form-group">
            <label for="password">Senha *</label>
            <input type="password" id="password" name="password" required ${isDevelopment ? 'value="dev123"' : ''}>
          </div>

          <button type="submit" class="btn btn-primary">Entrar</button>
        </form>

        <div id="auth-message"></div>

        <div class="social-login">
          <button type="button" id="google-signin" class="btn btn-secondary">
            <i class="fab fa-google"></i> Google
          </button>
        </div>
      </div>
    `;
  },

  setupEvents() {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }

    // Dev auto-login button
    const devAutoLoginBtn = document.getElementById('dev-auto-login-btn');
    if (devAutoLoginBtn) {
      devAutoLoginBtn.addEventListener('click', async () => {
        await this.handleDevAutoLogin();
      });
    }

    // Google sign-in button
    const googleBtn = document.getElementById('google-signin');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        await this.handleGoogleSignIn();
      });
    }
  },

  async handleDevAutoLogin() {
    console.log('🔧 [DEV] Auto-login triggered...');
    
    try {
      const devAutoLoginBtn = document.getElementById('dev-auto-login-btn');
      if (devAutoLoginBtn) {
        devAutoLoginBtn.disabled = true;
        devAutoLoginBtn.textContent = '⏳ Criando usuário e fazendo login...';
      }

      // Call backend to create/get dev user
      const response = await fetch('http://localhost:3000/api/dev-auth/auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to auto-login');
      }

      console.log('🔧 [DEV] Auto-login successful:', result.data.user);

      // Save token and user data
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('orgId', result.data.user.organizationId);
      localStorage.setItem('userId', result.data.user.id);
      localStorage.setItem('userRole', result.data.user.role);
      localStorage.setItem('userEmail', result.data.user.email);
      localStorage.setItem('userName', `${result.data.user.firstName} ${result.data.user.lastName}`);

      this.currentUser = result.data.user;
      this.currentOrgId = result.data.user.organizationId;

      console.log('🔧 [DEV] Saved data to localStorage:', {
        token: result.data.token.substring(0, 20) + '...',
        orgId: result.data.user.organizationId,
        userId: result.data.user.id,
        role: result.data.user.role
      });

      // Show success message
      this.showMessage(`✅ Login automático bem-sucedido! Bem-vindo, ${result.data.user.firstName}!`, 'success');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);

    } catch (error) {
      console.error('🔧 [DEV] Auto-login error:', error);
      this.showMessage('❌ Erro no auto-login: ' + error.message, 'error');
      
      const devAutoLoginBtn = document.getElementById('dev-auto-login-btn');
      if (devAutoLoginBtn) {
        devAutoLoginBtn.disabled = false;
        devAutoLoginBtn.textContent = '⚡ Login Automático (dev@academia.com)';
      }
    }
  },

  async handleLogin() {
    if (!supabaseClient) {
      this.showMessage('Sistema de autenticação não está pronto. Tente novamente.', 'error');
      return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      this.showMessage('Preencha todos os campos', 'error');
      return;
    }

    try {
      console.log('🔐 [LOGIN] Attempting login with email:', email);
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('🔐 [LOGIN ERROR]', error);
        throw error;
      }

      console.log('🔐 ✅ Login successful!');
      console.log('🔐 [DEBUG] Session data:', {
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
        hasAccessToken: !!data.session?.access_token
      });

      // Salvar token explicitamente
      localStorage.setItem('token', data.session.access_token);
      console.log('🔐 ✅ Token saved to localStorage');
      
      // Verificar se salvou
      const savedToken = localStorage.getItem('token');
      console.log('🔐 [DEBUG] Token verification:', savedToken ? '✅ Saved' : '❌ FAILED');
      
      // onAuthStateChange should handle redirect, but force it just in case
      console.log('🔐 Redirecting to dashboard...');
      window.location.href = '/dashboard.html';
    } catch (error) {
      console.error('🔐 [LOGIN ERROR]', error);
      this.showMessage(error.message, 'error');
    }
  },

  async handleGoogleSignIn() {
    if (!supabaseClient) {
      this.showMessage('Sistema de autenticação não está pronto. Tente novamente.', 'error');
      return;
    }

    try {
      console.log('🔐 Iniciando Google OAuth...');
      
      // ✅ Redirect para a mesma página (index.html) - Supabase detectará automaticamente
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/index.html',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;

      console.log('🔐 Google OAuth iniciado, aguardando redirect...', data);
      // Não precisa redirecionar manualmente - o Supabase faz isso
      
    } catch (error) {
      console.error('🔐 Erro no Google OAuth:', error);
      this.showMessage(error.message, 'error');
    }
  },

  showMessage(message, type) {
    const messageEl = document.getElementById('auth-message');
    if (messageEl) {
      messageEl.innerHTML = `<div class="notification-${type}">${message}</div>`;
    }
  }
};

// Global registration
window.AuthModule = AuthModule;
window.authModule = AuthModule;

// Initialization function
window.initAuthModule = async function(container) {
  AuthModule.container = container || document.body;
  return await AuthModule.init();
};

console.log('🔐 Auth Module (Single-File) loaded and ready');