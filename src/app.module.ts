import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './database/database.config';
import { CategoryModule } from './category/category.module';
import { OrderModule } from './order/order.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    HttpModule,
    CategoryModule,
    OrderModule,
    ReportModule,
  ],
})
export class AppModule {}
