// src/reports.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RangeDto } from './auth/dto/range.dto';  
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('daily')
  async daily(@Query() q: RangeDto) {
    return this.svc.getDaily(q.from, q.to, q.userId);
  }

  @Get('weekly')
  async weekly(@Query() q: RangeDto) {
    return this.svc.getWeekly(q.from, q.to, q.userId);
  }

  @Get('monthly')
  async monthly(@Query() q: RangeDto) {
    return this.svc.getMonthly(q.from, q.to, q.userId);
  }

  @Post('export')
  async exportar(@Body() body: { email: string; tab: 'diario'|'semanal'|'mensual' }) {
    return this.svc.sendReportToEmail(body.email, body.tab);
  }
}
