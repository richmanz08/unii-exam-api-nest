import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { CategoryModule } from '../category/category.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [HttpModule, CategoryModule, OrderModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
