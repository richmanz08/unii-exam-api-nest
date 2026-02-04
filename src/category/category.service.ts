import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Category as CategoryInterface } from './interfaces/category.interface';
import { get } from 'lodash';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private readonly httpService: HttpService,
  ) {}

  async getCategories(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().exec();
  }

  async syncCategoriesFromAPI(): Promise<{ message: string }> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          'https://apirecycle.unii.co.th/category/query-product-demo',
        ),
      );

      const list: CategoryInterface[] = get(
        response.data,
        'productList',
        response.data,
      );

      if (!Array.isArray(list) || !list.length) {
        throw new Error('Invalid API response structure');
      }

      await this.categoryModel.deleteMany({});
      const inserted = await this.categoryModel.insertMany(list);

      const subCategoryCount = inserted.reduce(
        (sum, cat) => sum + (cat.subcategory?.length || 0),
        0,
      );

      return {
        message: `Sync completed successfully. Categories: ${inserted.length}, Subcategories: ${subCategoryCount}`,
      };
    } catch (error) {
      throw new Error(`Failed to sync categories from API: ${error.message}`);
    }
  }
}
