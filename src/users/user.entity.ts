import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

// --- RUTAS DE IMPORTACIÓN CORREGIDAS ---
// Subimos un nivel (..) para salir de la carpeta 'users' y buscar las otras carpetas

// 1. Importar Alert (Asumiendo que está en src/alert/alert.entity.ts)
import { Alert } from '../alert.entity'; 

// 2. Importar Lente (Asumiendo que está en src/lentes/lente.entity.ts)
import { Lente } from '../lentes/lente.entity'; 

// 3. Importar Contacto (OJO: Carpeta con mayúscula 'Contacto' como pediste)
import { Contacto } from '../Contacto/contacto.entity'; 

@Entity('usuarios') // Se conecta a la tabla 'usuarios' de la base de datos
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  telefono: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  rol: string;

  // --- RELACIONES (Separación de lógica por usuario) ---

  // Relación 1: Mis Alertas
  @OneToMany(() => Alert, (alert) => alert.usuario)
  alertas: Alert[];

  // Relación 2: Mis Lentes (Hardware)
  @OneToMany(() => Lente, (lente) => lente.usuario)
  lentes: Lente[];

  // Relación 3: Mis Contactos de Emergencia
  @OneToMany(() => Contacto, (contacto) => contacto.usuario)
  contactos: Contacto[];
}