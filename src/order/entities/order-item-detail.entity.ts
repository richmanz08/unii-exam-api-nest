import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('order_item_details')
@Index(['orderItemId'])
export class OrderItemDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderItemId: string;

  @Column({ type: 'varchar', length: 10 })
  grade: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'varchar', length: 50 })
  quantity: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total: number;

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
