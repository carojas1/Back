import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as nodemailer from 'nodemailer';

// CORRECCIÓN DE RUTAS: Usamos ./ porque estamos en la raiz src
import { Alert } from './alert.entity'; 
import { ExportHistory } from './export-history.entity'; 
import { User } from './users/user.entity'; 

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
    const user = process.env.SMTP_USER || 'alertavision706@gmail.com';
    const pass = process.env.SMTP_PASS || 'whtp jyvo ylae fjga'; 
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  // --- SERIES ---

  async getDaily(fromISO: string, toISO: string, userId: number) {
    const from = new Date(fromISO);
    const to   = new Date(toISO);

    const alerts = await this.alertRepository.find({
      where: {
        created_at: Between(from, to),
        usuario: { id: userId } 
      },
      order: { created_at: 'ASC' },
    });

    const map = new Map<string, number>();
    for (const a of alerts) {
      const d = new Date(a.created_at);
      const label = d.toLocaleDateString();
      map.set(label, (map.get(label) || 0) + 1);
    }
    return { labels: Array.from(map.keys()), values: Array.from(map.values()) };
  }

  async getWeekly(fromISO: string, toISO: string, userId: number) {
    const from = new Date(fromISO);
    const to   = new Date(toISO);

    const alerts = await this.alertRepository.find({
      where: {
        created_at: Between(from, to),
        usuario: { id: userId }
      },
      order: { created_at: 'ASC' },
    });

    const MS_DAY = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / MS_DAY));
    const weeks = Math.ceil(totalDays / 7);
    const buckets = Array(weeks).fill(0);

    for (const a of alerts) {
      const idx = Math.floor((new Date(a.created_at).getTime() - from.getTime()) / (7 * MS_DAY));
      if (idx >= 0 && idx < buckets.length) buckets[idx] += 1;
    }

    const labels = buckets.map((_, i) => `Sem ${i + 1}`);
    return { labels, values: buckets };
  }

  async getMonthly(fromISO: string, toISO: string, userId: number) {
    const from = new Date(fromISO);
    const to   = new Date(toISO);

    const alerts = await this.alertRepository.find({
      where: {
        created_at: Between(from, to),
        usuario: { id: userId }
      },
    });

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

  // --- EXPORTAR ---

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

  async sendReportToEmail(user: User, email: string, tab: string) {
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
      where: { 
        created_at: Between(startDate, endDate),
        usuario: { id: user.id } 
      },
      order: { created_at: 'ASC' },
    });

    const totalAlertas = alerts.length;

    const contador: Record<string, number> = {};
    for (const alert of alerts) {
      const date = new Date(alert.created_at);
      let key = '';
      if (agrupador === 'hour') key = `${date.getHours()}:00`;
      else if (agrupador === 'day') key = date.toLocaleDateString();
      else key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      contador[key] = (contador[key] || 0) + 1;
    }

    let diaCritico = '';
    let max = 0;
    for (const [k, v] of Object.entries(contador)) {
      if (v > max) { max = v; diaCritico = k; }
    }

    let diffSemana = '+0';
    try {
      const { start: prevStart, end: prevEnd } = this.lastWeekRange(startDate);
      const prevCount = await this.alertRepository.count({ 
        where: { 
          created_at: Between(prevStart, prevEnd),
          usuario: { id: user.id } 
        } 
      });
      const delta = totalAlertas - prevCount;
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
      mensajePersonalizado = `¡Excelente ${user.nombre}! No detectamos fatiga.`;
    } else if (totalAlertas < 3) {
      mensajePersonalizado = 'Nivel aceptable. Mantén tus buenos hábitos.';
    } else {
      mensajePersonalizado = 'Precaución: se detectaron varios episodios. Descansa.';
    }

    await this.exportHistoryRepository.save({ email });
    const exportHistory = await this.exportHistoryRepository.find({
      where: { email },
      order: { created_at: 'DESC' },
      take: 5,
    });

    let historialHtml = '';
    if (exportHistory.length > 0) {
      historialHtml = `
      <div style="margin-top:17px;">
        <div style="font-weight:600;margin-bottom:7px;color:#5a4228;">🕑 Últimas exportaciones</div>
        <ul style="padding-left:17px;margin:0;">
          ${exportHistory.map(e => `<li style="margin-bottom:3px;">${new Date(e.created_at).toLocaleString()}</li>`).join('')}
        </ul>
      </div>`;
    }

    const html = `
      <div style="max-width:540px;margin:20px auto;font-family:Arial,sans-serif;background:#fcf8f5;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        <div style="background:#007bff;color:#fff;padding:20px;text-align:center;">
          <h2 style="margin:0;">Reporte de Fatiga (${tab})</h2>
          <p style="margin:5px 0 0 0;">Hola, ${user.nombre}</p>
        </div>
        <div style="padding:20px;">
           <div style="display:flex;justify-content:space-around;margin-bottom:20px;text-align:center;">
              <div>
                <strong style="font-size:1.5em;color:#333;">${totalAlertas}</strong><br>
                <span style="color:#666;">Alertas</span>
              </div>
              <div>
                <strong style="font-size:1.5em;color:#333;">${diaCritico || '-'}</strong><br>
                <span style="color:#666;">Día Crítico</span>
              </div>
              <div>
                <strong style="font-size:1.5em;color:#333;">${diffSemana}</strong><br>
                <span style="color:#666;">vs Semana Ant.</span>
              </div>
           </div>
           
           <div style="background:#eee;padding:15px;border-radius:5px;font-family:monospace;white-space:pre-wrap;">${grafica || 'Sin datos para mostrar.'}</div>

           <p style="margin-top:20px;color:#d9534f;font-weight:bold;">${mensajePersonalizado}</p>
           
           ${historialHtml}
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Alerta Visión" <alertavision706@gmail.com>',
      to: email,
      subject: `Reporte ${tab} - ${user.nombre}`,
      html,
    };

    await this.transporter.sendMail(mailOptions);
    return { message: '¡Reporte enviado correctamente!' };
  }
}