import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import NavLogo from './NavLogo';
import LanguageToggle from './LanguageToggle';

export default function AuthScreen({ onSuccess, onBack }) {
  const { t } = useI18n();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data =
        mode === 'login'
          ? await login(email, password)
          : await register({ email, password, name });
      onSuccess?.(data);
    } catch (err) {
      setError(err.message || t('auth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="font-heading-sm text-center">
            {mode === 'login' ? t('auth.titleLogin') : t('auth.titleRegister')}
          </h1>
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

            {error && <p className="text-sm text-accent">{error}</p>}

            <button type="submit" disabled={loading} className="btn-pill-primary w-full">
              {loading
                ? '…'
                : mode === 'login'
                  ? t('auth.submitLogin')
                  : t('auth.submitRegister')}
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-4">{t('auth.creatorHint')}</p>

          <button
            type="button"
            className="nav-ghost text-sm w-full mt-6"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? t('auth.switchRegister') : t('auth.switchLogin')}
          </button>

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
