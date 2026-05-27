function fmtDateBR(dateStr) {
  if (!dateStr) return '';
  const p = dateStr.split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function statusText(project, metrics) {
  if (project.completed) return 'Concluído';
  if (metrics.visualStatus === 'warning') return 'Atenção';
  if (metrics.visualStatus === 'danger') return 'Risco';
  return 'Saudável';
}

function statusColor(project, metrics) {
  if (project.completed || metrics.visualStatus === 'healthy') return '#22c55e';
  if (metrics.visualStatus === 'warning') return '#eab308';
  return '#ef4444';
}

function statusBg(project, metrics) {
  if (project.completed || metrics.visualStatus === 'healthy') return '#f0fdf4';
  if (metrics.visualStatus === 'warning') return '#fefce8';
  return '#fef2f2';
}

function diffPercent(metrics) {
  return Math.round(metrics.overallProgressReal - metrics.expectedProgress);
}

function diffSign(val) {
  return val > 0 ? '+' : '';
}

function progressBarSvg(pct, color, height) {
  const w = Math.min(pct, 100);
  return `<svg width="100%" height="${height}" style="display:block;border-radius:${Math.floor(height/2)}px;overflow:hidden;">
    <rect width="100%" height="${height}" fill="#e5e7eb" rx="${Math.floor(height/2)}"/>
    <rect width="${w}%" height="${height}" fill="${color}" rx="${Math.floor(height/2)}"/>
  </svg>`;
}

function timelineSvg(elapsed, total, color) {
  const pct = total > 0 ? Math.min(elapsed / total * 100, 100) : 0;
  const remaining = total - elapsed;
  return `<svg width="100%" height="28" style="display:block;border-radius:14px;overflow:hidden;">
    <rect width="100%" height="28" fill="#e5e7eb" rx="14"/>
    <rect width="${pct}%" height="28" fill="${color}" rx="14"/>
    <text x="50%" y="19" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${elapsed}d decorridos / ${total}d úteis</text>
    <text x="${pct > 50 ? 8 : 100}%" y="19" text-anchor="${pct > 50 ? 'start' : 'end'}" font-size="10" fill="#6b7280" dx="${pct > 50 ? '4' : '-4'}">${remaining}d restantes</text>
  </svg>`;
}

export function generatePlainTextBody(project, metrics) {
  const diff = diffPercent(metrics);
  const barW = 30;
  const realBar = Math.round(metrics.overallProgressReal / 100 * barW);
  const expBar = Math.round(metrics.expectedProgress / 100 * barW);
  const totalDays = metrics.elapsedWorkingDays + metrics.remainingWorkingDays;

  const lines = [
    `=== Acompanhamento de Evolução do Projeto ===`,
    ``,
    `Projeto: ${project.title}`,
    `Período: ${fmtDateBR(project.startDate)} à ${fmtDateBR(project.endDate)}`,
    `Status: ${statusText(project, metrics)}`,
    `Dias úteis restantes: ${metrics.remainingWorkingDays} de ${totalDays}`,
    ``,
    `── Recursos Alocados ──`,
    `DEV: ${project.qtyDevs} devs × ${project.hoursPerDev}h/dia = ${metrics.devDailyCapacity}h/dia`,
    `QA:  ${project.qtyQas} qas × ${project.hoursPerQa}h/dia = ${metrics.qaDailyCapacity}h/dia`,
    ``,
    `── Produção Esperada ──`,
    `Horas DEV esperadas: ${Math.round(metrics.elapsedWorkingDays * metrics.devDailyCapacity)}h`,
    `Horas QA esperadas:  ${Math.round(metrics.elapsedWorkingDays * metrics.qaDailyCapacity)}h`,
    `Progresso: [${'█'.repeat(expBar)}${'░'.repeat(Math.max(0, barW - expBar))}] ${Math.round(metrics.expectedProgress)}%`,
    ``,
    `── Produção Realizada ──`,
    `Horas DEV realizadas: ${project.hoursDevRealized}h de ${project.estimatedDevHours}h`,
    `Horas QA realizadas:  ${project.hoursQaRealized}h de ${project.estimatedQaHours}h`,
    `Progresso: [${'█'.repeat(realBar)}${'░'.repeat(Math.max(0, barW - realBar))}] ${Math.round(metrics.overallProgressReal)}%`,
    ``,
    `── Diferença ──`,
    `Real - Esperado: ${diffSign(diff)}${diff}%`,
    ``,
    `── Previsão ──`,
    `Chance de sucesso: ${metrics.successChance}%`,
    `Conclusão planejada: ${fmtDateBR(project.endDate)}`,
    `Conclusão prevista atual: ${fmtDateBR(metrics.projectedCompletionDate)}`,
    ``,
    `───`,
    `Relatório gerado automaticamente pelo Effort Track.`
  ];
  return lines.join('\n');
}

export function generateHtmlBody(project, metrics) {
  const diff = diffPercent(metrics);
  const color = statusColor(project, metrics);
  const bg = statusBg(project, metrics);
  const diffColor = diff >= 0 ? '#16a34a' : '#dc2626';
  const barRealPct = Math.round(metrics.overallProgressReal);
  const barExpectedPct = Math.round(metrics.expectedProgress);
  const totalDays = metrics.elapsedWorkingDays + metrics.remainingWorkingDays;

  const devHoursExpected = Math.round(metrics.elapsedWorkingDays * metrics.devDailyCapacity);
  const qaHoursExpected = Math.round(metrics.elapsedWorkingDays * metrics.qaDailyCapacity);

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:580px;margin:0 auto;padding:20px;background:#f4f5f7;border-radius:10px;">
  <div style="text-align:center;padding:12px 0 14px;border-bottom:2px solid #e2e4e8;">
    <h1 style="margin:0;font-size:19px;color:#111827;">Acompanhamento de Evolução</h1>
    <p style="margin:3px 0 0;font-size:12px;color:#6b7280;">${project.title} &mdash; ${fmtDateBR(project.startDate)} a ${fmtDateBR(project.endDate)}</p>
  </div>

  <div style="display:inline-block;margin-top:14px;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;color:${color};background:${bg};border:1px solid ${color};">${statusText(project, metrics)}</div>
  <span style="margin-left:10px;font-size:12px;color:#6b7280;">${metrics.remainingWorkingDays} dias &uacute;teis restantes</span>

  <table style="width:100%;margin-top:14px;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="padding:12px 14px 4px;font-size:13px;font-weight:700;color:#374151;">&#9201; Recursos Alocados</td></tr>
    <tr><td style="padding:2px 14px;font-size:12px;color:#6b7280;">DEV: <strong>${project.qtyDevs}</strong> devs &times; <strong>${project.hoursPerDev}h</strong>/dia = <strong>${metrics.devDailyCapacity}h</strong>/dia</td></tr>
    <tr><td style="padding:2px 14px 12px;font-size:12px;color:#6b7280;">QA: <strong>${project.qtyQas}</strong> qas &times; <strong>${project.hoursPerQa}h</strong>/dia = <strong>${metrics.qaDailyCapacity}h</strong>/dia</td></tr>
  </table>

  <table style="width:100%;margin-top:8px;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="padding:12px 14px 8px;font-size:13px;font-weight:700;color:#374151;">&#9729; Progresso da Produ&ccedil;&atilde;o</td></tr>
    <tr><td style="padding:2px 14px 4px;"><div style="display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-bottom:3px;"><span>Esperado</span><span>${barExpectedPct}%</span></div>${progressBarSvg(barExpectedPct, '#9ca3af', 10)}</td></tr>
    <tr><td style="padding:2px 14px 8px;"><div style="display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-bottom:3px;"><span>Real</span><span>${barRealPct}%</span></div>${progressBarSvg(barRealPct, color, 10)}</td></tr>
    <tr><td style="padding:4px 14px 12px;border-top:1px solid #f3f4f6;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr><td style="padding:3px 0;color:#6b7280;">Horas DEV</td><td style="padding:3px 0;text-align:right;font-weight:600;">${project.hoursDevRealized}h realiz. / ${project.estimatedDevHours}h estim. <span style="color:#6b7280;font-weight:400;">(${Math.round(metrics.devProgressReal)}%)</span></td></tr>
        <tr><td style="padding:3px 0;color:#6b7280;">Horas QA</td><td style="padding:3px 0;text-align:right;font-weight:600;">${project.hoursQaRealized}h realiz. / ${project.estimatedQaHours}h estim. <span style="color:#6b7280;font-weight:400;">(${Math.round(metrics.qaProgressReal)}%)</span></td></tr>
      </table>
    </td></tr>
  </table>

  <table style="width:100%;margin-top:8px;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="padding:12px 14px 4px;font-size:13px;font-weight:700;color:#374151;">&#9200; Tempo Decorrido</td></tr>
    <tr><td style="padding:2px 14px 12px;">${timelineSvg(metrics.elapsedWorkingDays, totalDays, '#3b82f6')}</td></tr>
  </table>

  <table style="width:100%;margin-top:8px;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:#374151;">Diferen&ccedil;a (Real &minus; Esperado)</span>
      <span style="font-size:17px;font-weight:700;color:${diffColor};">${diffSign(diff)}${diff}%</span>
    </td></tr>
  </table>

  <table style="width:100%;margin-top:8px;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="padding:12px 14px 6px;font-size:13px;font-weight:700;color:#374151;">&#128202; Previs&atilde;o</td></tr>
    <tr><td style="padding:3px 14px;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Chance de sucesso</td><td style="padding:4px 0;text-align:right;font-weight:700;font-size:15px;color:${color};">${metrics.successChance}%</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Conclus&atilde;o planejada</td><td style="padding:4px 0;text-align:right;">${fmtDateBR(project.endDate)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Conclus&atilde;o prevista atual</td><td style="padding:4px 0;text-align:right;font-weight:600;">${fmtDateBR(metrics.projectedCompletionDate)}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:8px 14px 6px;">
      ${progressBarSvg(metrics.successChance, color, 8)}
    </td></tr>
    <tr><td style="padding:0 14px 12px;text-align:right;font-size:10px;color:#9ca3af;">${metrics.successChance}% de chance de concluir no prazo</td></tr>
  </table>

  <div style="margin-top:14px;padding-top:10px;border-top:1px solid #e2e4e8;text-align:center;font-size:10px;color:#9ca3af;">
    Relat&oacute;rio gerado automaticamente pelo <strong>Effort Track</strong>
  </div>
</div>`.trim();
}

export function generateMailToUrl(project, metrics) {
  const emails = (project.stakeholderEmails || []).filter(Boolean);
  const to = emails.join(',');
  const subject = `Acompanhamento de evolução do projeto ${project.title} (${fmtDateBR(project.startDate)} à ${fmtDateBR(project.endDate)})`;
  const htmlBody = generateLightHtmlBody(project, metrics);
  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(htmlBody)}`;
  if (url.length > 8000) {
    const fallback = generatePlainTextBody(project, metrics);
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fallback)}`;
  }
  return url;
}

function generateLightHtmlBody(project, metrics) {
  const diff = diffPercent(metrics);
  const color = statusColor(project, metrics);
  const diffColor = diff >= 0 ? '#16a34a' : '#dc2626';
  const totalDays = metrics.elapsedWorkingDays + metrics.remainingWorkingDays;
  const barRealPct = Math.round(metrics.overallProgressReal);
  const barExpectedPct = Math.round(metrics.expectedProgress);

  return `<div style="font-family:Arial,sans-serif;max-width:560px">
  <div style="border-bottom:2px solid #e5e7eb;padding-bottom:10px;margin-bottom:12px">
    <h2 style="margin:0;font-size:17px;color:#111827">Acompanhamento de Evolu\u00e7\u00e3o</h2>
    <p style="margin:3px 0 0;font-size:12px;color:#6b7280">${project.title} \u2014 ${fmtDateBR(project.startDate)} a ${fmtDateBR(project.endDate)}</p>
  </div>

  <p style="margin:6px 0"><strong style="color:${color}">${statusText(project, metrics)}</strong> <span style="color:#6b7280;font-size:12px">\u2022 ${metrics.remainingWorkingDays} dias \u00fateis restantes</span></p>

  <table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:12px;background:#f9fafb;border-radius:6px">
    <tr><td style="padding:8px 10px;font-weight:700;color:#374151;border-bottom:1px solid #e5e7eb">Recursos Alocados</td></tr>
    <tr><td style="padding:4px 10px;color:#6b7280">DEV: <strong>${project.qtyDevs}</strong> devs \u00d7 <strong>${project.hoursPerDev}h</strong>/dia = <strong>${metrics.devDailyCapacity}h</strong>/dia</td></tr>
    <tr><td style="padding:4px 10px 8px;color:#6b7280">QA: <strong>${project.qtyQas}</strong> qas \u00d7 <strong>${project.hoursPerQa}h</strong>/dia = <strong>${metrics.qaDailyCapacity}h</strong>/dia</td></tr>
  </table>

  <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:12px;background:#f9fafb;border-radius:6px">
    <tr><td style="padding:8px 10px;font-weight:700;color:#374151;border-bottom:1px solid #e5e7eb">Progresso da Produ\u00e7\u00e3o</td></tr>
    <tr><td style="padding:4px 10px;color:#6b7280">Esperado: <strong>${barExpectedPct}%</strong> &nbsp;|&nbsp; Real: <strong style="color:${color}">${barRealPct}%</strong></td></tr>
    <tr><td style="padding:2px 10px;color:#6b7280">DEV: <strong>${project.hoursDevRealized}h</strong> realiz. de <strong>${project.estimatedDevHours}h</strong> (${Math.round(metrics.devProgressReal)}%)</td></tr>
    <tr><td style="padding:2px 10px 8px;color:#6b7280">QA: <strong>${project.hoursQaRealized}h</strong> realiz. de <strong>${project.estimatedQaHours}h</strong> (${Math.round(metrics.qaProgressReal)}%)</td></tr>
  </table>

  <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:12px;background:#f9fafb;border-radius:6px">
    <tr><td style="padding:8px 10px;font-weight:700;color:#374151;border-bottom:1px solid #e5e7eb">Tempo</td></tr>
    <tr><td style="padding:4px 10px 8px;color:#6b7280"><strong>${metrics.elapsedWorkingDays}</strong> dias decorridos de <strong>${totalDays}</strong> \u00fateis | <strong>${metrics.remainingWorkingDays}</strong> restantes</td></tr>
  </table>

  <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:12px;background:#f9fafb;border-radius:6px">
    <tr><td style="padding:8px 10px;font-weight:700;color:#374151">Diferen\u00e7a (Real \u2212 Esperado): <strong style="color:${diffColor}">${diffSign(diff)}${diff}%</strong></td></tr>
  </table>

  <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:12px;background:#f9fafb;border-radius:6px">
    <tr><td style="padding:8px 10px;font-weight:700;color:#374151;border-bottom:1px solid #e5e7eb">Previs\u00e3o</td></tr>
    <tr><td style="padding:4px 10px;color:#6b7280">Chance de sucesso: <strong style="color:${color};font-size:14px">${metrics.successChance}%</strong></td></tr>
    <tr><td style="padding:2px 10px;color:#6b7280">Conclus\u00e3o planejada: <strong>${fmtDateBR(project.endDate)}</strong></td></tr>
    <tr><td style="padding:2px 10px 8px;color:#6b7280">Conclus\u00e3o prevista atual: <strong>${fmtDateBR(metrics.projectedCompletionDate)}</strong></td></tr>
  </table>

  <p style="margin:12px 0 0;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px;text-align:center">Relat\u00f3rio gerado automaticamente pelo <strong>Effort Track</strong></p>
</div>`.trim();
}

export async function copyReportToClipboard(project, metrics) {
  const html = generateHtmlBody(project, metrics);
  const plain = generatePlainTextBody(project, metrics);
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([plain], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' })
      })
    ]);
    return { success: true, format: 'html' };
  } catch (_) {
    try {
      await navigator.clipboard.writeText(plain);
      return { success: true, format: 'text' };
    } catch (_2) {
      return { success: false };
    }
  }
}
