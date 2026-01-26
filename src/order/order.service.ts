import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';
import { lastValueFrom } from 'rxjs';
import { Order } from './interfaces/order.interface';

@Injectable()
export class OrderService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly httpService: HttpService,
  ) {}

  async getOrders(): Promise<Order[]> {
    const cacheKey = 'order-data';
    let data = await this.cacheManager.get<Order[]>(cacheKey);
    if (!data) {
      const response$ = this.httpService.get(
        'https://apirecycle.unii.co.th/Stock/query-transaction-demo',
      );
      const response = await lastValueFrom(response$);
      data = response.data;
      await this.cacheManager.set(cacheKey, data, 900);
    }
    return data;
  }
}
