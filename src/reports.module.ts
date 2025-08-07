import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Alert } from './alert.entity'; // Ajusta la ruta si está en otra carpeta
import { ExportHistory } from './export-history.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, ExportHistory]), // Inyecta ambos repositorios
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService], // Exporta el service si otro módulo lo usa
})
export class ReportsModule {}
