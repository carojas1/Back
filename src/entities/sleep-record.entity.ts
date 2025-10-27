import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sleep_record')
@Index('idx_sleep_record_ts', ['ts'])
@Index('idx_sleep_record_user', ['userId'])
export class SleepRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  @Column({ type: 'timestamp' })
  ts!: Date;

  @Column({ type: 'varchar', length: 10 })
  stage!: 'light' | 'deep' | 'awake';

  @Column({ name: 'duration_minutes', type: 'int', default: 0 })
  durationMinutes!: number;

  @Column({ type: 'numeric', precision: 4, scale: 2 })
  somnolence!: number; // 0..10
}
