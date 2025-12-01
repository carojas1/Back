// src/alert.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { User } from './users/user.entity'; // <--- IMPORTANTE: Importamos al Usuario
import { CreateAlertDto } from './auth/dto/create-alert.dto';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  // 1. CREAR ALERTA (Asignada al usuario específico)
  async createAndNotify(user: User, createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create({
      ...createAlertDto,
      created_at: new Date(),
      usuario: user, // <--- AQUÍ ESTÁ LA CLAVE: Vinculamos la alerta al usuario que llega
    });
    return await this.alertRepository.save(alert);
  }

  // 2. BUSCAR ALERTAS (Solo las del usuario que pregunta)
  async findAll(user: User): Promise<Alert[]> {
    // Si quieres que Andrés (admin) vea TODO y los demás solo lo suyo:
    if (user.email === 'andres2007benavides@gmail.com' || user.rol === 'admin') {
       return this.alertRepository.find({
         order: { created_at: 'DESC' },
         relations: ['usuario'] // Para ver de quién es cada alerta
       });
    }

    // Para el resto de mortales: Solo ven sus propias alertas
    return this.alertRepository.find({
      where: { usuario: { id: user.id } }, // <--- FILTRO DE SEGURIDAD
      order: { created_at: 'DESC' },
    });
  }
}