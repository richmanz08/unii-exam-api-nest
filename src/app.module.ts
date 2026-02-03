import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from './category/category.module';
import { OrderModule } from './order/order.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://root:root@localhost:27017/unii_exam_db?authSource=admin',
    ),
    HttpModule,
    CategoryModule,
    OrderModule,
    ReportModule,
  ],
})
export class AppModule {}
