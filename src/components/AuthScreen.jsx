import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import NavLogo from './NavLogo';
import LanguageToggle from './LanguageToggle';
import api from '../config/api';

export default function AuthScreen({ onSuccess, onBack, initialMode = 'login', resetToken = null }) {
  const { t } = useI18n();
  const { login, register } = useAuth();
  const [mode, setMode] = useState(resetToken ? 'reset' : initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await api.forgotPassword(email);
        setSuccess(t('auth.forgotSent'));
      } else if (mode === 'reset') {
        if (password !== confirmPassword) {
          setError(t('auth.passwordMismatch'));
          setLoading(false);
          return;
        }
        await api.resetPassword(resetToken, password);
        setSuccess(t('auth.resetSuccess'));
        setTimeout(() => switchMode('login'), 2000);
      } else {
        const data =
          mode === 'login'
            ? await login(email, password)
            : await register({ email, password, name });
        onSuccess?.(data);
      }
    } catch (err) {
      setError(err.message || t('auth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  const title = {
    login: t('auth.titleLogin'),
    register: t('auth.titleRegister'),
    forgot: t('auth.titleForgot'),
    reset: t('auth.titleReset'),
  }[mode];

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <header className="harness-nav harness-nav-landing">
        <div className="harness-nav-landing-inner">
          <NavLogo onClick={onBack} />
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="card-elevated w-full max-w-md p-8">
          <h1 className="font-heading-sm text-center">{title}</h1>
          <p className="text-muted text-sm text-center mt-2">{t('auth.subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-label block mb-2">{t('auth.name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark w-full"
                  autoComplete="name"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="text-label block mb-2">{t('auth.email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark w-full"
                  autoComplete="email"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div>
                <label className="text-label block mb-2">{t('auth.password')}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark w-full"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div>
                  <label className="text-label block mb-2">{t('auth.newPassword')}</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-dark w-full"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="text-label block mb-2">{t('auth.confirmPassword')}</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-dark w-full"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-accent">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}

            <button type="submit" disabled={loading} className="btn-pill-primary w-full">
              {loading ? '…' : {
                login: t('auth.submitLogin'),
                register: t('auth.submitRegister'),
                forgot: t('auth.submitForgot'),
                reset: t('auth.submitReset'),
              }[mode]}
            </button>
          </form>

          {mode === 'login' && (
            <button
              type="button"
              className="nav-ghost text-sm w-full mt-3"
              onClick={() => switchMode('forgot')}
            >
              {t('auth.forgotLink')}
            </button>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              className="nav-ghost text-sm w-full mt-3"
              onClick={() => switchMode('login')}
            >
              {t('auth.backToLogin')}
            </button>
          )}

          {(mode === 'login' || mode === 'register') && (
            <button
              type="button"
              className="nav-ghost text-sm w-full mt-4"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? t('auth.switchRegister') : t('auth.switchLogin')}
            </button>
          )}

          {mode === 'login' && (
            <p className="text-xs text-muted text-center mt-4">{t('auth.creatorHint')}</p>
          )}

          {onBack && (
            <button type="button" className="btn-nav text-sm w-full mt-3" onClick={onBack}>
              {t('nav.back')}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
