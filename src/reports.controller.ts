import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // POST /reports/export
  @Post('export')
  async exportReport(@Body() body: { email: string; tab: string }) {
    const { email, tab } = body;
    await this.reportsService.sendReportToEmail(email, tab);
    return { message: '¡Reporte enviado correctamente!' };
  }

  // GET /reports/history?email=...
  @Get('history')
  async getExportHistory(@Query('email') email: string) {
    const history = await this.reportsService.getExportHistory(email);
    return history;
  }
}
