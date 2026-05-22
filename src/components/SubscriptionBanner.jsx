import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';

export default function SubscriptionBanner({ onActivate }) {
  const { isPlanActive, planStatus, currentPeriodEnd, startCheckout, loading } = useAuth();
  const { t, locale } = useI18n();

  if (loading || isPlanActive) {
    if (isPlanActive && currentPeriodEnd) {
      const date = new Date(currentPeriodEnd).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US');
      return (
        <p className="text-sm text-muted mb-4">
          {t('billing.activeUntil')} {date}
        </p>
      );
    }
    return null;
  }

  return (
    <div className="card-elevated border-accent/30 p-6 mb-6">
      <p className="text-label mb-2">{t('billing.required')}</p>
      <p className="text-muted text-sm mb-4">{t('billing.requiredDesc')}</p>
      <p className="text-xs text-muted mb-4">
        {t('billing.inactive')} ({planStatus})
      </p>
      <button
        type="button"
        className="btn-pill-primary text-sm"
        onClick={onActivate || startCheckout}
      >
        {t('billing.activate')}
      </button>
    </div>
  );
}
