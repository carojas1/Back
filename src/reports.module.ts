import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Alert } from './alert.entity';
import { ExportHistory } from './export-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, ExportHistory])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
