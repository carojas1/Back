import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    const cliente = this.clienteRepository.create(createClienteDto);
    return this.clienteRepository.save(cliente);
  }

  async findAll(): Promise<Cliente[]> {
    return this.clienteRepository.find();
  }

  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOneBy({ id });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOne(id);
    const actualizado = Object.assign(cliente, updateClienteDto);
    return this.clienteRepository.save(actualizado);
  }

  async remove(id: number): Promise<void> {
    const cliente = await this.findOne(id);
    await this.clienteRepository.remove(cliente);
  }
}
