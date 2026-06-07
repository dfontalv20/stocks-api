import { User } from '@/auth/entities/user.entity';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('alerts')
export class Alert {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.alerts, { nullable: false })
  user: User;

  @ApiProperty()
  @Column()
  stock: string;

  @ApiProperty()
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price: number;

  @ApiProperty()
  @Column({ nullable: true, default: null })
  notifiedAt: Date;
}

export class AlertResponse extends OmitType(Alert, ['user']) {}
