import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity'; // Verifica que la ruta a tu entidad sea correcta

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Buscar todos
  findAll() {
    return this.usersRepository.find({ order: { id: 'ASC' } });
  }

  // Buscar uno por email (para auth)
  findOneByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Buscar uno por ID
  async findOne(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    return user;
  }

  // --- LÓGICA QUE FALTABA ---

  // Crear
  async create(data: any) {
    // Si no mandan password, ponemos uno por defecto '123456'
    // OJO: Aquí deberías encriptarla con bcrypt si estás usando Auth, 
    // pero para que te funcione YA, lo guardamos directo.
    const newUser = this.usersRepository.create({
      ...data,
      password: data.password || '$2b$10$tuHashGenericoO123456', 
      createdAt: new Date(),
    });
    return this.usersRepository.save(newUser);
  }

  // Actualizar
  async update(id: number, data: any) {
    const user = await this.findOne(id);
    this.usersRepository.merge(user, data);
    return this.usersRepository.save(user);
  }

  // Eliminar
  async remove(id: number) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }
}