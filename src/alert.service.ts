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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  // ==== CREAR ALERTA - Soporta frontend y ESP32 ====
  async create(user: User | { id: number }, dto: CreateAlertDto): Promise<Alert> {
    try {
      const tipoAlerta = dto.type || dto.tipo_alerta || 'desconocido';
      const mensaje = dto.message || dto.mensaje || 'Sin mensaje';

      const alert = this.alertRepository.create({
        usuarioId: user.id,
        tipoAlerta: tipoAlerta,
        mensaje: mensaje,
        nivelFatiga: dto.nivelFatiga ?? 5,
      });

      console.log('✅ Creando alerta para usuario ID:', user.id);
      return await this.alertRepository.save(alert);
    } catch (err) {
      console.error('❌ Error creando alerta:', err);
      throw new InternalServerErrorException('Error guardando alerta');
    }
  }

  // ==== CREAR ALERTA DESDE ESP32 (busca usuario por email) ====
  async createFromESP32(dto: CreateAlertDto): Promise<Alert> {
    try {
      let userId = dto.usuarioId;

      // Si viene email, buscar el usuario por email
      if (dto.email) {
        console.log('🔍 Buscando usuario por email:', dto.email);
        const user = await this.userRepository.findOne({
          where: { email: dto.email }
        });
        if (user) {
          userId = user.id;
          console.log('✅ Usuario encontrado:', user.email, 'ID:', user.id);
        } else {
          console.log('⚠️ Usuario no encontrado, usando ID por defecto');
        }
      }

      // Si no hay userId, usar 1 por defecto
      if (!userId) {
        userId = 1;
      }

      const tipoAlerta = dto.type || dto.tipo_alerta || 'microsueno';
      const mensaje = dto.message || dto.mensaje || 'Microsueno detectado';

      const alert = this.alertRepository.create({
        usuarioId: userId,
        tipoAlerta: tipoAlerta,
        mensaje: mensaje,
        nivelFatiga: dto.nivelFatiga ?? 10,
      });

      console.log('🚨 ESP32: Creando alerta para usuario ID:', userId);
      const savedAlert = await this.alertRepository.save(alert);
      console.log('✅ Alerta guardada con ID:', savedAlert.id);

      return savedAlert;
    } catch (err) {
      console.error('❌ Error creando alerta ESP32:', err);
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
