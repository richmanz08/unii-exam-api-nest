import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Transaction } from './entities/order-transaction.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemDetail } from './entities/order-item-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, OrderItem, OrderItemDetail]),
    HttpModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
