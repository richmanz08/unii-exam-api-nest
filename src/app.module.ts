import { Module, CacheModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

// ...existing code...
import { ReportModule } from './report/report.module';
import { OrderService } from './order/order.service';
import { CategoryService } from './category/category.service';

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
  controllers: [],
  providers: [OrderService, CategoryService],
})
export class AppModule {}
