import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('contactos_configuracion') // Nombre de la tabla en SQL
export class Contacto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'email_destino' })
  emailDestino: string;

  @Column({ name: 'nombre_contacto', nullable: true })
  nombreContacto: string;

  @Column({ name: 'es_predeterminado', default: false })
  esPredeterminado: boolean;

  @ManyToOne(() => User, (user) => user.contactos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}