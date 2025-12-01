import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
// CORRECCIÓN 1: Usamos './' porque este archivo está en src/, no dentro de una carpeta
import { User } from './users/user.entity'; 

@Entity('alertas')
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tipo_alerta' })
  tipo: string;

  @Column({ name: 'nivel_fatiga' })
  nivel: number;

  @Column({ nullable: true })
  mensaje: string;

  // CORRECCIÓN 2: Renombrado a 'created_at' para que tus servicios NO fallen.
  // En la base de datos se llamará 'fecha', pero en el código será 'created_at'.
  @Column({ name: 'fecha', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  // CORRECCIÓN 3: Agregamos 'status' porque vi en tus errores que podría hacer falta
  @Column({ default: 'pendiente', nullable: true }) 
  status: string;

  @ManyToOne(() => User, (user) => user.alertas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' }) 
  usuario: User;
}