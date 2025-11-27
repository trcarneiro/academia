// AUTH MODULE v2.0 - Supabase Integration
if (typeof window.AuthModule !== 'undefined') {
    console.log('Auth Module v2.0 already loaded');
} else {
    console.log('Auth Module v2.0 loaded');

    const SUPABASE_URL = 'https://yawfuymgwukericlhgxh.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA5NTYsImV4cCI6MjA2NjUzNjk1Nn0.sqm8ZAVJoS_tUGSGFuQapJYFTjfdAa7dkLs437A5bUs';
    // Use current origin for backend URL to support both local and production environments
    const BACKEND_URL = window.location.origin;
    const SIGNIN_RELOAD_FLAG = 'auth:signin-reload-pending';
    const SIGNOUT_RELOAD_FLAG = 'auth:signout-reload-pending';

    let supabaseClient = null;

    function initializeSupabase() {
        if (window.supabase && !supabaseClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, flowType: 'pkce' }
            });
            return true;
        }
        return false;
    }

    if (typeof window !== 'undefined') {
        const checkInterval = setInterval(() => {
            if (initializeSupabase()) clearInterval(checkInterval);
        }, 100);
    }

const AuthModule = {
  container: null,
  currentUser: null,
  currentOrganization: null,
  authAPI: null,
  hasHandledPersistentSignIn: false,

  async init(container) {
    this.container = container || document.body;
    await this.waitForSupabase();
    await this.initializeAPI();
    this.renderLoginForm();
    await this.checkSession();
    this.setupAuthStateListener();
    window.authModule = this;
    if (window.app) window.app.dispatchEvent('module:loaded', { name: 'auth' });
    return this;
  },

  async waitForSupabase() {
    let attempts = 0;
    while (!supabaseClient && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    if (!supabaseClient) throw new Error('Supabase timeout');
  },

  async initializeAPI() {
    if (typeof window.waitForAPIClient === 'function') await window.waitForAPIClient();
    else {
      let attempts = 0;
      while (!window.createModuleAPI && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
    }
    if (window.createModuleAPI) this.authAPI = window.createModuleAPI('Auth');
  },

  async checkSession() {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) return;
      if (session) {
        await this.syncUserWithBackend(session);
        this.currentUser = session.user;
        this.currentOrganization = session.user.user_metadata?.organizationId || localStorage.getItem('organizationId');
        // Session válida - esconder overlay de login
        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) authOverlay.style.display = 'none';
        console.log('✅ Session válida - usuário autenticado');
      } else {
        // Sem session - mostrar login
        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) authOverlay.style.display = 'block';
        this.renderLoginForm();
      }
    } catch (e) { console.error('Session check error:', e); }
  },

  setupAuthStateListener() {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await this.syncUserWithBackend(session);
        this.currentUser = session.user;
        this.currentOrganization = session.user.user_metadata?.organizationId || localStorage.getItem('organizationId');
        document.dispatchEvent(new CustomEvent('auth:statechange', { detail: { event, session } }));
        // Após login, recarregar página para mostrar dashboard com menu lateral
        if (event === 'SIGNED_IN') {
          try {
            if (sessionStorage.getItem(SIGNIN_RELOAD_FLAG)) {
              sessionStorage.removeItem(SIGNIN_RELOAD_FLAG);
              console.log('✅ Login detectado após reload anterior - mantendo sessão ativa sem novo refresh');
              this.hasHandledPersistentSignIn = true;
            } else {
              if (this.hasHandledPersistentSignIn) {
                console.log('ℹ️ Evento SIGNED_IN ignorado (sessão já estabilizada)');
                return;
              }
              console.log('✅ Login realizado - recarregando dashboard');
              sessionStorage.setItem(SIGNIN_RELOAD_FLAG, '1');
              window.location.reload();
            }
          } catch (storageError) {
            console.warn('⚠️ Falha ao gerenciar flag de reload pós-login:', storageError);
            window.location.reload();
          }
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentOrganization = null;
        ['token', 'organizationId', 'userId', 'userRole'].forEach(k => localStorage.removeItem(k));
        document.dispatchEvent(new CustomEvent('auth:statechange', { detail: { event } }));
        // Após logout, recarregar página para mostrar login
        try {
          if (sessionStorage.getItem(SIGNOUT_RELOAD_FLAG)) {
            sessionStorage.removeItem(SIGNOUT_RELOAD_FLAG);
            console.log('✅ Logout processado após reload - aguardando nova autenticação');
            this.hasHandledPersistentSignIn = false;
          } else {
            console.log('✅ Logout realizado - recarregando para login');
            sessionStorage.setItem(SIGNOUT_RELOAD_FLAG, '1');
            window.location.reload();
          }
        } catch (storageError) {
          console.warn('⚠️ Falha ao gerenciar flag de reload pós-logout:', storageError);
          window.location.reload();
        }
      }
    });
  },

  async syncUserWithBackend(session) {
    try {
      if (!session || !session.user) return;
      const user = session.user;
      const userMeta = user.user_metadata || {};
      const appMeta = user.app_metadata || {};
      let orgId = userMeta.organizationId || appMeta.organizationId;
      
      if (!orgId) {
        const fetchedOrgId = await this.fetchOrganizationFromBackend(user.email, session.access_token);
        if (fetchedOrgId) {
          orgId = fetchedOrgId;
          localStorage.setItem('organizationId', fetchedOrgId);
        }
        if (!orgId) {
          console.warn('⚠️ No organizationId found for user');
          return;
        }
      }
      
      localStorage.setItem('token', session.access_token);
      localStorage.setItem('organizationId', orgId);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userEmail', user.email);
      console.log(`✅ User synced: ${user.email} → Org: ${orgId.substring(0, 8)}...`);
    } catch (e) { console.error('Sync error:', e); }
  },

  async fetchOrganizationFromBackend(email) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/by-email?email=${encodeURIComponent(email)}`);
      if (res.ok) return (await res.json()).data?.organizationId;
    } catch (e) { console.error('Fetch org error:', e); }
    return null;
  },

  renderLoginForm() {
    const isDev = window.location.hostname === 'localhost';
    this.container.innerHTML = `
      <div class="module-header-premium">
        <h1>Login</h1>
        <p>Powered by Supabase</p>
      </div>
      <div class="data-card-premium">
        ${isDev ? '<div style="background:#667eea;color:white;padding:1rem;border-radius:8px;margin-bottom:1rem"><strong>Dev Mode</strong><p>Use trcampos@gmail.com</p></div>' : ''}
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" required placeholder="seu@email.com" ${isDev ? 'value="trcampos@gmail.com"' : ''}>
          </div>
          <div class="form-group">
            <label for="password">Senha *</label>
            <input type="password" id="password" required placeholder="">
          </div>
          <button type="submit" class="btn btn-primary" id="login-btn">Entrar</button>
        </form>
        <div id="auth-message" style="margin-top:1rem"></div>
        <div style="text-align:center;margin:2rem 0;color:#999"><span style="background:white;padding:0 1rem">ou</span></div>
        <button type="button" id="google-signin" class="btn btn-secondary" style="width:100%">Google</button>
        <div style="text-align:center;margin-top:2rem"><a href="/reset-password.html" style="color:#667eea">Esqueceu sua senha?</a></div>
      </div>
    `;
    this.setupEvents();
  },

  setupEvents() {
    const form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', async (e) => { e.preventDefault(); await this.handleLogin(); });
    const googleBtn = document.getElementById('google-signin');
    if (googleBtn) googleBtn.addEventListener('click', async () => await this.handleGoogleSignIn());
  },

  async handleLogin() {
    if (!supabaseClient) { this.showMessage('Sistema não pronto', 'error'); return; }
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');
    if (!email || !password) { this.showMessage('Preencha todos os campos', 'error'); return; }
    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Autenticando...'; }
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.showMessage('Login bem-sucedido!', 'success');
    } catch (e) {
      let msg = e.message;
      if (msg.includes('Invalid login')) msg = 'Email ou senha incorretos';
      this.showMessage(msg, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
    }
  },

  async handleGoogleSignIn() {
    if (!supabaseClient) { this.showMessage('Sistema não pronto', 'error'); return; }
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/index.html' }
      });
      if (error) throw error;
    } catch (e) { this.showMessage(e.message, 'error'); }
  },

  async handleLogout() {
    if (!supabaseClient) return;
    try {
      await supabaseClient.auth.signOut();
    } catch (e) { console.error('Logout error:', e); }
  },

  showMessage(msg, type) {
    const el = document.getElementById('auth-message');
    if (!el) return;
    const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
    const icons = { success: '', error: '', warning: '', info: 'ℹ' };
    el.innerHTML = `<div style="padding:1rem;border-radius:8px;background:${colors[type]}22;border:1px solid ${colors[type]};color:${colors[type]}">${icons[type]} ${msg}</div>`;
    if (type === 'success') setTimeout(() => el.innerHTML = '', 5000);
  }
};

window.AuthModule = AuthModule;
window.authModule = AuthModule;
window.initAuthModule = async (c) => { AuthModule.container = c || document.body; return await AuthModule.init(c); };
window.logout = async () => { if (window.authModule) await window.authModule.handleLogout(); };
}