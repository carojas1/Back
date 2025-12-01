import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RangeDto } from './auth/dto/range.dto'; // <--- CORREGIDO: ./
import { JwtAuthGuard } from './auth/jwt-auth/jwt-auth.guard'; // <--- CORREGIDO: ./

@Controller('reports')
@UseGuards(JwtAuthGuard) 
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('daily')
  async daily(@Query() q: RangeDto, @Request() req) {
    return this.svc.getDaily(q.from, q.to, req.user.id);
  }

  @Get('weekly')
  async weekly(@Query() q: RangeDto, @Request() req) {
    return this.svc.getWeekly(q.from, q.to, req.user.id);
  }

  @Get('monthly')
  async monthly(@Query() q: RangeDto, @Request() req) {
    return this.svc.getMonthly(q.from, q.to, req.user.id);
  }

  @Post('export')
  async exportar(@Request() req, @Body() body: { email: string; tab: 'diario'|'semanal'|'mensual' }) {
    return this.svc.sendReportToEmail(req.user, body.email, body.tab);
  }
}