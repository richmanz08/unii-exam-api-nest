import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { CategoryModule } from '../category/category.module';
import { OrderItemDetail } from '../order/entities/order-item-detail.entity';

@Module({
  imports: [CategoryModule, TypeOrmModule.forFeature([OrderItemDetail])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
