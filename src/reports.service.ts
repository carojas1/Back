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
    private readonly exportHistoryRepository: Repository<ExportHistory>,
  ) {
    const user = process.env.SMTP_USER || 'alertavision706@gmail.com';
    const pass = process.env.SMTP_PASS || 'whtp jyvo ylae fjga';

    // Configuración FINAL robusta para Gmail
    // Puerto 465 (SSL) es el único confiable desde servidores Cloud como Render
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true para 465
      auth: { user, pass },
      // Timeouts explícitos para no colgar la conexión
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    });
  }

  // --- SERIES ---

  async getDaily(fromISO: string, toISO: string, userId: number) {
    // Usar fecha de hoy
    const from = new Date(fromISO);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toISO);
    to.setHours(23, 59, 59, 999);

    console.log('📅 getDaily - Rango:', { from, to, userId });

    const alerts = await this.alertRepository.find({
      where: {
        fecha: Between(from, to),
        usuarioId: userId,
      },
      order: { fecha: 'ASC' },
    });

    console.log('📊 Alertas diarias encontradas:', alerts.length);

    // Agrupar por HORA del día (0-23)
    const hourMap = new Map<number, number>();

    // Inicializar todas las horas en 0
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, 0);
    }

    for (const a of alerts) {
      const hora = new Date(a.fecha).getHours();
      hourMap.set(hora, (hourMap.get(hora) || 0) + 1);
    }

    // Generar labels como "00:00", "01:00", etc.
    const labels: string[] = [];
    const values: number[] = [];

    for (let h = 0; h < 24; h++) {
      labels.push(`${h.toString().padStart(2, '0')}:00`);
      values.push(hourMap.get(h) || 0);
    }

    return { labels, values };
  }

  async getWeekly(fromISO: string, toISO: string, userId: number) {
    const from = new Date(fromISO);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toISO);
    to.setHours(23, 59, 59, 999);

    console.log('📅 getWeekly - Rango:', { from, to, userId });

    const alerts = await this.alertRepository.find({
      where: {
        fecha: Between(from, to),
        usuarioId: userId,
      },
      order: { fecha: 'ASC' },
    });

    console.log('📊 Alertas semanales encontradas:', alerts.length);

    // Nombres de días en español
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Inicializar contador por día de la semana
    const dayMap = new Map<number, number>();
    for (let d = 0; d < 7; d++) {
      dayMap.set(d, 0);
    }

    for (const a of alerts) {
      const dia = new Date(a.fecha).getDay(); // 0=Dom, 1=Lun, etc.
      dayMap.set(dia, (dayMap.get(dia) || 0) + 1);
    }

    // Ordenar empezando por Lunes (1) hasta Domingo (0)
    const ordenDias = [1, 2, 3, 4, 5, 6, 0]; // Lun, Mar, Mié, Jue, Vie, Sáb, Dom

    const labels: string[] = [];
    const values: number[] = [];

    for (const d of ordenDias) {
      labels.push(diasSemana[d]);
      values.push(dayMap.get(d) || 0);
    }

    return { labels, values };
  }

  async getMonthly(fromISO: string, toISO: string, userId: number) {
    const from = new Date(fromISO);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toISO);
    to.setHours(23, 59, 59, 999);

    console.log('📅 getMonthly - Rango:', { from, to, userId });

    const alerts = await this.alertRepository.find({
      where: {
        fecha: Between(from, to),
        usuarioId: userId,
      },
    });

    console.log('📊 Alertas mensuales encontradas:', alerts.length);

    // Si no hay alertas
    if (alerts.length === 0) {
      return {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        values: [0, 0, 0, 0],
      };
    }

    // Agrupar por semana del mes (1-4)
    const weekMap = new Map<number, number>();
    for (let w = 1; w <= 4; w++) {
      weekMap.set(w, 0);
    }

    for (const a of alerts) {
      const fecha = new Date(a.fecha);
      const diaDelMes = fecha.getDate();
      const semana = Math.min(4, Math.ceil(diaDelMes / 7)); // Semana 1-4
      weekMap.set(semana, (weekMap.get(semana) || 0) + 1);
    }

    const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    const values = [
      weekMap.get(1) || 0,
      weekMap.get(2) || 0,
      weekMap.get(3) || 0,
      weekMap.get(4) || 0,
    ];

    return { labels, values };
  }

  // --- EXPORTAR ---

  // Normaliza el tab a español (acepta inglés o español, mayúsculas o minúsculas)
  private normalizeTab(tab: string): TabKey | null {
    const tabLower = (tab || '').toLowerCase().trim();

    // Mapeo inglés -> español
    const mapping: Record<string, TabKey> = {
      'daily': 'diario',
      'diario': 'diario',
      'weekly': 'semanal',
      'semanal': 'semanal',
      'monthly': 'mensual',
      'mensual': 'mensual',
    };

    return mapping[tabLower] || null;
  }

  private isValidTab(tab: string): tab is TabKey {
    return this.normalizeTab(tab) !== null;
  }

  private startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  }
  private endOfDay(d: Date) {
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23,
      59,
      59,
      999,
    );
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
      const da = Date.parse(a),
        db = Date.parse(b);
      if (isNaN(da) || isNaN(db)) return 0;
      return da - db;
    });
  }

  async sendReportToEmail(user: { id: number; nombre?: string; email?: string }, email: string, tab: string) {
    // Validación robusta
    if (!user || !user.id) {
      console.error('❌ Export error: Usuario inválido', user);
      throw new Error('Usuario no válido para generar reporte');
    }

    if (!email || !email.includes('@')) {
      console.error('❌ Export error: Email inválido', email);
      throw new Error('Email no válido');
    }

    // Normalizar tab (acepta Daily/Weekly/Monthly o diario/semanal/mensual)
    const normalizedTab = this.normalizeTab(tab);
    if (!normalizedTab) {
      console.error('❌ Export error: Tab inválido', tab);
      throw new Error('Tipo de reporte no válido');
    }

    console.log('📧 Tab normalizado:', tab, '->', normalizedTab);

    const userName = user.nombre || 'Usuario';

    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      let periodoLabel = '';
      let agrupador: 'day' | 'hour' | 'month' = 'day';

      if (normalizedTab === 'diario') {
        startDate = this.startOfDay(now);
        endDate = this.endOfDay(now);
        periodoLabel = `Día: ${startDate.toLocaleDateString()}`;
        agrupador = 'hour';
      } else if (normalizedTab === 'semanal') {
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

      console.log('📧 Generando reporte:', { userId: user.id, email, tab: normalizedTab, startDate, endDate });

      const alerts = await this.alertRepository.find({
        where: {
          fecha: Between(startDate, endDate),
          usuarioId: user.id,
        },
        order: { fecha: 'ASC' },
      });

      const totalAlertas = alerts.length;

      const contador: Record<string, number> = {};
      for (const alert of alerts) {
        const date = new Date(alert.fecha);
        let key = '';
        if (agrupador === 'hour') key = `${date.getHours()}:00`;
        else if (agrupador === 'day') key = date.toLocaleDateString();
        else key = `${date.getMonth() + 1}/${date.getFullYear()}`;
        contador[key] = (contador[key] || 0) + 1;
      }

      let diaCritico = '';
      let max = 0;
      for (const [k, v] of Object.entries(contador)) {
        if (v > max) {
          max = v;
          diaCritico = k;
        }
      }

      let diffSemana = '+0';
      try {
        const { start: prevStart, end: prevEnd } = this.lastWeekRange(startDate);
        const prevCount = await this.alertRepository.count({
          where: {
            fecha: Between(prevStart, prevEnd),
            usuarioId: user.id,
          },
        });
        const delta = totalAlertas - prevCount;
        diffSemana = (delta >= 0 ? '+' : '') + delta.toString();
      } catch (e) {
        console.log('⚠️ No se pudo calcular diferencia semanal:', e);
      }

      let grafica = '';
      const dias = this.sortKeys(Object.keys(contador), agrupador);
      for (const dia of dias) {
        const n = contador[dia];
        grafica += `${dia}: ${'█'.repeat(Math.max(1, n))}  (${n})\n`;
      }

      let mensajePersonalizado = '';
      if (totalAlertas === 0) {
        mensajePersonalizado = `¡Excelente ${userName}! No detectamos fatiga.`;
      } else if (totalAlertas < 3) {
        mensajePersonalizado = 'Nivel aceptable. Mantén tus buenos hábitos.';
      } else {
        mensajePersonalizado =
          'Precaución: se detectaron varios episodios. Descansa.';
      }

      // Guardar historial (con manejo de error)
      try {
        await this.exportHistoryRepository.save({ email });
      } catch (e) {
        console.log('⚠️ No se pudo guardar historial de exportación:', e);
      }

      let historialHtml = '';
      try {
        const exportHistory = await this.exportHistoryRepository.find({
          where: { email },
          order: { created_at: 'DESC' },
          take: 5,
        });

        if (exportHistory.length > 0) {
          historialHtml = `
          <div style="margin-top:17px;">
            <div style="font-weight:600;margin-bottom:7px;color:#5a4228;">🕑 Últimas exportaciones</div>
            <ul style="padding-left:17px;margin:0;">
              ${exportHistory.map((e) => `<li style="margin-bottom:3px;">${new Date(e.created_at).toLocaleString()}</li>`).join('')}
            </ul>
          </div>`;
        }
      } catch (e) {
        console.log('⚠️ No se pudo obtener historial:', e);
      }

      const html = `
        <div style="max-width:540px;margin:20px auto;font-family:Arial,sans-serif;background:#fcf8f5;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <div style="background:#007bff;color:#fff;padding:20px;text-align:center;">
            <h2 style="margin:0;">Reporte de Fatiga (${normalizedTab})</h2>
            <p style="margin:5px 0 0 0;">Hola, ${userName}</p>
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
        from:
          process.env.SMTP_FROM || '"Alerta Visión" <alertavision706@gmail.com>',
        to: email,
        subject: `Reporte ${normalizedTab} - ${userName}`,
        html,
      };

      console.log('📧 Enviando email a:', email);

      try {
        // Timeout de 15 segundos para no colgar el servidor
        const sendPromise = this.transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tiempo de espera agotado (Timeout 15s)')), 15000)
        );

        await Promise.race([sendPromise, timeoutPromise]);

        console.log('✅ Email enviado exitosamente');
        return { message: '¡Reporte enviado correctamente!', success: true };
      } catch (emailError) {
        // Log el error pero NO fallar - devolver éxito parcial
        console.error('⚠️ Error enviando email (SMTP):', emailError.message);
        return {
          message: 'Reporte generado. El envío de email falló o tardó demasiado, pero los datos están guardados.',
          success: false,
          emailError: emailError.message
        };
      }
    } catch (error) {
      console.error('❌ Error en sendReportToEmail:', error);
      throw new Error(`Error generando reporte: ${error.message || 'Error desconocido'}`);
    }
  }
}
