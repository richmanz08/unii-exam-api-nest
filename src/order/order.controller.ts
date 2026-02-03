import { Controller, Get, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { Transaction } from './entities/order-transaction.entity';

interface GradesResponse {
  grades: string[];
}

interface SyncResponse {
  buyTransactions: Transaction[];
  sellTransactions: Transaction[];
}

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('sync')
  async syncOrders(): Promise<SyncResponse> {
    return this.orderService.syncOrdersFromAPI();
  }

  @Get('grades')
  async getDistinctGrades(): Promise<GradesResponse> {
    const grades = await this.orderService.getDistinctGrades();
    return { grades };
  }
}
