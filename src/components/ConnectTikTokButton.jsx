import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';

export default function ConnectTikTokButton() {
  const { isPlanActive, tiktokShopConnected, connectTikTok, loading } = useAuth();
  const { t } = useI18n();

  if (loading) return null;

  const disabled = !isPlanActive;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <button
        type="button"
        className={disabled ? 'btn-pill-ghost opacity-50 cursor-not-allowed' : 'btn-pill-primary text-sm'}
        disabled={disabled}
        onClick={() => !disabled && connectTikTok()}
        title={disabled ? t('nav.connectTikTokDisabled') : undefined}
      >
        {t('nav.connectTikTok')}
      </button>
      {tiktokShopConnected && (
        <span className="badge-status text-xs">TikTok ✓</span>
      )}
    </div>
  );
}
