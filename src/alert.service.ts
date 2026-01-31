// src/alert.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { User } from './users/user.entity';
import { CreateAlertDto } from './auth/dto/create-alert.dto';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) { }

  // ==== CREAR ALERTA - Soporta frontend y ESP32 ====
  async create(user: User | { id: number }, dto: CreateAlertDto): Promise<Alert> {
    try {
      // Soportar ambos formatos: frontend (type/message) y ESP32 (tipo_alerta/mensaje)
      const tipoAlerta = dto.type || dto.tipo_alerta || 'desconocido';
      const mensaje = dto.message || dto.mensaje || 'Sin mensaje';

      const alert = this.alertRepository.create({
        usuarioId: user.id,
        tipoAlerta: tipoAlerta,
        mensaje: mensaje,
        nivelFatiga: dto.nivelFatiga ?? 5,
      });

      console.log('✅ Creando alerta:', alert);
      return await this.alertRepository.save(alert);
    } catch (err) {
      console.error('❌ Error creando alerta:', err);
      throw new InternalServerErrorException('Error guardando alerta');
    }
  }

  // ==== TODAS LAS ALERTAS (admin) ====
  async findAll(): Promise<Alert[]> {
    return this.alertRepository.find({
      order: { id: 'DESC' },
    });
  }

  // ==== ALERTAS POR USUARIO (Historial) ====
  async findByUser(userId: number): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { usuarioId: userId },
      order: { id: 'DESC' },
    });
  }
}
