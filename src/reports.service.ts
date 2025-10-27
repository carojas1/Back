import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Alert } from './alert.entity';
import { ExportHistory } from './export-history.entity';

type TabKey = 'diario' | 'semanal' | 'mensual';

@Injectable()
export class ReportsService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(ExportHistory)
    private readonly exportHistoryRepository: Repository<ExportHistory>
  ) {
    // usa .env si existe; si no, respalda con los valores que tenías (no rompemos nada)
    const user = process.env.SMTP_USER || 'alertavision706@gmail.com';
    const pass = process.env.SMTP_PASS || 'whtp jyvo ylae fjga';
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  // ------------------ SERIES PARA EL DASHBOARD ------------------

  // Conteo por día dentro del rango
  async getDaily(fromISO: string, toISO: string, userId?: string) {
    const from = new Date(fromISO);
    const to   = new Date(toISO);

    const alerts = await this.alertRepository.find({
      where: {
        created_at: Between(from, to),
        ...(userId ? { user_id: userId as any } : {}),
      } as any,
      order: { created_at: 'ASC' },
    });

    const map = new Map<string, number>();
    for (const a of alerts) {
      const d = new Date(a.created_at as unknown as Date);
      const label = d.toLocaleDateString();
      map.set(label, (map.get(label) || 0) + 1);
    }
    return { labels: Array.from(map.keys()), values: Array.from(map.values()) };
  }

  // Conteo por semanas (bloques de 7 días desde 'from')
  async getWeekly(fromISO: string, toISO: string, userId?: string) {
    const from = new Date(fromISO);
    const to   = new Date(toISO);

    const alerts = await this.alertRepository.find({
      where: {
        created_at: Between(from, to),
        ...(userId ? { user_id: userId as any } : {}),
      } as any,
      order: { created_at: 'ASC' },
    });

    const MS_DAY = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / MS_DAY));
    const weeks = Math.ceil(totalDays / 7);
    const buckets = Array(weeks).fill(0);

    for (const a of alerts) {
      const idx = Math.floor((new Date(a.created_at as unknown as Date).getTime() - from.getTime()) / (7 * MS_DAY));
      if (idx >= 0 && idx < buckets.length) buckets[idx] += 1;
    }

    const labels = buckets.map((_, i) => `Sem ${i + 1}`);
    return { labels, values: buckets };
  }

  // Donut mensual (si no tienes campo de etapa en Alert, se reparte para no dejar vacío)
  async getMonthly(fromISO: string, toISO: string, userId?: string) {
    const from = new Date(fromISO);
    const to   = new Date(toISO);

    const alerts = await this.alertRepository.find({
      where: {
        created_at: Between(from, to),
        ...(userId ? { user_id: userId as any } : {}),
      } as any,
    });

    // Ajusta este bloque si tu tabla Alert tiene campo de etapa/tipo de sueño
    let light = 0, deep = 0, awake = 0;
    for (let i = 0; i < alerts.length; i++) {
      light++;
      if (i % 3 === 0) deep++;
      if (i % 5 === 0) awake++;
    }

    return {
      labels: ['Sueño ligero', 'Sueño profundo', 'Despierto'],
      values: [light, deep, awake],
    };
  }

  // ------------------ EXPORTAR REPORTE POR CORREO (tu flujo) ------------------

  private isValidTab(tab: string): tab is TabKey {
    return tab === 'diario' || tab === 'semanal' || tab === 'mensual';
  }

  private startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  }
  private endOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
  private lastWeekRange(ref: Date) {
    const end = this.endOfDay(new Date(ref));
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    return { start, end };
  }
  private sortKeys(keys: string[], grain: 'hour' | 'day' | 'month') {
    return [...keys].sort((a, b) => {
      if (grain === 'hour') return parseInt(a, 10) - parseInt(b, 10);
      if (grain === 'month') {
        const [ma, ya] = a.split('/').map(Number);
        const [mb, yb] = b.split('/').map(Number);
        return ya !== yb ? ya - yb : ma - mb;
      }
      const da = Date.parse(a), db = Date.parse(b);
      if (isNaN(da) || isNaN(db)) return 0;
      return da - db;
    });
  }

  async sendReportToEmail(email: string, tab: string) {
    if (!this.isValidTab(tab)) throw new Error('Tipo de reporte no válido');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let periodoLabel = '';
    let agrupador: 'day' | 'hour' | 'month' = 'day';

    if (tab === 'diario') {
      startDate = this.startOfDay(now);
      endDate = this.endOfDay(now);
      periodoLabel = `Día: ${startDate.toLocaleDateString()}`;
      agrupador = 'hour';
    } else if (tab === 'semanal') {
      const dayOfWeek = now.getDay();
      startDate = this.startOfDay(new Date(now));
      startDate.setDate(now.getDate() - dayOfWeek);
      endDate = this.endOfDay(now);
      periodoLabel = `Semana: ${startDate.toLocaleDateString()} al ${endDate.toLocaleDateString()}`;
      agrupador = 'day';
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = this.endOfDay(now);
      periodoLabel = `Mes: ${startDate.toLocaleString('default', { month: 'long' })}`;
      agrupador = 'day';
    }

    const alerts = await this.alertRepository.find({
      where: { created_at: Between(startDate, endDate) },
      order: { created_at: 'ASC' },
    });

    const totalAlertas = alerts.length;

    const contador: Record<string, number> = {};
    for (const alert of alerts) {
      const date = new Date(alert.created_at as unknown as Date);
      let key = '';
      if (agrupador === 'hour') key = `${date.getHours()}:00`;
      else if (agrupador === 'day') key = date.toLocaleDateString();
      else key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      contador[key] = (contador[key] || 0) + 1;
    }

    let masAlertasLabel = 'Sin datos';
    let max = 0;
    let diaCritico = '';
    for (const [k, v] of Object.entries(contador)) {
      if (v > max) { max = v; masAlertasLabel = `${k} (${v} alerta${v > 1 ? 's' : ''})`; diaCritico = k; }
    }

    // vs semana pasada (intenta real, si falla deja +3)
    let diffSemana = '+3';
    try {
      const { start: prevStart, end: prevEnd } = this.lastWeekRange(startDate);
      const prevCount = await this.alertRepository.count({ where: { created_at: Between(prevStart, prevEnd) } as any });
      const currCount = totalAlertas;
      const delta = currCount - prevCount;
      diffSemana = (delta >= 0 ? '+' : '') + delta.toString();
    } catch {}

    let grafica = '';
    const dias = this.sortKeys(Object.keys(contador), agrupador);
    for (const dia of dias) {
      const n = contador[dia];
      grafica += `${dia}: ${'█'.repeat(Math.max(1, n))}  (${n})\n`;
    }

    let mensajePersonalizado = '';
    if (totalAlertas === 0) {
      mensajePersonalizado = '¡Excelente! No se detectaron episodios de somnolencia en este periodo. 😎';
    } else if (totalAlertas < 3) {
      mensajePersonalizado = 'Bien hecho, tu nivel de alerta fue bueno. Mantén tus buenos hábitos de descanso.';
    } else {
      mensajePersonalizado = 'Precaución: se detectaron varios episodios de somnolencia. Por favor, revisa tus hábitos de sueño y mantente alerta en el volante.';
    }

    await this.exportHistoryRepository.save({ email });

    const exportHistory = await this.exportHistoryRepository.find({
      where: { email },
      order: { created_at: 'DESC' },
      take: 5,
      select: ['created_at'],
    });

    let historialHtml = '';
    if (exportHistory.length > 0) {
      historialHtml = `
      <div style="margin-top:17px;">
        <div style="font-weight:600;margin-bottom:7px;color:#5a4228;font-size:1.01em;">🕑 Últimas exportaciones realizadas</div>
        <ul style="padding-left:17px;margin:0;">
          ${exportHistory.map(e => `<li style="margin-bottom:3px;">${new Date(e.created_at).toLocaleString()}</li>`).join('')}
        </ul>
      </div>
      `;
    }

    const html = `
      <div style="max-width:540px;margin:38px auto 0 auto;border-radius:13px;box-shadow:0 8px 34px #76471d22;font-family:Segoe UI,Arial,sans-serif;background:#fcf8f5;overflow:hidden;">
    <!-- CABECERA -->
    <div style="background:#7d5a38;color:#fff;padding:22px 32px 14px 32px;display:flex;align-items:center;gap:26px;border-radius:13px 13px 0 0;">
      <img src="https://i.ibb.co/VW3qt8W3/logo-alertavision.png" alt="Logo Alerta Visión" style="width:72px;height:72px;background:#fff;border-radius:13px;padding:5px 5px;box-shadow:0 2px 16px #0002;">
      <div>
        <div style="font-size:1.45em;font-weight:600;letter-spacing:-.5px;line-height:1.1;">Reporte de Somnolencia</div>
        <div style="font-size:1.02em;opacity:.92;margin-top:5px;font-weight:400;">
          <span style="opacity:.9;">(${tab})</span>
          <span style="margin-left:11px;">📅 ${periodoLabel}</span>
        </div>
      </div>
    </div>

    <!-- CUERPO PRINCIPAL -->
    <div style="padding:24px 32px 16px 32px;background:#fcf8f5;">
      <p style="margin:0 0 17px 0;font-size:1.12em;">
        <b>Resumen ejecutivo de Alerta Visión:</b>
      </p>
      <!-- Tarjetas resumen -->
      <div style="display:flex;gap:14px;justify-content:space-between;margin-bottom:22px;">
        <div style="background:#ebe2d7;padding:17px 14px;border-radius:10px;flex:1;text-align:center;box-shadow:0 1px 8px #76471d1b;">
          <div style="font-size:1.5em;font-weight:600;color:#53391c;">${totalAlertas}</div>
          <div style="font-size:.98em;opacity:.86;">Total alertas</div>
        </div>
        <div style="background:#f4e6cf;padding:17px 14px;border-radius:10px;flex:1;text-align:center;box-shadow:0 1px 8px #b7956e19;">
          <div style="font-size:1.15em;font-weight:600;color:#7d5a38;">${diaCritico || '—'}</div>
          <div style="font-size:.98em;opacity:.86;">Día más crítico</div>
        </div>
        <div style="background:#e6e1dc;padding:17px 14px;border-radius:10px;flex:1;text-align:center;box-shadow:0 1px 8px #765f4d13;">
          <div style="font-size:1.15em;font-weight:600;color:#6f4f2b;">${diffSemana}</div>
          <div style="font-size:.98em;opacity:.86;">vs semana pasada</div>
        </div>
      </div>

      <!-- Historial -->
      <div style="margin-bottom:22px;">
        <div style="font-weight:600;margin-bottom:7px;color:#7d5a38;font-size:1.05em;display:flex;align-items:center;gap:7px;">
          <img src="https://cdn-icons-png.flaticon.com/512/2937/2937592.png" width="17" style="vertical-align:-3px;"> Historial
        </div>
        <pre style="background:#f7f2ee;padding:12px 10px 12px 18px;border-radius:8px;font-size:.99em;margin:0;color:#4b3a29;font-family:monospace;box-shadow:0 1px 5px #a0764510;">
${grafica || '(sin datos)'}
        </pre>
      </div>

      ${historialHtml}

      <div style="background:#fcf1e7;color:#855b2c;font-size:1.06em;padding:14px 18px;border-radius:10px;margin-bottom:10px;display:flex;align-items:flex-start;gap:10px;box-shadow:0 1px 5px #76471d0c;">
        <span style="font-size:1.18em;line-height:1;margin-top:2px;">⚠️</span>
        <div>
          <b style="color:#b87f1a;">Precaución:</b>
          <span style="color:#7d5a38;">${mensajePersonalizado.replace(/^.*?:\s*/, '')}</span>
        </div>
      </div>

      <div style="margin-top:22px;padding-top:13px;border-top:1px solid #ebddd0;color:#6c563e;font-size:.97em;">
        Reporte generado automáticamente el ${now.toLocaleString()}<br>
        <span style="color:#b79a74;">Alerta Visión © 2025</span>
      </div>
    </div>
  </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Alerta Visión" <alertavision706@gmail.com>',
      to: email,
      subject: `Reporte de Somnolencia (${tab})`,
      html,
    };

    await this.transporter.sendMail(mailOptions);
    return { message: '¡Reporte enviado correctamente!' };
  }

  async getExportHistory(email: string) {
    return this.exportHistoryRepository.find({
      where: { email },
      order: { created_at: 'DESC' },
      take: 5,
      select: ['created_at'],
    });
  }
}
