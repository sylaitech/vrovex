/**
 * Generate appeal content based on category and shop data
 */
export function generateAppealContent(category, shop, customData = {}) {
  const header = `A LA ATENCIÓN DEL DEPARTAMENTO DE COMPLIANCE DE TIKTOK SHOP
ASUNTO: Apelación Formal de Infracción y Restablecimiento de Métricas
TIENDA: ${shop.shopName}
ID DE SELLER: ${shop.shopId}
REGIÓN: ${shop.region}
FECHA: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}

`;
  
  let content = '';
  
  switch (category) {
    case 'late_dispatch':
      content = `Estimado Equipo de Soporte Técnico y Cumplimiento,

Escribo en representación de ${shop.shopName} para apelar la reciente penalización de puntos aplicada a nuestro perfil de vendedor debido a la tasa de envío tardío (Late Dispatch Rate de ${shop.metrics.lateDispatchRate.toFixed(1)}%).

1. CAUSA PRINCIPAL:
Hemos identificado que el desfase se debió a un retraso de sincronización de la API de nuestro transportista local durante el período de alta demanda del ${customData.incidentDate || 'último mes'}. Las órdenes fueron despachadas físicamente a tiempo, pero el tracking no se transmitió correctamente a los servidores de TikTok Shop dentro del plazo estándar de 24-48 horas.

2. ACCIONES CORRECTIVAS INMEDIATAS:
- Hemos migrado nuestro webhook de tracking a un canal dedicado de redundancia por API oficial.
- Aumentamos el personal operativo de fulfillment en un 30% en las horas pico.
- Implementamos un sistema de verificación manual de tracking al final de cada jornada.
- Establecimos alertas automáticas para detectar fallos de sincronización en tiempo real.

3. EVIDENCIA ADJUNTA:
- Capturas de pantalla de los números de tracking válidos en el sistema del transportista.
- Logs de API mostrando los intentos de sincronización fallidos.
- Confirmación del transportista sobre el incidente técnico.

4. COMPROMISO DE MEJORA:
Nos comprometemos a mantener una tasa de envío tardío inferior al 2% en los próximos 90 días mediante la implementación de nuestro nuevo sistema de monitoreo automatizado.

Solicitamos respetuosamente la remoción de los puntos de penalización asociados para normalizar nuestro estado de seller y continuar brindando un servicio excepcional a la comunidad de TikTok Shop.

Atentamente,
Equipo de Operaciones de ${shop.shopName}
Contacto: ${customData.contactEmail || 'support@' + shop.shopName.toLowerCase().replace(/\s/g, '') + '.com'}`;
      break;
      
    case 'compliance_copyright':
      content = `Estimado Equipo de Moderación de Catálogo,

Nos ponemos en contacto con ustedes con relación a la infracción de catálogo por supuesta inconsistencia de marca o derechos de autor aplicada a nuestro producto "${customData.productName || 'producto afectado'}" (SKU: ${customData.sku || 'N/A'}).

1. DOCUMENTACIÓN LEGAL:
Adjuntamos en formato PDF a través de la consola:
- Carta oficial de autorización de distribución directa del fabricante original.
- Certificado de autenticidad con número de serie verificable.
- Contrato de distribución autorizada vigente hasta ${customData.contractExpiry || '2026'}.
- Registro de marca comercial en la región ${shop.region}.

2. ORIGEN DEL PRODUCTO:
Todos nuestros productos son adquiridos directamente del fabricante autorizado ${customData.manufacturer || '[Nombre del Fabricante]'} con factura comercial verificable. No comercializamos réplicas ni productos falsificados bajo ninguna circunstancia.

3. MEDIDAS PREVENTIVAS IMPLEMENTADAS:
- Todo nuestro catálogo ha sido escaneado preventivamente por un motor de compliance automático.
- Implementamos un proceso de verificación legal previo al listado de cualquier producto.
- No se listarán nuevos productos sin aprobación legal previa del titular de la propiedad intelectual.
- Establecimos un canal directo de comunicación con los titulares de marca para resolver cualquier duda.

4. IMPACTO EN EL NEGOCIO:
Esta suspensión temporal afecta significativamente nuestras operaciones y la confianza de nuestros clientes. Hemos invertido considerablemente en construir una reputación de autenticidad y calidad.

Solicitamos la reactivación inmediata de las publicaciones afectadas y la revisión de la penalización aplicada, dado que contamos con toda la documentación legal requerida.

Quedamos a su entera disposición para proporcionar cualquier documentación adicional que consideren necesaria.

Atentamente,
${shop.shopName} - Departamento Legal
Contacto: ${customData.contactEmail || 'legal@' + shop.shopName.toLowerCase().replace(/\s/g, '') + '.com'}`;
      break;
      
    case 'seller_metrics':
      content = `Estimado Comité de Apelaciones de TikTok Shop,

Solicitamos formalmente una revisión exhaustiva de nuestro Account Health Score actual (${shop.metrics.accountHealth}/1000) bajo el amparo de la sección de soporte al vendedor partner.

1. ANÁLISIS DE LA SITUACIÓN:
Hemos identificado un patrón anómalo de quejas repetidas provenientes de ${customData.suspiciousAccounts || 'tres'} cuentas específicas de usuarios en el mismo rango de fecha (${customData.dateRange || 'últimas 2 semanas'}). Estas cuentas presentan las siguientes características sospechosas:

- Múltiples compras seguidas de devoluciones inmediatas sin justificación válida.
- Reseñas negativas idénticas o muy similares publicadas en corto período de tiempo.
- Patrones de comportamiento que sugieren coordinación entre las cuentas.
- Ninguna de estas cuentas tiene historial de compras previo en TikTok Shop.

2. EVIDENCIA DE ATAQUE COORDINADO:
- Capturas de pantalla de las reseñas y quejas con timestamps.
- Análisis de patrones de comportamiento de las cuentas involucradas.
- Comparación con nuestro historial de satisfacción del cliente (${customData.satisfactionRate || '98'}% positivo).
- Testimonios de clientes legítimos satisfechos con nuestro servicio.

3. HISTORIAL COMPROBADO:
Antes de este incidente, nuestra tienda mantenía:
- Account Health Score superior a ${customData.previousScore || '850'}/1000
- Tasa de satisfacción del cliente del ${customData.satisfactionRate || '98'}%
- Más de ${customData.totalOrders || '5,000'} órdenes completadas exitosamente
- Calificación promedio de ${customData.avgRating || '4.8'}/5 estrellas

4. SOLICITUD:
Pedimos una auditoría detallada de estas órdenes de compra y cuentas de usuario específicas, así como el restablecimiento de nuestro estatus operativo saludable una vez confirmado el ataque malicioso.

Estamos comprometidos con la excelencia en el servicio y la satisfacción genuina de nuestros clientes. Este tipo de ataques coordinados perjudican a vendedores legítimos y a la plataforma en general.

Saludos cordiales,
${shop.shopName} - Dirección General
Contacto: ${customData.contactEmail || 'admin@' + shop.shopName.toLowerCase().replace(/\s/g, '') + '.com'}`;
      break;
      
    default:
      content = `Estimado Equipo de TikTok Shop,

Escribo para apelar la reciente acción tomada en nuestra cuenta de vendedor ${shop.shopName}.

Hemos revisado exhaustivamente nuestras operaciones y hemos implementado las medidas correctivas necesarias para asegurar el cumplimiento total de las políticas de TikTok Shop.

Solicitamos respetuosamente la revisión de esta decisión y la restauración de nuestro estado de cuenta.

Atentamente,
${shop.shopName}`;
  }
  
  return header + content;
}
