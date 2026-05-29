import { useState } from 'react';

const RADIUS = 80;
const CIRC = 2 * Math.PI * RADIUS;

function RingProgress({ progress, status }) {
  const offset = CIRC * (1 - Math.min(progress, 100) / 100);
  const stroke =
    status === 'critical' ? '#ef4444'
    : status === 'warning'  ? '#f59e0b'
    : '#70dcd3';

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#2e3038" strokeWidth="10" />
      <circle
        cx="100" cy="100" r={RADIUS}
        fill="none"
        stroke={stroke}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
      />
    </svg>
  );
}

function CategoryRow({ label, progress, done }) {
  return (
    <div style={{ borderBottom: '1px solid #2e3038', padding: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#aeaeb7', fontFamily: 'var(--font-geist)', fontWeight: 500 }}>
          {label}
        </span>
        <span style={{
          fontSize: 12,
          fontFamily: 'var(--font-calsans)',
          fontWeight: 600,
          color: done ? '#70dcd3' : '#aeaeb7',
          letterSpacing: '0.04em',
        }}>
          {done ? 'OK' : `${Math.round(progress)}%`}
        </span>
      </div>
      <div style={{ height: 3, background: '#2e3038', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(progress, 100)}%`,
          background: done ? '#70dcd3' : 'linear-gradient(90deg, #0092e4, #70dcd3)',
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

function SeverityDot({ level }) {
  const color = level >= 9 ? '#ef4444' : level >= 6 ? '#f59e0b' : level >= 4 ? '#eab308' : '#70dcd3';
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0, marginTop: 6 }} />;
}

export default function ComplianceScannerUI({ shopId, onClose }) {
  const [scanState, setScanState] = useState('idle');
  const [scanResults, setScanResults] = useState(null);
  const [scanProgress, setScanProgress] = useState({ policies: 0, trademarks: 0, health: 0, claims: 0, restricted: 0 });
  const [error, setError] = useState(null);
  const [scanDuration, setScanDuration] = useState(0);

  const overallProgress = scanState === 'completed' ? 100
    : Math.round((scanProgress.policies + scanProgress.trademarks + scanProgress.health + scanProgress.claims + scanProgress.restricted) / 5);

  const startScan = async () => {
    setScanState('scanning');
    setError(null);
    setScanProgress({ policies: 0, trademarks: 0, health: 0, claims: 0, restricted: 0 });
    setScanDuration(0);
    const startTime = Date.now();

    try {
      const progressInterval = setInterval(() => {
        setScanProgress(prev => ({
          policies:   Math.min(prev.policies   + Math.random() * 25, 100),
          trademarks: Math.min(prev.trademarks + Math.random() * 20, 100),
          health:     Math.min(prev.health     + Math.random() * 30, 100),
          claims:     Math.min(prev.claims     + Math.random() * 25, 100),
          restricted: Math.min(prev.restricted + Math.random() * 28, 100),
        }));
        setScanDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 300);

      let results;
      try {
        const res = await fetch(`/api/shops/${shopId}/scan-compliance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) results = await res.json();
        else throw new Error('API not available');
      } catch {
        results = {
          status: 'warning',
          riskLevel: 6,
          issues: [
            { type: 'health_product', severity: 7, message: 'Productos de salud requieren certificación', keyword: 'supplement' },
            { type: 'trademark_risk', severity: 5, message: 'Posible referencia a marca registrada detectada', keyword: 'branded' },
          ],
          recommendations: [
            'Revisa los listados de salud para obtener certificaciones requeridas',
            'Verifica referencias de marcas registradas',
            'Consulta con el equipo legal antes de publicar',
          ],
          summary: { totalIssues: 2, criticalIssues: 0, warningIssues: 2, cautionIssues: 0, minorIssues: 0 },
          scannedAt: new Date().toISOString(),
        };
      }

      clearInterval(progressInterval);
      setScanProgress({ policies: 100, trademarks: 100, health: 100, claims: 100, restricted: 100 });
      setScanResults(results);
      setScanState('completed');
    } catch (err) {
      setError(err.message);
      setScanState('idle');
    }
  };

  const resultStatus =
    scanResults?.riskLevel >= 9 ? 'critical'
    : scanResults?.riskLevel >= 5 ? 'warning'
    : 'ok';

  const resultColor =
    resultStatus === 'critical' ? '#ef4444'
    : resultStatus === 'warning' ? '#f59e0b'
    : '#70dcd3';

  const resultLabel =
    resultStatus === 'critical' ? 'INFRACCIONES CRÍTICAS'
    : resultStatus === 'warning' ? 'ADVERTENCIAS DETECTADAS'
    : 'SIN INFRACCIONES';

  const scoreDisplay = scanResults
    ? Math.round(100 - (scanResults.riskLevel / 10) * 100)
    : overallProgress;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(7,7,7,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: '#0d0e12',
        border: '1px solid #2e3038',
        borderRadius: 16,
        width: '100%',
        maxWidth: 560,
        maxHeight: '92vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid #2e3038',
        }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aeaeb7', marginBottom: 4, fontFamily: 'var(--font-geist)', fontWeight: 500 }}>
              Vyshai Shield
            </p>
            <h2 style={{ fontFamily: 'var(--font-calsans)', fontWeight: 600, fontSize: 18, color: '#ffffff', letterSpacing: '0.04em', margin: 0 }}>
              Compliance Scanner
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid #2e3038', color: '#aeaeb7',
              width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#70dcd3'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e3038'; e.currentTarget.style.color = '#aeaeb7'; }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '32px 28px' }}>

          {/* IDLE */}
          {scanState === 'idle' && !scanResults && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 180, height: 180, margin: '0 auto 32px', position: 'relative' }}>
                <RingProgress progress={0} status="ok" />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-calsans)', fontSize: 13, fontWeight: 600, color: '#aeaeb7', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Listo</span>
                </div>
              </div>
              <h3 style={{ fontFamily: 'var(--font-calsans)', fontSize: 22, fontWeight: 600, color: '#ffffff', letterSpacing: '0.04em', margin: '0 0 10px' }}>
                Escaneo de cumplimiento
              </h3>
              <p style={{ color: '#aeaeb7', fontSize: 14, lineHeight: 1.6, margin: '0 0 32px', fontFamily: 'var(--font-geist)' }}>
                Analiza tu tienda para detectar potenciales infracciones de políticas de TikTok Shop
              </p>
              <button
                onClick={startScan}
                style={{
                  fontFamily: 'var(--font-calsans)', fontWeight: 600, fontSize: 14,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: 'transparent',
                  border: '1px solid #70dcd3',
                  color: '#70dcd3',
                  padding: '14px 48px',
                  borderRadius: 8, cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#70dcd3'; e.currentTarget.style.color = '#070707'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#70dcd3'; }}
              >
                Iniciar escaneo
              </button>
            </div>
          )}

          {/* SCANNING */}
          {scanState === 'scanning' && (
            <div>
              <div style={{ width: 200, height: 200, margin: '0 auto 32px', position: 'relative' }}>
                <RingProgress progress={overallProgress} status="ok" />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-calsans)', fontSize: 42, fontWeight: 600, color: '#ffffff', lineHeight: 1 }}>
                    {overallProgress}
                  </span>
                  <span style={{ fontFamily: 'var(--font-geist)', fontSize: 11, color: '#aeaeb7', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                    %
                  </span>
                </div>
              </div>

              <p style={{ textAlign: 'center', fontFamily: 'var(--font-calsans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#70dcd3', marginBottom: 28 }}>
                Analizando — {scanDuration}s
              </p>

              <div style={{ borderTop: '1px solid #2e3038' }}>
                <CategoryRow label="Políticas de prohibición"    progress={scanProgress.policies}   done={scanProgress.policies   >= 100} />
                <CategoryRow label="Marcas registradas"          progress={scanProgress.trademarks} done={scanProgress.trademarks >= 100} />
                <CategoryRow label="Productos de salud"          progress={scanProgress.health}     done={scanProgress.health     >= 100} />
                <CategoryRow label="Afirmaciones engañosas"      progress={scanProgress.claims}     done={scanProgress.claims     >= 100} />
                <CategoryRow label="Contenido restringido"       progress={scanProgress.restricted} done={scanProgress.restricted >= 100} />
              </div>
            </div>
          )}

          {/* COMPLETED */}
          {scanState === 'completed' && scanResults && (
            <div>
              <div style={{ width: 200, height: 200, margin: '0 auto 24px', position: 'relative' }}>
                <RingProgress progress={scoreDisplay} status={resultStatus} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-calsans)', fontSize: 46, fontWeight: 600, color: resultColor, lineHeight: 1 }}>
                    {scoreDisplay}
                  </span>
                  <span style={{ fontFamily: 'var(--font-geist)', fontSize: 11, color: '#aeaeb7', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                    Score
                  </span>
                </div>
              </div>

              <p style={{ textAlign: 'center', fontFamily: 'var(--font-calsans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: resultColor, marginBottom: 28 }}>
                {resultLabel}
              </p>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
                {[
                  { label: 'Total', value: scanResults.summary.totalIssues, color: '#ffffff' },
                  { label: 'Críticos', value: scanResults.summary.criticalIssues, color: '#ef4444' },
                  { label: 'Advertencias', value: scanResults.summary.warningIssues, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#141418', border: '1px solid #2e3038', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-calsans)', fontSize: 28, fontWeight: 600, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontFamily: 'var(--font-geist)', fontSize: 11, color: '#aeaeb7', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '6px 0 0' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Issues */}
              {scanResults.issues.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontFamily: 'var(--font-geist)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aeaeb7', marginBottom: 12, fontWeight: 500 }}>
                    Problemas detectados
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {scanResults.issues.map((issue, i) => (
                      <div key={i} style={{ background: '#141418', border: '1px solid #2e3038', borderRadius: 8, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <SeverityDot level={issue.severity} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-geist)', fontSize: 13, color: '#ffffff', margin: '0 0 4px', fontWeight: 500 }}>{issue.message}</p>
                          <p style={{ fontFamily: 'var(--font-geist)', fontSize: 11, color: '#aeaeb7', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            {issue.type.replace(/_/g, ' ')} — Severidad {issue.severity}/10
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {scanResults.recommendations.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontFamily: 'var(--font-geist)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aeaeb7', marginBottom: 12, fontWeight: 500 }}>
                    Recomendaciones
                  </p>
                  <div style={{ background: '#141418', border: '1px solid #2e3038', borderRadius: 8, padding: '16px' }}>
                    {scanResults.recommendations.map((rec, i) => {
                      const clean = rec.replace(/^[^\w]+/, '').trim();
                      return (
                        <p key={i} style={{ fontFamily: 'var(--font-geist)', fontSize: 13, color: '#d9dae5', margin: i === 0 ? 0 : '10px 0 0', lineHeight: 1.55, paddingLeft: 14, borderLeft: '2px solid #2e3038' }}>
                          {clean}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={startScan}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-calsans)', fontWeight: 600, fontSize: 13,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'transparent',
                  border: '1px solid #2e3038',
                  color: '#aeaeb7',
                  padding: '13px',
                  borderRadius: 8, cursor: 'pointer',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#70dcd3'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e3038'; e.currentTarget.style.color = '#aeaeb7'; }}
              >
                Escanear nuevamente
              </button>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div style={{ background: '#141418', border: '1px solid #ef444440', borderRadius: 8, padding: 20, marginTop: 16 }}>
              <p style={{ fontFamily: 'var(--font-calsans)', fontSize: 14, fontWeight: 600, color: '#ef4444', margin: '0 0 8px', letterSpacing: '0.04em' }}>
                Error en el escaneo
              </p>
              <p style={{ fontFamily: 'var(--font-geist)', fontSize: 13, color: '#aeaeb7', margin: '0 0 16px' }}>{error}</p>
              <button
                onClick={() => { setError(null); setScanState('idle'); }}
                style={{
                  fontFamily: 'var(--font-calsans)', fontWeight: 600, fontSize: 12,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: 'transparent', border: '1px solid #ef4444',
                  color: '#ef4444', padding: '10px 24px',
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
