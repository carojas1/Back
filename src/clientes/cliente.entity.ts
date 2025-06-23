import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column()
  sexo: string;

  @Column()
  fechaNacimiento: string;

  @Column()
  edad: number;

  @Column()
  cedula: string;
}