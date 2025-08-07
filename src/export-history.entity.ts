import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ExportHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @CreateDateColumn()
  created_at: Date;
}
