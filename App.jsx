import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Eye, 
  FileWarning, 
  Building2, 
  Activity, 
  Brain, 
  FileText, 
  ClipboardCheck, 
  ShieldAlert, 
  Star, 
  Check, 
  ArrowRight,
  Zap,
  Plus,
  Minus,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Copy,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldX
} from 'lucide-react';

export default function ShopGuardLanding() {
  const [view, setView] = useState('landing'); // 'landing' | 'dashboard'
  const [openFaq, setOpenFaq] = useState(0);
  
  // Dashboard Specific States
  const [selectedShop, setSelectedShop] = useState('US_Seller_Main');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'appeals' | 'compliance'
  const [copied, setCopied] = useState(false);
  
  // Interactive Appeal Generator States
  const [appealCategory, setAppealCategory] = useState('late_dispatch');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAppeal, setGeneratedAppeal] = useState('');

  // Interactive Compliance Tool States
  const [complianceText, setComplianceText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState(null);

  // 3D Canvas Background Reference
  const canvasRef = useRef(null);

  // Shop Simulated Metrics
  const shopsData = {
    US_Seller_Main: {
      accountHealth: 347,
      lateDispatch: 6.2,
      onTimeDelivery: 87.0,
      vtr: 96.4,
      shieldScore: 35,
      status: 'critical',
      alerts: [
        { id: 1, type: 'danger', title: 'Late Dispatch Rate Crítico', desc: 'Estás en 6.2% — El límite permitido de TikTok es 4.0%. Tenés 3 órdenes sin tracking vinculado en las últimas 48 horas.' },
        { id: 2, type: 'warning', title: 'Tendencia de Caída detectada', desc: 'Tu Account Health Score cayó 53 puntos. Estimamos riesgo de suspensión de afiliados en 4 días si no se apela la última penalización.' },
        { id: 3, type: 'warning', title: 'Inconsistencia en Catálogo de Producto', desc: 'El listing "Suplemento Omega 3 Pro" requiere certificaciones sanitarias adicionales cargadas en TikTok Seller Center.' }
      ]
    },
    UK_Fashion_Outlet: {
      accountHealth: 890,
      lateDispatch: 1.1,
      onTimeDelivery: 99.2,
      vtr: 99.8,
      shieldScore: 92,
      status: 'healthy',
      alerts: []
    },
    EU_Tech_Hub: {
      accountHealth: 720,
      lateDispatch: 3.8,
      onTimeDelivery: 94.5,
      vtr: 98.1,
      shieldScore: 72,
      status: 'warning',
      alerts: [
        { id: 4, type: 'warning', title: 'Late Dispatch al límite', desc: 'Actualmente en 3.8% (Límite: 4.0%). Dos retrasos más podrían activar penalización por punto de infracción.' }
      ]
    }
  };

  const currentShopData = shopsData[selectedShop];
  const [activeAlerts, setActiveAlerts] = useState(currentShopData.alerts);

  // Sync alerts when shop changes
  useEffect(() => {
    setActiveAlerts(currentShopData.alerts);
  }, [selectedShop]);

  // 3D Perspective Digital Wave Animation inside Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const cols = 24;
    const rows = 24;
    const spacingX = 70;
    const spacingZ = 70;
    const depth = rows * spacingZ;

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      time += 0.006;

      for (let x = 0; x < cols; x++) {
        for (let z = 0; z < rows; z++) {
          const posX = (x - cols / 2) * spacingX;
          const posZ = z * spacingZ + 120;
          
          // Wave dynamics - oscillating sine & cosine math
          const posY = Math.sin(x * 0.18 + time) * Math.cos(z * 0.18 + time) * 50 
                     + Math.sin((x + z) * 0.06 + time * 1.8) * 18;
          
          // Perspective math
          const focalLength = 360;
          const scale = focalLength / (posZ + focalLength);
          
          // Project points (push down into screen view)
          const screenX = width / 2 + posX * scale;
          const screenY = height / 1.7 + (posY + 160) * scale;
          
          if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
            const alpha = Math.max(0, 1 - posZ / depth) * 0.38;
            
            // Subtle Auros teals/cyan color oscillation
            const green = Math.floor(120 + Math.sin(time + x * 0.1) * 45);
            const blue = Math.floor(180 + Math.cos(time + z * 0.1) * 60);
            
            ctx.fillStyle = `rgba(0, ${green}, ${blue}, ${alpha})`;
            
            // Draw grid dots
            ctx.beginPath();
            ctx.arc(screenX, screenY, scale * 3.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Connection line to the right neighbor
            if (x < cols - 1) {
              const nextPosX = (x + 1 - cols / 2) * spacingX;
              const nextPosY = Math.sin((x + 1) * 0.18 + time) * Math.cos(z * 0.18 + time) * 50 
                             + Math.sin((x + 1 + z) * 0.06 + time * 1.8) * 18;
              const nextScale = focalLength / (posZ + focalLength);
              const nextScreenX = width / 2 + nextPosX * nextScale;
              const nextScreenY = height / 1.7 + (nextPosY + 160) * nextScale;
              
              ctx.strokeStyle = `rgba(0, ${green}, ${blue}, ${alpha * 0.18})`;
              ctx.lineWidth = scale * 0.7;
              ctx.beginPath();
              ctx.moveTo(screenX, screenY);
              ctx.lineTo(nextScreenX, nextScreenY);
              ctx.stroke();
            }
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleDismissAlert = (id) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const generateAppealContent = (category) => {
    const header = `A LA ATENCIÓN DEL DEPARTAMENTO DE COMPLIANCE DE TIKTOK SHOP\nASUNTO: Apelación Formal de Infracción y Restablecimiento de Métricas\nTIENDA: ${selectedShop}\nID DE SELLER: seller_id_tiktok_auto_${selectedShop.toLowerCase()}\nFECHA: ${new Date().toLocaleDateString()}\n\n`;
    
    switch (category) {
      case 'late_dispatch':
        return header + `Estimado Equipo de Soporte Técnico y Cumplimiento,\n\nEscribo en representación de la tienda para apelar la reciente penalización de puntos aplicada a nuestro perfil de vendedor debido a la tasa de envío tardío (Late Dispatch Rate de ${currentShopData.lateDispatch}%).\n\n1. CAUSA PRINCIPAL:\nHemos identificado que el desfase se debió a un retraso de sincronización de la API de nuestro transportista local durante el período de alta demanda. Las órdenes fueron despachadas físicamente a tiempo, pero el tracking no se transmitió correctamente a los servidores de TikTok Shop dentro del plazo estándar de 24-48 horas.\n\n2. ACCIONES CORRECTIVAS INMEDIATAS:\n- Hemos migrado nuestro webhook de tracking a un canal dedicado de redundancia por API oficial.\n- Aumentamos el personal operativo de fulfillment en un 30% en las horas pico.\n- Todos los números de guía se verificarán manualmente al final de cada jornada.\n\nSolicitamos la remoción de los puntos de penalización asociados para normalizar nuestro estado de seller.\n\nAtentamente,\nEquipo de Operaciones de ${selectedShop}`;
      case 'compliance_copyright':
        return header + `Estimado Equipo de Moderación de Catálogo,\n\nNos ponemos en contacto con ustedes con relación a la infracción de catálogo por supuesta inconsistencia de marca o derechos de autor aplicada a nuestro producto.\n\n1. DOCUMENTACIÓN ADJUNTA:\nAdjuntamos en formato PDF a través de la consola la carta oficial de autorización de distribución directa y el certificado de autenticidad del fabricante original.\n\n2. MEDIDAS OPERATIVAS:\n- Todo nuestro catálogo ha sido escaneado preventivamente por un motor de compliance automático.\n- No se listarán nuevos productos sin aprobación legal previa del titular de la propiedad intelectual.\n\nSolicitamos la reactivación inmediata de las publicaciones afectadas.\n\nQuedamos a su entera disposición,\n${selectedShop} Directorship`;
      case 'seller_metrics':
        return header + `Estimado Comité de Apelaciones de TikTok Shop,\n\nSolicitamos formalmente una revisión exhaustiva de nuestro Account Health Score actual (${currentShopData.accountHealth}/1000) bajo el amparo de la sección de soporte al vendedor partner.\n\nIdentificamos picos de quejas repetidas de tres cuentas específicas de usuarios en el mismo rango de fecha. Sospechamos un ataque coordinado de competidores maliciosos que viola las directrices de comunidad de TikTok.\n\nPedimos una auditoría de estas órdenes de compra externas y el restablecimiento de nuestro estatus operativo saludable.\n\nSaludos cordiales,\n${selectedShop}`;
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
      const lowerText = complianceText.toLowerCase();
      let status = 'passed';
      let issues = [];

      if (lowerText.includes('omega') || lowerText.includes('suplemento') || lowerText.includes('medicina')) {
        status = 'warning';
        issues.push('Requiere registro sanitario y carga del certificado de laboratorio en TikTok FDA Center.');
      }
      if (lowerText.includes('nike') || lowerText.includes('apple') || lowerText.includes('diseñador') || lowerText.includes('replica')) {
        status = 'failed';
        issues.push('Posible infracción de marca registrada de alto impacto (Copyright Auto-Ban Risk).');
      }
      if (lowerText.includes('gratis') || lowerText.includes('100% garantizado') || lowerText.includes('cura')) {
        status = 'warning';
        issues.push('Afirmación engañosa o no permitida según políticas de publicidad orgánica de TikTok.');
      }

      setComplianceStatus({ status, issues });
      setIsScanning(false);
    }, 1400);
  };

  const faqs = [
    { q: "¿Cómo se conecta ShopGuard con mi cuenta de TikTok Shop?", a: "Se conecta mediante la API oficial de TikTok Shop Partner en un solo click. No guardamos tus credenciales de inicio de sesión ni modificamos tus productos, solo leemos tus métricas de salud en tiempo real." },
    { q: "¿ShopGuard puede prevenir un ban automático de TikTok?", a: "Sí. Nuestra IA detecta anomalías en tu Late Dispatch Rate y en las quejas de clientes 48 horas antes de que alcancen el umbral de penalización de TikTok, dándote una ventana crítica para corregirlo." },
    { q: "¿Cómo funciona el generador automático de appeals?", a: "Si tu cuenta recibe una infracción, nuestro sistema analiza el código de error exacto de TikTok y redacta una apelación optimizada legalmente con las plantillas de mayor tasa de éxito del mercado." },
    { q: "¿Puedo añadir múltiples tiendas en el plan Pro?", a: "¡Sí! El plan Pro te permite enlazar hasta 3 tiendas de TikTok Shop de forma simultánea con un único panel centralizado y alertas independientes." }
  ];

  return (
    <div className="min-h-screen bg-midnight-canvas text-frost-white font-roobert antialiased overflow-x-hidden relative">
      
      {/* GRADIENT ATMOSPHERE */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-animated opacity-10" />
      </div>
      
      {/* 3D PARTICLE NETWORK CANVAS (Smooth dynamic data waves) */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {/* RENDER DUAL-STATE VIEWS */}
      {view === 'landing' ? (
        <div className="animate-fade-in relative z-10">
          
          {/* NAVBAR - Nav links completely removed for high-fidelity Saas feel */}
          <nav className="border-b border-white/10 bg-midnight-canvas/90 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-frost-white border border-white/20">
                  <ShieldCheck className="w-5 h-5 animate-float" />
                </div>
                <span className="font-medium text-frost-white font-roobert tracking-normal">ShopGuard</span>
              </div>
              
              <button 
                onClick={() => setView('dashboard')}
                className="bg-frost-white text-midnight-canvas font-medium text-xs py-2.5 px-5 rounded-buttons hover:opacity-80 transition-all font-roobert"
              >
                Acceder al Dashboard
              </button>
            </div>
          </nav>

          {/* HERO SECTION */}
          <header className="relative max-w-5xl mx-auto pt-24 pb-20 px-6 text-center z-10">
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-1.5 rounded-buttons text-frost-white text-xs font-medium tracking-widest uppercase mb-8 animate-slide-up-fade">
              <span className="w-2 h-2 rounded-full bg-hero-gradient animate-pulse" />
              700,000 sellers protegidos en tiempo real
            </div>
            
            {/* Cinematic 3D entrance heading */}
            <h1 className="text-heading md:text-heading-lg font-medium max-w-4xl mx-auto leading-tight text-frost-white animate-reveal-3d font-roobert">
              Account protection <br />
              <span className="text-transparent bg-clip-text bg-hero-gradient">made simple</span> <br />
              <span className="text-whisper-gray font-normal">for TikTok Shop</span>
            </h1>
            
            <p className="mt-6 text-whisper-gray max-w-xl mx-auto text-body leading-relaxed font-normal animate-slide-up-fade delay-100 opacity-0">
              ShopGuard monitorea tu cuenta 24/7, predice suspensiones antes de que pasen y genera tu appeal automáticamente si algo sale mal.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4 justify-center animate-slide-up-fade delay-200 opacity-0">
              <button 
                onClick={() => setView('dashboard')}
                className="bg-frost-white text-midnight-canvas font-medium px-8 py-4 rounded-buttons hover:opacity-80 transition-all flex items-center gap-2 group text-body"
              >
                Probar Dashboard Live <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#how-it-works"
                className="bg-transparent border border-white/30 text-frost-white font-medium px-8 py-4 rounded-buttons hover:bg-white/10 transition-all text-body"
              >
                Ver Funcionamiento
              </a>
            </div>

            <div className="mt-20 relative w-full h-[220px] md:h-[320px] rounded-t-[1000px] border-t-2 border-white/20 flex items-end justify-center overflow-hidden bg-gradient-to-t from-black via-white/5 to-transparent">
              <div className="absolute top-0 w-12 h-12 rounded-full bg-black border-2 border-white/30 flex items-center justify-center text-frost-white shadow-xl -translate-y-1/2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="w-[90%] h-full bg-hero-gradient blur-3xl opacity-10 rounded-t-full" />
            </div>
          </header>

          {/* TRUSTED BY */}
          <section className="border-y border-white/10 bg-deep-shadow/50 py-8 px-6 text-center z-10 relative">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
              <span className="text-caption text-whisper-gray tracking-widest uppercase font-medium">Trusted by top sellers on</span>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 font-medium text-frost-white/50 text-body tracking-wider">
                <span className="hover:text-frost-white transition-colors cursor-default">TikTok Shop</span>
                <span className="hover:text-frost-white transition-colors cursor-default">Shopify</span>
                <span className="hover:text-frost-white transition-colors cursor-default">WooCommerce</span>
                <span className="hover:text-frost-white transition-colors cursor-default">BigCommerce</span>
              </div>
            </div>
          </section>

          {/* STATS ROW */}
          <section className="grid grid-cols-1 md:grid-cols-3 border-b border-white/10 bg-deep-shadow/20 relative z-10">
            <div className="border-r border-white/10 p-10 text-center hover:bg-white/5 transition-colors">
              <span className="text-display font-medium text-frost-white tracking-tight block">700K+</span>
              <p className="text-caption text-whisper-gray mt-2.5 leading-relaxed uppercase tracking-widest">Sellers baneados<br />en los últimos 6 meses</p>
            </div>
            <div className="border-r border-white/10 p-10 text-center hover:bg-white/5 transition-colors">
              <span className="text-display font-medium text-frost-white tracking-tight block">$20K</span>
              <p className="text-caption text-whisper-gray mt-2.5 leading-relaxed uppercase tracking-widest">Revenue promedio diario<br />perdido por suspensiones</p>
            </div>
            <div className="p-10 text-center hover:bg-white/5 transition-colors">
              <span className="text-display font-medium text-frost-white tracking-tight block">48H</span>
              <p className="text-caption text-whisper-gray mt-2.5 leading-relaxed uppercase tracking-widest">Ventana de acción crítica<br />antes del ban permanente</p>
            </div>
          </section>

          {/* STEP-BY-STEP */}
          <section id="how-it-works" className="max-w-6xl mx-auto py-24 px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="text-caption font-medium text-midnight-canvas uppercase tracking-widest bg-frost-white px-3 py-1.5 rounded-buttons">Workflow</span>
              <h2 className="text-heading md:text-heading-lg font-medium mt-4 animate-reveal-3d text-frost-white font-roobert">Step-by-Step Protection</h2>
              <p className="text-whisper-gray mt-4 text-body max-w-md mx-auto">Tres capas de protección inteligentes que blindan tu facturación en segundo plano.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: '01', title: 'Conecta tu shop', desc: 'Autorizás ShopGuard con tu cuenta de TikTok Shop en un click. Setup automatizado en 5 minutos sin tocar código.' },
                { id: '02', title: 'Monitor en tiempo real', desc: 'Analizamos de manera continua tu Account Health Score, late dispatch rate, tracking y compliance de catálogos.' },
                { id: '03', title: 'Alerta y actúa', desc: 'Recibís notificaciones push inmediatas antes del riesgo. Si te banean, generamos y enviamos el appeal automatizado.' }
              ].map((step, idx) => (
                <div key={step.id} className="bg-deep-shadow border border-white/10 rounded-cards p-10 hover:border-white/25 transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
                  <span className="text-display font-medium text-white/10 absolute top-4 right-6 group-hover:text-white/20 transition-all duration-300 font-mono">{step.id}</span>
                  <h3 className="text-subheading font-medium text-frost-white mt-4">{step.title}</h3>
                  <p className="text-whisper-gray text-body mt-3 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SIMULATED EMBEDDED DASHBOARD ANCHOR */}
          <section className="max-w-6xl mx-auto py-12 px-6 relative z-10 border-t border-white/10">
            <div className="text-center mb-8">
              <span className="text-caption font-medium text-midnight-canvas uppercase tracking-widest bg-frost-white px-3 py-1.5 rounded-buttons">Vista Previa Interactiva</span>
              <h2 className="text-heading font-medium mt-4 animate-reveal-3d text-frost-white font-roobert">Prueba la plataforma operativa</h2>
              <p className="text-whisper-gray mt-2 text-body">Accede a una simulación completamente funcional haciendo click a continuación.</p>
            </div>
            <div className="flex justify-center mb-12">
              <button 
                onClick={() => setView('dashboard')}
                className="bg-frost-white text-midnight-canvas px-8 py-3 rounded-buttons font-medium text-body hover:opacity-80 transition-all flex items-center gap-2"
              >
                Abrir Consola de Control Live <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* FEATURES GRID */}
          <section id="features" className="max-w-6xl mx-auto py-24 px-6 border-t border-white/10 relative z-10">
            <div className="text-center mb-16">
              <span className="text-caption font-medium text-midnight-canvas uppercase tracking-widest bg-frost-white px-3 py-1.5 rounded-buttons">Módulos</span>
              <h2 className="text-heading md:text-heading-lg font-medium mt-4 animate-reveal-3d text-frost-white font-roobert">Ecosistema Completo de Cobertura</h2>
              <p className="text-whisper-gray mt-4 text-body max-w-md mx-auto">Herramientas automatizadas desarrolladas específicamente para las políticas cambiantes de TikTok.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <Activity />, title: 'Monitor de Métricas 24/7', desc: 'Rastreo permanente de Dispatch Rate y Account Health. Detectamos caídas antes de que generen penalizaciones.' },
                { icon: <Brain />, title: 'Ban Prediction AI', desc: 'Modelos predictivos entrenados con miles de tiendas suspendidas para alertarte 48h antes de recibir infracciones.' },
                { icon: <FileText />, title: 'Apelaciones Automatizadas', desc: 'Redacción instantánea de contrarreferencias utilizando terminología legal aprobada directamente por moderadores de TikTok.' },
                { icon: <ClipboardCheck />, title: 'Filtro de Compliance', desc: 'Escaneo inteligente de imágenes y descripciones de producto previo al listado para evitar infracciones por copyright o marca.' },
                { icon: <ShieldAlert />, title: 'Asistente de INFORM Act', desc: 'Auditoría continua de tus datos fiscales y empresariales para prevenir cierres repentinos por cambios regulatorios.' },
                { icon: <Star />, title: 'Protección Anti-Ataques', desc: 'Monitoreo de picos anormales de reseñas negativas o reclamos de competidores maliciosos para mitigarlos en tiempo récord.' }
              ].map((feat, idx) => (
                <div key={idx} className="bg-deep-shadow border border-white/10 hover:border-white/25 transition-all duration-300 rounded-cards p-9 group">
                  <div className="w-10 h-10 bg-black border border-white/15 rounded-cards flex items-center justify-center text-frost-white mb-4 group-hover:scale-105 transition-transform">{feat.icon}</div>
                  <h3 className="text-subheading font-medium text-frost-white transition-colors">{feat.title}</h3>
                  <p className="text-whisper-gray text-body mt-2.5 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section id="testimonials" className="max-w-6xl mx-auto py-20 px-6 border-t border-white/10 relative z-10">
            <div className="text-center mb-16">
              <span className="text-caption font-medium text-midnight-canvas uppercase tracking-widest bg-frost-white px-3 py-1.5 rounded-buttons">Prueba Real</span>
              <h2 className="text-heading md:text-heading-lg font-medium mt-4 animate-reveal-3d text-frost-white font-roobert">Sellers que salvaron su negocio</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-deep-shadow border border-white/10 p-9 md:p-12 rounded-cards relative hover:border-white/20 transition-colors">
                <div className="flex gap-1 text-frost-white mb-3"><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /></div>
                <p className="text-body text-whisper-gray leading-relaxed">"TikTok nos metió un ban por error en pleno Black Friday. El appeal automático de ShopGuard se generó y aprobó en menos de 6 horas. Nos salvó el año entero de facturación."</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-caption font-medium text-frost-white">AM</div>
                  <div>
                    <h5 className="text-caption font-medium text-frost-white">Alex M.</h5>
                    <span className="text-[10px] text-whisper-gray">TikTok Seller de Electrónica ($80k/mes)</span>
                  </div>
                </div>
              </div>

              <div className="bg-deep-shadow border border-white/10 p-9 md:p-12 rounded-cards relative hover:border-white/20 transition-colors">
                <div className="flex gap-1 text-frost-white mb-3"><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /></div>
                <p className="text-body text-whisper-gray leading-relaxed">"La predicción de IA nos avisó del problema con los trackings de USPS un fin de semana completo antes de que TikTok saltara. Pudimos pausar campañas y evitar la penalización."</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-caption font-medium text-frost-white">DR</div>
                  <div>
                    <h5 className="text-caption font-medium text-frost-white">Dani R.</h5>
                    <span className="text-[10px] text-whisper-gray">Dropshipper e-Com en USA</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section id="pricing" className="max-w-6xl mx-auto py-24 px-6 border-t border-white/10 relative z-10">
            <div className="text-center mb-16">
              <span className="text-caption font-medium text-midnight-canvas uppercase tracking-widest bg-frost-white px-3 py-1.5 rounded-buttons">Precios</span>
              <h2 className="text-heading md:text-heading-lg font-medium mt-4 animate-reveal-3d text-frost-white font-roobert">Planes simples, sin sorpresas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
              <div className="bg-deep-shadow border border-white/10 rounded-cards p-6 flex flex-col justify-between hover:border-white/20 transition-colors">
                <div>
                  <span className="text-caption font-medium text-whisper-gray uppercase tracking-widest block">Basic Protection</span>
                  <div className="text-heading font-medium mt-2 text-frost-white tracking-tight">$47<span className="text-caption font-normal text-whisper-gray">/mes</span></div>
                  <ul className="mt-6 space-y-3.5 text-caption text-whisper-gray">
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Monitor de 1 tienda</li>
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Alertas por correo y push</li>
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Escáner básico de catálogo</li>
                  </ul>
                </div>
                <button 
                  onClick={() => setView('dashboard')}
                  className="w-full mt-8 py-3 rounded-buttons border border-white/30 text-caption font-medium hover:bg-white/10 transition-all text-frost-white"
                >
                  Empezar hoy
                </button>
              </div>

              <div className="bg-frost-white border-2 border-white rounded-cards p-6 flex flex-col justify-between relative shadow-2xl">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-midnight-canvas text-frost-white font-medium text-[9px] uppercase tracking-widest px-3 py-1 rounded-buttons border border-white/20">RECOMENDADO</span>
                <div>
                  <span className="text-caption font-medium text-frost-white uppercase tracking-wider block">Pro Shield</span>
                  <div className="text-heading font-medium mt-2 text-frost-white tracking-tight">$97<span className="text-caption font-normal text-whisper-gray">/mes</span></div>
                  <ul className="mt-6 space-y-3.5 text-caption text-midnight-canvas">
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Monitor para 3 tiendas</li>
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Inteligencia Ban Prediction AI</li>
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Appeals Automatizados Premium</li>
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Soporte en directo de INFORM Act</li>
                  </ul>
                </div>
                <button 
                  onClick={() => setView('dashboard')}
                  className="w-full mt-8 py-3 rounded-buttons bg-midnight-canvas text-frost-white text-caption font-medium hover:opacity-80 transition-all"
                >
                  Activar Cobertura
                </button>
              </div>

              <div className="bg-deep-shadow border border-white/10 rounded-cards p-6 flex flex-col justify-between hover:border-white/20 transition-colors">
                <div>
                  <span className="text-caption font-medium text-whisper-gray uppercase tracking-widest block">Enterprise / Agency</span>
                  <div className="text-heading font-medium mt-2 text-frost-white tracking-tight">$197<span className="text-caption font-normal text-whisper-gray">/mes</span></div>
                  <ul className="mt-6 space-y-3.5 text-caption text-whisper-gray">
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Tiendas vinculadas ilimitadas</li>
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Consola de Marca Blanca</li>
                    <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-frost-white flex-shrink-0" /> Acceso total a Webhook & API</li>
                  </ul>
                </div>
                <button 
                  onClick={() => setView('dashboard')}
                  className="w-full mt-8 py-3 rounded-buttons border border-white/30 text-caption font-medium hover:bg-white/10 transition-all text-frost-white"
                >
                  Contactar Ventas
                </button>
              </div>
            </div>

            {/* BUNDLE PROMO BOX */}
            <div className="mt-20 bg-deep-shadow border border-white/15 rounded-cards p-8 flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-hero-gradient blur-[100px] opacity-10 pointer-events-none" />
              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 text-midnight-canvas text-[10px] font-medium uppercase tracking-widest bg-frost-white px-3 py-1.5 rounded-buttons"><Zap className="w-3 h-3 text-midnight-canvas" /> Suite de Crecimiento</div>
                <h3 className="text-subheading font-medium tracking-tight animate-reveal-3d text-frost-white">Bundle VyshAI + ShopGuard</h3>
                <p className="text-whisper-gray text-body max-w-md">
                  VyshAI localiza y filtra los productos con mayor demanda y potencial. ShopGuard blinda tu infraestructura operativa ante infracciones mientras escalás la pauta publicitaria.
                </p>
              </div>
              <div className="text-center flex-shrink-0 bg-black border border-white/15 p-6 rounded-cards min-w-[240px]">
                <div className="text-[10px] text-whisper-gray line-through">VyshAI $99 + ShopGuard $97 = $196</div>
                <div className="text-subheading font-medium text-frost-white mt-1 tracking-tight">$147<span className="text-caption font-normal text-whisper-gray">/mes</span></div>
                <div className="text-[10px] text-frost-white font-medium mt-1.5 bg-white/10 border border-white/15 py-1 px-2 rounded-buttons inline-block">Ahorrás $49 al mes · Cancelá cuando quieras</div>
                <button 
                  onClick={() => setView('dashboard')}
                  className="w-full mt-4 bg-frost-white text-midnight-canvas text-caption font-medium py-3 rounded-buttons hover:opacity-80 transition-all"
                >
                  Adquirir Suite Completa
                </button>
              </div>
            </div>
          </section>

          {/* INTERACTIVE FAQ SECTION */}
          <section className="max-w-3xl mx-auto py-20 px-6 border-t border-white/10 relative z-10">
            <div className="text-center mb-14">
              <div className="w-10 h-10 bg-deep-shadow border border-white/15 rounded-cards flex items-center justify-center text-frost-white mx-auto mb-4"><HelpCircle className="w-5 h-5" /></div>
              <h2 className="text-subheading md:text-heading font-medium tracking-tight animate-reveal-3d text-frost-white font-roobert">Preguntas frecuentes</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border border-white/10 bg-deep-shadow/50 rounded-cards overflow-hidden transition-all">
                    <button 
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between text-left p-5 font-medium text-body md:text-subheading text-frost-white hover:bg-white/5 transition-all"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <Minus className="w-4 h-4 text-frost-white flex-shrink-0" /> : <Plus className="w-4 h-4 text-whisper-gray flex-shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-whisper-gray text-body leading-relaxed border-t border-white/10 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-white/10 bg-midnight-canvas px-6 py-10 text-caption text-whisper-gray relative z-10">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-white/10 border border-white/15 rounded-full flex items-center justify-center text-frost-white"><ShieldCheck className="w-3.5 h-3.5" /></div>
                <span className="font-medium text-frost-white">ShopGuard © 2026</span>
              </div>
              <div className="flex gap-6 text-whisper-gray">
                <a href="#" className="hover:text-frost-white transition-colors">Términos de servicio</a>
                <a href="#" className="hover:text-frost-white transition-colors">Política de privacidad</a>
              </div>
              <span className="text-[11px] text-whisper-gray/60">Setup instantáneo en 5 minutos · Sin permanencia obligatoria</span>
            </div>
          </footer>

        </div>
      ) : (
        /* 100% FUNCTIONAL INTERACTIVE DASHBOARD VIEW */
        <div className="animate-fade-in min-h-screen bg-midnight-canvas flex flex-col relative z-10">
          
          {/* Top Command Bar */}
          <header className="border-b border-white/10 bg-deep-shadow/90 px-6 py-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setView('landing')} 
                className="flex items-center gap-2 text-caption text-whisper-gray hover:text-frost-white border border-white/20 bg-black/50 py-1.5 px-3 rounded-buttons transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver a la Landing
              </button>
              
              <div className="h-6 w-px bg-white/15 hidden sm:block" />
              
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-frost-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-frost-white hidden sm:inline">ShopGuard Command Center</span>
              </div>
            </div>

            {/* Shop Switcher Component */}
            <div className="flex items-center gap-3">
              <span className="text-caption text-whisper-gray hidden md:inline uppercase tracking-wider">Tienda Activa:</span>
              <div className="relative">
                <select 
                  value={selectedShop} 
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="bg-black border border-white/20 text-frost-white text-caption py-1.5 px-4 pr-8 rounded-buttons font-medium focus:outline-none focus:border-white/50 cursor-pointer appearance-none"
                >
                  <option value="US_Seller_Main">US_Seller_Main</option>
                  <option value="UK_Fashion_Outlet">UK_Fashion_Outlet</option>
                  <option value="EU_Tech_Hub">EU_Tech_Hub</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-whisper-gray">
                  <Plus className="w-3 h-3 rotate-45" />
                </div>
              </div>

              <button 
                onClick={() => setView('landing')}
                className="bg-white/10 hover:bg-white/20 text-frost-white p-2 rounded-buttons transition-all"
                title="Cerrar Consola"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Sub Navigation Bar inside Dashboard */}
          <div className="bg-deep-shadow/55 border-b border-white/10 px-6 py-2">
            <div className="max-w-[1440px] mx-auto flex items-center gap-4 text-caption font-arial font-medium">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`py-1 px-3 rounded-links flex items-center gap-1.5 transition-all ${activeTab === 'overview' ? 'bg-frost-white text-midnight-canvas' : 'text-whisper-gray hover:text-frost-white hover:bg-white/10'}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Métricas y Diagnósticos
              </button>
              <button 
                onClick={() => setActiveTab('appeals')}
                className={`py-1 px-3 rounded-links flex items-center gap-1.5 transition-all ${activeTab === 'appeals' ? 'bg-frost-white text-midnight-canvas' : 'text-whisper-gray hover:text-frost-white hover:bg-white/10'}`}
              >
                <FileText className="w-3.5 h-3.5" /> Generador de Appeals AI
              </button>
              <button 
                onClick={() => setActiveTab('compliance')}
                className={`py-1 px-3 rounded-links flex items-center gap-1.5 transition-all ${activeTab === 'compliance' ? 'bg-frost-white text-midnight-canvas' : 'text-whisper-gray hover:text-frost-white hover:bg-white/10'}`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" /> Compliance Sandbox Scanner
              </button>
            </div>
          </div>

          {/* Dashboard Main Workspace */}
          <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 space-y-6">
            
            {/* Status Header Banner */}
            <div className="bg-deep-shadow border border-white/10 rounded-cards p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-caption text-whisper-gray uppercase tracking-widest">TikTok Shop Partner Status</span>
                <h2 className="text-subheading font-medium text-frost-white mt-1 flex items-center gap-2">
                  Consola de Análisis: <span className="text-transparent bg-clip-text bg-hero-gradient font-bold">{selectedShop}</span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-badges text-caption font-medium border ${
                  currentShopData.status === 'critical' ? 'bg-white/10 border-white/50 text-frost-white' : 
                  currentShopData.status === 'warning' ? 'bg-white/5 border-white/30 text-whisper-gray' : 
                  'bg-white/10 border-white/20 text-frost-white'
                }`}>
                  {currentShopData.status === 'critical' ? '[ZONA DE RIESGO SUSPENSIÓN]' : 
                   currentShopData.status === 'warning' ? '[ANOMALÍAS DETECTADAS]' : 
                   '[SISTEMA DE PROTECCIÓN ACTIVO]'}
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-frost-white animate-pulse" />
              </div>
            </div>

            {/* TAB CONTENT: 1. OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Account Health */}
                  <div className="bg-deep-shadow border border-white/10 rounded-cards p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-caption text-whisper-gray uppercase tracking-wider">Health Score</span>
                        <ShieldAlert className={`w-5 h-5 ${currentShopData.accountHealth < 400 ? 'text-white' : 'text-frost-white'}`} />
                      </div>
                      <div className="text-heading font-medium text-frost-white mt-2">
                        {currentShopData.accountHealth} <span className="text-caption text-whisper-gray">/ 1000</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-whisper-gray">
                      <span>Umbral de Suspensión: 200</span>
                      <span className={currentShopData.accountHealth < 400 ? 'text-white' : 'text-frost-white'}>
                        {currentShopData.accountHealth < 400 ? 'Crítico' : 'Estable'}
                      </span>
                    </div>
                  </div>

                  {/* Late Dispatch Rate */}
                  <div className="bg-deep-shadow border border-white/10 rounded-cards p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-caption text-whisper-gray uppercase tracking-wider">Late Dispatch Rate</span>
                        <Activity className="w-5 h-5 text-frost-white" />
                      </div>
                      <div className="text-heading font-medium text-frost-white mt-2">
                        {currentShopData.lateDispatch}%
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-whisper-gray">
                      <span>Límite TikTok: 4.0%</span>
                      <span className={currentShopData.lateDispatch > 4 ? 'text-white' : 'text-frost-white'}>
                        {currentShopData.lateDispatch > 4 ? 'Excedido' : 'Óptimo'}
                      </span>
                    </div>
                  </div>

                  {/* On-Time Delivery */}
                  <div className="bg-deep-shadow border border-white/10 rounded-cards p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-caption text-whisper-gray uppercase tracking-wider">On-Time Delivery</span>
                        <CheckCircle2 className="w-5 h-5 text-frost-white" />
                      </div>
                      <div className="text-heading font-medium text-frost-white mt-2">
                        {currentShopData.onTimeDelivery}%
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-whisper-gray">
                      <span>Objetivo: 95.0%</span>
                      <span className="text-frost-white">Activo</span>
                    </div>
                  </div>

                  {/* VTR */}
                  <div className="bg-deep-shadow border border-white/10 rounded-cards p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-caption text-whisper-gray uppercase tracking-wider">Valid Tracking Rate</span>
                        <Eye className="w-5 h-5 text-frost-white" />
                      </div>
                      <div className="text-heading font-medium text-frost-white mt-2">
                        {currentShopData.vtr}%
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-whisper-gray">
                      <span>Mínimo: 95.0%</span>
                      <span className="text-frost-white">Estable</span>
                    </div>
                  </div>

                </div>

                {/* Detailed Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Alerts Management Engine */}
                  <div className="bg-deep-shadow border border-white/10 rounded-cards p-6 lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-caption font-medium text-frost-white uppercase tracking-wider font-arial">Consola de Alertas Operativas</span>
                      <span className="text-caption text-whisper-gray font-mono">{activeAlerts.length} Pendientes</span>
                    </div>

                    {activeAlerts.length === 0 ? (
                      <div className="py-12 text-center text-whisper-gray space-y-3">
                        <div className="w-12 h-12 rounded-full bg-white/10 mx-auto flex items-center justify-center text-frost-white">
                          <Check className="w-6 h-6" />
                        </div>
                        <p className="text-body font-medium text-frost-white">¡Sin alertas ni penalizaciones críticas registradas!</p>
                        <p className="text-caption text-whisper-gray/70">Tu infraestructura operativa está completamente sana.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeAlerts.map((alert) => (
                          <div key={alert.id} className="p-4 bg-black/30 border border-white/10 rounded-cards flex items-start gap-4 transition-all hover:border-white/20">
                            <div className="p-2 rounded-cards bg-white/10 border border-white/10 flex-shrink-0 text-frost-white">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="text-caption font-bold text-frost-white uppercase tracking-wider">{alert.title}</h4>
                                <button 
                                  onClick={() => handleDismissAlert(alert.id)}
                                  className="text-[10px] text-whisper-gray hover:text-frost-white border border-white/15 px-2 py-0.5 rounded-buttons bg-black/40"
                                >
                                  Resolver / Descartar
                                </button>
                              </div>
                              <p className="text-caption text-whisper-gray mt-1.5 leading-relaxed">{alert.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shield Global Score Indicator */}
                  <div className="bg-deep-shadow border border-white/10 rounded-cards p-6 flex flex-col justify-between">
                    <span className="text-caption font-medium text-whisper-gray tracking-wider uppercase">Indicador de Fuerza ShopGuard</span>
                    
                    <div className="flex flex-col items-center py-6">
                      <div className="relative w-36 h-36">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <defs>
                            <linearGradient id="vividAquaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#00827c" />
                              <stop offset="100%" stopColor="#cbfffc" />
                            </linearGradient>
                          </defs>
                          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(237, 255, 254, 0.02)" strokeWidth="8" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#vividAquaGrad)" strokeWidth="8" strokeDasharray="264" strokeDashoffset={264 - (264 * currentShopData.shieldScore) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-display font-medium text-frost-white tracking-tighter">{currentShopData.shieldScore}</span>
                          <span className="text-caption text-whisper-gray font-medium uppercase tracking-wider">/ 100</span>
                        </div>
                      </div>
                      <span className="text-caption text-whisper-gray mt-4 uppercase tracking-wider">
                        Protección: {currentShopData.shieldScore > 75 ? 'Robusta' : currentShopData.shieldScore > 50 ? 'Intermedia' : 'Vulnerable'}
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-white/10 pt-4 text-caption text-whisper-gray">
                      <div className="flex justify-between">
                        <span>Estado IA:</span>
                        <span className="text-frost-white font-medium">Activo</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frecuencia escaneo:</span>
                        <span className="text-frost-white font-medium">Cada 5 minutos</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. AI APPEAL GENERATOR */}
            {activeTab === 'appeals' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                
                {/* Form parameters */}
                <div className="bg-deep-shadow border border-white/10 rounded-cards p-8 space-y-6">
                  <div>
                    <h3 className="text-subheading font-medium text-frost-white">Generador Automatizado de Apelaciones</h3>
                    <p className="text-caption text-whisper-gray mt-1 leading-relaxed">
                      Si recibes un bloqueo de producto o de cuenta, utiliza nuestro motor entrenado con políticas de TikTok para redactar el contra-argumento legal óptimo.
                    </p>
                  </div>

                  <form onSubmit={handleGenerateAppeal} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-caption text-frost-white uppercase tracking-wider block">Categoría de la Infracción</label>
                      <select 
                        value={appealCategory} 
                        onChange={(e) => setAppealCategory(e.target.value)}
                        className="w-full bg-black border border-white/20 text-frost-white text-caption py-3 px-4 rounded-cards focus:outline-none focus:border-white/50 cursor-pointer"
                      >
                        <option value="late_dispatch">Tasa de Envío Tardío (Late Dispatch Rate)</option>
                        <option value="compliance_copyright">Cumplimiento de Propiedad Intelectual / Copyright</option>
                        <option value="seller_metrics">Account Health Score Crítico (Ataque Competidor)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-caption text-frost-white uppercase tracking-wider block">Tienda TikTok Asociada</label>
                      <input 
                        type="text" 
                        value={selectedShop} 
                        disabled
                        className="w-full bg-black/30 border border-white/10 text-whisper-gray text-caption py-3 px-4 rounded-cards cursor-not-allowed" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isGenerating}
                      className="w-full bg-frost-white text-midnight-canvas py-3 rounded-buttons font-medium text-caption uppercase tracking-wider hover:opacity-80 transition-all flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Redactando con IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Generar Appeal Legal
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Resulting Document Panel */}
                <div className="bg-deep-shadow border border-white/10 rounded-cards p-8 flex flex-col justify-between space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-hero-gradient blur-[100px] opacity-10 pointer-events-none" />
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
                      <span className="text-caption font-medium text-frost-white uppercase tracking-wider font-arial">Documento Apelación Generado</span>
                      {generatedAppeal && (
                        <button 
                          onClick={handleCopyAppeal}
                          className="text-caption text-frost-white bg-white/10 border border-white/15 px-3 py-1 rounded-buttons flex items-center gap-1.5 hover:bg-white/20 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" /> {copied ? 'Copiado' : 'Copiar Texto'}
                        </button>
                      )}
                    </div>

                    {generatedAppeal ? (
                      <textarea 
                        readOnly 
                        value={generatedAppeal}
                        className="flex-1 min-h-[300px] bg-black/30 border border-white/15 rounded-cards p-4 text-[12px] font-mono text-frost-white/90 leading-relaxed focus:outline-none resize-none"
                      />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-whisper-gray py-12 space-y-3">
                        <FileText className="w-12 h-12 text-frost-white/30" />
                        <p className="text-body font-medium text-frost-white">Consola de Apelación Lista</p>
                        <p className="text-caption text-whisper-gray/70 max-w-xs">Configura los parámetros en el panel izquierdo y haz click en "Generar Appeal" para ver la plantilla de apelación automatizada.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: 3. COMPLIANCE SANDBOX SCANNER */}
            {activeTab === 'compliance' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                
                {/* Input listing area */}
                <div className="bg-deep-shadow border border-white/10 rounded-cards p-8 space-y-6">
                  <div>
                    <h3 className="text-subheading font-medium text-frost-white">Compliance Sandbox Scanner</h3>
                    <p className="text-caption text-whisper-gray mt-1 leading-relaxed">
                      Prueba tu catálogo antes de publicarlo en TikTok. Ingresa el título o descripción del producto para analizar posibles infracciones automáticas de copyright, marcas o lenguaje restringido.
                    </p>
                  </div>

                  <form onSubmit={handleScanCompliance} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-caption text-frost-white uppercase tracking-wider block">Texto del Listing a Escanear</label>
                      <textarea 
                        value={complianceText}
                        onChange={(e) => setComplianceText(e.target.value)}
                        placeholder="Ej. Suplemento Omega 3 de marca premium con fórmula garantizada para curar fatiga..."
                        className="w-full h-32 bg-black border border-white/20 rounded-cards p-4 text-caption text-frost-white placeholder-whisper-gray/40 focus:outline-none focus:border-white/50 resize-none"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isScanning}
                      className="w-full bg-frost-white text-midnight-canvas py-3 rounded-buttons font-medium text-caption uppercase tracking-wider hover:opacity-80 transition-all flex items-center justify-center gap-2"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Escaneando Catálogo...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" /> Ejecutar Escaneo
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Scan Results Panel */}
                <div className="bg-deep-shadow border border-white/10 rounded-cards p-8 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-hero-gradient blur-[100px] opacity-10 pointer-events-none" />

                  <div className="flex-1 flex flex-col">
                    <div className="pb-3 border-b border-white/10 mb-4 flex justify-between items-center">
                      <span className="text-caption font-medium text-frost-white uppercase tracking-wider font-arial">Diagnóstico del Sandbox</span>
                      {complianceStatus && (
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-badges border ${
                          complianceStatus.status === 'passed' ? 'bg-white/10 text-frost-white border-white/30' :
                          complianceStatus.status === 'warning' ? 'bg-white/5 text-whisper-gray border-white/20' :
                          'bg-white/5 border-white/50 text-frost-white'
                        }`}>
                          {complianceStatus.status === 'passed' ? '[APROBADO]' :
                           complianceStatus.status === 'warning' ? '[REQUERIMIENTOS DETECTADOS]' :
                           '[BLOQUEO AUTOMÁTICO DETECTADO]'}
                        </span>
                      )}
                    </div>

                    {complianceStatus ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-black/30 border border-white/10 rounded-cards">
                          <h4 className="text-caption font-bold text-frost-white uppercase tracking-wider">Análisis Detallado</h4>
                          
                          {complianceStatus.issues.length === 0 ? (
                            <p className="text-caption text-frost-white mt-2 leading-relaxed">✓ Tu listado no presenta riesgos evidentes según las políticas actuales de propiedad intelectual y publicidad orgánica de TikTok Shop.</p>
                          ) : (
                            <ul className="mt-3 space-y-2">
                              {complianceStatus.issues.map((issue, idx) => (
                                <li key={idx} className="text-caption text-whisper-gray flex items-start gap-2.5">
                                  <span className="text-frost-white flex-shrink-0 mt-1 font-bold">!</span>
                                  <span>{issue}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="p-4 border border-white/10 bg-white/5 rounded-cards text-caption text-whisper-gray leading-relaxed">
                          Recomendamos realizar escaneos preventivos de catálogo con cada cambio sustancial de inventario. Nuestro software se actualiza automáticamente con cada cambio regulatorio de TikTok.
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-whisper-gray py-12 space-y-3">
                        <ClipboardCheck className="w-12 h-12 text-frost-white/30" />
                        <p className="text-body font-medium text-frost-white">Consola de Sandbox Lista</p>
                        <p className="text-caption text-whisper-gray/70 max-w-xs">Escribe el listing de producto en el panel izquierdo y haz click en "Ejecutar Escaneo" para emitir el veredicto preventivo.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </main>
        </div>
      )}

    </div>
  );
}
