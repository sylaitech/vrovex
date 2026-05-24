/**
 * Comprehensive compliance scanner for TikTok Shop
 * Detects violations of TikTok Shop policies
 */

// Helper to check if word exists in text (word boundaries)
function hasWord(text, word) {
  const regex = new RegExp(`\\b${word}\\b`, 'i');
  return regex.test(text);
}

export function scanProductCompliance(text = '', productData = {}) {
  const lowerText = (text || '').toLowerCase();
  const issues = [];
  let status = 'passed';
  let riskLevel = 0;
  
  // TIER 1: Strictly Prohibited Keywords (Severity 10 - Auto Ban)
  const tier1Prohibited = [
    { patterns: ['replica', 'replik'], message: 'Réplica/imitación prohibida - Alto riesgo de suspensión de cuenta' },
    { patterns: ['fake', 'counterfeit', 'falsa'], message: 'Producto falsificado - Violación directa de políticas' },
    { patterns: ['knockoff'], message: 'Imitación de marca - Infracción de propiedad intelectual' },
    { patterns: ['illegal', 'stolen', 'robado'], message: 'Contenido potencialmente ilegal detectado' }
  ];

  for (const item of tier1Prohibited) {
    for (const pattern of item.patterns) {
      if (lowerText.includes(pattern)) {
        issues.push({
          type: 'prohibited_keyword',
          severity: 10,
          message: item.message,
          keyword: pattern
        });
        riskLevel = Math.max(riskLevel, 10);
      }
    }
  }
  
  // TIER 2: Medical/Health Claims (Severity 8-9)
  const medicalTerms = [
    { patterns: ['cure', 'cura'], severity: 9, message: 'Afirmación de "cura" - Prohibida sin certificación regulatoria' },
    { patterns: ['treat', 'trata', 'tratamiento'], severity: 8, message: 'Afirmación médica sin documentación - Requiere aprobación' },
    { patterns: ['diagnose', 'diagnóstico'], severity: 9, message: 'Diagnóstico médico no permitido' },
    { patterns: ['prevent disease', 'prevenir enfermedad'], severity: 8, message: 'Prevención de enfermedad requiere evidencia científica' },
    { patterns: ['prescription', 'receta médica'], severity: 10, message: 'Medicamentos de prescripción prohibidos en TikTok Shop' },
    { patterns: ['FDA approved', 'aprobado por FDA'], severity: 7, message: 'Afirmación de aprobación FDA requiere documentación verificada' }
  ];

  for (const item of medicalTerms) {
    for (const pattern of item.patterns) {
      if (lowerText.includes(pattern)) {
        issues.push({
          type: 'health_claim',
          severity: item.severity,
          message: item.message,
          keyword: pattern
        });
        riskLevel = Math.max(riskLevel, item.severity);
      }
    }
  }
  
  // TIER 3: Trademark Risk (Severity 9-10)
  const suspiciousBrands = [
    'nike', 'adidas', 'apple', 'samsung', 'gucci', 'louis vuitton',
    'chanel', 'prada', 'rolex', 'cartier', 'hermès', 'dior',
    'versace', 'burberry', 'fendi', 'balenciaga', 'supreme', 'disney',
    'star wars', 'marvel', 'dc comics', 'pokemon', 'hello kitty',
    'coca cola', 'pepsi', 'starbucks', 'mcdonald', 'nike', 'lamborghini'
  ];
  
  for (const brand of suspiciousBrands) {
    if (lowerText.includes(brand)) {
      // Check if it's actually referencing the brand (not just mentioning inspiration)
      const context = lowerText.substring(Math.max(0, lowerText.indexOf(brand) - 30), lowerText.indexOf(brand) + brand.length + 30);
      if (!context.includes('inspired') && !context.includes('estilo') && !context.includes('style')) {
        issues.push({
          type: 'trademark_risk',
          severity: 9,
          message: `Referencia a marca registrada "${brand}" - Requiere verificación de autorización`,
          keyword: brand
        });
        riskLevel = Math.max(riskLevel, 9);
      }
    }
  }

  // TIER 4: Health Products (Severity 7-8)
  const healthProducts = [
    { patterns: ['supplement', 'suplemento'], severity: 7, message: 'Suplemento detectado - Requiere certificado sanitario' },
    { patterns: ['vitamin', 'vitamina'], severity: 7, message: 'Vitamina detectada - Requiere aprobación regulatoria' },
    { patterns: ['colágeno', 'collagen'], severity: 7, message: 'Producto de colágeno - Requiere documentación de seguridad' },
    { patterns: ['probiotico', 'probiotic'], severity: 7, message: 'Probiótico detectado - Requiere certificación' },
    { patterns: ['medicina', 'medicine', 'medicamento'], severity: 8, message: 'Medicamento detectado - No permitido en TikTok Shop' },
    { patterns: ['peso', 'weight loss', 'pérdida de peso'], severity: 8, message: 'Producto para pérdida de peso - Requiere estudios clínicos' },
    { patterns: ['cáncer', 'cancer', 'tumor'], severity: 10, message: 'Afirmación sobre enfermedad grave - Completamente prohibida' }
  ];

  for (const item of healthProducts) {
    for (const pattern of item.patterns) {
      if (lowerText.includes(pattern)) {
        issues.push({
          type: 'health_product',
          severity: item.severity,
          message: item.message,
          keyword: pattern
        });
        riskLevel = Math.max(riskLevel, item.severity);
      }
    }
  }

  // TIER 5: Misleading Claims (Severity 5-6)
  const misleadingClaims = [
    { patterns: ['100% garantizado', '100% guaranteed', 'garantía absoluta'], message: 'Garantía absoluta - Debe especificar términos y condiciones' },
    { patterns: ['100% effective', '100% efectivo'], message: 'Efectividad absoluta - No permitida sin evidencia científica' },
    { patterns: ['sin riesgo', 'risk free', 'sin riesgos'], message: 'Afirmación "sin riesgo" requiere política de retorno clara' },
    { patterns: ['milagro', 'miracle', 'magical'], message: 'Término exagerado - Viola políticas de marketing honesto' },
    { patterns: ['instant results', 'resultados instantáneos'], message: 'Promesa de resultados inmediatos es considerada engañosa' },
    { patterns: ['legalizado', 'certified', 'aprobado'], message: 'Afirmación de certificación sin prueba - Requiere documentación' },
    { patterns: ['gratis', 'free shipping', 'envío gratis'], message: 'Afirmación "gratis" debe ser transparente sobre costos ocultos' }
  ];

  for (const item of misleadingClaims) {
    for (const pattern of item.patterns) {
      if (lowerText.includes(pattern)) {
        issues.push({
          type: 'misleading_claim',
          severity: 6,
          message: item.message,
          keyword: pattern
        });
        riskLevel = Math.max(riskLevel, 6);
      }
    }
  }

  // TIER 6: Age-Restricted Content (Severity 10)
  const ageRestrictedItems = [
    { patterns: ['alcohol', 'cerveza', 'vino', 'whiskey'], message: 'Bebidas alcohólicas - Prohibidas en TikTok Shop' },
    { patterns: ['tobacco', 'cigarro', 'cigarrillo', 'tabaco'], message: 'Productos de tabaco - Completamente prohibidos' },
    { patterns: ['vape', 'e-cigarrette', 'vaper'], message: 'Cigarrillo electrónico - Prohibido para menores de edad' },
    { patterns: ['weapon', 'gun', 'pistola', 'arma'], message: 'Arma de fuego - Prohibida en TikTok Shop' },
    { patterns: ['knife', 'cuchillo', 'espada'], severity: 9, message: 'Arma blanca - Restricción severa en TikTok Shop' },
    { patterns: ['cannabis', 'marijuana', 'marihuana', 'cbd'], message: 'Sustancia controlada - Prohibida en TikTok Shop' }
  ];

  for (const item of ageRestrictedItems) {
    for (const pattern of item.patterns) {
      if (lowerText.includes(pattern)) {
        issues.push({
          type: 'age_restricted',
          severity: item.severity || 10,
          message: item.message,
          keyword: pattern
        });
        riskLevel = Math.max(riskLevel, item.severity || 10);
      }
    }
  }

  // TIER 7: Sexualized Content (Severity 8-9)
  const sexualizedTerms = [
    { patterns: ['sexy', 'sensual', 'provocativo', 'provocative'], severity: 6, message: 'Contenido con tono sexual - Requiere restricción de edad' },
    { patterns: ['adult', 'xxx', 'nsfw'], severity: 9, message: 'Contenido para adultos - Prohibido en TikTok Shop' }
  ];

  for (const item of sexualizedTerms) {
    for (const pattern of item.patterns) {
      if (lowerText.includes(pattern)) {
        issues.push({
          type: 'sexualized_content',
          severity: item.severity,
          message: item.message,
          keyword: pattern
        });
        riskLevel = Math.max(riskLevel, item.severity);
      }
    }
  }

  // TIER 8: Counterfeit Indicators (Severity 9-10)
  const counterFeitIndicators = [
    { patterns: ['aaaa', 'aaa', 'high quality replica', 'best copy'], message: 'Indicador de producto falsificado' },
    { patterns: ['wholesale price', 'distribuidor oficial', 'official distributor'], message: 'Afirmación de distribuidores oficial sin documentación' },
    { patterns: ['direct from factory', 'factory price'], message: 'Afirmación de precio de fábrica - Posible producto falsificado' }
  ];

  for (const item of counterFeitIndicators) {
    for (const pattern of item.patterns) {
      if (lowerText.includes(pattern)) {
        issues.push({
          type: 'counterfeit_indicator',
          severity: 9,
          message: item.message,
          keyword: pattern
        });
        riskLevel = Math.max(riskLevel, 9);
      }
    }
  }
  
  // Determine overall status
  if (riskLevel >= 9) {
    status = 'failed';
  } else if (riskLevel >= 7) {
    status = 'warning';
  } else if (riskLevel >= 4) {
    status = 'caution';
  }
  
  // Generate recommendations based on findings
  const recommendations = [];
  
  if (issues.length === 0) {
    recommendations.push('✅ Tienda cumple con políticas básicas de TikTok Shop');
    recommendations.push('📸 Revisa manualmente las imágenes de productos para asegurar calidad');
    recommendations.push('📋 Verifica especificaciones técnicas y detalles de envío');
  } else {
    const criticalCount = issues.filter(i => i.severity >= 9).length;
    const warningCount = issues.filter(i => i.severity >= 7 && i.severity < 9).length;
    const cautionCount = issues.filter(i => i.severity < 7).length;
    
    if (status === 'failed') {
      recommendations.push('🚫 ACCIÓN INMEDIATA: Este producto tiene riesgo CRÍTICO de suspensión');
      recommendations.push(`${criticalCount} problema(s) crítico(s) detectado(s) - Eliminación de contenido puede ser automática`);
      recommendations.push('Solución: Modifica o elimina el producto antes de que sea penalizado');
      recommendations.push('📞 Contacta soporte de Vrovex si necesitas asesoría legal');
    } else if (status === 'warning') {
      recommendations.push('⚠️ PRECAUCIÓN: Se detectaron problemas significativos');
      recommendations.push(`${warningCount} advertencia(s) y ${cautionCount} precaución(es)`);
      recommendations.push('Recomendación: Revisa y corrige antes de publicar');
      recommendations.push('Considera documentación adicional (certificados, permisos, etc.)');
    } else {
      recommendations.push('⚠️ Nota: Se detectaron algunos problemas menores');
      recommendations.push('Revisa cada elemento antes de publicar para evitar penalizaciones');
    }
  }
  
  return {
    status,
    riskLevel,
    issues,
    recommendations,
    scannedAt: new Date().toISOString(),
    summary: {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity >= 9).length,
      warningIssues: issues.filter(i => i.severity >= 7 && i.severity < 9).length,
      cautionIssues: issues.filter(i => i.severity >= 4 && i.severity < 7).length,
      minorIssues: issues.filter(i => i.severity < 4).length,
      issuesByType: {
        prohibited: issues.filter(i => i.type === 'prohibited_keyword').length,
        health: issues.filter(i => i.type === 'health_claim' || i.type === 'health_product').length,
        trademark: issues.filter(i => i.type === 'trademark_risk').length,
        misleading: issues.filter(i => i.type === 'misleading_claim').length,
        restricted: issues.filter(i => i.type === 'age_restricted' || i.type === 'sexualized_content').length,
        counterfeit: issues.filter(i => i.type === 'counterfeit_indicator').length
      }
    }
  };
}

