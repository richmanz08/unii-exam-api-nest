import { Module, CacheModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { OrderService } from '../order/order.service';
import { CategoryService } from '../category/category.service';

@Module({
  imports: [CacheModule.register(), HttpModule],
  controllers: [ReportController],
  providers: [ReportService, OrderService, CategoryService],
})
export class ReportModule {}
