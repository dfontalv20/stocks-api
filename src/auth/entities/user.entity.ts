import { Exclude } from 'class-transformer';
import { Alert } from '@/alerts/entities/alert.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  username: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @ApiProperty({ type: () => Alert })
  @OneToMany(() => Alert, (alert) => alert.user, { cascade: true })
  alerts: Alert[];

  @ApiProperty()
  @Column({ nullable: true, default: null })
  fcmToken: string;
}
