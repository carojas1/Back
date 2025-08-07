import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Alert } from './alert.entity';
import { ExportHistory } from './export-history.entity'; // ← ESTA ES LA FORMA CORRECTA

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, ExportHistory]), // ← AQUÍ DIRECTO
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
