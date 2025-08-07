// src/alert.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  message: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  telefonoUsuario: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;   // <-- este campo es el que guarda la fecha
}
