import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';
import { lastValueFrom } from 'rxjs';
import { Category } from './interfaces/category.interface';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly httpService: HttpService,
  ) {}

  async getCategories(): Promise<Category[]> {
    const cacheKey = 'category-data';
    let data = await this.cacheManager.get<Category[]>(cacheKey);
    if (!data) {
      const response$ = this.httpService.get(
        'https://apirecycle.unii.co.th/category/query-product-demo',
      );
      const response = await lastValueFrom(response$);
      data = response.data;
      await this.cacheManager.set(cacheKey, data, 900);
    }
    return data;
  }
}
