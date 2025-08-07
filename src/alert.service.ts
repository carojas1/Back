// src/alert.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { CreateAlertDto } from './auth/dto/create-alert.dto';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  async createAndNotify(createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create({
      ...createAlertDto,
      created_at: new Date(), // Asegúrate que tu entidad tenga created_at
    });
    return await this.alertRepository.save(alert);
  }

  // ESTE MÉTODO DEBE EXISTIR
  async findAll(): Promise<Alert[]> {
    return this.alertRepository.find({
      order: { created_at: 'DESC' }, // Usa el campo correcto
    });
  }
}
