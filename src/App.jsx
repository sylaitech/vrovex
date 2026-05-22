import React, { useState, useEffect } from 'react';
import FlowingRibbons from './components/FlowingRibbons';
import NavLogo from './components/NavLogo';
import LanguageToggle from './components/LanguageToggle';
import SubscriptionBanner from './components/SubscriptionBanner';
import ConnectTikTokButton from './components/ConnectTikTokButton';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import { useI18n } from './i18n/I18nContext';
import { useAuth } from './context/AuthContext';

function AmbientBackground() {
  return (
    <>
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-layer ambient-drift-sage" />
        <div className="ambient-layer ambient-drift-teal" />
        <div className="ambient-layer ambient-mesh-shift" />
        <div className="ambient-layer ambient-edge-pulse" />
        <div className="ambient-layer ambient-grain" />
      </div>
      <FlowingRibbons />
    </>
  );
}

export default function ShopGuardLanding() {
  const { t } = useI18n();
  const {
    isPlanActive,
    isAuthenticated,
    isStaff,
    startCheckout,
    logout,
    user,
  } = useAuth();
  const [view, setView] = useState('landing');
  const [billingToast, setBillingToast] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [selectedShop, setSelectedShop] = useState('US_Seller_Main');
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [appealCategory, setAppealCategory] = useState('late_dispatch');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAppeal, setGeneratedAppeal] = useState('');
  const [complianceText, setComplianceText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState(null);

  const shopsData = {
    US_Seller_Main: {
      accountHealth: 347,
      lateDispatch: 6.2,
      onTimeDelivery: 87.0,
      vtr: 96.4,
      shieldScore: 35,
      status: 'critical',
      alerts: [
        { id: 1, title: 'Late Dispatch Rate Crítico', desc: 'Estás en 6.2% — Límite TikTok 4.0%. 3 órdenes sin tracking en 48h.' },
        { id: 2, title: 'Tendencia de caída', desc: 'Health Score cayó 53 puntos. Riesgo de suspensión en ~4 días.' },
        { id: 3, title: 'Catálogo inconsistente', desc: 'Listing "Omega 3 Pro" requiere certificaciones en Seller Center.' },
      ],
    },
    UK_Fashion_Outlet: {
      accountHealth: 890,
      lateDispatch: 1.1,
      onTimeDelivery: 99.2,
      vtr: 99.8,
      shieldScore: 92,
      status: 'healthy',
      alerts: [],
    },
    EU_Tech_Hub: {
      accountHealth: 720,
      lateDispatch: 3.8,
      onTimeDelivery: 94.5,
      vtr: 98.1,
      shieldScore: 72,
      status: 'warning',
      alerts: [
        { id: 4, title: 'Late Dispatch al límite', desc: '3.8% (límite 4.0%). Dos retrasos más activan penalización.' },
      ],
    },
  };

  const currentShopData = shopsData[selectedShop];
  const [activeAlerts, setActiveAlerts] = useState(currentShopData.alerts);

  useEffect(() => {
    setActiveAlerts(currentShopData.alerts);
  }, [selectedShop]);

  const handleDismissAlert = (id) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const generateAppealContent = (category) => {
    const header = `TIENDA: ${selectedShop}\nFECHA: ${new Date().toLocaleDateString()}\n\n`;
    switch (category) {
      case 'late_dispatch':
        return header + `Apelación por Late Dispatch Rate (${currentShopData.lateDispatch}%). Causa: retraso API transportista. Acciones correctivas implementadas.\n\n${selectedShop}`;
      case 'compliance_copyright':
        return header + `Apelación copyright/IP. Documentación de autorización adjunta en Seller Center.\n\n${selectedShop}`;
      case 'seller_metrics':
        return header + `Revisión Account Health (${currentShopData.accountHealth}/1000). Solicitud de auditoría por picos anómalos de quejas.\n\n${selectedShop}`;
      default:
        return '';
    }
  };

  const handleGenerateAppeal = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedAppeal(generateAppealContent(appealCategory));
      setIsGenerating(false);
    }, 1200);
  };

  const handleCopyAppeal = () => {
    navigator.clipboard.writeText(generatedAppeal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScanCompliance = (e) => {
    e.preventDefault();
    if (!complianceText.trim()) return;
    setIsScanning(true);
    setTimeout(() => {
      const t = complianceText.toLowerCase();
      let status = 'passed';
      const issues = [];
      if (t.includes('omega') || t.includes('suplemento')) {
        status = 'warning';
        issues.push('Requiere registro sanitario en TikTok FDA Center.');
      }
      if (t.includes('nike') || t.includes('replica')) {
        status = 'failed';
        issues.push('Riesgo de infracción de marca registrada.');
      }
      if (t.includes('cura') || t.includes('garantizado')) {
        status = 'warning';
        issues.push('Afirmación no permitida en publicidad orgánica.');
      }
      setComplianceStatus({ status, issues });
      setIsScanning(false);
    }, 1400);
  };

  const [heroVideoReady, setHeroVideoReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get('billing');
    const tiktok = params.get('tiktok');
    if (billing === 'success') setBillingToast(t('billing.success'));
    if (billing === 'canceled') setBillingToast(t('billing.canceled'));
    if (tiktok === 'connected') setBillingToast(t('tiktok.connected'));
    if (tiktok === 'blocked') setBillingToast(t('tiktok.blocked'));
    if (tiktok === 'error') setBillingToast(t('tiktok.error'));
    if (billing || tiktok) {
      window.history.replaceState({}, '', window.location.pathname);
      setView('dashboard');
    }
  }, [t]);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      setView('auth');
      return;
    }
    if (isStaff || isPlanActive) {
      setView('dashboard');
      return;
    }
    startCheckout().catch(() => setView('dashboard'));
  };

  const afterAuth = (data) => {
    const staff = data?.role === 'creator' || data?.role === 'admin';
    const active =
      staff ||
      data?.planStatus === 'active' ||
      (data?.user?.planStatus === 'active');
    if (staff) setView('admin');
    else if (active) setView('dashboard');
    else startCheckout().catch(() => setView('dashboard'));
  };

  if (view === 'auth') {
    return (
      <div className="harness-app">
        <AmbientBackground />
        <AuthScreen onSuccess={afterAuth} onBack={() => setView('landing')} />
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="harness-app min-h-screen">
        <AmbientBackground />
        <AdminPanel
          onBack={() => setView('landing')}
          onPreviewDashboard={() => setView('dashboard')}
        />
      </div>
    );
  }

  const faqs = [
    { q: '¿Cómo se conecta la plataforma?', a: 'API oficial TikTok Shop Partner. Sin guardar credenciales; solo métricas de salud.' },
    { q: '¿Previene bans?', a: 'Detectamos anomalías 48h antes del umbral de penalización de TikTok.' },
    { q: '¿Appeals automáticos?', a: 'Redacción optimizada según código de error e historial de éxito.' },
    { q: '¿Varias tiendas?', a: 'Plan Pro: hasta 3 tiendas con alertas independientes.' },
  ];

  const statusBadge = () => {
    if (currentShopData.status === 'critical') return 'badge-status badge-critical';
    if (currentShopData.status === 'warning') return 'badge-status badge-warning';
    return 'badge-status';
  };

  if (view === 'dashboard') {
    return (
      <div className="harness-app min-h-screen flex flex-col">
        <AmbientBackground />
        <header className="harness-nav harness-nav-inner flex flex-wrap items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <NavLogo onClick={() => setView('landing')} />
            <button type="button" onClick={() => setView('landing')} className="btn-nav text-sm">
              {t('nav.back')}
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap justify-end">
            <LanguageToggle />
            {isStaff && (
              <button type="button" onClick={() => setView('admin')} className="btn-nav text-sm">
                {t('nav.admin')}
              </button>
            )}
            <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} className="select-dark w-auto max-w-[140px] sm:max-w-none">
              <option value="US_Seller_Main">US_Seller_Main</option>
              <option value="UK_Fashion_Outlet">UK_Fashion_Outlet</option>
              <option value="EU_Tech_Hub">EU_Tech_Hub</option>
            </select>
            <button type="button" onClick={() => { logout(); setView('landing'); }} className="btn-nav text-sm">
              {t('nav.logout')}
            </button>
          </div>
        </header>

        {billingToast && (
          <div className="harness-container relative z-10 pt-4">
            <p className="text-sm text-accent">{billingToast}</p>
          </div>
        )}

        <div className="border-b border-graphite px-4 sm:px-6 py-3 relative z-10">
          <div className="harness-container !px-0 flex flex-wrap gap-2">
            {[
              { id: 'overview', label: t('tabs.overview') },
              { id: 'appeals', label: t('tabs.appeals') },
              { id: 'compliance', label: t('tabs.compliance') },
            ].map(({ id, label }) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} className={activeTab === id ? 'tab-btn tab-btn-active' : 'tab-btn'}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <main className="harness-container flex-1 py-6 sm:py-8 space-y-6 relative z-10">
          <SubscriptionBanner />
          {!isPlanActive ? (
            <div className="card-elevated p-8 text-center">
              <h2 className="font-heading-sm mb-3">{t('dashboard.paywallTitle')}</h2>
              <p className="text-muted text-sm max-w-md mx-auto">{t('dashboard.paywallDesc')}</p>
            </div>
          ) : (
          <>
          <div className="card-elevated flex flex-col md:flex-row md:items-center justify-between gap-4 reveal-on-load reveal-delay-2">
            <div>
              <p className="text-label">{t('dashboard.partner')}</p>
              <h1 className="font-heading-sm mt-2">
                Command Center · <span className="text-accent font-normal text-lg">{selectedShop}</span>
              </h1>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-3">
              <span className={statusBadge()}>
                {currentShopData.status === 'critical' ? 'Riesgo' : currentShopData.status === 'warning' ? 'Anomalías' : 'Activo'}
              </span>
              <ConnectTikTokButton />
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Health Score', value: currentShopData.accountHealth, suffix: '/1000', danger: currentShopData.accountHealth < 400, meta: 'Umbral 200', st: currentShopData.accountHealth < 400 ? 'Crítico' : 'OK' },
                  { label: 'Late Dispatch', value: `${currentShopData.lateDispatch}%`, danger: currentShopData.lateDispatch > 4, meta: 'Max 4%', st: currentShopData.lateDispatch > 4 ? 'Alto' : 'OK' },
                  { label: 'On-Time', value: `${currentShopData.onTimeDelivery}%`, danger: false, meta: 'Meta 95%', st: 'Activo' },
                  { label: 'VTR', value: `${currentShopData.vtr}%`, danger: false, meta: 'Min 95%', st: 'OK' },
                ].map((m) => (
                  <div key={m.label} className="card-elevated">
                    <p className="text-label">{m.label}</p>
                    <p className={`text-2xl font-semibold mt-2 ${m.danger ? 'text-accent' : ''}`}>
                      {m.value}
                      {m.suffix && <span className="text-sm text-muted font-normal ml-1">{m.suffix}</span>}
                    </p>
                    <div className="flex justify-between mt-4 pt-3 text-sm text-muted border-t border-graphite">
                      <span>{m.meta}</span>
                      <span className={m.danger ? 'text-accent' : ''}>{m.st}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card-elevated lg:col-span-2">
                  <div className="flex justify-between pb-4 mb-4 border-b border-graphite">
                    <span className="text-label">Alertas</span>
                    <span className="text-sm text-muted">{activeAlerts.length} pendientes</span>
                  </div>
                  {activeAlerts.length === 0 ? (
                    <div className="py-12 text-center text-muted">
                      <p>Sin alertas críticas</p>
                    </div>
                  ) : (
                    activeAlerts.map((alert) => (
                      <div key={alert.id} className="flex gap-3 py-4 border-b border-graphite last:border-0">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex justify-between gap-2">
                            <h4 className="text-sm font-medium">{alert.title}</h4>
                            <button type="button" onClick={() => handleDismissAlert(alert.id)} className="btn-nav text-xs py-1 px-2 shrink-0">
                              Descartar
                            </button>
                          </div>
                          <p className="text-sm text-muted mt-1">{alert.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="card-bordered flex flex-col">
                  <p className="text-label">Shield Score</p>
                  <div className="flex flex-col items-center py-8 flex-1">
                    <div className="relative w-28 h-28">
                      <svg className="w-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-graphite)" strokeWidth="6" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-electric-blue)" strokeWidth="6" strokeDasharray="264" strokeDashoffset={264 - (264 * currentShopData.shieldScore) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-semibold">{currentShopData.shieldScore}</span>
                        <span className="text-xs text-muted">/100</span>
                      </div>
                    </div>
                    <p className="text-label mt-4">
                      {currentShopData.shieldScore > 75 ? 'Robusta' : currentShopData.shieldScore > 50 ? 'Media' : 'Vulnerable'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'appeals' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card-elevated space-y-5">
                <div>
                  <h2 className="font-heading-sm">Generador de apelaciones</h2>
                  <p className="text-hero-sub mt-2">Políticas TikTok Shop.</p>
                </div>
                <form onSubmit={handleGenerateAppeal} className="space-y-4">
                  <div>
                    <label className="text-label block mb-2">Categoría</label>
                    <select value={appealCategory} onChange={(e) => setAppealCategory(e.target.value)} className="input-outlined">
                      <option value="late_dispatch">Late Dispatch</option>
                      <option value="compliance_copyright">Copyright</option>
                      <option value="seller_metrics">Account Health</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label block mb-2">Tienda</label>
                    <input type="text" value={selectedShop} disabled className="input-outlined opacity-70" />
                  </div>
                    <button type="submit" disabled={isGenerating} className="btn-pill-primary w-full">
                      {isGenerating ? 'Redactando...' : 'Generar appeal'}
                    </button>
                </form>
              </div>
              <div className="card-elevated flex flex-col min-h-[360px]">
                <div className="flex justify-between pb-4 mb-4 border-b border-graphite">
                  <span className="text-label">Documento</span>
                  {generatedAppeal && (
                    <button type="button" onClick={handleCopyAppeal} className="btn-nav text-sm">
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  )}
                </div>
                {generatedAppeal ? (
                  <textarea readOnly value={generatedAppeal} className="textarea-dark flex-1 min-h-[280px] font-mono text-sm" />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted py-10">
                    <p>Consola lista</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card-elevated space-y-5">
                <div>
                  <h2 className="font-heading-sm">Compliance sandbox</h2>
                  <p className="text-hero-sub mt-2">Validación previa al listado.</p>
                </div>
                <form onSubmit={handleScanCompliance} className="space-y-4">
                  <div>
                    <label className="text-label block mb-2">Listing</label>
                    <textarea value={complianceText} onChange={(e) => setComplianceText(e.target.value)} placeholder="Descripción del producto..." className="textarea-dark h-32" />
                  </div>
                    <button type="submit" disabled={isScanning} className="btn-pill-primary w-full">
                      {isScanning ? 'Escaneando...' : 'Escanear'}
                    </button>
                </form>
              </div>
              <div className="card-elevated flex flex-col min-h-[360px]">
                <div className="flex justify-between pb-4 mb-4 border-b border-graphite">
                  <span className="text-label">Diagnóstico</span>
                  {complianceStatus && (
                    <span className={`badge-status ${complianceStatus.status === 'failed' ? 'badge-critical' : ''}`}>
                      {complianceStatus.status === 'passed' ? 'OK' : complianceStatus.status === 'warning' ? 'Revisar' : 'Bloqueo'}
                    </span>
                  )}
                </div>
                {complianceStatus ? (
                  <div className="text-muted text-sm space-y-3">
                    {complianceStatus.issues.length === 0 ? (
                      <p>Sin riesgos evidentes.</p>
                    ) : (
                      <ul className="space-y-2">
                        {complianceStatus.issues.map((issue, i) => (
                          <li key={i} className="flex gap-2"><span className="text-accent">!</span>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted py-10">
                    <p>Sandbox lista</p>
                  </div>
                )}
              </div>
            </div>
          )}
          </>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="harness-app">
      <AmbientBackground />

      <nav className="harness-nav harness-nav-landing relative z-10">
        <div className="harness-nav-landing-inner">
          <NavLogo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
            <LanguageToggle />
            {isAuthenticated ? (
              <>
                {isStaff && (
                  <button type="button" onClick={() => setView('admin')} className="btn-nav text-sm">
                    {t('nav.admin')}
                  </button>
                )}
                <button type="button" onClick={() => setView('dashboard')} className="btn-nav text-sm">
                  {t('nav.dashboard')}
                </button>
                <button type="button" onClick={() => { logout(); setView('landing'); }} className="btn-nav text-sm">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setView('auth')} className="btn-nav text-sm">
                  {t('nav.login')}
                </button>
                <button type="button" onClick={handleGetStarted} className="btn-pill-primary text-sm shrink-0">
                  {t('nav.getStarted')}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <header className="hero-split relative z-10">
        <div className="harness-container hero-grid">
          <div className="hero-copy">
            <p className="text-label mb-6 reveal-on-load reveal-delay-2">{t('hero.label')}</p>
            <h1 className="font-display reveal-on-load reveal-delay-3 title-hover">
              {t('hero.title')}
            </h1>
            <p className="text-hero-sub mt-6 max-w-xl reveal-on-load reveal-delay-4">
              {t('hero.sub')}
            </p>
            <div className="mt-10 reveal-on-load reveal-delay-5">
              <a href="#how-it-works" className="btn-pill-ghost">{t('hero.cta')}</a>
            </div>
          </div>
          <div className="video-slot reveal-on-load reveal-delay-4">
            <video
              className="video-slot-media"
              controls
              playsInline
              preload="metadata"
              onLoadedData={() => setHeroVideoReady(true)}
              onCanPlay={() => setHeroVideoReady(true)}
              onError={() => setHeroVideoReady(false)}
            >
              <source src="/explain.mp4" type="video/mp4" />
            </video>
            <div className={`video-slot-fallback${heroVideoReady ? ' hidden' : ''}`}>
              <p className="text-label">{t('hero.videoLabel')}</p>
              <p className="text-muted text-sm mt-3 max-w-xs">
                {t('hero.videoHint')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="section-sm relative z-10">
        <div className="harness-container flex flex-col md:flex-row items-center justify-center gap-6">
          <span className="text-label">Trusted on</span>
          <div className="flex flex-wrap justify-center gap-8 text-muted">
            {['TikTok Shop', 'Shopify', 'WooCommerce', 'BigCommerce'].map((b) => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm relative z-10">
        <div className="harness-container grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { val: '700K+', label: 'Sellers baneados (6 meses)' },
            { val: '$20K', label: 'Revenue diario perdido' },
            { val: '48H', label: 'Ventana crítica pre-ban' },
          ].map((s) => (
            <div key={s.val} className="stat-block-interactive text-center">
              <p className="stat-num title-hover">{s.val}</p>
              <p className="text-muted mt-3 text-sm max-w-[200px] mx-auto">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section relative z-10">
        <div className="harness-container">
          <div className="card-elevated card-interactive" style={{ paddingLeft: 'clamp(24px, 8vw, 56px)' }}>
            <h2 className="font-heading-lg title-hover">Operaciones sin fricción.</h2>
            <p className="text-hero-sub mt-4 max-w-xl">Tres capas que blindan tu facturación en segundo plano.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { n: '01', title: 'Conecta', desc: 'TikTok Shop Partner en un click. Setup 5 min.' },
              { n: '02', title: 'Monitor', desc: 'Health, dispatch, tracking y compliance 24/7.' },
              { n: '03', title: 'Actúa', desc: 'Alertas y appeals automatizados ante infracción.' },
            ].map((step) => (
              <div key={step.n} className="card-elevated card-interactive">
                <span className="text-label">{step.n}</span>
                <h3 className="font-heading-sm mt-4 title-hover">{step.title}</h3>
                <p className="text-muted mt-3 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="section relative z-10">
        <div className="harness-container">
          <div className="info-block max-w-2xl mb-12">
            <h2 className="font-heading title-hover">Diseñado para políticas en movimiento.</h2>
            <p className="text-hero-sub mt-4">Herramientas densas, claras y listas para escalar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Monitor 24/7', desc: 'Dispatch y health antes de penalización.', highlight: false },
              { title: 'Ban Prediction AI', desc: 'Alertas 48h antes de infracción.', highlight: true },
              { title: 'Appeals', desc: 'Redacción legal alineada a TikTok.', highlight: false },
              { title: 'Compliance', desc: 'Sandbox pre-publicación.', highlight: false },
              { title: 'INFORM Act', desc: 'Auditoría fiscal continua.', highlight: false },
              { title: 'Anti-ataques', desc: 'Detección de reseñas maliciosas.', highlight: false },
            ].map(({ title, desc, highlight }) => (
              <div key={title} className={`${highlight ? 'card-feature' : 'card-elevated'} card-interactive`}>
                <h3 className="font-heading-sm title-hover">{title}</h3>
                <p className="mt-3 text-sm text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="section relative z-10">
        <div className="harness-container">
          <h2 className="font-heading mb-12 title-hover">Sellers que recuperaron revenue.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: 'Appeal aprobado en 6 horas durante Black Friday.', who: 'Alex M.', role: 'Electrónica' },
              { q: 'Aviso de USPS un fin de semana antes del strike de TikTok.', who: 'Dani R.', role: 'Dropship USA' },
            ].map((t) => (
              <div key={t.who} className="card-elevated card-interactive">
                <p className="text-muted leading-relaxed">&ldquo;{t.q}&rdquo;</p>
                <p className="text-sm mt-6"><span className="text-light-ghost font-medium">{t.who}</span> · {t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="section relative z-10">
        <div className="harness-container">
          <h2 className="font-heading mb-12 title-hover">Planes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Basic', price: 47, items: ['1 tienda', 'Alertas', 'Escáner'], cta: 'Empezar', featured: false },
              { name: 'Pro Shield', price: 97, items: ['3 tiendas', 'Ban AI', 'Appeals', 'INFORM'], cta: 'Activar', featured: true },
              { name: 'Enterprise', price: 197, items: ['Ilimitado', 'White label', 'API'], cta: 'Contactar', featured: false },
            ].map((plan) => (
              <div key={plan.name} className={`flex flex-col card-interactive ${plan.featured ? 'card-feature' : 'card-elevated'}`}>
                {plan.featured && <span className="tag-subtle self-start mb-4 w-fit">Recomendado</span>}
                <p className="text-label">{plan.name}</p>
                <p className="font-heading-sm mt-2 title-hover">${plan.price}<span className="text-sm font-normal opacity-70">/mes</span></p>
                <ul className="mt-6 space-y-3 flex-1 text-sm text-muted">
                  {plan.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button type="button" onClick={() => setView('dashboard')} className={`mt-8 w-full ${plan.featured ? 'btn-pill-primary' : 'btn-pill-ghost'}`} style={plan.featured ? { background: 'var(--color-slate)', color: 'var(--color-light-ghost)', border: 'none' } : undefined}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <div className="card-elevated card-interactive mt-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <p className="tag-subtle inline-block mb-4 w-fit">VyshAI Suite</p>
              <h3 className="font-heading-sm title-hover">Bundle completo</h3>
              <p className="text-muted mt-2 max-w-md text-sm">Demanda y protección operativa en un solo stack.</p>
            </div>
            <div className="text-center md:text-right shrink-0">
              <p className="text-sm text-muted line-through">$196/mes</p>
              <p className="font-heading-sm mt-1 title-hover">$147<span className="text-sm">/mes</span></p>
              <button type="button" onClick={() => setView('dashboard')} className="btn-pill-primary mt-4">Adquirir</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section relative z-10">
        <div className="harness-container max-w-2xl">
          <h2 className="font-heading-sm mb-8 title-hover">Preguntas frecuentes</h2>
          {faqs.map((faq, idx) => {
            const open = openFaq === idx;
            return (
              <div key={idx} className="faq-row">
                <button type="button" onClick={() => setOpenFaq(open ? null : idx)} className="faq-btn">
                  <span>{faq.q}</span>
                  <span className="faq-toggle">{open ? '−' : '+'}</span>
                </button>
                {open && <p className="text-muted pb-6 -mt-2 text-sm leading-relaxed">{faq.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="section-sm border-t border-graphite relative z-10">
        <div className="harness-container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
          <span className="font-heading-sm text-base">VyshAI Shield © 2026</span>
          <div className="flex gap-6">
            <a href="#" className="nav-ghost text-sm">Términos</a>
            <a href="#" className="nav-ghost text-sm">Privacidad</a>
          </div>
          <span className="text-label normal-case">5 min setup</span>
        </div>
      </footer>
    </div>
  );
}
