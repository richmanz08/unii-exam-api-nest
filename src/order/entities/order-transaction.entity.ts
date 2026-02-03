import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { TransactionType } from '../enums/transaction-type.enum';

@Entity('order_transaction')
@Index(['transactionType'])
@Index(['orderId'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  transactionType: TransactionType; // 'buy' or 'sell'

  @Column({ type: 'varchar', length: 255, unique: true })
  orderId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transportName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transportId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  collectorName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  collectorId: string;

  @Column({ type: 'date', nullable: true })
  finishedDate: Date;

  @Column({ type: 'time', nullable: true })
  finishedTime: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.transaction, {
    cascade: true,
    eager: true,
  })
  orderItems: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
