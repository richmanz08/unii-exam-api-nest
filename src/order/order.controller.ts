import { Controller, Get } from '@nestjs/common';
import { OrderService } from './order.service';

interface GradesResponse {
  grades: string[];
}

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('grades')
  async getDistinctGrades(): Promise<GradesResponse> {
    const grades = await this.orderService.getDistinctGrades();
    return { grades };
  }
}
