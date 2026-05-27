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

function diffPercent(metrics) {
  return Math.round(metrics.overallProgressReal - metrics.expectedProgress);
}

function diffSign(val) {
  return val > 0 ? '+' : '';
}

export function generatePlainTextBody(project, metrics) {
  const diff = diffPercent(metrics);
  const lines = [
    `=== Acompanhamento de Evolução do Projeto ===`,
    ``,
    `Projeto: ${project.title}`,
    `Período: ${fmtDateBR(project.startDate)} à ${fmtDateBR(project.endDate)}`,
    `Status: ${statusText(project, metrics)}`,
    `Dias úteis restantes: ${metrics.remainingWorkingDays}`,
    ``,
    `--- Recursos Alocados ---`,
    `DEV: ${project.qtyDevs} devs × ${project.hoursPerDev}h/dia = ${metrics.devDailyCapacity}h/dia`,
    `QA:  ${project.qtyQas} qas × ${project.hoursPerQa}h/dia = ${metrics.qaDailyCapacity}h/dia`,
    ``,
    `--- Produção Esperada ---`,
    `Horas DEV esperadas: ${Math.round(metrics.elapsedWorkingDays * metrics.devDailyCapacity)}h`,
    `Horas QA esperadas:  ${Math.round(metrics.elapsedWorkingDays * metrics.qaDailyCapacity)}h`,
    `Progresso esperado: ${Math.round(metrics.expectedProgress)}%`,
    ``,
    `--- Produção Realizada ---`,
    `Horas DEV realizadas: ${project.hoursDevRealized}h`,
    `Horas QA realizadas:  ${project.hoursQaRealized}h`,
    `Progresso real: ${Math.round(metrics.overallProgressReal)}%`,
    ``,
    `--- Diferença ---`,
    `% Diferença: ${diffSign(diff)}${diff}%`,
    ``,
    `--- Previsão ---`,
    `Chance de sucesso: ${metrics.successChance}%`,
    `Conclusão planejada: ${fmtDateBR(project.endDate)}`,
    `Conclusão prevista atual: ${fmtDateBR(metrics.projectedCompletionDate)}`,
    ``,
    `---`,
    `Relatório gerado automaticamente pelo Effort Track.`
  ];
  return lines.join('\n');
}

export function generateHtmlBody(project, metrics) {
  const diff = diffPercent(metrics);
  const color = statusColor(project, metrics);
  const diffColor = diff >= 0 ? '#22c55e' : '#ef4444';
  const barRealPct = Math.round(metrics.overallProgressReal);
  const barExpectedPct = Math.round(metrics.expectedProgress);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f9fa; border-radius: 8px;">
      <div style="text-align: center; padding: 16px 0; border-bottom: 2px solid #e9ecef;">
        <h2 style="margin: 0; color: #1f2937; font-size: 20px;">Acompanhamento de Evolução</h2>
        <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${project.title} (${fmtDateBR(project.startDate)} à ${fmtDateBR(project.endDate)})</p>
      </div>

      <div style="margin-top: 16px;">
        <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; color: #fff; background: ${color};">${statusText(project, metrics)}</div>
        <span style="margin-left: 12px; font-size: 13px; color: #6b7280;">${metrics.remainingWorkingDays} dias úteis restantes</span>
      </div>

      <div style="margin-top: 20px; background: #fff; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: #374151;">Recursos Alocados</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr><td style="padding: 4px 0; color: #6b7280;">DEV</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${project.qtyDevs} devs × ${project.hoursPerDev}h/dia = ${metrics.devDailyCapacity}h/dia</td></tr>
          <tr><td style="padding: 4px 0; color: #6b7280;">QA</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${project.qtyQas} qas × ${project.hoursPerQa}h/dia = ${metrics.qaDailyCapacity}h/dia</td></tr>
        </table>
      </div>

      <div style="margin-top: 12px; background: #fff; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: #374151;">Progresso</h3>

        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            <span>Esperado</span><span>${barExpectedPct}%</span>
          </div>
          <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${barExpectedPct}%; background: #9ca3af; border-radius: 4px;"></div>
          </div>
        </div>

        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            <span>Real</span><span>${barRealPct}%</span>
          </div>
          <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${barRealPct}%; background: ${color}; border-radius: 4px;"></div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px;">
          <tr><td style="padding: 6px 0; color: #6b7280;">Horas DEV realizadas</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${project.hoursDevRealized}h / ${project.estimatedDevHours}h</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Horas QA realizadas</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${project.hoursQaRealized}h / ${project.estimatedQaHours}h</td></tr>
        </table>
      </div>

      <div style="margin-top: 12px; background: #fff; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: #374151;">Diferença (Real - Esperado)</span>
          <span style="font-size: 18px; font-weight: 700; color: ${diffColor};">${diffSign(diff)}${diff}%</span>
        </div>
      </div>

      <div style="margin-top: 12px; background: #fff; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: #374151;">Previsão</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr><td style="padding: 4px 0; color: #6b7280;">Chance de sucesso</td><td style="padding: 4px 0; text-align: right; font-weight: 700; color: ${color};">${metrics.successChance}%</td></tr>
          <tr><td style="padding: 4px 0; color: #6b7280;">Conclusão planejada</td><td style="padding: 4px 0; text-align: right;">${fmtDateBR(project.endDate)}</td></tr>
          <tr><td style="padding: 4px 0; color: #6b7280;">Conclusão prevista atual</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${fmtDateBR(metrics.projectedCompletionDate)}</td></tr>
        </table>
      </div>

      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af;">
        Relatório gerado automaticamente pelo Effort Track
      </div>
    </div>
  `.trim();
}

export function generateMailToUrl(project, metrics) {
  const emails = (project.stakeholderEmails || []).filter(Boolean);
  const to = emails.join(',');
  const subject = `Acompanhamento de evolução do projeto ${project.title} (${fmtDateBR(project.startDate)} à ${fmtDateBR(project.endDate)})`;
  const body = generatePlainTextBody(project, metrics);
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function copyReportToClipboard(project, metrics) {
  const html = generateHtmlBody(project, metrics);
  const plain = generatePlainTextBody(project, metrics);
  try {
    await navigator.clipboard.writeText(plain);
    return { success: true, format: 'text' };
  } catch (_) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([plain], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })
      ]);
      return { success: true, format: 'html' };
    } catch (_2) {
      return { success: false };
    }
  }
}
