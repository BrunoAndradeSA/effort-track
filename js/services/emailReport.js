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
  const accent = '#7c5cfc';
  const border = '#e2e4e8';
  const textMuted = '#6b7280';
  const textDark = '#111827';

  return `<div style="font-family:'Outfit','Inter',Arial,Helvetica,sans-serif;max-width:580px;margin:0 auto;background:#f0f2f5;border-radius:16px;overflow:hidden;">
  <div style="padding:20px 24px 16px;background:#fff;border-bottom:1px solid ${border};text-align:center;">
    <h1 style="margin:0;font-family:'Outfit',Arial,sans-serif;font-size:18px;font-weight:800;color:${textDark};">Acompanhamento de Evolu\u00e7\u00e3o</h1>
    <p style="margin:4px 0 0;font-size:12px;color:${textMuted};">${project.title} &mdash; ${fmtDateBR(project.startDate)} a ${fmtDateBR(project.endDate)}</p>
  </div>

  <div style="position:relative;margin:16px 24px 0;padding:4px 0 4px 14px;border-left:4px solid ${color};background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
    <div style="padding:12px 16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${color};background:${bg};border:1px solid ${color};">${statusText(project, metrics)}</span>
      <span style="font-size:12px;color:${textMuted};">${metrics.remainingWorkingDays} dias \u00fateis restantes</span>
    </div>
  </div>

  <div style="margin:12px 24px 0;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);overflow:hidden;">
    <div style="padding:16px 20px 8px;font-size:13px;font-weight:700;font-family:'Outfit',Arial,sans-serif;color:${textDark};">Recursos Alocados</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <tr>
        <td style="width:50%;padding:4px 10px 4px 20px;color:${textMuted};vertical-align:top;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${accent};margin-right:6px;"></span>DEV: <strong>${project.qtyDevs}</strong> devs &times; <strong>${project.hoursPerDev}h</strong>/dia
        </td>
        <td style="width:50%;padding:4px 20px 4px 10px;color:${textMuted};vertical-align:top;text-align:right;">
          Capacidade <strong>${metrics.devDailyCapacity}h</strong>/dia
        </td>
      </tr>
      <tr>
        <td style="padding:4px 10px 12px 20px;color:${textMuted};vertical-align:top;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${accent};margin-right:6px;"></span>QA: <strong>${project.qtyQas}</strong> qas &times; <strong>${project.hoursPerQa}h</strong>/dia
        </td>
        <td style="padding:4px 20px 12px 10px;color:${textMuted};vertical-align:top;text-align:right;">
          Capacidade <strong>${metrics.qaDailyCapacity}h</strong>/dia
        </td>
      </tr>
    </table>
  </div>

  <div style="margin:8px 24px 0;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);overflow:hidden;">
    <div style="padding:16px 20px 8px;font-size:13px;font-weight:700;font-family:'Outfit',Arial,sans-serif;color:${textDark};">Progresso</div>
    <div style="padding:4px 20px 8px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:${textMuted};margin-bottom:3px;"><span>Esperado</span><span>${barExpectedPct}%</span></div>
      ${progressBarSvg(barExpectedPct, '#9ca3af', 8)}
    </div>
    <div style="padding:2px 20px 12px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:${textMuted};margin-bottom:3px;"><span>Real</span><span>${barRealPct}%</span></div>
      ${progressBarSvg(barRealPct, color, 8)}
    </div>
    <div style="padding:8px 20px 16px;border-top:1px solid ${border};">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr><td style="padding:3px 0;color:${textMuted};">Horas DEV</td><td style="padding:3px 0;text-align:right;font-weight:600;">${project.hoursDevRealized}h / ${project.estimatedDevHours}h <span style="color:${textMuted};font-weight:400;">(${Math.round(metrics.devProgressReal)}%)</span></td></tr>
        <tr><td style="padding:3px 0;color:${textMuted};">Horas QA</td><td style="padding:3px 0;text-align:right;font-weight:600;">${project.hoursQaRealized}h / ${project.estimatedQaHours}h <span style="color:${textMuted};font-weight:400;">(${Math.round(metrics.qaProgressReal)}%)</span></td></tr>
      </table>
    </div>
  </div>

  <div style="margin:8px 24px 0;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);overflow:hidden;">
    <div style="padding:16px 20px 8px;font-size:13px;font-weight:700;font-family:'Outfit',Arial,sans-serif;color:${textDark};">Tempo</div>
    <div style="padding:4px 20px 16px;">${timelineSvg(metrics.elapsedWorkingDays, totalDays, '#3b82f6')}</div>
  </div>

  <div style="margin:8px 24px 0;padding:14px 20px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:13px;color:${textDark};">Diferen\u00e7a <span style="color:${textMuted};">(Real \u2212 Esperado)</span></span>
    <span style="font-size:18px;font-weight:800;font-family:'Outfit',Arial,sans-serif;color:${diffColor};">${diffSign(diff)}${diff}%</span>
  </div>

  <div style="margin:8px 24px 0;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);overflow:hidden;">
    <div style="padding:16px 20px 8px;font-size:13px;font-weight:700;font-family:'Outfit',Arial,sans-serif;color:${textDark};">Previs\u00e3o</div>
    <div style="padding:4px 20px;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr><td style="padding:4px 0;color:${textMuted};">Chance de sucesso</td><td style="padding:4px 0;text-align:right;font-weight:800;font-size:16px;font-family:'Outfit',Arial,sans-serif;color:${color};">${metrics.successChance}%</td></tr>
        <tr><td style="padding:4px 0;color:${textMuted};">Conclus\u00e3o planejada</td><td style="padding:4px 0;text-align:right;font-weight:600;">${fmtDateBR(project.endDate)}</td></tr>
        <tr><td style="padding:4px 0 0;color:${textMuted};">Previs\u00e3o atual</td><td style="padding:4px 0 0;text-align:right;font-weight:600;">${fmtDateBR(metrics.projectedCompletionDate)}</td></tr>
      </table>
    </div>
    <div style="padding:4px 20px 8px 20px;">${progressBarSvg(metrics.successChance, color, 6)}</div>
    <div style="padding:0 20px 16px;text-align:right;font-size:10px;color:${textMuted};">${metrics.successChance}% de chance de concluir no prazo</div>
  </div>

  <div style="margin:16px 24px 24px;padding-top:12px;border-top:1px solid ${border};text-align:center;font-size:10px;color:#9ca3af;">
    Relat\u00f3rio gerado automaticamente pelo <strong style="color:${accent};">Effort Track</strong>
  </div>
</div>`.trim();
}

