import { Controller, Get, Post } from '@nestjs/common';
import { OrderService } from './order.service';

interface GradesResponse {
  grades: string[];
}

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('sync')
  async syncOrders(): Promise<{ message: string }> {
    return this.orderService.syncOrdersFromAPI();
  }

  @Get('grades')
  async getDistinctGrades(): Promise<GradesResponse> {
    const grades = await this.orderService.getDistinctGrades();
    return { grades };
  }
}
