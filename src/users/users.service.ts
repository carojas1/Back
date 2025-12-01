import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  // CORREGIDO: Ahora devuelve User | null (para evitar el error rojo)
  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // CORREGIDO: Quitamos el tipo estricto de retorno para evitar conflictos de Array
  async create(userData: any) {
    const newUser = this.usersRepository.create(userData);
    return await this.usersRepository.save(newUser);
  }

  async updateProfile(id: number, data: any) {
    const datosAActualizar = {
      nombre: data.nombre,
      telefono: data.telefono,
      email_recuperacion: data.email_recuperacion 
    };

    // Limpieza de datos vacíos
    Object.keys(datosAActualizar).forEach(key => 
      (datosAActualizar[key] === undefined || datosAActualizar[key] === null) && delete datosAActualizar[key]
    );

    await this.usersRepository.update(id, datosAActualizar);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}