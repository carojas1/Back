import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity'; // Revisa que esta ruta suba un nivel (..) y entre a users

@Entity('dispositivos_lentes') // Nombre de la tabla en SQL
export class Lente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'mac_address', unique: true })
  macAddress: string;

  @Column({ name: 'nombre_dispositivo', default: 'Mis Lentes' })
  nombreDispositivo: string;

  @Column({ default: 'desconectado' })
  estado: string;

  @ManyToOne(() => User, (user) => user.lentes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}