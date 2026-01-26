import { Module, CacheModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

// ...existing code...
import { ReportModule } from './report/report.module';
import { OrderService } from './order/order.service';
import { CategoryService } from './category/category.service';
import { CategoryController } from './category/category.controller';

@Module({
  imports: [
    CacheModule.register({
      store: require('cache-manager-redis-store'),
      host: 'localhost',
      port: 6379,
      ttl: 900,
    }),
    HttpModule,
    ReportModule,
  ],
  controllers: [CategoryController],
  providers: [OrderService, CategoryService],
})
export class AppModule {}
