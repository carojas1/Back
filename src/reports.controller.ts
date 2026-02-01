import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RangeDto } from './auth/dto/range.dto';
import { JwtAuthGuard } from './auth/jwt-auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly svc: ReportsService) { }

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
  async exportar(
    @Request() req,
    @Body() body: { email: string; tab: 'diario' | 'semanal' | 'mensual' },
  ) {
    try {
      console.log('📧 Export request:', { user: req.user, body });

      if (!body.email) {
        throw new HttpException('Email es requerido', HttpStatus.BAD_REQUEST);
      }
      if (!body.tab) {
        throw new HttpException('Tab es requerido', HttpStatus.BAD_REQUEST);
      }

      const result = await this.svc.sendReportToEmail(req.user, body.email, body.tab);
      return result;
    } catch (error) {
      console.error('❌ Export error:', error);

      // Si ya es HttpException, re-lanzar
      if (error instanceof HttpException) {
        throw error;
      }

      // Error de SMTP o nodemailer
      if (error.message?.includes('SMTP') || error.message?.includes('auth') || error.code === 'EAUTH') {
        throw new HttpException(
          'Error de configuración de correo. Contacta al administrador.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Cualquier otro error
      throw new HttpException(
        error.message || 'Error enviando reporte',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
