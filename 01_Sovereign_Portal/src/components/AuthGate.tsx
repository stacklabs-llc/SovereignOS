import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext, AuthUser } from '../contexts/AuthContext';
import { HoloLinkProvider } from '../contexts/HoloLinkContext';

const TOKEN_KEY = 'sovereign_session_token';

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const getCookieDomain = (): string => {
  const hostname = window.location.hostname;
  if (hostname.endsWith('.ts.net')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return '; domain=.' + parts.slice(-3).join('.');
    }
    return '; domain=' + hostname;
  }
  return '';
};

const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const domain = getCookieDomain();
  const secure = window.location.protocol === 'https:' && !window.location.hostname.endsWith('.ts.net') ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${domain}${secure}`;
};

const deleteCookie = (name: string) => {
  const domain = getCookieDomain();
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${domain}`;
};

// ── DEV AUTH BYPASS ──────────────────────────────────────────────────────────
// Controlled by VITE_DEV_BYPASS_AUTH in .env (dev only).
// This constant is resolved at build time — Vite strips the login branch
// entirely in bypass mode. NEVER set this var in .env.uat or .env.prod.
const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
const DEV_USER   = import.meta.env.VITE_DEV_BYPASS_USER  || 'antigravity';

const DEV_MOCK_USER = {
  user_name:    DEV_USER,
  display_name: 'Antigravity (Dev)',
  role:         'pilot',
  u_layout_configuration: '{"bypass": true}',
  logout: () => console.warn('[DEV BYPASS] Logout is a no-op in dev mode.'),
};
// ─────────────────────────────────────────────────────────────────────────────

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  // ── GUEST BYPASS FOR HOLOLINK TESTING ──
  const params = new URLSearchParams(window.location.search);
  const isHoloLinkBypass = (params.get('view') === 'mobile_hololink' || window.location.pathname === '/hololink' || window.location.pathname === '/hololink/') && params.get('vip')?.toLowerCase() === 'creator';
  if (isHoloLinkBypass) {
    const guestUser = {
      user_name: 'mom_guest',
      display_name: 'Mom (Guest)',
      role: 'guest',
      u_layout_configuration: '{"bypass": true}',
      logout: () => console.warn('[GUEST BYPASS] Logout is a no-op.'),
    };
    return (
      <AuthContext.Provider value={guestUser as any}>
        <HoloLinkProvider>
          {children}
        </HoloLinkProvider>
      </AuthContext.Provider>
    );
  }

  // ── DEV / LOCALHOST BYPASS: skip ALL auth logic and render immediately ──
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (DEV_BYPASS || isLocalhost) {
    const devUserParam = params.get('dev_user');
    const bypassUser = DEV_BYPASS ? DEV_MOCK_USER : {
      user_name: devUserParam || 'james',
      display_name: devUserParam ? devUserParam.charAt(0).toUpperCase() + devUserParam.slice(1) : 'James (Local)',
      role: devUserParam === 'eileen' ? 'patron' : (devUserParam === 'test_manager' ? 'stack_manager' : (devUserParam === 'creator' ? 'creator' : 'pilot')),
      u_layout_configuration: '{"bypass": true}',
      logout: () => console.warn('[LOCAL BYPASS] Logout is a no-op.'),
    };
    return (
      <AuthContext.Provider value={bypassUser as any}>
        <HoloLinkProvider>
          {children}
        </HoloLinkProvider>
      </AuthContext.Provider>
    );
  }
  // ────────────────────────────────────────────────────────────

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const verifyToken = useCallback(async (token: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken);
      localStorage.setItem("sov_auth", "unlocked");
      setCookie(TOKEN_KEY, urlToken);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
    }

    const cookieToken = getCookie(TOKEN_KEY);
    let stored = localStorage.getItem(TOKEN_KEY);

    if (cookieToken) {
      if (cookieToken !== stored) {
        localStorage.setItem(TOKEN_KEY, cookieToken);
        localStorage.setItem("sov_auth", "unlocked");
        stored = cookieToken;
      }
    } else {
      // Cookie is missing. Unless on localhost (handled by bypass) or Tailscale network, clear local storage token to sync logout.
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.endsWith('.ts.net');
      if (!isLocal && stored) {
        localStorage.removeItem(TOKEN_KEY);
        stored = null;
      }
    }

    if (stored) {
      verifyToken(stored).then(u => {
        if (u) {
          setUser(u);
          setLoading(false);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          deleteCookie(TOKEN_KEY);
          // If stored token was invalid, try auto-identifying via IP
          fetch('/api/public/identify')
            .then(async res => {
              if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.identified && data.token) {
                  localStorage.setItem(TOKEN_KEY, data.token);
                  localStorage.setItem("sov_auth", "unlocked");
                  setCookie(TOKEN_KEY, data.token);
                  const fullUser = await verifyToken(data.token);
                  setUser(fullUser || { user_name: data.user_name, display_name: data.display_name, role: data.role });
                }
              }
            })
            .catch(() => {})
            .finally(() => {
              setLoading(false);
            });
        }
      });
    } else {
      // Try auto-identifying via client IP
      fetch('/api/public/identify')
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'success' && data.identified && data.token) {
              localStorage.setItem(TOKEN_KEY, data.token);
              localStorage.setItem("sov_auth", "unlocked");
              setCookie(TOKEN_KEY, data.token);
              const fullUser = await verifyToken(data.token);
              setUser(fullUser || { user_name: data.user_name, display_name: data.display_name, role: data.role });
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    }
  }, [verifyToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setSubmitting(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setCookie(TOKEN_KEY, data.token);
        setUser({ user_name: data.user_name, display_name: data.display_name, role: data.role });
      } else if (res.status === 429) {
        setLoginError('Too many attempts. Wait 60 seconds.');
      } else {
        setLoginError('Invalid credentials.');
      }
    } catch {
      setLoginError('Connection error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    deleteCookie(TOKEN_KEY);
    setUser(null);
    setUsername('');
    setPassword('');
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0B0E14', fontFamily: 'Outfit, Inter, sans-serif',
      }}>
        <div style={{ color: '#38bdf8', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 }}>
          Initializing Sovereign OS...
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <AuthContext.Provider value={{ ...user, logout } as any}>
        <HoloLinkProvider>
          {children}
        </HoloLinkProvider>
      </AuthContext.Provider>
    );
  }

  // ── LOGIN SCREEN ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 30%, #0f1724 0%, #0B0E14 60%, #060810 100%)',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: '1rem',
    }}>
      {/* Subtle grid overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(56,189,248,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{
        width: '100%', maxWidth: 420, position: 'relative',
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(56,189,248,0.15)',
        borderRadius: 20,
        backdropFilter: 'blur(24px)',
        boxShadow: '0 0 60px rgba(56,189,248,0.06), 0 32px 64px rgba(0,0,0,0.6)',
        padding: '2.5rem 2rem',
      }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(168,85,247,0.2))',
            border: '1px solid rgba(56,189,248,0.3)',
            marginBottom: '1rem',
            fontSize: 28,
          }}>🛡️</div>
          <h1 style={{
            color: '#f1f5f9', fontSize: 22, fontWeight: 700,
            letterSpacing: '0.05em', margin: 0, lineHeight: 1.2,
          }}>Sovereign OS</h1>
          <p style={{
            color: 'rgba(148,163,184,0.7)', fontSize: 11,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            marginTop: 6, margin: '6px 0 0 0',
          }}>Secure Access Required</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(148,163,184,0.8)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
              Username
            </label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(56,189,248,0.2)',
                borderRadius: 10, color: '#f1f5f9',
                padding: '0.75rem 1rem', fontSize: 14,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(56,189,248,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(56,189,248,0.2)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'rgba(148,163,184,0.8)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(56,189,248,0.2)',
                borderRadius: 10, color: '#f1f5f9',
                padding: '0.75rem 1rem', fontSize: 14,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(56,189,248,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(56,189,248,0.2)'}
            />
          </div>

          {loginError && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '0.625rem 0.875rem',
              color: '#fca5a5', fontSize: 12, letterSpacing: '0.02em',
            }}>
              {loginError}
            </div>
          )}

          <button
            id="auth-submit"
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 4,
              background: submitting
                ? 'rgba(56,189,248,0.3)'
                : 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
              border: 'none', borderRadius: 10,
              color: '#0B0E14', fontWeight: 700,
              fontSize: 13, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '0.875rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity 0.2s, transform 0.1s',
              opacity: submitting ? 0.6 : 1,
              width: '100%',
            }}
            onMouseEnter={e => { if (!submitting) (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            {submitting ? 'Authenticating...' : 'Enter'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: '1.5rem', marginBottom: 0,
          color: 'rgba(100,116,139,0.6)', fontSize: 10,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Sovereign OS // Access by invitation only
        </p>
      </div>
    </div>
  );
}

// Export logout helper for GlobalSystemBar
export const TOKEN_KEY_EXPORT = TOKEN_KEY;
