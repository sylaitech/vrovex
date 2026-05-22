import { useI18n } from '../i18n/I18nContext';

export default function LanguageToggle({ className = '' }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={`lang-toggle ${className}`.trim()}
      role="group"
      aria-label={locale === 'es' ? 'Idioma' : 'Language'}
    >
      <button
        type="button"
        className={locale === 'en' ? 'lang-toggle-btn lang-toggle-active' : 'lang-toggle-btn'}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        className={locale === 'es' ? 'lang-toggle-btn lang-toggle-active' : 'lang-toggle-btn'}
        onClick={() => setLocale('es')}
        aria-pressed={locale === 'es'}
      >
        ES
      </button>
    </div>
  );
}
