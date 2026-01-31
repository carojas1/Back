import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './users/user.entity';

@Entity('alertas')
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  // columna tipo_alerta
  @Column({ name: 'tipo_alerta', type: 'varchar', length: 50 })
  tipoAlerta: string;

  // columna nivel_fatiga
  @Column({ name: 'nivel_fatiga', type: 'int', nullable: true })
  nivelFatiga: number | null;

  // columna mensaje
  @Column({ name: 'mensaje', type: 'varchar', length: 255, nullable: true })
  mensaje: string | null;

  // columna fecha
  @CreateDateColumn({ name: 'fecha', type: 'timestamp' })
  fecha: Date;

  // FK usuario_id
  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @ManyToOne(() => User, (user) => user.alertas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  // getters para que Angular pueda usar createdAt o created_at
  get createdAt() {
    return this.fecha;
  }

  get created_at() {
    return this.fecha;
  }
}
