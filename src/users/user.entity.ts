// src/users/user.entity.ts
import { Role } from 'src/auth/roles.enum';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuario') // 🔥 Fuerza el nombre de la tabla
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  rol: Role;
}

