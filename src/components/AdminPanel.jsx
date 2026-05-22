import { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import NavLogo from './NavLogo';
import LanguageToggle from './LanguageToggle';

export default function AdminPanel({ onBack, onPreviewDashboard }) {
  const { t } = useI18n();
  const { user, isStaff, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(search ? { q: search } : {}),
      ]);
      setStats(s);
      setUsers(u.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isStaff) load();
  }, [isStaff, load]);

  const patchUser = async (id, body) => {
    setActionId(id);
    try {
      await api.updateAdminUser(id, body);
      await load();
    } finally {
      setActionId(null);
    }
  };

  if (!isStaff) {
    return (
      <div className="harness-container py-20 text-center">
        <p className="text-accent">403 — Admin only</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <header className="harness-nav harness-nav-inner flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <NavLogo onClick={onBack} />
          <span className="badge-status">{t('admin.staffBadge')}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LanguageToggle />
          <button type="button" className="btn-nav text-sm" onClick={onPreviewDashboard}>
            {t('admin.previewDashboard')}
          </button>
          <button type="button" className="btn-nav text-sm" onClick={load} disabled={loading}>
            {t('admin.refresh')}
          </button>
          <button type="button" className="btn-nav text-sm" onClick={logout}>
            {t('nav.logout')}
          </button>
        </div>
      </header>

      <main className="harness-container py-8 space-y-8">
        <div>
          <h1 className="font-display">{t('admin.title')}</h1>
          <p className="text-muted mt-2">{t('admin.subtitle')}</p>
          <p className="text-sm text-muted mt-1">{user?.email}</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: t('admin.totalUsers'), value: stats.users?.total },
              { label: t('admin.activePlans'), value: stats.users?.active },
              { label: t('admin.inactivePlans'), value: stats.users?.inactive },
              { label: t('admin.tiktokConnected'), value: stats.tiktokConnected },
              { label: t('admin.shops'), value: stats.shopCount },
            ].map((c) => (
              <div key={c.label} className="card-elevated">
                <p className="text-label">{c.label}</p>
                <p className="text-2xl font-semibold mt-2">{c.value ?? '—'}</p>
              </div>
            ))}
          </div>
        )}

        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-graphite flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <input
              type="search"
              placeholder={t('admin.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              className="input-dark w-full sm:max-w-xs"
            />
            <button type="button" className="btn-pill-ghost text-sm" onClick={load}>
              {t('admin.refresh')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t('admin.colEmail')}</th>
                  <th>{t('admin.colName')}</th>
                  <th>{t('admin.colPlan')}</th>
                  <th>{t('admin.colRole')}</th>
                  <th>{t('admin.colTikTok')}</th>
                  <th>{t('admin.colShops')}</th>
                  <th>{t('admin.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      …
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-mono text-xs">{u.email}</td>
                      <td>{u.name}</td>
                      <td>
                        <span className={`badge-status ${u.planStatus === 'active' ? '' : 'badge-warning'}`}>
                          {u.planStatus}
                        </span>
                      </td>
                      <td>{u.role}</td>
                      <td>{u.tiktokShopConnected ? '✓' : '—'}</td>
                      <td>{u.shopCount}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="btn-nav text-xs py-1 px-2"
                            disabled={actionId === u.id}
                            onClick={() => patchUser(u.id, { extendDays: 30 })}
                          >
                            {t('admin.activate')}
                          </button>
                          <button
                            type="button"
                            className="btn-nav text-xs py-1 px-2"
                            disabled={actionId === u.id}
                            onClick={() => patchUser(u.id, { planStatus: 'inactive' })}
                          >
                            {t('admin.deactivate')}
                          </button>
                          {u.role === 'user' && (
                            <button
                              type="button"
                              className="btn-nav text-xs py-1 px-2"
                              disabled={actionId === u.id}
                              onClick={() => patchUser(u.id, { role: 'creator' })}
                            >
                              {t('admin.makeCreator')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