export function generateMailToUrl(project, metrics) {
  const emails = (project.stakeholderEmails || []).filter(Boolean);
  const to = emails.join(',');
  const subject = `Acompanhamento de evolução do projeto ${project.title} (${fmtDateBR(project.startDate)} à ${fmtDateBR(project.endDate)})`;
  const body = generatePlainTextBody(project, metrics);
  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return url;
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

export function downloadPdfReport(project, metrics) {
  const html = generateHtmlBody(project, metrics);
  const printStyles = `
    @page { margin: 6mm; size: A4; }
    body { font-family: 'Outfit', 'Inter', Arial, Helvetica, sans-serif; padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    svg { display: block; }
  `;
  const fullDoc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório - ${project.title}</title>
  <style>${printStyles}</style>
</head>
<body>
  ${html}
  <script>window.print()<\/script>
</body>
</html>`;
  const blob = new Blob([fullDoc], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (w) {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    URL.revokeObjectURL(url);
  }
}

export function downloadHtmlReport(project, metrics) {
  const html = generateHtmlBody(project, metrics);
  const fullDoc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Relatório - ${project.title}</title>
  <style>
    @page { margin: 6mm; size: A4; }
    body { font-family: 'Outfit','Inter',Arial,Helvetica,sans-serif; padding: 16px; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    svg { display: block; max-width: 100%; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  const safeName = project.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
  const blob = new Blob([fullDoc], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_${safeName}.html`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
