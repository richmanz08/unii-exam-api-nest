/* eslint-disable prettier/prettier */
import { lastValueFrom } from 'rxjs';
import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';

@Injectable()
export class AppService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly httpService: HttpService,
  ) {}

  async getOrderData(): Promise<any> {
    const cacheKey = 'order-data';
    let data = await this.cacheManager.get(cacheKey);
    if (!data) {
      const response$ = this.httpService.get(
        'https://apirecycle.unii.co.th/Stock/query-transaction-demo',
      );
      const response = await lastValueFrom(response$);
      data = response.data;
      await this.cacheManager.set(cacheKey, data, 900); // cache 15 นาที
    }
    return data;
  }

  async getCategoryData(): Promise<any> {
    const cacheKey = 'category-data';
    let data = await this.cacheManager.get(cacheKey);
    if (!data) {
      const response$ = this.httpService.get(
        'https://apirecycle.unii.co.th/category/query-product-demo',
      );
      const response = await lastValueFrom(response$);
      data = response.data;
      await this.cacheManager.set(cacheKey, data, 900); // cache 15 นาที
    }
    return data;
  }

  getHello(): string {
    return 'Copy of Unii Digital Group Assignment (Full-Stack Position)';
  }
}
