import { Controller, Get } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('grades')
  async getDistinctGrades() {
    const grades = await this.orderService.getDistinctGrades();
    return { grades };
  }
}