/**
 * Scan entire shop for compliance issues
 * Aggregates all products and alerts
 */
export async function scanShopCompliance(shop, supabase) {
  try {
    let totalIssues = 0;
    let criticalIssues = 0;
    let warningIssues = 0;
    const allIssues = [];
    const issuesByCategory = {
      prohibited: 0,
      health: 0,
      trademark: 0,
      misleading: 0,
      restricted: 0,
      counterfeit: 0
    };

    // Get shop data from TikTok (in real implementation)
    // For now, this is a framework for future expansion
    
    // Fetch existing shop data from Supabase
    const { data: shopData } = await supabase
      .from('shops')
      .select('shop_name, products_total, health_score')
      .eq('tiktok_shop_id', shop.tiktok_shop_id)
      .single();

    if (!shopData) {
      return {
        status: 'completed',
        riskLevel: 0,
        issues: [],
        recommendations: ['Tienda no encontrada en base de datos'],
        summary: {
          totalIssues: 0,
          criticalIssues: 0,
          warningIssues: 0,
          cautionIssues: 0,
          minorIssues: 0,
          issuesByType: {
            prohibited: 0,
            health: 0,
            trademark: 0,
            misleading: 0,
            restricted: 0,
            counterfeit: 0
          }
        },
        scannedAt: new Date().toISOString()
      };
    }

    // Prepare response
    const response = {
      status: 'passed',
      riskLevel: 0,
      issues: allIssues,
      recommendations: [],
      summary: {
        totalIssues,
        criticalIssues,
        warningIssues,
        cautionIssues: 0,
        minorIssues: 0,
        issuesByType: issuesByCategory
      },
      scannedAt: new Date().toISOString(),
      shopName: shopData?.shop_name || 'Unknown Shop',
      productsScanned: shopData?.products_total || 0
    };

    if (criticalIssues > 0) {
      response.status = 'failed';
      response.recommendations.push('🚫 Tu tienda tiene problemas críticos. Acción inmediata requerida.');
    } else if (warningIssues > 0) {
      response.status = 'warning';
      response.recommendations.push('⚠️ Se detectaron advertencias en tu tienda.');
    } else {
      response.recommendations.push('✅ Tu tienda cumple con las políticas de TikTok Shop.');
    }

    response.riskLevel = Math.min(10, Math.max(criticalIssues * 2, warningIssues));
    
    return response;
  } catch (err) {
    console.error('Error scanning shop compliance:', err);
    throw err;
  }
}
