import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Transaction } from './order-transaction.entity';
import { OrderItemDetail } from './order-item-detail.entity';

@Entity('order_items')
@Index(['transactionId'])
@Index(['categoryId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  transactionId: string;

  @Column({ type: 'varchar', length: 50 })
  categoryId: string;

  @Column({ type: 'varchar', length: 50 })
  subCategoryId: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.orderItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @OneToMany(
    () => OrderItemDetail,
    (orderItemDetail) => orderItemDetail.orderItem,
    {
      cascade: true,
      eager: true,
    },
  )
  details: OrderItemDetail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
