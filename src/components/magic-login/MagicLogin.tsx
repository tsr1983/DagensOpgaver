import { useState, useEffect, useCallback } from 'react';
import styles from './magic-login.module.css';

export interface MagicLoginUser {
  id: number;
  email: string;
  name: string | null;
}

export interface MagicLoginProps {
  apiBaseUrl: string;
  onAuthStateChange?: (user: MagicLoginUser | null, isInitialCheck: boolean) => void;
  title?: string;
}

type View = 'loading' | 'login' | 'link-sent' | 'authenticated' | 'register' | 'register-success' | 'reset-password' | 'reset-confirm' | 'reset-complete';

export default function MagicLogin({ apiBaseUrl, onAuthStateChange, title = 'Log ind' }: MagicLoginProps) {
  const [view, setView] = useState<View>('loading');
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<MagicLoginUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordRepeat, setNewPasswordRepeat] = useState('');

  const notifyAuth = useCallback((u: MagicLoginUser | null, isInitialCheck = false) => onAuthStateChange?.(u, isInitialCheck), [onAuthStateChange]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/me`, { credentials: 'include' });
        if (!cancelled && res.ok) {
          const data: MagicLoginUser = await res.json();
          setUser(data);
          setView('authenticated');
          notifyAuth(data, true);
          return;
        }
      } catch {
        // no session
      }
      if (!cancelled) {
        setView('login');
        notifyAuth(null, true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, notifyAuth]);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      const res = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, returnUrl: window.location.origin }),
      });

      if (res.ok) {
        setView('link-sent');
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiBaseUrl}/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // best effort
    }
    setUser(null);
    setView('login');
    notifyAuth(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      const res = await fetch(`${apiBaseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });

      if (res.ok) {
        setView('register-success');
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Could not create user.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSending(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      const res = await fetch(`${apiBaseUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (res.ok) {
        setView('reset-confirm');
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Something went wrong.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSending(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== newPasswordRepeat) {
      setError('Passwords do not match.');
      return;
    }

    setSending(true);

    try {
      const res = await fetch(`${apiBaseUrl}/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword, newPasswordRepeat }),
      });

      if (res.ok) {
        setView('reset-complete');
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Something went wrong.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSending(false);
    }
  };

  const switchView = (target: View) => {
    setError(null);
    setView(target);
  };

  if (view === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (view === 'authenticated' && user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.avatarCircle}>{(user.name || user.email)[0].toUpperCase()}</div>
          <h2 className={styles.title}>Welcome{user.name ? `, ${user.name}` : ''}</h2>
          <p className={styles.subtitle}>{user.email}</p>
          <button className={styles.btnOutline} onClick={handleLogout}>Log out</button>
        </div>
      </div>
    );
  }

  if (view === 'link-sent') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconCircle}>✉️</div>
          <h2 className={styles.title}>Check your email</h2>
          <p className={styles.subtitle}>We sent a login link to <strong>{email}</strong></p>
          <p className={styles.hint}>Open the link in your email to continue.</p>
          <button className={styles.btnText} onClick={() => switchView('login')}>← Use another email</button>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Create account</h2>
          <p className={styles.subtitle}>Fill in the form to create a new account.</p>
          <form onSubmit={handleCreateUser} className={styles.form}>
            <input type="text" className={styles.input} placeholder="Name" value={regName} onChange={(e) => setRegName(e.target.value)} required autoFocus />
            <input type="email" className={styles.input} placeholder="you@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
            <input type="password" className={styles.input} placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.btnPrimary} disabled={sending}>{sending ? 'Creating...' : 'Create account'}</button>
          </form>
          <div className={styles.linkRow}>
            <button className={styles.btnText} onClick={() => switchView('login')}>← Back to login</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register-success') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconCircle}>✅</div>
          <h2 className={styles.title}>Account created</h2>
          <p className={styles.subtitle}>Your account is ready. Please check your email to confirm it.</p>
          <button className={styles.btnPrimary} onClick={() => switchView('login')}>Go to login</button>
        </div>
      </div>
    );
  }

  if (view === 'reset-password') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Reset password</h2>
          <p className={styles.subtitle}>Enter your email to receive a reset code.</p>
          <form onSubmit={handleRequestPasswordReset} className={styles.form}>
            <input type="email" className={styles.input} placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required autoFocus />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.btnPrimary} disabled={sending}>{sending ? 'Sending...' : 'Send reset code'}</button>
          </form>
          <div className={styles.linkRow}>
            <button className={styles.btnText} onClick={() => switchView('login')}>← Back to login</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'reset-confirm') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconCircle}>🔑</div>
          <h2 className={styles.title}>Enter code</h2>
          <p className={styles.subtitle}>We sent a code to <strong>{resetEmail}</strong>. Enter it and choose a new password.</p>
          <form onSubmit={handleConfirmPasswordReset} className={styles.form}>
            <input type="text" className={styles.input} placeholder="Reset code" value={resetCode} onChange={(e) => setResetCode(e.target.value)} required autoFocus />
            <input type="password" className={styles.input} placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            <input type="password" className={styles.input} placeholder="Repeat password" value={newPasswordRepeat} onChange={(e) => setNewPasswordRepeat(e.target.value)} required minLength={6} />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.btnPrimary} disabled={sending}>{sending ? 'Resetting...' : 'Reset password'}</button>
          </form>
          <div className={styles.linkRow}>
            <button className={styles.btnText} onClick={() => switchView('reset-password')}>← Try another email</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'reset-complete') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconCircle}>✅</div>
          <h2 className={styles.title}>Password updated</h2>
          <p className={styles.subtitle}>Your password has been reset. You can now sign in.</p>
          <button className={styles.btnPrimary} onClick={() => switchView('login')}>Go to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>Enter your email to receive a login link.</p>
        <form onSubmit={handleRequestLink} className={styles.form}>
          <input type="email" className={styles.input} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btnPrimary} disabled={sending}>{sending ? 'Sending...' : 'Send login link'}</button>
        </form>
        <div className={styles.linkRow}>
          <button className={styles.btnText} onClick={() => switchView('register')}>Create account</button>
          <button className={styles.btnText} onClick={() => switchView('reset-password')}>Forgot password?</button>
        </div>
      </div>
    </div>
  );
}
