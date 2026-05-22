/**
 * Scan product text for compliance issues
 */
export function scanProductCompliance(text, productData = {}) {
  const lowerText = text.toLowerCase();
  const issues = [];
  let status = 'passed';
  let riskLevel = 0;
  
  // Prohibited Keywords Check
  const prohibitedKeywords = [
    { word: 'replica', severity: 10, message: 'Término "replica" está prohibido - Alto riesgo de ban por copyright' },
    { word: 'fake', severity: 10, message: 'Término "fake" está prohibido - Violación de autenticidad' },
    { word: 'counterfeit', severity: 10, message: 'Término "counterfeit" está prohibido - Infracción de marca' },
    { word: 'knockoff', severity: 10, message: 'Término "knockoff" está prohibido - Violación de propiedad intelectual' },
    { word: 'cure', severity: 8, message: 'Afirmación médica "cure" no permitida sin certificación FDA' },
    { word: 'treat', severity: 7, message: 'Afirmación médica "treat" requiere documentación regulatoria' },
    { word: 'diagnose', severity: 8, message: 'Término médico "diagnose" está restringido' },
    { word: 'prevent disease', severity: 8, message: 'Afirmación de prevención de enfermedades no permitida' },
    { word: '100% garantizado', severity: 6, message: 'Afirmación absoluta engañosa según políticas de publicidad' },
    { word: '100% effective', severity: 6, message: 'Afirmación de efectividad absoluta no permitida' },
    { word: 'miracle', severity: 7, message: 'Término exagerado "miracle" viola políticas de marketing' },
    { word: 'instant results', severity: 6, message: 'Promesa de resultados instantáneos considerada engañosa' }
  ];
  
  for (const item of prohibitedKeywords) {
    if (lowerText.includes(item.word)) {
      issues.push({
        type: 'prohibited_keyword',
        severity: item.severity,
        message: item.message,
        keyword: item.word
      });
      riskLevel = Math.max(riskLevel, item.severity);
    }
  }
  
  // Brand Name Check
  const brandNames = [
    'nike', 'adidas', 'apple', 'samsung', 'gucci', 'louis vuitton',
    'chanel', 'prada', 'rolex', 'cartier', 'hermès', 'dior',
    'versace', 'burberry', 'fendi', 'balenciaga', 'supreme'
  ];
  
  for (const brand of brandNames) {
    if (lowerText.includes(brand)) {
      issues.push({
        type: 'trademark_risk',
        severity: 9,
        message: `Posible infracción de marca registrada "${brand}" - Requiere autorización oficial del titular`,
        keyword: brand
      });
      riskLevel = Math.max(riskLevel, 9);
    }
  }
  
  // Health/Supplement Keywords
  const healthKeywords = ['omega', 'suplemento', 'vitamina', 'medicina', 'pastilla', 'cápsula', 'supplement'];
  for (const keyword of healthKeywords) {
    if (lowerText.includes(keyword)) {
      issues.push({
        type: 'health_product',
        severity: 7,
        message: 'Producto de salud detectado - Requiere registro sanitario y certificado de laboratorio en TikTok FDA Center',
        keyword
      });
      riskLevel = Math.max(riskLevel, 7);
    }
  }
  
  // Misleading Claims
  const misleadingPhrases = [
    { phrase: 'gratis', severity: 5, message: 'Uso de "gratis" puede ser considerado engañoso si hay costos ocultos' },
    { phrase: 'free', severity: 5, message: 'Uso de "free" debe ser transparente sobre todos los costos' },
    { phrase: 'garantía de por vida', severity: 6, message: 'Garantías absolutas requieren términos y condiciones claros' },
    { phrase: 'sin riesgo', severity: 5, message: 'Afirmación "sin riesgo" debe estar respaldada por política de devolución clara' }
  ];
  
  for (const item of misleadingPhrases) {
    if (lowerText.includes(item.phrase)) {
      issues.push({
        type: 'misleading_claim',
        severity: item.severity,
        message: item.message,
        keyword: item.phrase
      });
      riskLevel = Math.max(riskLevel, item.severity);
    }
  }
  
  // Age-Restricted Content
  const ageRestrictedKeywords = ['alcohol', 'tobacco', 'cigar', 'vape', 'weapon', 'knife', 'gun'];
  for (const keyword of ageRestrictedKeywords) {
    if (lowerText.includes(keyword)) {
      issues.push({
        type: 'age_restricted',
        severity: 10,
        message: `Producto restringido por edad "${keyword}" - Prohibido en TikTok Shop`,
        keyword
      });
      riskLevel = Math.max(riskLevel, 10);
    }
  }
  
  // Determine overall status
  if (riskLevel >= 9) {
    status = 'failed';
  } else if (riskLevel >= 6) {
    status = 'warning';
  } else if (issues.length > 0) {
    status = 'caution';
  }
  
  // Generate recommendations
  const recommendations = [];
  if (issues.length === 0) {
    recommendations.push('✅ El texto cumple con las políticas básicas de TikTok Shop');
    recommendations.push('Recomendación: Revisa manualmente las imágenes y especificaciones técnicas');
  } else {
    recommendations.push(`⚠️ Se detectaron ${issues.length} problema(s) potencial(es)`);
    
    if (status === 'failed') {
      recommendations.push('🚫 ACCIÓN REQUERIDA: Este producto tiene alto riesgo de ban automático');
      recommendations.push('Modifica el contenido antes de publicar o proporciona certificaciones requeridas');
    } else if (status === 'warning') {
      recommendations.push('⚠️ PRECAUCIÓN: Revisa y corrige los problemas identificados');
      recommendations.push('Considera consultar con el equipo legal antes de publicar');
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
      warningIssues: issues.filter(i => i.severity >= 6 && i.severity < 9).length,
      minorIssues: issues.filter(i => i.severity < 6).length
    }
  };
}
